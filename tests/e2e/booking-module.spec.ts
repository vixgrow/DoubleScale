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

	// Booking pages are lazy-loaded chunks, so the wrapper appears a tick after
	// the admin layout does. A bare isVisible() races that and silently skips a
	// test that should have run — wait, and treat only a real timeout as
	// "module disabled".
	const shellVisible = await bookingPageWrapper(adminPage)
		.waitFor({ state: 'visible', timeout: 30_000 })
		.then(() => true)
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

		await expect(shell.getByPlaceholder(/^Search Events$/i)).toBeVisible();
	});

	test('calendars: list loads calendars or empty state', async ({
		adminPage,
	}) => {
		const shell = calendarsShell(adminPage);
		// Host cards render even when the host has no events. `.or()` without
		// `.first()` is strict and fails when Host Settings and the landing
		// page link are both on screen.
		await expect(
			shell
				.getByRole('button', { name: /Host Settings/i })
				.or(shell.getByText(/No Calendars available/i))
				.first()
		).toBeVisible({ timeout: 45_000 });
	});

	test('calendars: nonsense search shows no matching events', async ({
		adminPage,
	}) => {
		const shell = calendarsShell(adminPage);
		await expect(shell.getByPlaceholder(/^Search Events$/i)).toBeVisible({
			timeout: 45_000,
		});
		// Wait for the first fetch to finish so the keyword request is not
		// racing the initial empty `search` load.
		await expect(
			shell
				.getByRole('button', { name: /Host Settings/i })
				.or(shell.getByText(/No Calendars available/i))
				.first()
		).toBeVisible({ timeout: 45_000 });

		const keyword = 'zzz-e2e-no-match-calendar-xyz';
		const filtered = adminPage.waitForResponse(
			(res) =>
				res.ok() &&
				/\/calendars/i.test(res.url()) &&
				res.url().includes(keyword),
			{ timeout: 45_000 }
		);
		await shell.getByPlaceholder(/^Search Events$/i).fill(keyword);
		await filtered;

		await expect(
			shell.getByText(/No matching events found|No Calendars available/i)
		).toBeVisible({ timeout: 45_000 });
	});

	test('calendars: host card exposes settings, landing page, and actions', async ({
		adminPage,
	}) => {
		const shell = calendarsShell(adminPage);
		const hostSettings = shell.getByRole('button', {
			name: /Host Settings/i,
		});
		const empty = shell.getByText(/No Calendars available/i);

		await expect(hostSettings.or(empty).first()).toBeVisible({
			timeout: 45_000,
		});
		if (await empty.isVisible().catch(() => false)) {
			test.skip(true, 'No host calendar is provisioned for this user.');
		}

		await expect(
			shell.getByRole('link', { name: /View My Landing Page/i }).first()
		).toBeVisible();

		await shell
			.getByRole('button', { name: /Calendar actions/i })
			.first()
			.click();
		await expect(
			adminPage.getByRole('button', { name: /^Edit$/i })
		).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /Clone Event/i })
		).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /^Delete$/i })
		).toBeVisible();
	});

	test('calendars: Host Settings opens the host calendar page', async ({
		adminPage,
	}) => {
		const shell = calendarsShell(adminPage);
		const hostSettings = shell.getByRole('button', {
			name: /Host Settings/i,
		});
		const empty = shell.getByText(/No Calendars available/i);

		await expect(hostSettings.or(empty).first()).toBeVisible({
			timeout: 45_000,
		});
		if (await empty.isVisible().catch(() => false)) {
			test.skip(true, 'No host calendar is provisioned for this user.');
		}

		await hostSettings.first().click();
		await expect(adminPage).toHaveURL(
			/path=booking(%2F|\/)calendars(%2F|\/)\d+/,
			{ timeout: 45_000 }
		);
		await expect(adminPage).not.toHaveURL(/remote-calendars/);
	});

	test('calendars: Create Event opens the event type dialog', async ({
		adminPage,
	}) => {
		const shell = calendarsShell(adminPage);
		const createEvent = shell.getByRole('button', {
			name: /^Create Event$/i,
		});
		const noCalendars = shell.getByText(/No Calendars available/i);

		await expect(createEvent.or(noCalendars).first()).toBeVisible({
			timeout: 45_000,
		});
		if (await noCalendars.isVisible().catch(() => false)) {
			test.skip(
				true,
				'Create Event is hidden until a host calendar exists.'
			);
		}

		await createEvent.first().click();
		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });
		await expect(
			dialog.getByRole('heading', { name: /^Single Event$/i })
		).toBeVisible();
		await expect(
			dialog.getByRole('heading', { name: /^Group Event$/i })
		).toBeVisible();
		await adminPage.keyboard.press('Escape');
	});

	test('calendars: Team Events tab is available on Pro', async ({
		adminPage,
	}) => {
		const shell = calendarsShell(adminPage);
		const teamTab = shell.getByRole('tab', { name: /^Team Events$/i });
		await expect(teamTab).toBeVisible({ timeout: 45_000 });
		await teamTab.click();
		await expect(teamTab).toHaveAttribute('data-state', 'active');
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

	test('bookings: header and manual booking action', async ({
		adminPage,
	}) => {
		await expect(
			adminPage.getByText(
				/See your scheduled events from your calendar events links/i
			)
		).toBeVisible();

		await expect(
			adminPage
				.getByRole('button', { name: /^Booking Manually$/i })
				.first()
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
