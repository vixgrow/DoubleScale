import { test, expect, type Page, type Browser } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';
const SITE = (process.env.WP_BASE_URL ?? 'http://localhost:8889').replace(/\/+$/, '');
const ADMIN_AUTH = 'tests/e2e/.auth/admin.json';

function db(sql: string): string {
	return execFileSync('wp', ['db', 'query', sql, '--skip-column-names', `--path=${WP_PATH}`], {
		encoding: 'utf8',
	}).trim();
}

function proActive(): boolean {
	try {
		execFileSync('wp', ['plugin', 'is-active', 'doublescale-pro', `--path=${WP_PATH}`]);
		return true;
	} catch {
		return false;
	}
}

test.describe('Pro waiting list journey', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('full group slot surfaces waiting list UI', async ({ page }) => {
		if (!proActive()) test.skip(true, 'DoubleScale Pro is not active.');
		const row = db(
			`SELECT e.slug, c.slug FROM wp_doublescale_booking_events e
			 JOIN wp_doublescale_booking_calendars c ON c.id = e.calendar_id
			 WHERE e.type = 'group' ORDER BY e.id DESC LIMIT 1`
		);
		if (!row) test.skip(true, 'No group event exists for waiting-list E2E.');
		const [eventSlug, calendarSlug] = row.split('\t');
		await page.goto(
			`${SITE}/?doublescale_booking_calendar=${encodeURIComponent(calendarSlug)}&event=${encodeURIComponent(eventSlug)}`
		);
		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({ timeout: 45_000 });
		await page.locator('.highlight-date').first().click();
		const waiting = page.locator('.time-slot-waiting, .time-slot').filter({ hasText: /waiting|full/i });
		if ((await waiting.count()) === 0) {
			test.skip(true, 'No full/waiting-list slot visible on this event.');
		}
		await waiting.first().click();
		await expect(page.getByText(/waiting list|join the waitlist|Waiting List/i)).toBeVisible({
			timeout: 15_000,
		});
	});
});
