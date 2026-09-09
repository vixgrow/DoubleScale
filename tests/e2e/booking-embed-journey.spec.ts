import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';
const SITE = (process.env.WP_BASE_URL ?? 'http://localhost:8889').replace(/\/+$/, '');

function db(sql: string): string {
	return execFileSync('wp', ['db', 'query', sql, '--skip-column-names', `--path=${WP_PATH}`], {
		encoding: 'utf8',
	}).trim();
}

test.describe('Booking inline embed', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('embed_type=Inline shows inline confirmation instead of redirecting', async ({ page }) => {
		const row = db(
			`SELECT e.slug, c.slug FROM wp_doublescale_booking_events e
			 JOIN wp_doublescale_booking_calendars c ON c.id = e.calendar_id
			 ORDER BY e.id DESC LIMIT 1`
		);
		if (!row) test.skip(true, 'No public booking event exists.');
		const [eventSlug, calendarSlug] = row.split('\t');
		const url = `${SITE}/?doublescale_booking_calendar=${encodeURIComponent(calendarSlug)}&event=${encodeURIComponent(eventSlug)}&embed_type=Inline`;

		await page.goto(url);
		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({ timeout: 45_000 });
		await page.locator('.highlight-date').first().click();
		await page.locator('.time-slot:not(.time-slot-waiting)').first().click();
		await expect(page.getByText(/Enter Details/i)).toBeVisible({ timeout: 15_000 });

		const who = `E2E-Embed-${Date.now().toString(36)}`;
		await page.getByPlaceholder(/enter your name/i).first().pressSequentially(who, { delay: 20 });
		await page.getByPlaceholder(/enter your email/i).first().pressSequentially(`${who}@example.test`, { delay: 20 });

		const bookingResponse = page.waitForResponse(
			(r) =>
				r.url().includes('admin-ajax.php') &&
				r.request().postData()?.includes('doublescale_booking_booking') === true,
			{ timeout: 45_000 }
		);
		await page.locator('.schedule-btn').first().click();
		expect((await (await bookingResponse).json()).success).toBe(true);

		await expect(page.getByText(/Booking Confirmed!|Your meeting has been Scheduled/i)).toBeVisible({
			timeout: 30_000,
		});
		expect(page.url()).not.toMatch(/type=confirm/);
	});
});
