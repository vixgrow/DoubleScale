import { execFileSync } from 'node:child_process';
import { expect, type Page } from '@playwright/test';

export const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';
export const SITE = (process.env.WP_BASE_URL ?? 'http://localhost:8889').replace(
	/\/+$/, 
	''
);

/** Event slug blocked by Memberships URI rules on the default E2E site. */
export const GATED_EVENT_SLUG = process.env.DS_E2E_GATED_EVENT_SLUG ?? 'ddd';

export function db(sql: string): string {
	return execFileSync(
		'wp',
		['db', 'query', sql, '--skip-column-names', `--path=${WP_PATH}`],
		{ encoding: 'utf8', timeout: 30_000 }
	).trim();
}

export function q(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

/** Latest event on an active host calendar with a linked availability row. */
export function activePublicEventSlugs(): { eventSlug: string; calendarSlug: string } | null {
	const row = db(
		`SELECT e.slug, c.slug FROM wp_doublescale_booking_events e
		 INNER JOIN wp_doublescale_booking_calendars c ON c.id = e.calendar_id
		 INNER JOIN wp_doublescale_booking_availability a ON a.id = e.availability_id
		 WHERE e.status = 'active' AND c.status = 'active'
		 AND e.slug != ${q(GATED_EVENT_SLUG)}
		 ORDER BY e.id DESC LIMIT 1`
	);
	if (!row) {
		return null;
	}
	const [eventSlug, calendarSlug] = row.split('\t');
	if (!eventSlug || !calendarSlug) {
		return null;
	}
	return { eventSlug, calendarSlug };
}

export function activePublicEventId(): number | null {
	const id = db(
		`SELECT e.id FROM wp_doublescale_booking_events e
		 INNER JOIN wp_doublescale_booking_calendars c ON c.id = e.calendar_id
		 INNER JOIN wp_doublescale_booking_availability a ON a.id = e.availability_id
		 WHERE e.status = 'active' AND c.status = 'active'
		 AND e.slug != ${q(GATED_EVENT_SLUG)}
		 ORDER BY e.id DESC LIMIT 1`
	);
	if (!id) {
		return null;
	}
	return Number(id);
}

export function publicEventUrl(
	calendarSlug: string,
	eventSlug: string,
	query = ''
): string {
	const base = `${SITE}/?doublescale_booking_calendar=${encodeURIComponent(
		calendarSlug
	)}&event=${encodeURIComponent(eventSlug)}`;
	return query ? `${base}&${query}` : base;
}

export async function fillPublicBookingForm(
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
		await address.pressSequentially('1 E2E Street');
	}

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

export async function pickAvailableSlot(
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
						if (ap.toUpperCase() === 'PM') hour += 12;
						if (ap.toUpperCase() === 'AM' && Number(h) === 12) hour = 0;
						return `${hour.toString().padStart(2, '0')}:${m}`;
					}
				);
				if (skipTimes.has(normalized)) continue;
				if (onlyTimes && !onlyTimes.has(normalized)) continue;
				await slot.click();
				await expect(page.getByText(/Enter Details/i)).toBeVisible({
					timeout: 15_000,
				});
				return { slotDate: targetDate, slotTime: normalized || label };
			}
		}

		const next = page.locator('.nav-arrow').last();
		if (!(await next.isEnabled().catch(() => false))) break;
		await next.click();
	}

	throw new Error('No bookable day/time slot was found on the public picker.');
}

export async function gotoBookingAdmin(page: Page, subpath: string): Promise<void> {
	await page.goto(`wp-admin/admin.php?page=doublescale&path=booking/${subpath}`);
	await expect(page.locator('.doublescale-layout__main')).toBeVisible({ timeout: 45_000 });
	await expect(page.locator('.doublescale-booking-page-component-wrapper')).toBeVisible({
		timeout: 30_000,
	});
}

export async function createEventViaWizard(page: Page, name: string): Promise<number> {
	await gotoBookingAdmin(page, 'calendars');
	const shell = page.locator('.doublescale-booking-calendars');
	await shell.getByRole('button', { name: /^Create Event$/i }).first().click();
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
	expect(index, 'No "Attendee Address" location offered.').toBeGreaterThan(-1);
	await checkboxes.nth(index).click();
	await dialog.getByRole('button', { name: /^Submit Event$/i }).click();
	await expect
		.poll(() => db(`SELECT COUNT(*) FROM wp_doublescale_booking_events WHERE name = ${q(name)}`), {
			timeout: 45_000,
		})
		.toBe('1');
	return Number(db(`SELECT id FROM wp_doublescale_booking_events WHERE name = ${q(name)} LIMIT 1`));
}

export function deriveEventSlugs(eventId: number): { eventSlug: string; calendarSlug: string } {
	const eventSlug = db(`SELECT slug FROM wp_doublescale_booking_events WHERE id = ${eventId}`);
	const calendarSlug = db(
		`SELECT c.slug FROM wp_doublescale_booking_calendars c
		 JOIN wp_doublescale_booking_events e ON e.calendar_id = c.id
		 WHERE e.id = ${eventId}`
	);
	expect(eventSlug).not.toBe('');
	expect(calendarSlug).not.toBe('');
	return { eventSlug, calendarSlug };
}

export function deleteWizardEvent(eventId: number): void {
	try {
		db(`DELETE FROM wp_doublescale_bookings WHERE event_id = ${eventId}`);
		db(`DELETE FROM wp_doublescale_booking_events_meta WHERE event_id = ${eventId}`);
		db(`DELETE FROM wp_doublescale_booking_events WHERE id = ${eventId}`);
	} catch {
		/* best effort */
	}
}

export function e2eName(prefix = 'E2E'): string {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
