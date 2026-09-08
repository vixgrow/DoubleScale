import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

/**
 * Deleting a contact must not orphan their bookings.
 *
 * `RestContactController` already refuses to delete a contact that has
 * invoices, contracts or credit notes (409, `requires_force`). Bookings were
 * counted in the deletion-impact report but were NOT part of that guard, so
 * deleting the contact left:
 *
 *   - a booking row pointing at a contact that no longer exists, and
 *   - its `booked_slots` lock still held, making that slot unbookable forever.
 *
 * A real orphan of exactly this shape existed on the site (booking id 14 →
 * contact 372) before this test was written.
 *
 * Every row created here is removed in afterEach, including on failure.
 */

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';
const SITE = process.env.WP_BASE_URL ?? 'http://localhost/wordpress';
const AJAX = `${SITE}/wp-admin/admin-ajax.php`;
const EVENT_ID = Number(process.env.DS_E2E_EVENT_ID ?? 11);

/** Ids created by the current test, torn down afterwards. */
let made: { contacts: number[]; bookings: number[] } = {
	contacts: [],
	bookings: [],
};

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

/** A future weekday inside the default 09:00-17:00 schedule. */
function futureWeekday(daysOut: number, time: string): string {
	const d = new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
	while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
		d.setUTCDate(d.getUTCDate() + 1);
	}
	return `${d.toISOString().slice(0, 10)} ${time}`;
}

test.afterEach(async () => {
	// Slot lock first — deleting the booking alone strands the lock and makes
	// that slot permanently unbookable.
	for (const id of made.bookings) {
		try {
			db(
				`DELETE FROM wp_doublescale_booking_booked_slots WHERE booking_id = ${id}`
			);
			db(`DELETE FROM wp_doublescale_bookings WHERE id = ${id}`);
		} catch {
			// One failure must not strand the rest.
		}
	}
	for (const id of made.contacts) {
		try {
			db(`DELETE FROM wp_doublescale_contacts WHERE id = ${id}`);
		} catch {
			// Same.
		}
	}
	made = { contacts: [], bookings: [] };
});

/** Create a real booking through the public path; returns its ids. */
async function makeBooking(
	page: Page,
	tag: string
): Promise<{ bookingId: number; contactId: number; email: string }> {
	const name = `E2E-${tag}-${Math.random().toString(36).slice(2, 8)}`;
	const email = `${name.toLowerCase()}@example.test`;

	const res = await page.request.post(AJAX, {
		form: {
			action: 'doublescale_booking_booking',
			id: String(EVENT_ID),
			timezone: 'UTC',
			duration: '30',
			location: JSON.stringify({
				type: 'attendee_address',
				value: '1 E2E Street',
			}),
			invitees: JSON.stringify([{ name, email }]),
			start_date: futureWeekday(
				500 + Math.floor(Math.random() * 200),
				'10:30:00'
			),
		},
	});

	const body = await res.json();
	expect(
		body.success,
		`Setup failed: could not create a booking. ${JSON.stringify(body).slice(0, 200)}`
	).toBe(true);

	const contactId = Number(
		db(
			`SELECT id FROM wp_doublescale_contacts WHERE email = ${q(email)} LIMIT 1`
		)
	);
	const bookingId = Number(
		db(
			`SELECT id FROM wp_doublescale_bookings WHERE contact_id = ${contactId} LIMIT 1`
		)
	);

	expect(contactId, 'Setup failed: no contact row.').toBeGreaterThan(0);
	expect(bookingId, 'Setup failed: no booking row.').toBeGreaterThan(0);

	made.contacts.push(contactId);
	made.bookings.push(bookingId);

	return { bookingId, contactId, email };
}

/** The admin REST nonce, taken from the page so cookie and nonce match. */
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

/** DELETE a contact from inside the page (shared cookie jar + nonce). */
async function deleteContact(
	page: Page,
	nonce: string,
	contactId: number,
	force = false
): Promise<{ status: number; text: string }> {
	return page.evaluate(
		async ({ n, id, f }) => {
			const url =
				`/wordpress/wp-json/doublescale/v1/contacts/${id}` +
				(f ? '?force=true' : '');
			const r = await fetch(url, {
				method: 'DELETE',
				credentials: 'same-origin',
				headers: { 'X-WP-Nonce': n },
			});
			return { status: r.status, text: await r.text() };
		},
		{ n: nonce, id: contactId, f: force }
	);
}

test.describe('Contact deletion must not orphan bookings', () => {
	test('deleting a contact who has a booking is refused with 409', async ({
		page,
	}) => {
		const nonce = await adminNonce(page);
		const { contactId, bookingId } = await makeBooking(page, 'guard');

		const res = await deleteContact(page, nonce, contactId);

		expect(
			res.status,
			`A contact with a booking must not be deletable. ${res.text}`
		).toBe(409);

		// The contact, the booking and its slot lock all survive.
		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_contacts WHERE id = ${contactId}`
			),
			'The contact should still exist after a refused delete.'
		).toBe('1');
		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_bookings WHERE id = ${bookingId}`
			)
		).toBe('1');
		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_booking_booked_slots WHERE booking_id = ${bookingId}`
			),
			'The slot lock must stay with its booking.'
		).toBe('1');
	});

	test('the refusal names bookings as the reason', async ({ page }) => {
		const nonce = await adminNonce(page);
		const { contactId } = await makeBooking(page, 'reason');

		const res = await deleteContact(page, nonce, contactId);

		expect(res.status).toBe(409);
		// The caller must be able to tell WHY, and act on it.
		expect(res.text).toMatch(/booking/i);
		expect(res.text).toMatch(/requires_force|impact/);
	});

	test('no booking is ever left pointing at a deleted contact', async ({
		page,
	}) => {
		const nonce = await adminNonce(page);
		const { contactId } = await makeBooking(page, 'orphan');

		await deleteContact(page, nonce, contactId);

		// Whatever the endpoint decides, this invariant must hold: a booking
		// must never reference a contact that no longer exists.
		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_bookings b
				 LEFT JOIN wp_doublescale_contacts c ON c.id = b.contact_id
				 WHERE c.id IS NULL AND b.contact_id = ${contactId}`
			),
			'Deleting a contact orphaned their booking.'
		).toBe('0');
	});
});
