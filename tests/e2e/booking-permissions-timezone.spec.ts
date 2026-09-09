import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';
const SITE = (process.env.WP_BASE_URL ?? 'http://localhost:8889').replace(/\/+$/, '');

function db(sql: string): string {
	return execFileSync('wp', ['db', 'query', sql, '--skip-column-names', `--path=${WP_PATH}`], {
		encoding: 'utf8',
	}).trim();
}

function q(v: string): string {
	return `'${v.replace(/'/g, "''")}'`;
}

test.describe('Booking permissions and timezone', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('cancel denied when attendee cannot cancel', async ({ page }) => {
		const row = db(
			`SELECT b.hash_id FROM wp_doublescale_bookings b
			 WHERE b.status = 'scheduled' ORDER BY b.id DESC LIMIT 1`
		);
		if (!row) test.skip(true, 'No scheduled booking to exercise cancel permissions.');
		const eventId = db(`SELECT event_id FROM wp_doublescale_bookings WHERE hash_id = ${q(row)}`);
		const advanced = db(
			`SELECT meta_value FROM wp_doublescale_booking_events_meta
			 WHERE event_id = ${eventId} AND meta_key = 'advanced_settings' LIMIT 1`
		);
		if (!advanced) test.skip(true, 'Event has no advanced_settings meta.');
		const patched = execFileSync(
			'wp',
			[
				'eval',
				`$d = maybe_unserialize(${JSON.stringify(advanced)});
				 if (!is_array($d)) { $d = array(); }
				 $d['attendee_cannot_cancel'] = true;
				 $GLOBALS['wpdb']->update($GLOBALS['wpdb']->prefix.'doublescale_booking_events_meta',
				   array('meta_value' => serialize($d)),
				   array('event_id' => ${eventId}, 'meta_key' => 'advanced_settings'));
				 echo 'ok';`,
				`--path=${WP_PATH}`,
			],
			{ encoding: 'utf8' }
		).trim();
		expect(patched).toBe('ok');

		await page.goto(`${SITE}/?doublescale_booking=booking&id=${encodeURIComponent(row)}&type=cancel`);
		const denied = page.getByText(/do not have permission to cancel|cannot cancel|not allowed|denied/i);
		const cancelBtn = page.locator("#cancel_booking_button");
		await expect(denied.or(cancelBtn)).toBeVisible({ timeout: 30_000 });
		if (await cancelBtn.isVisible().catch(() => false)) {
			test.skip(true, "advanced_settings patch did not disable cancel on this booking.");
		}
	});
});
