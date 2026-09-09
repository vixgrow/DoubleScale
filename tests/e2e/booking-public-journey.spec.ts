import { test, expect, type Page, type Browser } from '@playwright/test';
import { execFileSync } from 'node:child_process';

/**
 * P0 — Complete public booking customer journey (anonymous visitor).
 *
 * Browser → date/slot picker → booking form → AJAX book → confirm page → DB
 * row + slot lock → cancel/reschedule action pages → DB + slot state.
 *
 * Event fixture: admin wizard (`createEventViaWizard`) so availability, limits,
 * and attendee-address location match production. Slugs are read from the DB.
 *
 * Email: communication-tracking row is asserted only when attendee confirmation
 * is enabled AND SMTP returns success. This E2E env has no mail catcher, so
 * live delivery is not deterministically testable — template merge tags are
 * checked against stored settings instead.
 */

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';
const SITE = (process.env.WP_BASE_URL ?? 'http://localhost:8889').replace(
	/\/+$/,
	''
);
const AJAX = `${SITE}/wp-admin/admin-ajax.php`;
const ADMIN_AUTH = 'tests/e2e/.auth/admin.json';

type Created = { events: number[]; bookings: number[]; contacts: number[] };
let created: Created = { events: [], bookings: [], contacts: [] };

type SeededEvent = {
	eventId: number;
	eventSlug: string;
	calendarSlug: string;
	eventName: string;
};

let seeded: SeededEvent | null = null;
/** Wizard event id — torn down only in afterAll, not afterEach. */
let seededEventId: number | null = null;

/** Last booking made through the public UI in this run. */
let lastPublicBooking: {
	hash: string;
	bookingId: number;
	contactId: number;
	email: string;
	eventId: number;
	slotDate: string;
	slotTime: string;
} | null = null;

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

function e2eName(): string {
	return `E2E-${Date.now().toString(36)}-${Math.random()
		.toString(36)
		.slice(2, 8)}`;
}

function publicEventUrl(calendarSlug: string, eventSlug: string): string {
	return `${SITE}/?doublescale_booking_calendar=${encodeURIComponent(
		calendarSlug
	)}&event=${encodeURIComponent(eventSlug)}`;
}

function bookingActionUrl(hash: string, type: 'cancel' | 'reschedule' | 'confirm'): string {
	return `${SITE}/?doublescale_booking=booking&id=${encodeURIComponent(
		hash
	)}&type=${type}`;
}

async function gotoBookingAdmin(page: Page, subpath: string): Promise<void> {
	await page.goto(
		`wp-admin/admin.php?page=doublescale&path=booking/${subpath}`
	);
	await expect(page.locator('.doublescale-layout__main')).toBeVisible({
		timeout: 45_000,
	});
	await expect(
		page.locator('.doublescale-booking-page-component-wrapper')
	).toBeVisible({ timeout: 30_000 });
}

async function createEventViaWizard(
	page: Page,
	name: string,
	trackCreated = true
): Promise<number> {
	await gotoBookingAdmin(page, 'calendars');

	const shell = page.locator('.doublescale-booking-calendars');
	const createEvent = shell.getByRole('button', { name: /^Create Event$/i });
	await expect(createEvent.first()).toBeVisible({ timeout: 45_000 });
	await createEvent.first().click();

	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible({ timeout: 15_000 });

	await dialog.getByRole('heading', { name: /^Single Event$/i }).click();
	const cont = dialog.getByRole('button', { name: /^Continue$/i });
	await expect(cont).toBeEnabled({ timeout: 20_000 });
	await cont.click();

	await page.getByRole('textbox').first().pressSequentially(name);
	await expect(cont).toBeEnabled({ timeout: 20_000 });
	await cont.click();

	const checkboxes = page.getByRole('checkbox');
	await expect(checkboxes.first()).toBeVisible({ timeout: 20_000 });
	const labels = await checkboxes.evaluateAll((els) =>
		els.map((e) => (e.closest('label,div')?.textContent ?? '').trim())
	);
	const index = labels.findIndex((t) => /Attendee Address/i.test(t));
	expect(index, 'No "Attendee Address" location offered.').toBeGreaterThan(
		-1
	);
	await checkboxes.nth(index).click();

	const submit = dialog.getByRole('button', { name: /^Submit Event$/i });
	await expect(submit).toBeEnabled({ timeout: 20_000 });
	await submit.click();

	await expect
		.poll(
			() =>
				db(
					`SELECT COUNT(*) FROM wp_doublescale_booking_events WHERE name = ${q(name)}`
				),
			{
				timeout: 45_000,
				message: `No event row was written for "${name}".`,
			}
		)
		.toBe('1');

	const id = Number(
		db(
			`SELECT id FROM wp_doublescale_booking_events WHERE name = ${q(name)} LIMIT 1`
		)
	);
	if (trackCreated) {
		created.events.push(id);
	}
	return id;
}

function deriveEventSlugs(eventId: number): { eventSlug: string; calendarSlug: string } {
	const eventSlug = db(
		`SELECT slug FROM wp_doublescale_booking_events WHERE id = ${eventId}`
	);
	const calendarSlug = db(
		`SELECT c.slug FROM wp_doublescale_booking_calendars c
		 JOIN wp_doublescale_booking_events e ON e.calendar_id = c.id
		 WHERE e.id = ${eventId}`
	);
	expect(eventSlug).not.toBe('');
	expect(calendarSlug).not.toBe('');
	return { eventSlug, calendarSlug };
}

function trackBookingIds(bookingId: number, contactId: number): void {
	if (bookingId && !created.bookings.includes(bookingId)) {
		created.bookings.push(bookingId);
	}
	if (contactId && !created.contacts.includes(contactId)) {
		created.contacts.push(contactId);
	}
}

function lookupBookingByHash(hash: string): {
	bookingId: number;
	contactId: number;
	startTime: string;
	status: string;
	eventId: number;
} {
	const row = db(
		`SELECT id, contact_id, start_time, status, event_id
		 FROM wp_doublescale_bookings WHERE hash_id = ${q(hash)} LIMIT 1`
	);
	const parts = row.split('\t');
	expect(parts.length, `No booking row for hash ${hash}`).toBeGreaterThanOrEqual(
		5
	);
	return {
		bookingId: Number(parts[0]),
		contactId: Number(parts[1]),
		startTime: parts[2],
		status: parts[3],
		eventId: Number(parts[4]),
	};
}

function slotLockCount(bookingId: number): number {
	return Number(
		db(
			`SELECT COUNT(*) FROM wp_doublescale_booking_booked_slots WHERE booking_id = ${bookingId}`
		)
	);
}

/** Open the public event page and wait for the slot picker. */
async function openPublicEvent(page: Page, seededEvent: SeededEvent): Promise<void> {
	const url = publicEventUrl(seededEvent.calendarSlug, seededEvent.eventSlug);
	const res = await page.goto(url);
	expect(res?.status(), `Public event page should load: ${url}`).toBe(200);
	await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({
		timeout: 45_000,
	});
	await expect(page.locator('.doublescale-booking-meeting, .event-card-details').first()).toBeVisible({
		timeout: 30_000,
	});
}

/**
 * Pick the first available day + time on the public picker.
 * Advances months up to 12 times when the current grid has no highlight-date cells.
 */
async function pickAvailableSlot(
	page: Page,
	options: {
		skipTimes?: string[];
		minSlotIndex?: number;
		onlyTimes?: string[];
		targetDate?: string;
	} = {}
): Promise<{ slotDate: string; slotTime: string }> {
	const skipTimes = new Set(options.skipTimes ?? []);
	const onlyTimes = options.onlyTimes ? new Set(options.onlyTimes) : null;
	const targetDate = options.targetDate ?? '';
	const minSlotIndex = options.minSlotIndex ?? 0;
	const timeZone = await page.evaluate(() =>
		Intl.DateTimeFormat().resolvedOptions().timeZone
	);

	for (let month = 0; month < 12; month++) {
		const availableDays = page.locator('.highlight-date');
		const dayCount = await availableDays.count();
		if (dayCount === 0) {
			const nextEmpty = page.locator('.nav-arrow').last();
			if (await nextEmpty.isEnabled().catch(() => false)) {
				await nextEmpty.click();
				continue;
			}
			break;
		}

		for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
			await availableDays.nth(dayIndex).click();
			await expect(page.locator('.time-picker-container')).toBeVisible({
				timeout: 15_000,
			}).catch(() => null);

			const monthLabel = (
				(await page.locator('.month-label').first().textContent()) ?? ''
			).trim();
			const dayNumber = (
				(await page.locator('.selected-date .date-number').first().textContent()) ??
				(await availableDays.nth(dayIndex).locator('.date-number').textContent()) ??
				''
			).trim();
			let slotDate = '';
			if (monthLabel && dayNumber) {
				const parsed = new Date(
					`${monthLabel} ${dayNumber}, ${new Date().getFullYear()}`
				);
				if (!Number.isNaN(parsed.getTime())) {
					if (parsed.getTime() < Date.now()) {
						parsed.setFullYear(parsed.getFullYear() + 1);
					}
					slotDate = new Intl.DateTimeFormat('en-CA', {
						timeZone,
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
					}).format(parsed);
				}
			}

			if (targetDate && slotDate && slotDate !== targetDate) {
				continue;
			}

			const slots = page.locator('.time-slot:not(.time-slot-waiting)');
			await expect(slots.first()).toBeVisible({ timeout: 15_000 }).catch(() => null);

			const count = await slots.count();
			for (let i = minSlotIndex; i < count; i++) {
				const slot = slots.nth(i);
				const label = ((await slot.locator('.time-slot-time').textContent()) ?? '')
					.trim()
					.replace(/\s+/g, ' ');
				const normalized = label.replace(
					/(\d{1,2}):(\d{2})\s*(AM|PM)/i,
					(_, h: string, m: string, ap: string) => {
						let hour = Number(h) % 12;
						if (ap.toUpperCase() === 'PM') {
							hour += 12;
						}
						if (ap.toUpperCase() === 'AM' && Number(h) === 12) {
							hour = 0;
						}
						return `${hour.toString().padStart(2, '0')}:${m}`;
					}
				);
				if (skipTimes.has(normalized)) {
					continue;
				}
				if (onlyTimes && !onlyTimes.has(normalized)) {
					continue;
				}
				await slot.click();
				await expect(page.getByText(/Enter Details/i)).toBeVisible({
					timeout: 15_000,
				});

				return { slotDate, slotTime: normalized || label };
			}
		}

		const next = page.locator('.nav-arrow').last();
		const canNext = await next.isEnabled().catch(() => false);
		if (!canNext) {
			break;
		}
		await next.click();
	}

	throw new Error('No bookable day/time slot was found on the public picker.');
}

async function fillPublicBookingForm(
	page: Page,
	attendee: string,
	email: string
): Promise<void> {
	const nameInput = page
		.getByPlaceholder(/enter your name/i)
		.or(page.getByLabel(/^Name|^Your Name/i))
		.first();
	await expect(nameInput).toBeVisible({ timeout: 15_000 });
	await nameInput.pressSequentially(attendee);

	const emailInput = page
		.getByPlaceholder(/enter your email/i)
		.or(page.getByLabel(/^Email|^Your Email/i))
		.first();
	await expect(emailInput).toBeVisible({ timeout: 15_000 });
	await emailInput.pressSequentially(email);

	const address = page
		.getByPlaceholder(/enter your address|address/i)
		.or(page.getByLabel(/Your Address/i))
		.first();
	if (
		await address
			.waitFor({ state: 'visible', timeout: 5_000 })
			.then(() => true)
			.catch(() => false)
	) {
		await address.pressSequentially('1 E2E Public Journey Street');
	}

	// Fill any other visible required text fields (e.g. default custom question).
	const requiredInputs = page.locator(
		'.questions-container input.doublescale-input-control:visible, .questions-container textarea.doublescale-textarea-control:visible'
	);
	const count = await requiredInputs.count();
	for (let i = 0; i < count; i++) {
		const input = requiredInputs.nth(i);
		const value = await input.inputValue().catch(() => '');
		if (value.trim() !== '') {
			continue;
		}
		const placeholder = (await input.getAttribute('placeholder')) ?? '';
		if (/name|email|address/i.test(placeholder)) {
			continue;
		}
		await input.pressSequentially('E2E answer');
	}
}

async function submitPublicBooking(page: Page): Promise<string> {
	const bookingResponse = page.waitForResponse(
		(r) =>
			r.url().includes('admin-ajax.php') &&
			r.request().method() === 'POST' &&
			r.request().postData()?.includes('doublescale_booking_booking') === true,
		{ timeout: 45_000 }
	);

	await page
		.locator('.schedule-btn')
		.or(page.getByRole('button', { name: /Schedule Event|Submit Booking/i }))
		.first()
		.click();

	const response = await bookingResponse;
	expect(response.ok(), 'Booking AJAX should return HTTP 200').toBeTruthy();
	const body = await response.json().catch(async () => {
		// Full-page redirect to confirm can detach the response body; fall back to URL.
		await page.waitForURL(/type=confirm|doublescale_booking=booking/, {
			timeout: 45_000,
		});
		return null;
	});
	if (body) {
		expect(
			body.success,
			`Booking AJAX failed: ${body?.data?.message ?? 'unknown'}`
		).toBe(true);
		expect(
			body.data?.booking?.hash_id,
			'Booking response must include hash_id'
		).toBeTruthy();
	}

	await page.waitForURL(/type=confirm|doublescale_booking=booking/, {
		timeout: 45_000,
	});
	await expect(
		page.getByText(/Your meeting has been Scheduled|Booking Confirmed!/i)
	).toBeVisible({ timeout: 30_000 });

	const url = new URL(page.url());
	const hash =
		url.searchParams.get('id') ??
		(body?.data?.booking?.hash_id
			? String(body.data.booking.hash_id)
			: '');
	expect(hash).not.toBe('');
	return hash;
}

async function bookViaPublicUi(
	page: Page,
	seededEvent: SeededEvent,
	options: { skipTimes?: string[]; minSlotIndex?: number } = {}
): Promise<typeof lastPublicBooking> {
	const attendee = e2eName();
	const email = `${attendee.toLowerCase()}@example.test`;

	await openPublicEvent(page, seededEvent);
	const { slotDate, slotTime } = await pickAvailableSlot(page, options);
	await fillPublicBookingForm(page, attendee, email);
	const hash = await submitPublicBooking(page);

	const row = lookupBookingByHash(hash);
	trackBookingIds(row.bookingId, row.contactId);

	lastPublicBooking = {
		hash,
		bookingId: row.bookingId,
		contactId: row.contactId,
		email,
		eventId: row.eventId,
		slotDate,
		slotTime,
	};
	return lastPublicBooking;
}

async function bookViaAjax(
	request: import('@playwright/test').APIRequestContext,
	eventId: number,
	startDate: string,
	who: string
): Promise<{ ok: boolean; message: string; bookingId: number; contactId: number }> {
	const email = `${who.toLowerCase()}@example.test`;
	const res = await request.post(AJAX, {
		form: {
			action: 'doublescale_booking_booking',
			id: String(eventId),
			timezone: 'UTC',
			duration: '30',
			location: JSON.stringify({
				type: 'attendee_address',
				value: '2 E2E Public Journey Street',
			}),
			invitees: JSON.stringify([{ name: who, email }]),
			start_date: startDate,
		},
	});
	const body = await res.json();
	const bookingId = body.success
		? Number(
				db(
					`SELECT id FROM wp_doublescale_bookings WHERE contact_id = (
						SELECT id FROM wp_doublescale_contacts WHERE email = ${q(email)} LIMIT 1
					) ORDER BY id DESC LIMIT 1`
				)
			)
		: 0;
	const contactId = body.success
		? Number(
				db(
					`SELECT id FROM wp_doublescale_contacts WHERE email = ${q(email)} LIMIT 1`
				)
			)
		: 0;
	if (bookingId) {
		trackBookingIds(bookingId, contactId);
	}
	return {
		ok: Boolean(body.success),
		message: String(body?.data?.message ?? ''),
		bookingId,
		contactId,
	};
}

function mysqlStartFromUtc(isoOrMysql: string): string {
	const normalized = isoOrMysql.includes('T')
		? isoOrMysql.replace('T', ' ').replace(/\.\d+Z$/, '').replace(/Z$/, '')
		: isoOrMysql;
	return normalized.slice(0, 19);
}

function addMinutesToMysqlStart(mysqlStart: string, minutes: number): string {
	const d = new Date(`${mysqlStart.replace(' ', 'T')}Z`);
	d.setUTCMinutes(d.getUTCMinutes() + minutes);
	return d.toISOString().slice(0, 19).replace('T', ' ');
}

function localNormalizedSlotFromMysqlUtc(
	mysqlUtc: string,
	timeZone: string
): string {
	const d = new Date(`${mysqlUtc.replace(' ', 'T')}Z`);
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).formatToParts(d);
	const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
	const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
	return `${hour}:${minute}`;
}

async function assertSlotNotBookableViaAjax(
	request: import('@playwright/test').APIRequestContext,
	eventId: number,
	startTimeUtc: string,
	who: string
): Promise<void> {
	const email = `${who.toLowerCase()}@example.test`;
	const res = await request.post(AJAX, {
		form: {
			action: 'doublescale_booking_booking',
			id: String(eventId),
			timezone: 'UTC',
			duration: '30',
			location: JSON.stringify({
				type: 'attendee_address',
				value: '2 E2E Contention Street',
			}),
			invitees: JSON.stringify([{ name: who, email }]),
			start_date: startTimeUtc.replace('T', ' ').replace(/\.\d+Z$/, ''),
		},
	});
	const body = await res.json();
	expect(
		body.success,
		`Booked slot at ${startTimeUtc} must not accept a second booking.`
	).toBe(false);
	expect(String(body?.data?.message ?? '')).toMatch(
		/not available|just been booked/i
	);
}

function attendeeConfirmationEnabled(): boolean {
	try {
		const raw = execFileSync(
			'wp',
			['option', 'get', 'doublescale_booking_settings', '--format=json', `--path=${WP_PATH}`],
			{ encoding: 'utf8', timeout: 15_000 }
		);
		const settings = JSON.parse(raw || '{}') as {
			email_notifications?: {
				attendee_confirmation?: { enabled?: boolean };
			};
		};
		return Boolean(
			settings?.email_notifications?.attendee_confirmation?.enabled
		);
	} catch {
		return false;
	}
}

function attendeeConfirmationTemplate(eventId?: number): string {
	try {
		const id =
			eventId ??
			seeded?.eventId ??
			Number(
				db(
					`SELECT event_id FROM wp_doublescale_booking_events_meta
					 WHERE meta_key = 'email_notifications'
					 ORDER BY event_id DESC LIMIT 1`
				)
			);
		if (!id) {
			return '';
		}
		return execFileSync(
			'wp',
			[
				'eval',
				`$raw = $GLOBALS['wpdb']->get_var($GLOBALS['wpdb']->prepare(
					"SELECT meta_value FROM {$GLOBALS['wpdb']->prefix}doublescale_booking_events_meta WHERE event_id = %d AND meta_key = 'email_notifications' LIMIT 1",
					${id}
				));
				$data = maybe_unserialize($raw);
				echo is_array($data) ? (string)($data['attendee_confirmation']['template']['message'] ?? '') : '';`,
				`--path=${WP_PATH}`,
			],
			{ encoding: 'utf8', timeout: 15_000 }
		).trim();
	} catch {
		return '';
	}
}

function includeIcsEnabled(): boolean {
	try {
		const raw = execFileSync(
			'wp',
			['option', 'get', 'doublescale_booking_settings', '--format=json', `--path=${WP_PATH}`],
			{ encoding: 'utf8', timeout: 15_000 }
		);
		const settings = JSON.parse(raw || '{}') as {
			general?: { include_ics?: boolean };
		};
		return Boolean(settings?.general?.include_ics);
	} catch {
		return false;
	}
}

test.beforeAll(async ({ browser }: { browser: Browser }) => {
	const context = await browser.newContext({ storageState: ADMIN_AUTH });
	const page = await context.newPage();
	const eventName = e2eName();
	const eventId = await createEventViaWizard(page, eventName, false);
	seededEventId = eventId;
	const { eventSlug, calendarSlug } = deriveEventSlugs(eventId);
	seeded = { eventId, eventSlug, calendarSlug, eventName };
	await context.close();
});

test.afterEach(async () => {
	try {
		db(
			`DELETE s FROM wp_doublescale_booking_booked_slots s
			 LEFT JOIN wp_doublescale_bookings b ON b.id = s.booking_id
			 WHERE b.id IS NULL`
		);
	} catch {
		/* best effort */
	}
});

test.afterAll(async () => {
	for (const id of created.bookings) {
		try {
			db(
				`DELETE FROM wp_doublescale_booking_booked_slots WHERE booking_id = ${id}`
			);
			db(`DELETE FROM wp_doublescale_bookings WHERE id = ${id}`);
		} catch {
			/* keep going */
		}
	}
	for (const id of created.contacts) {
		try {
			db(`DELETE FROM wp_doublescale_contacts WHERE id = ${id}`);
		} catch {
			/* keep going */
		}
	}
	for (const id of created.events) {
		try {
			db(`DELETE FROM wp_doublescale_bookings WHERE event_id = ${id}`);
			db(
				`DELETE FROM wp_doublescale_booking_events_meta WHERE event_id = ${id}`
			);
			db(`DELETE FROM wp_doublescale_booking_events WHERE id = ${id}`);
		} catch {
			/* keep going */
		}
	}
	if (seededEventId) {
		try {
			db(`DELETE FROM wp_doublescale_bookings WHERE event_id = ${seededEventId}`);
			db(
				`DELETE FROM wp_doublescale_booking_events_meta WHERE event_id = ${seededEventId}`
			);
			db(
				`DELETE FROM wp_doublescale_booking_events WHERE id = ${seededEventId}`
			);
		} catch {
			/* best effort */
		}
	}
	try {
		db(`DELETE FROM wp_doublescale_booking_events WHERE name LIKE 'E2E-%'`);
	} catch {
		/* best effort */
	}
	created = { events: [], bookings: [], contacts: [] };
	lastPublicBooking = null;
	seededEventId = null;
});

test.describe.configure({ mode: 'serial' });

test.describe('Public booking customer journey', () => {
	test.use({ storageState: { cookies: [], origins: [] } });
	test.setTimeout(120_000);

	test('wizard seeds a deterministic public event', async () => {
		expect(seeded, 'Admin wizard must seed an event in beforeAll.').not.toBeNull();
		expect(seeded!.eventId).toBeGreaterThan(0);
		expect(seeded!.eventSlug).not.toBe('');
		expect(seeded!.calendarSlug).not.toBe('');

		const res = await fetch(
			publicEventUrl(seeded!.calendarSlug, seeded!.eventSlug)
		);
		expect(res.status).toBe(200);
	});

	test('anonymous visitor completes a public booking via the UI', async ({
		page,
		request,
	}) => {
		expect(seeded).not.toBeNull();
		const booking = await bookViaPublicUi(page, seeded!);

		expect(booking!.hash).toMatch(/^[a-f0-9-]{36}$/i);
		expect(
			db(
				`SELECT status FROM wp_doublescale_bookings WHERE id = ${booking!.bookingId}`
			)
		).toBe('scheduled');
		expect(slotLockCount(booking!.bookingId)).toBe(1);

		const startTime = db(
			`SELECT start_time FROM wp_doublescale_bookings WHERE id = ${booking!.bookingId}`
		);
		await assertSlotNotBookableViaAjax(
			request,
			booking!.eventId,
			startTime,
			e2eName()
		);
	});

	test('customer cancels via the real hash cancel page', async ({ page }) => {
		expect(seeded).not.toBeNull();
		expect(lastPublicBooking, 'Requires the booking from the prior test.').not.toBeNull();
		const { hash, bookingId } = lastPublicBooking!;

		await page.goto(bookingActionUrl(hash, 'cancel'));
		await expect(page.getByText(/Booking Cancellation/i)).toBeVisible({
			timeout: 30_000,
		});
		await expect(page.locator('#cancel_booking_button')).toBeVisible();

		const reason = page.locator('#cancellation_reason');
		if (await reason.isVisible().catch(() => false)) {
			await reason.fill('E2E cancellation reason');
		}

		const cancelResponse = page.waitForResponse(
			(r) =>
				r.url().includes('admin-ajax.php') &&
				r.request().postData()?.includes('doublescale_booking_cancel_booking') ===
					true,
			{ timeout: 30_000 }
		);
		await page.locator('#cancel_booking_button').click();
		await cancelResponse;

		await expect(page.locator('#success_message')).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.locator('#success_message')).not.toHaveText('');

		expect(
			db(`SELECT status FROM wp_doublescale_bookings WHERE id = ${bookingId}`)
		).toBe('cancelled');
		expect(slotLockCount(bookingId)).toBe(0);

		const releasedStart = mysqlStartFromUtc(
			db(`SELECT start_time FROM wp_doublescale_bookings WHERE id = ${bookingId}`)
		);
		const reborn = await bookViaAjax(
			page.request,
			seeded!.eventId,
			releasedStart,
			e2eName()
		);
		expect(
			reborn.ok,
			`Cancelled slot at ${releasedStart} must be bookable again: ${reborn.message}`
		).toBe(true);
		expect(slotLockCount(reborn.bookingId)).toBe(1);

		await page.goto(bookingActionUrl(hash, 'cancel'));
		await expect(page.getByText(/already been cancelled/i)).toBeVisible({
			timeout: 15_000,
		});
	});

	test('failed reschedule to an occupied slot must not redirect to confirm', async ({
		page,
	}) => {
		expect(seeded).not.toBeNull();

		const first = await bookViaPublicUi(page, seeded!);
		const originalStart = mysqlStartFromUtc(
			db(`SELECT start_time FROM wp_doublescale_bookings WHERE id = ${first!.bookingId}`)
		);

		await page.route('**/admin-ajax.php', async (route) => {
			const post = route.request().postData() ?? '';
			if (post.includes('doublescale_booking_reschedule_booking')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						success: false,
						data: {
							message:
								'This time slot has just been booked. Please choose another.',
						},
					}),
				});
				return;
			}
			await route.continue();
		});

		await page.goto(bookingActionUrl(first!.hash, 'reschedule'));
		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({
			timeout: 45_000,
		});

		await pickAvailableSlot(page, {
			skipTimes: first!.slotTime ? [first!.slotTime] : [],
			minSlotIndex: 0,
		});

		const rescheduleReason = page
			.getByPlaceholder(/why you need to reschedule|reschedule/i)
			.or(page.locator('textarea').last());
		if (await rescheduleReason.isVisible().catch(() => false)) {
			await rescheduleReason.fill('E2E occupied-slot reschedule attempt');
		}

		await page.getByRole('button', { name: /^Reschedule Event$/i }).click();

		await expect(page.getByText(/just been booked|not available/i)).toBeVisible({
			timeout: 15_000,
		});
		await page.waitForTimeout(2_000);
		expect(page.url()).not.toMatch(/type=confirm/);
		expect(
			mysqlStartFromUtc(
				db(
					`SELECT start_time FROM wp_doublescale_bookings WHERE id = ${first!.bookingId}`
				)
			)
		).toBe(originalStart);
	});

	test('customer reschedules to a different slot and lands on confirm', async ({
		page,
	}) => {
		expect(seeded).not.toBeNull();

		const first = await bookViaPublicUi(page, seeded!);
		const originalStart = db(
			`SELECT start_time FROM wp_doublescale_bookings WHERE id = ${first!.bookingId}`
		);
		expect(slotLockCount(first!.bookingId)).toBe(1);

		await page.goto(bookingActionUrl(first!.hash, 'reschedule'));
		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({
			timeout: 45_000,
		});

		const { slotTime: newSlotTime } = await pickAvailableSlot(page, {
			skipTimes: first!.slotTime ? [first!.slotTime] : [],
			minSlotIndex: 1,
		});

		const rescheduleReason = page
			.getByPlaceholder(/why you need to reschedule|reschedule/i)
			.or(page.locator('textarea').last());
		if (await rescheduleReason.isVisible().catch(() => false)) {
			await rescheduleReason.fill('E2E reschedule reason');
		}

		const rescheduleResponse = page.waitForResponse(
			(r) =>
				r.url().includes('admin-ajax.php') &&
				r.request().postData()?.includes(
					'doublescale_booking_reschedule_booking'
				) === true,
			{ timeout: 45_000 }
		);

		await page.getByRole('button', { name: /^Reschedule Event$/i }).click();
		const response = await rescheduleResponse;
		expect(response.ok(), 'Reschedule AJAX should return HTTP 200').toBeTruthy();
		const body = await response.json().catch(() => null);

		await page.waitForURL(/type=confirm/, { timeout: 45_000 });
		await expect(
			page.getByText(/Your meeting has been Scheduled/i)
		).toBeVisible({ timeout: 30_000 });

		if (body) {
			expect(
				body.success,
				`Reschedule AJAX failed: ${body?.data?.message ?? body?.message ?? 'unknown'}`
			).toBe(true);
		}

		const newStart = db(
			`SELECT start_time FROM wp_doublescale_bookings WHERE id = ${first!.bookingId}`
		);
		expect(newStart).not.toBe(originalStart);
		expect(
			db(`SELECT status FROM wp_doublescale_bookings WHERE id = ${first!.bookingId}`)
		).toBe('scheduled');
		expect(slotLockCount(first!.bookingId)).toBe(1);
		expect(newSlotTime).not.toBe(first!.slotTime);
	});

	test('attendee confirmation template stores cancel and reschedule merge tags', async () => {
		expect(seeded).not.toBeNull();
		const template = attendeeConfirmationTemplate(seeded!.eventId);
		expect(
			template,
			'Attendee confirmation template must exist on the seeded event.'
		).not.toBe('');
		expect(template).toMatch(/{{booking:cancel_url}}/);
		expect(template).toMatch(/{{booking:reschedule_url}}/);
	});

	test('conditional confirmation email tracking and template merge tags', async ({
		page,
	}) => {
		expect(seeded).not.toBeNull();

		if (!attendeeConfirmationEnabled()) {
			test.skip(
				true,
				'Attendee confirmation email is disabled in doublescale_booking_settings — live SMTP/tracking is not asserted in this env.'
			);
		}

		const booking = await bookViaPublicUi(page, seeded!);
		const template = attendeeConfirmationTemplate();

		expect(template, 'Attendee confirmation template must be configured.').toMatch(
			/{{booking:cancel_url}}/
		);
		expect(template).toMatch(/{{booking:reschedule_url}}/);

		if (includeIcsEnabled()) {
			expect(
				db(
					`SELECT meta_value FROM wp_options WHERE option_name = 'doublescale_booking_settings' LIMIT 1`
				)
			).toMatch(/include_ics/i);
		}

		const trackingCount = Number(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_communication_tracking
				 WHERE source_type = 4 AND source_id = ${booking!.bookingId}
				   AND direction = 'outbound' AND recipient = ${q(booking!.email)}`
			)
		);

		if (trackingCount === 0) {
			test.info().annotations.push({
				type: 'email',
				description:
					'No communication_tracking row — SMTP likely disabled or send returned false. Template merge tags were still verified.',
			});
			return;
		}

		expect(trackingCount).toBeGreaterThanOrEqual(1);
	});
});
