import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const calendarsShell = (page: Page) =>
	page.locator('.doublescale-booking-calendars');
const bookingPageWrapper = (page: Page) =>
	page.locator('.doublescale-booking-page-component-wrapper');

/**
 * Wait for DoubleScale admin shell or fail when WordPress blocks the URL.
 */
async function waitForDoubleScaleAdmin(adminPage: Page): Promise<void> {
	const wpDenied = adminPage.getByText(
		/sorry, you are not allowed to access this page/i
	);
	const layout = adminPage.locator('.doublescale-layout__main');

	await expect(wpDenied.or(layout)).toBeVisible({ timeout: 45_000 });

	if (await wpDenied.isVisible().catch(() => false)) {
		throw new Error(
			'WordPress blocked the DoubleScale admin URL. ' +
				'Use an Administrator (or a role with doublescale_access and booking capabilities). ' +
				'After changing WP_BASE_URL or WP_ADMIN_USER, delete tests/e2e/.auth/admin.json and re-run tests.'
		);
	}

	await expect(layout).toBeVisible({ timeout: 45_000 });
}

async function gotoBookingPath(
	adminPage: Page,
	subpath: string
): Promise<void> {
	await adminPage.goto(
		`wp-admin/admin.php?page=doublescale&path=booking/${subpath}`
	);
	await waitForDoubleScaleAdmin(adminPage);
}

async function ensureBookingModuleActive(adminPage: Page): Promise<void> {
	const onBookingRoute = /path=booking/i.test(adminPage.url());
	const shellVisible = await bookingPageWrapper(adminPage)
		.isVisible()
		.catch(() => false);

	if (!onBookingRoute || !shellVisible) {
		test.skip(
			true,
			'Booking module is disabled or the user lacks booking capabilities (route redirects away).'
		);
	}
}

/**
 * Booking admin — free plugin; requires the booking module toggle and booking caps.
 *
 * Routes: admin.php?page=doublescale&path=booking/{calendars|bookings|settings|...}
 */
test.describe('Booking calendars', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	test('calendars: header and event type tabs', async ({ adminPage }) => {
		const shell = calendarsShell(adminPage);

		await expect(
			shell.getByRole('heading', { name: /^Calendars$/i })
		).toBeVisible();

		await expect(
			shell.getByText(
				/Create events to share for people to book on your calendar/i
			)
		).toBeVisible();

		await expect(
			shell.getByRole('tab', { name: /^Single Events$/i })
		).toBeVisible();
		await expect(
			shell.getByRole('tab', { name: /^Team Events$/i })
		).toBeVisible();
	});

	test('calendars: search events', async ({ adminPage }) => {
		const shell = calendarsShell(adminPage);

		await expect(
			shell.getByPlaceholder(/^Search Events$/i)
		).toBeVisible();
	});

	test('calendars: list loads calendars or empty state', async ({
		adminPage,
	}) => {
		const shell = calendarsShell(adminPage);
		const loaded = shell
			.locator('.doublescale-booking-calendar-events')
			.or(shell.getByText(/No Calendars available|No matching events found/i))
			.or(shell.getByText(/^Create Event$/i));

		await expect(loaded.first()).toBeVisible({ timeout: 45_000 });
	});
});

test.describe('Booking bookings list', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoBookingPath(adminPage, 'bookings');
		await ensureBookingModuleActive(adminPage);
		await expect(
			adminPage.getByRole('heading', { name: /^Bookings$/i })
		).toBeVisible({ timeout: 45_000 });
	});

	test('bookings: header and manual booking action', async ({ adminPage }) => {
		await expect(
			adminPage.getByText(
				/See your scheduled events from your calendar events links/i
			)
		).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /^Booking Manually$/i }).first()
		).toBeVisible();
	});

	test('bookings: period filter and search', async ({ adminPage }) => {
		await expect(
			adminPage.getByPlaceholder(/^Search Bookings$/i)
		).toBeVisible();

		const periodFilter = adminPage.getByRole('combobox').first();
		const monthNav = adminPage.getByRole('button', { name: /^\d{4}$/ });

		await expect(periodFilter.or(monthNav)).toBeVisible({
			timeout: 15_000,
		});
	});

	test('bookings: list or empty onboarding', async ({ adminPage }) => {
		const emptyTitle = adminPage.getByText(/^No Bookings Yet\?$/i);
		const bookingCard = adminPage.locator('[class*="card-details"]');

		await expect(emptyTitle.or(bookingCard.first())).toBeVisible({
			timeout: 45_000,
		});
	});

	test('bookings: Booking Manually opens add booking modal', async ({
		adminPage,
	}) => {
		await adminPage
			.getByRole('button', { name: /^Booking Manually$/i })
			.first()
			.click();

		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });

		await adminPage.keyboard.press('Escape');
	});
});

test.describe('Booking settings', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoBookingPath(adminPage, 'settings');
		await ensureBookingModuleActive(adminPage);
	});

	test('settings: general settings header', async ({ adminPage }) => {
		const accessDenied = adminPage.getByRole('heading', {
			name: /^Access Denied$/i,
		});
		if (await accessDenied.isVisible().catch(() => false)) {
			test.skip(
				true,
				'User lacks doublescale_crm_manager required for booking settings.'
			);
		}

		await expect(
			adminPage.getByRole('heading', { name: /^Settings$/i })
		).toBeVisible({ timeout: 45_000 });
	});
});
