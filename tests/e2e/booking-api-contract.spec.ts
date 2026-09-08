import {
	test,
	expect,
	type APIRequestContext,
	type Page,
} from '@playwright/test';
import { execFileSync } from 'node:child_process';

/**
 * Booking API contract: permissions, validation boundaries, failure paths and
 * concurrency — asserted against the real endpoints, not the UI.
 *
 * The UI specs prove buttons exist and guards hold. This file proves the
 * server enforces the rules even when the UI is bypassed, which is the only
 * thing standing between a crafted request and the database.
 *
 * Two surfaces are covered:
 *   REST  /doublescale/v1/booking/*                    — admin, cookie + nonce
 *   AJAX  admin-ajax.php?action=doublescale_booking_*  — public, unauthenticated
 *
 * Every row this file creates is deleted in afterEach, including on failure.
 */

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';
const SITE = process.env.WP_BASE_URL ?? 'http://localhost/wordpress';
const REST = '/wordpress/wp-json/doublescale/v1/booking';
const AJAX = `${SITE}/wp-admin/admin-ajax.php`;

/** An event that exists on this site. Override for another environment. */
const EVENT_ID = Number(process.env.DS_E2E_EVENT_ID ?? 11);

/** Emails this run created; every row keyed to them is removed in teardown. */
let probeEmails: string[] = [];

function db(sql: string): string {
	return execFileSync(
		'wp',
		['db', 'query', sql, '--skip-column-names', `--path=${WP_PATH}`],
		{ encoding: 'utf8', timeout: 30_000 }
	).trim();
}

function q(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

/** A unique, obviously-synthetic identity per assertion. */
function probe(tag: string): { name: string; email: string } {
	const name = `E2E-${tag}-${Math.random().toString(36).slice(2, 8)}`;
	const email = `${name.toLowerCase()}@example.test`;
	probeEmails.push(email);
	return { name, email };
}

/**
 * A future weekday at a given time, inside the default 09:00-17:00 schedule.
 * Weekends are skipped because the default availability marks them off.
 */
function futureWeekday(daysOut: number, time: string): string {
	const d = new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
	while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
		d.setUTCDate(d.getUTCDate() + 1);
	}
	return `${d.toISOString().slice(0, 10)} ${time}`;
}

test.afterEach(async () => {
	// Guaranteed teardown: runs after pass, failure and timeout alike.
	for (const email of probeEmails) {
		try {
			// Release the slot lock FIRST. `booked_slots` is what enforces
			// "one booking per slot"; deleting the booking row alone leaves
			// an orphaned lock and that slot is unbookable forever.
			db(
				`DELETE s FROM wp_doublescale_booking_booked_slots s
				 JOIN wp_doublescale_bookings b ON b.id = s.booking_id
				 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
				 WHERE c.email = ${q(email)}`
			);
			db(
				`DELETE b FROM wp_doublescale_bookings b
				 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
				 WHERE c.email = ${q(email)}`
			);
			db(`DELETE FROM wp_doublescale_contacts WHERE email = ${q(email)}`);
		} catch {
			// One failed delete must not strand the rest.
		}
	}
	probeEmails = [];

	// Safety net: drop any lock whose booking no longer exists, whatever
	// created it. Never touches a slot backing a live booking.
	try {
		db(
			`DELETE s FROM wp_doublescale_booking_booked_slots s
			 LEFT JOIN wp_doublescale_bookings b ON b.id = s.booking_id
			 WHERE b.id IS NULL`
		);
	} catch {
		// Best effort.
	}
});

/** Body for a manual (admin) booking POST. */
function bookingBody(over: Record<string, unknown>): Record<string, unknown> {
	return {
		event_id: EVENT_ID,
		timezone: 'UTC',
		slot_time: 30,
		duration: 30,
		status: 'scheduled',
		location: { type: 'attendee_address', value: '1 E2E Street' },
		...over,
	};
}

/**
 * Post to the admin REST booking endpoint from inside the page.
 *
 * `page.request` carries its own cookie jar, so a nonce minted for the
 * browser session is rejected there with `rest_forbidden`. Issuing the fetch
 * in the page keeps cookie and nonce in the same session.
 */
async function restBooking(
	page: Page,
	nonce: string,
	body: Record<string, unknown>
): Promise<{ status: number; text: string }> {
	return page.evaluate(
		async ({ url, n, payload }) => {
			const r = await fetch(url, {
				method: 'POST',
				credentials: 'same-origin',
				headers: {
					'X-WP-Nonce': n,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});
			return { status: r.status, text: await r.text() };
		},
		{ url: `${REST}/bookings`, n: nonce, payload: body }
	);
}

/* =====================================================================
 * Permissions — the server must not trust the UI
 * ================================================================== */

test.describe('Booking API: permissions', () => {
	// Anonymous: no stored admin cookie.
	test.describe('anonymous', () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test('reads are refused without authentication', async ({
			request,
		}) => {
			for (const path of [
				'bookings',
				'events',
				'calendars',
				'availabilities',
				'settings',
				'bookings/counts',
				'bookings/revenue',
			]) {
				const res = await request.get(`${REST}/${path}`);
				expect(
					res.status(),
					`GET /${path} should require authentication.`
				).toBe(401);
			}
		});

		test('a complete create payload is still refused', async ({
			request,
		}) => {
			// A missing-parameter 400 would prove nothing: it is rejected by
			// schema validation before the permission callback runs. Send a
			// COMPLETE body so the only thing that can stop it is auth.
			const { name } = probe('anon');

			const res = await request.post(`${REST}/events`, {
				headers: { 'Content-Type': 'application/json' },
				data: {
					calendar_id: 1,
					name,
					type: 'one-to-one',
					duration: 30,
				},
			});

			expect(res.status(), await res.text()).toBe(401);

			// And nothing was written.
			expect(
				db(
					`SELECT COUNT(*) FROM wp_doublescale_booking_events WHERE name = ${q(name)}`
				),
				'An unauthenticated request must not create an event.'
			).toBe('0');
		});

		test('a complete booking payload is refused', async ({ request }) => {
			const { name, email } = probe('anonbook');

			const res = await request.post(`${REST}/bookings`, {
				headers: { 'Content-Type': 'application/json' },
				data: bookingBody({
					start_date: '2027-06-01 10:00:00',
					name,
					email,
				}),
			});

			expect(res.status(), await res.text()).toBe(401);
			expect(
				db(
					`SELECT COUNT(*) FROM wp_doublescale_contacts WHERE email = ${q(email)}`
				),
				'An unauthenticated booking must not create a contact.'
			).toBe('0');
		});

		test('deleting an event is refused', async ({ request }) => {
			const res = await request.delete(`${REST}/events/${EVENT_ID}`);
			expect([401, 403]).toContain(res.status());

			// Assert on THIS event, not a global count: sibling specs create
			// and delete their own events in parallel, so a total would race
			// them and fail for a reason unrelated to authorization.
			expect(
				db(
					`SELECT COUNT(*) FROM wp_doublescale_booking_events WHERE id = ${EVENT_ID}`
				),
				'An unauthenticated DELETE must not remove the targeted event.'
			).toBe('1');
		});
	});

	test('an authenticated admin can read the booking collections', async ({
		page,
	}) => {
		await page.goto(
			'wp-admin/admin.php?page=doublescale&path=booking/bookings'
		);
		await expect(page.locator('.doublescale-layout__main')).toBeVisible({
			timeout: 45_000,
		});

		const nonce = await page.evaluate(
			() =>
				(window as { wpApiSettings?: { nonce?: string } }).wpApiSettings
					?.nonce ?? ''
		);
		expect(nonce, 'No REST nonce was printed for the admin.').not.toBe('');

		// Fetch from inside the page so the cookie and the nonce belong to the
		// same session (page.request has a separate jar).
		for (const path of ['bookings', 'events', 'calendars']) {
			const status = await page.evaluate(
				async ({ url, n }) => {
					const r = await fetch(url, {
						credentials: 'same-origin',
						headers: { 'X-WP-Nonce': n },
					});
					return r.status;
				},
				{ url: `${REST}/${path}`, n: nonce }
			);
			expect(status, `GET /${path} as admin`).toBe(200);
		}
	});
});

/* =====================================================================
 * Public booking AJAX — the unauthenticated write path
 * ================================================================== */

test.describe('Booking API: public AJAX', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	/** Submit the public booking form the way the booking page does. */
	async function publicBook(
		request: APIRequestContext,
		over: Record<string, string>
	) {
		return request.post(AJAX, {
			form: {
				action: 'doublescale_booking_booking',
				id: String(EVENT_ID),
				timezone: 'UTC',
				duration: '30',
				location: JSON.stringify({
					type: 'attendee_address',
					value: '1 E2E Street',
				}),
				...over,
			},
		});
	}

	test('a past date is refused', async ({ request }) => {
		const { name, email } = probe('past');

		const res = await publicBook(request, {
			start_date: '2020-01-01 10:00:00',
			invitees: JSON.stringify([{ name, email }]),
		});

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(String(body.data?.message)).toMatch(/must be in the future/i);

		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_contacts WHERE email = ${q(email)}`
			),
			'A past-dated public booking must not persist.'
		).toBe('0');
	});

	test('a slot outside the schedule is refused', async ({ request }) => {
		// The default availability is 09:00-17:00, so midnight is out of
		// hours. The public path has no way to override that.
		const { name, email } = probe('midnight');

		const res = await publicBook(request, {
			start_date: '2027-03-01 00:00:00',
			invitees: JSON.stringify([{ name, email }]),
		});

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(String(body.data?.message)).toMatch(/not available/i);

		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_contacts WHERE email = ${q(email)}`
			)
		).toBe('0');
	});

	test('an invitee without a name or email is refused', async ({
		request,
	}) => {
		for (const invitees of [
			'[]',
			JSON.stringify([{ name: '', email: 'x@example.test' }]),
			JSON.stringify([{ name: 'No Email', email: '' }]),
		]) {
			const res = await publicBook(request, {
				start_date: '2027-06-02 10:00:00',
				invitees,
			});
			const body = await res.json();
			expect(body.success, `invitees=${invitees}`).toBe(false);
		}
	});

	test('a bogus booking hash fails cleanly on cancel', async ({
		request,
	}) => {
		const res = await request.post(AJAX, {
			form: {
				action: 'doublescale_booking_cancel_booking',
				id: 'zzz-not-a-real-hash',
			},
		});

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(String(body.data?.message)).toMatch(/invalid booking/i);
		// No PHP notice or trace leaked to an unauthenticated caller.
		expect(await res.text()).not.toMatch(
			/Fatal error|Uncaught|Stack trace/i
		);
	});

	test('an unknown event id fails cleanly on the slots endpoint', async ({
		request,
	}) => {
		const res = await request.post(AJAX, {
			form: {
				action: 'doublescale_booking_booking_slots',
				event_id: '999999',
			},
		});

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(await res.text()).not.toMatch(/Fatal error|Uncaught/i);
	});

	test('a valid public booking persists exactly one row', async ({
		request,
	}) => {
		const { name, email } = probe('ok');
		// A weekday inside 09:00-17:00, far enough out to be free.
		const start = futureWeekday(120, '10:00:00');

		const res = await publicBook(request, {
			start_date: start,
			invitees: JSON.stringify([{ name, email }]),
		});

		const body = await res.json();
		expect(body.success, JSON.stringify(body).slice(0, 300)).toBe(true);

		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_bookings b
				 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
				 WHERE c.email = ${q(email)}`
			),
			'A successful public booking should write exactly one row.'
		).toBe('1');
	});

	test('the same slot cannot be booked twice', async ({ request }) => {
		const first = probe('dbl1');
		const second = probe('dbl2');
		const start = futureWeekday(150, '11:00:00');

		const a = await publicBook(request, {
			start_date: start,
			invitees: JSON.stringify([
				{ name: first.name, email: first.email },
			]),
		});
		expect(
			(await a.json()).success,
			'The first booking should succeed.'
		).toBe(true);

		const b = await publicBook(request, {
			start_date: start,
			invitees: JSON.stringify([
				{ name: second.name, email: second.email },
			]),
		});
		const body = await b.json();
		expect(body.success, 'The second booking must be refused.').toBe(false);
		expect(String(body.data?.message)).toMatch(/not available/i);

		// And the slot holds exactly one booking.
		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_bookings WHERE start_time = ${q(start)}`
			),
			'A slot must never hold two bookings.'
		).toBe('1');
	});

	test('concurrent requests for one slot yield a single booking', async ({
		request,
	}) => {
		const start = futureWeekday(180, '12:00:00');
		const racers = [1, 2, 3, 4, 5].map((i) => probe(`race${i}`));

		const results = await Promise.all(
			racers.map((r) =>
				publicBook(request, {
					start_date: start,
					invitees: JSON.stringify([
						{ name: r.name, email: r.email },
					]),
				}).then((res) => res.json())
			)
		);

		const won = results.filter((r) => r.success === true).length;
		expect(
			won,
			'Exactly one of five concurrent requests should win the slot.'
		).toBe(1);

		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_bookings WHERE start_time = ${q(start)}`
			),
			'Concurrency must not double-book a slot in the database.'
		).toBe('1');
	});
});

/* =====================================================================
 * Admin booking: documented defects
 * ================================================================== */

test.describe('Booking API: admin edge cases', () => {
	/** The admin page's REST nonce. */
	async function adminNonce(page: Page): Promise<string> {
		await page.goto(
			'wp-admin/admin.php?page=doublescale&path=booking/bookings'
		);
		await expect(page.locator('.doublescale-layout__main')).toBeVisible({
			timeout: 45_000,
		});
		const nonce = await page.evaluate(
			() =>
				(window as { wpApiSettings?: { nonce?: string } }).wpApiSettings
					?.nonce ?? ''
		);
		expect(nonce).not.toBe('');
		return nonce;
	}

	/**
	 * INTENDED BEHAVIOUR — historical backfill. Not a defect.
	 *
	 * `RestBookingController::create_item` deliberately skips
	 * `validate_start_date` inside the `$can_skip_availability` branch, so a
	 * user with `doublescale_booking_manage_all_bookings` can record a
	 * meeting that already happened. The supporting evidence:
	 *
	 *   - the branch's own comment says "e.g. backfilling";
	 *   - the Add Booking dialog offers a "Completed" status at creation
	 *     time, which only makes sense for a past event;
	 *   - the dialog's date input has no `min`, so past dates are selectable
	 *     on purpose;
	 *   - `mark_booking_completed` is otherwise scheduled for the future, so
	 *     a completed booking can only be produced by a past-dated create.
	 *
	 * The public (unauthenticated) path still refuses past dates — proven by
	 * "a past date is refused" above. This test pins the admin capability so
	 * an accidental tightening is noticed.
	 */
	test('admin ignore_availability allows historical backfill', async ({
		page,
	}) => {
		const nonce = await adminNonce(page);
		const { name, email } = probe('adminpast');

		const res = await restBooking(
			page,
			nonce,
			bookingBody({
				start_date: '2020-05-05 10:00:00',
				name,
				email,
				ignore_availability: true,
			})
		);

		expect(
			res.status,
			`Historical backfill was refused — an admin can no longer record a past meeting. If that tightening is intended, update this test and the Completed-status flow with it. ${res.text}`
		).toBe(200);

		// It really did land in the past.
		expect(
			db(
				`SELECT start_time FROM wp_doublescale_bookings b
				 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
				 WHERE c.email = ${q(email)}`
			)
		).toMatch(/^2020-05-05/);
	});

	/**
	 * The backend accepts 00:00 with ignore_availability. Pinned because the
	 * ADMIN UI silently does nothing for that same time — proving the defect
	 * is in the frontend, not the API.
	 */
	test('admin ignore_availability accepts 00:00 at the API level', async ({
		page,
	}) => {
		const nonce = await adminNonce(page);
		const { name, email } = probe('adminmid');

		const res = await restBooking(
			page,
			nonce,
			bookingBody({
				start_date: '2027-05-05 00:00:00',
				name,
				email,
				ignore_availability: true,
			})
		);

		expect(res.status, res.text).toBe(200);
		expect(
			db(
				`SELECT start_time FROM wp_doublescale_bookings b
				 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
				 WHERE c.email = ${q(email)}`
			)
		).toBe('2027-05-05 00:00:00');
	});

	/**
	 * Regression for the "validation errors returned 500" defect.
	 *
	 * `create_item` used to wrap every exception as `status => 500`, so a
	 * caller could not tell "you sent bad data" from "the server broke".
	 * Input failures now raise InvalidBookingInputException and are mapped to
	 * 400 with the `rest_booking_invalid_input` code; everything else still
	 * falls through to 500.
	 *
	 * Before the fix each of these answered 500.
	 */
	for (const [label, over] of [
		['invalid email', { name: 'E2E-bademail', email: 'not-an-email' }],
		['empty name', { name: '', email: 'e2e-empty@example.test' }],
	] as [string, Record<string, unknown>][]) {
		test(`invalid input is a 400, not a 500: ${label}`, async ({
			page,
		}) => {
			const nonce = await adminNonce(page);

			const res = await restBooking(
				page,
				nonce,
				bookingBody({
					start_date: '2027-05-06 10:00:00',
					ignore_availability: true,
					...over,
				})
			);

			expect(
				res.status,
				`Client input errors must use 4xx. ${res.text}`
			).toBe(400);
			expect(res.text).toMatch(/rest_booking_invalid_input/);
			expect(res.text).toMatch(/Invalid invitee/i);
		});
	}

	test('an unparseable date is a 400, not a 500', async ({ page }) => {
		const nonce = await adminNonce(page);
		const { name, email } = probe('baddate');

		const res = await restBooking(
			page,
			nonce,
			bookingBody({
				start_date: 'not-a-date',
				name,
				email,
			})
		);

		expect(res.status, res.text).toBe(400);
		expect(res.text).toMatch(/rest_booking_invalid_input/);
		expect(res.text).toMatch(/Invalid date format or timezone/i);
	});

	/**
	 * The 400 mapping must be narrow: a slot conflict is NOT client-input
	 * validation, so it keeps its own status. This guards against the fix
	 * being widened into a blanket "everything is 400".
	 */
	test('a slot conflict keeps its own status, not 400', async ({ page }) => {
		const nonce = await adminNonce(page);
		const first = probe('conflict1');
		const second = probe('conflict2');
		const start = futureWeekday(210, '14:00:00');

		const a = await restBooking(
			page,
			nonce,
			bookingBody({
				start_date: start,
				name: first.name,
				email: first.email,
			})
		);
		expect(a.status, `First booking should succeed. ${a.text}`).toBe(200);

		const b = await restBooking(
			page,
			nonce,
			bookingBody({
				start_date: start,
				name: second.name,
				email: second.email,
			})
		);

		// Whatever the code, it must NOT be reclassified as invalid input.
		expect(b.status, b.text).not.toBe(200);
		expect(b.text).not.toMatch(/rest_booking_invalid_input/);
	});

	test('an unknown event id is rejected', async ({ page }) => {
		const nonce = await adminNonce(page);
		const { name, email } = probe('badevent');

		const res = await restBooking(
			page,
			nonce,
			bookingBody({
				event_id: 999999,
				start_date: '2027-05-07 10:00:00',
				name,
				email,
				ignore_availability: true,
			})
		);

		// The answer depends on who is asking, and both are correct:
		//
		//   403 — an ordinary admin. `can_manage_event` loads the event,
		//         finds nothing and denies, so the request never reaches the
		//         handler. This also avoids confirming which ids exist.
		//   400 — a super admin on multisite. `can_manage_event` returns true
		//         early for super admins, so the request does reach
		//         `create_item`, where the caller IS authorised and an
		//         unknown id is genuinely bad input.
		//
		// What must never happen is a 500 (the pre-fix behaviour) or a 200.
		expect([400, 403], res.text).toContain(res.status);
		expect(res.text).toMatch(/not allowed|Invalid event/i);

		// Whatever the wording, nothing was created.
		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_contacts WHERE email = ${q(email)}`
			),
			'A booking against an unknown event must not create a contact.'
		).toBe('0');
		expect(name).toBeTruthy();
	});
});
