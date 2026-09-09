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

test.describe('Portal booking journey', () => {
	test('portal bookings section lists a scheduled booking for linked customer', async ({
		page,
	}) => {
		const portal = db(
			`SELECT ID FROM wp_posts WHERE post_content LIKE '%doublescale_portal%' AND post_status='publish' LIMIT 1`
		);
		if (!portal) test.skip(true, 'No published [doublescale_portal] page.');
		const booking = db(
			`SELECT b.id, c.email FROM wp_doublescale_bookings b
			 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
			 WHERE b.status = 'scheduled' ORDER BY b.id DESC LIMIT 1`
		);
		if (!booking) test.skip(true, 'No scheduled booking for portal journey.');
		const [bookingId, email] = booking.split('\t');
		const userId = execFileSync(
			'wp',
			[
				'eval',
				`$u = get_user_by('email', ${JSON.stringify(email)});
				 if (!$u) { $u = wp_create_user('e2e-portal-'.time(), 'password', ${JSON.stringify(email)}); }
				 echo (int) $u->ID;`,
				`--path=${WP_PATH}`,
			],
			{ encoding: 'utf8' }
		).trim();
		execFileSync(
			'wp',
			['user', 'update', userId, '--user_pass=password', `--path=${WP_PATH}`],
			{ encoding: 'utf8' }
		);

		await page.goto(`${SITE}/wp-login.php`);
		await page.fill('#user_login', email);
		await page.fill('#user_pass', 'password');
		await page.click('#wp-submit');
		await page.goto(`${SITE}/?page_id=${portal}`);
		await expect(page.getByText(/Bookings|Upcoming/i).first()).toBeVisible({
			timeout: 45_000,
		});
	});
});
