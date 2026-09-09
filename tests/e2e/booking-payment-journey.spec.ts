import { test, expect, type Page, type Browser } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';
const SITE = (process.env.WP_BASE_URL ?? 'http://localhost:8889').replace(/\/+$/, '');
const ADMIN_AUTH = 'tests/e2e/.auth/admin.json';

function db(sql: string): string {
	return execFileSync('wp', ['db', 'query', sql, '--skip-column-names', `--path=${WP_PATH}`], {
		encoding: 'utf8',
		timeout: 30_000,
	}).trim();
}

function q(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

function proActive(): boolean {
	try {
		execFileSync('wp', ['plugin', 'is-active', 'doublescale-pro', `--path=${WP_PATH}`], {
			encoding: 'utf8',
			timeout: 15_000,
		});
		return true;
	} catch {
		return false;
	}
}

function stripeConfigured(): boolean {
	try {
		const pub = execFileSync(
			'wp',
			['eval', 'echo (string) get_option("doublescale_stripe_publishable_key");', `--path=${WP_PATH}`],
			{ encoding: 'utf8', timeout: 15_000 }
		).trim();
		const secret = execFileSync(
			'wp',
			['eval', 'echo (string) get_option("doublescale_stripe_secret_key");', `--path=${WP_PATH}`],
			{ encoding: 'utf8', timeout: 15_000 }
		).trim();
		return Boolean(pub && secret);
	} catch {
		return false;
	}
}

function e2eName(): string {
	return `E2E-Pay-${Date.now().toString(36)}`;
}

async function gotoBookingAdmin(page: Page, subpath: string): Promise<void> {
	await page.goto(`wp-admin/admin.php?page=doublescale&path=booking/${subpath}`);
	await expect(page.locator('.doublescale-layout__main')).toBeVisible({ timeout: 45_000 });
}

async function createPaidEvent(page: Page, name: string): Promise<number> {
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
	await cont.click();
	const checkboxes = page.getByRole('checkbox');
	await expect(checkboxes.first()).toBeVisible({ timeout: 20_000 });
	const labels = await checkboxes.evaluateAll((els) =>
		els.map((e) => (e.closest('label,div')?.textContent ?? '').trim())
	);
	const index = labels.findIndex((t) => /Attendee Address/i.test(t));
	expect(index).toBeGreaterThan(-1);
	await checkboxes.nth(index).click();
	await dialog.getByRole('button', { name: /^Submit Event$/i }).click();
	await expect
		.poll(() => db(`SELECT COUNT(*) FROM wp_doublescale_booking_events WHERE name = ${q(name)}`), {
			timeout: 45_000,
		})
		.toBe('1');
	const id = Number(
		db(`SELECT id FROM wp_doublescale_booking_events WHERE name = ${q(name)} LIMIT 1`)
	);
	const serialized = execFileSync(
		'wp',
		[
			'eval',
			`$m = array(
				'enable_payment' => true,
				'enable_stripe' => true,
				'type' => 'native',
				'enable_items_based_on_duration' => false,
				'items' => array(array('item' => 'Booking', 'price' => 25)),
				'currency' => 'USD',
				'payment_method' => 'stripe',
			);
			echo serialize($m);`,
			`--path=${WP_PATH}`,
		],
		{ encoding: 'utf8' }
	).trim();
	const existing = db(
		`SELECT COUNT(*) FROM wp_doublescale_booking_events_meta WHERE event_id = ${id} AND meta_key = 'payments_settings'`
	);
	if (existing === '1') {
		db(
			`UPDATE wp_doublescale_booking_events_meta SET meta_value = ${q(serialized)}
			 WHERE event_id = ${id} AND meta_key = 'payments_settings'`
		);
	} else {
		db(
			`INSERT INTO wp_doublescale_booking_events_meta (event_id, meta_key, meta_value)
			 VALUES (${id}, 'payments_settings', ${q(serialized)})`
		);
	}
	return id;
}

function publicEventUrl(eventId: number): string {
	const row = db(
		`SELECT e.slug, c.slug FROM wp_doublescale_booking_events e JOIN wp_doublescale_booking_calendars c ON c.id = e.calendar_id WHERE e.id = ${eventId}`
	);
	const [eventSlug, calendarSlug] = row.split('\t');
	return `${SITE}/?doublescale_booking_calendar=${encodeURIComponent(calendarSlug)}&event=${encodeURIComponent(eventSlug)}`;
}

let paidEventId: number | null = null;
let paidEventUrl = '';

test.beforeAll(async ({ browser }: { browser: Browser }) => {
	if (!proActive()) return;
	const context = await browser.newContext({ storageState: ADMIN_AUTH });
	const page = await context.newPage();
	const name = e2eName();
	paidEventId = await createPaidEvent(page, name);
	paidEventUrl = publicEventUrl(paidEventId);
	await context.close();
});

test.afterAll(async () => {
	if (!paidEventId) return;
	try {
		db(`DELETE FROM wp_doublescale_bookings WHERE event_id = ${paidEventId}`);
		db(`DELETE FROM wp_doublescale_booking_events_meta WHERE event_id = ${paidEventId}`);
		db(`DELETE FROM wp_doublescale_booking_events WHERE id = ${paidEventId}`);
	} catch {
		/* best effort */
	}
});

test.describe('Pro paid public booking', () => {
	test.use({ storageState: { cookies: [], origins: [] } });
	test.setTimeout(120_000);

	test('paid event stops on the payment step instead of confirm', async ({ page }) => {
		if (!proActive()) test.skip(true, 'DoubleScale Pro is not active.');
		expect(paidEventId).not.toBeNull();
		db(`DELETE FROM wp_doublescale_booking_booked_slots WHERE event_id = ${paidEventId}`);
		db(`DELETE FROM wp_doublescale_bookings WHERE event_id = ${paidEventId}`);

		const res = await page.goto(paidEventUrl);
		expect(res?.status()).toBe(200);
		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({ timeout: 45_000 });

		const who = e2eName();
		let body: { success?: boolean; data?: { booking?: { hash_id?: string }; message?: string } } =
			{};

		for (let attempt = 0; attempt < 12; attempt++) {
			if (attempt > 0) {
				await page.goto(paidEventUrl);
				await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({
					timeout: 45_000,
				});
			}

			for (let m = 0; m < Math.floor(attempt / 3); m++) {
				const next = page.locator('.nav-arrow').last();
				if (await next.isEnabled().catch(() => false)) {
					await next.click();
				}
			}

			const days = page.locator('.highlight-date');
			const dayCount = await days.count();
			if (dayCount === 0) {
				continue;
			}
			await days.nth(attempt % dayCount).click();
			const slots = page.locator('.time-slot:not(.time-slot-waiting)');
			const slotCount = await slots.count();
			if (slotCount === 0) {
				continue;
			}
			await slots.nth(attempt % slotCount).click();
			if (!(await page.getByText(/Enter Details/i).isVisible().catch(() => false))) {
				continue;
			}

			await page.getByPlaceholder(/enter your name/i).first().fill(who);
			await page
				.getByPlaceholder(/enter your email/i)
				.first()
				.fill(`${who}@example.test`);
			const address = page.getByPlaceholder(/address/i).first();
			if (await address.isVisible().catch(() => false)) {
				await address.fill('1 E2E Payment Street');
			}
			const msg = page.getByPlaceholder(/enter your message|meeting about/i).first();
			if (await msg.isVisible().catch(() => false)) {
				await msg.fill('E2E paid booking');
			}

			const bookingResponse = page.waitForResponse(
				(r) =>
					r.url().includes('admin-ajax.php') &&
					r.request().postData()?.includes('doublescale_booking_booking') === true,
				{ timeout: 45_000 }
			);
			await page.locator('.schedule-btn').first().click();
			body = await (await bookingResponse).json();
			if (body.success) {
				break;
			}
			const message = String(body?.data?.message ?? '');
			expect(
				/just been booked|not available/i.test(message),
				`Unexpected booking failure: ${message}`
			).toBe(true);
		}

		expect(
			body.success,
			`Paid booking never succeeded after retries: ${JSON.stringify(body?.data ?? body)}`
		).toBe(true);
		await page.waitForTimeout(3_000);
		expect(page.url()).not.toMatch(/type=confirm/);
		await expect(
			page.getByText(/Payment|Stripe|Pay now|Total|Failed to initialize payment/i).first()
		).toBeVisible({ timeout: 30_000 });

		if (!stripeConfigured()) {
			test.info().annotations.push({
				type: 'stripe',
				description: 'Stripe keys not configured — payment step render only.',
			});
		}
	});
});
