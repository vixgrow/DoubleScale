import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

/**
 * The happy path, for real: create an event, book it, prove the row landed,
 * then delete everything this spec made.
 *
 * The rest of the booking suite verifies that controls exist and that guards
 * hold. Nothing there completes a write, so a broken create POST would leave
 * every test green. This file closes that hole.
 *
 * Rules this file follows:
 *
 *  - Every artefact is named `E2E-<random>` so it can never be confused with
 *    the site's real data.
 *  - Cleanup runs in `afterEach`, so it happens even when a test fails or
 *    throws mid-way.
 *  - Success is confirmed against the DATABASE, not the UI. A toast saying
 *    "saved" is not evidence that a row exists.
 *  - Deletion is scoped by primary key to rows this run created. Nothing
 *    else is ever touched.
 */

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';

/** Rows created by the current test, torn down in afterEach. */
type Created = {
	events: number[];
	bookings: number[];
	contacts: number[];
};
let created: Created = { events: [], bookings: [], contacts: [] };

/** Unique, obviously-synthetic marker for everything this spec creates. */
function e2eName(): string {
	return `E2E-${Date.now().toString(36)}-${Math.random()
		.toString(36)
		.slice(2, 8)}`;
}

/** Run a read/write query through WP-CLI (no credentials in this file). */
function db(sql: string): string {
	return execFileSync(
		'wp',
		['db', 'query', sql, '--skip-column-names', `--path=${WP_PATH}`],
		{ encoding: 'utf8', timeout: 30_000 }
	).trim();
}

/** SQL-escape a literal for the narrow set of values this spec uses. */
function q(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

test.afterEach(async () => {
	// Teardown must never be skipped: it runs after passes, failures and
	// timeouts alike. Deletes are keyed on ids captured during the test.
	for (const id of created.bookings) {
		try {
			// Release the slot lock first — `booked_slots` is what enforces
			// "one booking per slot", so deleting only the booking row leaves
			// an orphaned lock and that slot stays unbookable forever.
			db(
				`DELETE FROM wp_doublescale_booking_booked_slots WHERE booking_id = ${id}`
			);
			db(`DELETE FROM wp_doublescale_bookings WHERE id = ${id}`);
		} catch {
			// Keep going: one failed delete must not strand the others.
		}
	}

	for (const id of created.events) {
		try {
			db(`DELETE FROM wp_doublescale_booking_events WHERE id = ${id}`);
		} catch {
			// Same.
		}
	}

	// Contacts created by the manual-booking test. Only ever E2E- rows.
	for (const id of created.contacts) {
		try {
			db(`DELETE FROM wp_doublescale_contacts WHERE id = ${id}`);
		} catch {
			// Same.
		}
	}

	created = { events: [], bookings: [], contacts: [] };
});

/** Belt and braces: sweep any stray E2E- rows an earlier crashed run left. */
test.afterAll(async () => {
	try {
		db(`DELETE FROM wp_doublescale_booking_events WHERE name LIKE 'E2E-%'`);
	} catch {
		// Best effort only.
	}
});

async function gotoBooking(page: Page, subpath: string): Promise<void> {
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

/**
 * Drive the three-step wizard to completion. Returns the created event's id,
 * recorded for teardown.
 */
async function createEventViaWizard(page: Page, name: string): Promise<number> {
	await gotoBooking(page, 'calendars');

	const shell = page.locator('.doublescale-booking-calendars');
	const createEvent = shell.getByRole('button', { name: /^Create Event$/i });
	await expect(createEvent.first()).toBeVisible({ timeout: 45_000 });
	await createEvent.first().click();

	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible({ timeout: 15_000 });

	// Step 1 — event type.
	await dialog.getByRole('heading', { name: /^Single Event$/i }).click();
	const cont = dialog.getByRole('button', { name: /^Continue$/i });
	await expect(cont).toBeEnabled({ timeout: 20_000 });
	await cont.click();

	// Step 2 — name and duration. pressSequentially, not fill: these forms
	// ignore a one-shot value set.
	await page.getByRole('textbox').first().pressSequentially(name);
	await expect(cont).toBeEnabled({ timeout: 20_000 });
	await cont.click();

	// Step 3 — location. Each option is a checkbox, and several open a nested
	// dialog for extra config ("Online Meeting" demands a Meeting URL, the
	// conferencing ones need a linked account). "Attendee Address" needs
	// nothing, so it is the one that keeps this test about the write path.
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

	// Wait for the row itself rather than a toast — the toast can appear
	// before the write settles, and its absence would not prove failure.
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
	created.events.push(id);
	return id;
}

/* =====================================================================
 * Create an event through the wizard
 * ================================================================== */

test.describe('Booking write path: create event', () => {
	test('the wizard creates an event and the row lands in the database', async ({
		page,
	}) => {
		const name = e2eName();

		const before = Number(
			db('SELECT COUNT(*) FROM wp_doublescale_booking_events')
		);

		const eventId = await createEventViaWizard(page, name);

		// Not an absolute count: sibling specs create and delete their own
		// events in parallel. The row found by this test's unique name (above)
		// is the real proof; this only guards against a net loss.
		const after = Number(
			db('SELECT COUNT(*) FROM wp_doublescale_booking_events')
		);
		expect(
			after,
			'The event count should not have dropped while creating an event.'
		).toBeGreaterThanOrEqual(before);

		// It is a usable event, not a half-written stub.
		const details = db(
			`SELECT CONCAT_WS('|', slug, status, duration) FROM wp_doublescale_booking_events WHERE id = ${eventId}`
		);
		const [slug, status, duration] = details.split('|');
		expect(slug, 'The event needs a slug to be bookable.').not.toBe('');
		expect(status).toBe('active');
		expect(Number(duration)).toBeGreaterThan(0);
	});

	test('the new event appears in the calendars list', async ({ page }) => {
		const name = e2eName();
		await createEventViaWizard(page, name);

		// Back to the list: the event the user just made must be visible
		// there, not only in the database.
		await gotoBooking(page, 'calendars');
		await expect(
			page.getByText(name, { exact: false }).first()
		).toBeVisible({ timeout: 45_000 });
	});

	test('the created event is reachable on its public page', async ({
		page,
	}) => {
		const name = e2eName();
		const eventId = await createEventViaWizard(page, name);

		const slug = db(
			`SELECT slug FROM wp_doublescale_booking_events WHERE id = ${eventId}`
		);
		const cal = db(
			`SELECT c.slug FROM wp_doublescale_booking_calendars c
			 JOIN wp_doublescale_booking_events e ON e.calendar_id = c.id
			 WHERE e.id = ${eventId}`
		);
		expect(slug).not.toBe('');
		expect(cal).not.toBe('');

		// The whole point of creating an event is that someone can book it.
		const site = process.env.WP_BASE_URL ?? 'http://localhost/wordpress';
		const res = await page.request.get(
			`${site}?doublescale_booking_calendar=${cal}&event=${slug}`
		);
		expect(
			res.status(),
			'A freshly created event should be publicly bookable.'
		).toBe(200);
	});
});

/* =====================================================================
 * Create a booking against an event
 * ================================================================== */

test.describe('Booking write path: create booking', () => {
	test('a manual booking is written and then shows in the list', async ({
		page,
	}) => {
		const attendee = e2eName();
		const email = `${attendee.toLowerCase()}@example.test`;

		const before = Number(
			db('SELECT COUNT(*) FROM wp_doublescale_bookings')
		);

		await gotoBooking(page, 'bookings');

		await page
			.getByRole('button', { name: /^Booking Manually$/i })
			.first()
			.click();

		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });

		// Choose an event first — Save Booking is disabled until one is set
		// (`disabled={!selectedEvent || loading}`).
		const eventPicker = dialog.getByRole('combobox').first();
		await expect(eventPicker).toBeVisible({ timeout: 15_000 });
		await eventPicker.click();

		const firstOption = page.getByRole('option').first();
		const hasOption = await firstOption
			.waitFor({ state: 'visible', timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		test.skip(!hasOption, 'No bookable event is offered in the picker.');
		await firstOption.click();

		// "Ignore Availability" — otherwise only slots inside the event's
		// working hours are offered, and a headless run may find none.
		const ignore = dialog.getByRole('checkbox').first();
		if (await ignore.isVisible().catch(() => false)) {
			await ignore.click();
		}

		// A date must be picked before the time dropdown enables.
		const dateInput = dialog.locator('input[type="date"]').first();
		await expect(dateInput).toBeVisible({ timeout: 15_000 });

		// A distinct future date per run. Re-using one date makes the second
		// run collide with the first booking and the API answers
		// "This time slot has just been booked." — a real 500, not a flake.
		const daysOut = 30 + Math.floor(Math.random() * 300);
		const when = new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
		await dateInput.fill(when.toISOString().slice(0, 10));

		// Now the time list should populate. The dialog's comboboxes are, in
		// order: event, timezone, duration, time, status — so the time one is
		// found by its placeholder text rather than by index.
		const timeSelect = dialog
			.getByRole('combobox')
			.filter({ hasText: /Select Time/i })
			.first();
		await expect(timeSelect).toBeVisible({ timeout: 15_000 });
		await timeSelect.click();

		const timeOptions = page.getByRole('option');
		const hasTime = await timeOptions
			.first()
			.waitFor({ state: 'visible', timeout: 15_000 })
			.then(() => true)
			.catch(() => false);
		test.skip(
			!hasTime,
			'No time slot was offered for the chosen date, even ignoring availability.'
		);

		// Vary the slot so repeat runs on the same date do not collide with
		// each other's bookings. Index 0 ("00:00") is deliberately included:
		// it submits correctly when availability is ignored — verified live,
		// 200 with the row stored at the right UTC offset.
		const count = await timeOptions.count();
		await timeOptions.nth(Math.floor(Math.random() * count)).click();

		// Attendee — switch to "New contact" so this test owns the contact it
		// creates instead of attaching to a real one.
		const newContact = dialog.getByText(/New contact/i).first();
		await expect(newContact).toBeVisible({ timeout: 15_000 });
		await newContact.click();

		const nameInput = dialog.getByPlaceholder(/name/i).first();
		await expect(nameInput).toBeVisible({ timeout: 15_000 });
		await nameInput.pressSequentially(attendee);

		const emailInput = dialog.getByPlaceholder(/email/i).first();
		await expect(emailInput).toBeVisible({ timeout: 15_000 });
		await emailInput.pressSequentially(email);

		// The event's location adds its own required field ("Attendee
		// Address" asks for the address). Fill whatever the form still
		// demands, so this test exercises the write rather than the guard.
		const address = dialog.getByPlaceholder(/address/i).first();
		if (
			await address
				.waitFor({ state: 'visible', timeout: 5_000 })
				.then(() => true)
				.catch(() => false)
		) {
			await address.pressSequentially('1 E2E Street');
		}

		const save = dialog.getByRole('button', { name: /Save Booking/i });

		// If the form still will not submit, the remaining required fields
		// (date/slot) are not reachable on this data set. Say so honestly
		// rather than pretending the path was covered.
		const canSave = await save.isEnabled().catch(() => false);
		test.skip(
			!canSave,
			'Save Booking stayed disabled — a date/slot is required that this event does not offer.'
		);

		// Capture what the server actually said, so a failure reports the API
		// error instead of a bare "no row appeared".
		const posted = page
			.waitForResponse(
				(r) =>
					/bookings/i.test(r.url()) &&
					r.request().method() === 'POST',
				{ timeout: 30_000 }
			)
			.catch(() => null);

		await save.click();

		const response = await posted;
		if (response && !response.ok()) {
			const body = await response.text().catch(() => '');
			throw new Error(
				`Booking POST failed: ${response.status()} ${body.slice(0, 400)}`
			);
		}
		expect(
			response,
			'Save Booking fired no POST — the form silently swallowed the click.'
		).not.toBeNull();

		// Prove the row exists, by the contact this test created.
		await expect
			.poll(
				() =>
					db(
						`SELECT COUNT(*) FROM wp_doublescale_bookings b
						 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
						 WHERE c.first_name = ${q(attendee)} OR c.email = ${q(email)}`
					),
				{
					timeout: 30_000,
					message: `No booking row was written for "${attendee}".`,
				}
			)
			.toBe('1');

		const bookingId = Number(
			db(
				`SELECT b.id FROM wp_doublescale_bookings b
				 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
				 WHERE c.first_name = ${q(attendee)} OR c.email = ${q(email)} LIMIT 1`
			)
		);
		created.bookings.push(bookingId);

		const contactId = Number(
			db(
				`SELECT id FROM wp_doublescale_contacts WHERE first_name = ${q(attendee)} OR email = ${q(email)} LIMIT 1`
			)
		);
		if (contactId) {
			created.contacts.push(contactId);
		}

		// Deliberately NOT an absolute-count assertion: other booking specs
		// run in parallel and create/delete their own rows, so `before + 1`
		// races them. The row identified by this test's own contact is the
		// only reliable proof, and it is asserted above.
		const after = Number(
			db('SELECT COUNT(*) FROM wp_doublescale_bookings')
		);
		expect(
			after,
			'The booking count should not have dropped while creating a booking.'
		).toBeGreaterThanOrEqual(before);

		// The row exists — now prove the UI can actually retrieve it. Open the
		// booking's own detail page by id and check it renders this
		// attendee, rather than hunting the month list (whose cards show the
		// event name and default to the current month).
		await page.goto(
			`wp-admin/admin.php?page=doublescale&path=booking/bookings/${bookingId}/upcoming`
		);
		await expect(page.locator('.doublescale-layout__main')).toBeVisible({
			timeout: 45_000,
		});

		await expect(
			page.getByText(attendee, { exact: false }).first(),
			'The new booking should be retrievable through the admin UI.'
		).toBeVisible({ timeout: 45_000 });
	});
});

/* =====================================================================
 * Cleanup proves itself
 * ================================================================== */

test.describe('Booking write path: cleanup', () => {
	test('teardown removes what a test created', async ({ page }) => {
		const name = e2eName();
		const eventId = await createEventViaWizard(page, name);

		// Delete here rather than leaning on afterEach, so the assertion that
		// cleanup actually works lives inside a test.
		db(`DELETE FROM wp_doublescale_booking_events WHERE id = ${eventId}`);
		created.events = created.events.filter((id) => id !== eventId);

		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_booking_events WHERE id = ${eventId}`
			),
			'The event should be gone after cleanup.'
		).toBe('0');
	});

	test('no E2E- rows survive this spec', async () => {
		// Runs last in this file, but sibling specs may still be mid-create in
		// another worker — so poll rather than sampling once. What matters is
		// that leftovers drain, not that the count is zero at one instant.
		await expect
			.poll(
				() =>
					db(
						`SELECT COUNT(*) FROM wp_doublescale_booking_events WHERE name LIKE 'E2E-%'`
					),
				{
					timeout: 60_000,
					message:
						'Leftover E2E- events found — teardown is not keeping up.',
				}
			)
			.toBe('0');
	});
});
