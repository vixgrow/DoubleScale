import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * Booking — "Connect to remote calendars".
 *
 * Two behaviors under test:
 *
 * 1. The Calendars action is labelled "Connect to remote calendars", not
 *    the bare "Connect".
 * 2. It navigates to a real route (`booking/calendars/:id/remote-calendars`)
 *    instead of opening a dropdown + dialog. The route matters because the
 *    OAuth handoff is a full page navigation (`window.location.href = authUri`
 *    in the integration panel): provider consent leaves the SPA entirely, and
 *    Pro's callback redirects back into wp-admin. Dialog state is local React
 *    state and cannot survive that round trip — a URL can.
 */

const calendarsShell = (page: Page) =>
	page.locator('.doublescale-booking-calendars');
const bookingPageWrapper = (page: Page) =>
	page.locator('.doublescale-booking-page-component-wrapper');
const remoteCalendarsShell = (page: Page) =>
	page.locator('.doublescale-booking-remote-calendars');

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
	// the admin layout does. A bare isVisible() races that and skips a test that
	// should have run — wait for it, and only treat a genuine timeout as
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

const connectButton = (page: Page) =>
	calendarsShell(page).getByRole('button', {
		name: /^Connect to remote calendars$/i,
	});

test.describe('Booking: connect to remote calendars', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	test('calendars: action is labelled "Connect to remote calendars"', async ({
		adminPage,
	}) => {
		// The visible label itself, not just some button in the header.
		await expect(connectButton(adminPage)).toBeVisible({
			timeout: 45_000,
		});

		// The old bare "Connect" label must be gone. Anchored so it cannot
		// match the new, longer label on a substring.
		await expect(
			calendarsShell(adminPage).getByRole('button', {
				name: /^Connect$/,
			})
		).toHaveCount(0);
	});

	test('calendars: the action navigates to a page, not a dropdown', async ({
		adminPage,
	}) => {
		const button = connectButton(adminPage);
		await expect(button).toBeVisible({ timeout: 45_000 });

		// A menu trigger announces itself; a navigation control does not.
		await expect(button).not.toHaveAttribute('aria-haspopup', 'menu');

		await button.click();

		// The URL must actually change — this is the whole point of the
		// change, and it is what survives the OAuth round trip.
		await expect(adminPage).toHaveURL(/remote-calendars/, {
			timeout: 45_000,
		});
		await expect(remoteCalendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	test('remote calendars page lists every provider', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();

		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await expect(
			shell.getByRole('heading', {
				name: /Connect to remote calendars/i,
			})
		).toBeVisible();

		// Assert the specific providers, not merely that the list rendered.
		for (const provider of [
			/Google Calendar/i,
			/Zoom/i,
			/Apple Calendar/i,
			/Outlook/i,
		]) {
			await expect(shell.getByText(provider).first()).toBeVisible({
				timeout: 30_000,
			});
		}
	});
});

test.describe('Booking: remote calendars edge cases', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	/**
	 * A stale bookmark or a hand-edited URL must not select a provider that
	 * does not exist — the page falls back to the "choose a service" state
	 * rather than rendering an empty panel.
	 */
	test('an unknown provider in the URL falls back to the chooser', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();
		await expect(adminPage).toHaveURL(/remote-calendars/, {
			timeout: 45_000,
		});

		const bogus = `${adminPage.url()}&provider=not-a-provider`;
		await adminPage.goto(bogus);
		await waitForDoubleScaleAdmin(adminPage);

		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });
		await expect(
			shell.getByText(/Choose a service to add or connect an account/i)
		).toBeVisible({ timeout: 45_000 });
	});

	/**
	 * Selecting a provider must put it in the URL. This is the mechanism the
	 * OAuth callback relies on to reopen the right panel, so assert the URL,
	 * not merely that something rendered.
	 */
	test('selecting a provider records it in the URL and survives reload', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();

		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await shell
			.getByRole('button', { name: /Google Calendar/i })
			.first()
			.click();

		await expect(adminPage).toHaveURL(/provider=google/, {
			timeout: 45_000,
		});

		// Reload is what the provider redirect does: a cold document load.
		await adminPage.goto(adminPage.url());
		await waitForDoubleScaleAdmin(adminPage);

		await expect(adminPage).toHaveURL(/provider=google/);
		await expect(
			remoteCalendarsShell(adminPage)
				.getByRole('button', { name: /Google Calendar/i })
				.first()
		).toHaveAttribute('aria-pressed', 'true', { timeout: 45_000 });
	});
});

/**
 * A connected account with no Remote Calendar chosen syncs nowhere, so the page
 * must refuse to let the user leave — the rule the old dropdown+dialog enforced
 * by refusing to close. Reaching that state needs a real OAuth account, so the
 * accounts endpoint is stubbed with one account that has no `default_calendar`.
 */
test.describe('Booking: remote calendars leave guard', () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.route(
			'**/integrations/google/*/accounts**',
			(route) => {
				if (route.request().method() !== 'GET') {
					return route.continue();
				}
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						'acct-e2e-1': {
							name: 'e2e-guard@example.test',
							// No default_calendar: nothing selected yet.
							config: {},
							// `can_edit` matters: without it the option renders as
							// "(Read Only)" and is disabled, so it can never be picked.
							calendars: [
								{
									id: 'cal-a',
									name: 'Primary',
									can_edit: true,
								},
								{ id: 'cal-b', name: 'Team', can_edit: true },
							],
							app_credentials: {},
						},
					}),
				});
			}
		);

		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	test('refuses to leave while a connected account has no remote calendar', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await shell
			.getByRole('button', { name: /Google Calendar/i })
			.first()
			.click();

		// The panel must actually have loaded the stubbed account, otherwise
		// this test would pass vacuously against an empty account list.
		await expect(
			shell.getByText(/e2e-guard@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		const urlBefore = adminPage.url();
		await shell.getByRole('button', { name: /Back to calendars/i }).click();

		// Blocked: still on the page, with the explanation shown.
		await expect(
			adminPage.getByText(/Remote calendar required/i).first()
		).toBeVisible({ timeout: 30_000 });
		await expect(remoteCalendarsShell(adminPage)).toBeVisible();
		expect(adminPage.url()).toBe(urlBefore);
	});

	/**
	 * Switching provider abandons the stranded one just as leaving the page
	 * does, so it must be blocked on the same terms.
	 */
	test('refuses to switch provider while a calendar is still required', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await shell
			.getByRole('button', { name: /Google Calendar/i })
			.first()
			.click();
		await expect(
			shell.getByText(/e2e-guard@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		await shell
			.getByRole('button', { name: /Apple Calendar/i })
			.first()
			.click();

		await expect(
			adminPage.getByText(/Remote calendar required/i).first()
		).toBeVisible({ timeout: 30_000 });
		// Still on Google, not switched to Apple.
		await expect(adminPage).toHaveURL(/provider=google/);
	});

	/**
	 * Zoom is conferencing, not a calendar — it has no Remote Calendar to pick,
	 * so it must never trap the user even with an account connected.
	 */
	test('never blocks leaving from Zoom', async ({ adminPage }) => {
		await adminPage.route('**/integrations/zoom/*/accounts**', (route) => {
			if (route.request().method() !== 'GET') {
				return route.continue();
			}
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					'zoom-e2e-1': {
						name: 'e2e-zoom@example.test',
						config: {},
						calendars: [],
						app_credentials: {},
					},
				}),
			});
		});

		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await shell.getByRole('button', { name: /Zoom/i }).first().click();
		await expect(adminPage).toHaveURL(/provider=zoom/, { timeout: 45_000 });

		await shell.getByRole('button', { name: /Back to calendars/i }).click();

		await expect(adminPage).toHaveURL(
			/path=booking(%2F|\/)calendars(?!.*remote)/,
			{ timeout: 45_000 }
		);
	});

	test('leaves normally once a remote calendar is selected', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await shell
			.getByRole('button', { name: /Google Calendar/i })
			.first()
			.click();
		await expect(
			shell.getByText(/e2e-guard@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		// Pick a remote calendar, which is what clears the guard.
		await shell.getByRole('combobox').first().click();
		await adminPage
			.getByRole('option', { name: /Primary/i })
			.first()
			.click();

		await shell.getByRole('button', { name: /Back to calendars/i }).click();

		await expect(adminPage).toHaveURL(
			/path=booking(%2F|\/)calendars(?!.*remote)/,
			{
				timeout: 45_000,
			}
		);
	});
});

/**
 * Apple Calendar uses basic auth (email + app-specific password). When iCloud
 * rejects the credentials the REST layer returns a real reason, and the notice
 * banner must show that reason — not a bare "Error" title with an empty body.
 * The POST is stubbed so this does not hit Apple's CalDAV servers.
 */
test.describe('Booking: Apple Calendar connect error reason', () => {
	const APPLE_FAIL_REASON =
		'E2E Apple CalDAV rejected: use an app-specific password';

	test.beforeEach(async ({ adminPage }) => {
		await adminPage.route(/integrations\/apple/i, (route) => {
			const method = route.request().method();
			const url = route.request().url();

			if (method === 'POST' && /accounts/i.test(url)) {
				return route.fulfill({
					status: 400,
					contentType: 'application/json',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						code: 'add_apple_account_error',
						message: APPLE_FAIL_REASON,
						data: { status: 400 },
					}),
				});
			}

			if (method === 'GET' && /accounts/i.test(url)) {
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
				});
			}

			if (method === 'GET') {
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						settings: {
							app: { enabled: true, cache_time: 300 },
						},
					}),
				});
			}

			return route.continue();
		});

		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	test('failed connect shows the server reason, not a bare Error title', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		const appleRow = shell
			.getByRole('button', { name: /Apple Calendar/i })
			.first();
		await expect(appleRow).toBeVisible({ timeout: 45_000 });

		if ((await appleRow.getAttribute('disabled')) === '') {
			test.skip(true, 'Apple Calendar connect requires DoubleScale Pro.');
		}

		await appleRow.click();
		await expect(adminPage).toHaveURL(/provider=apple/, {
			timeout: 45_000,
		});

		await expect(
			shell.getByRole('button', { name: /^Add New$/i })
		).toBeVisible({ timeout: 45_000 });
		await shell.getByRole('button', { name: /^Add New$/i }).click();

		await shell.getByLabel(/Apple ID/i).fill('e2e-apple@example.test');
		await shell
			.getByLabel(/App-specific Password/i)
			.fill('xxxx-xxxx-xxxx-xxxx');

		const connectBtn = shell.getByRole('button', {
			name: /Connect with Apple Calendar/i,
		});
		const postPromise = adminPage.waitForResponse(
			(response) =>
				response.request().method() === 'POST' &&
				/integrations\/apple/i.test(response.url()),
			{ timeout: 20_000 }
		);
		await connectBtn.click();
		const post = await postPromise;
		expect(post.status()).toBe(400);

		await expect(adminPage.getByText(APPLE_FAIL_REASON)).toBeVisible({
			timeout: 15_000,
		});
	});
});

test.describe('Booking: remote calendars page survives a cold load', () => {
	/**
	 * The OAuth return is a fresh document load from Pro's callback redirect —
	 * no prior React state, no click history. Reaching the URL directly is
	 * exactly that scenario, so it is the assertion that proves the fix.
	 */
	test('remote calendars route renders when opened directly by URL', async ({
		adminPage,
	}) => {
		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});

		await connectButton(adminPage).click();
		await expect(adminPage).toHaveURL(/remote-calendars/, {
			timeout: 45_000,
		});

		const deepLink = adminPage.url();

		// Hard reload: the same thing the provider redirect does.
		await adminPage.goto(deepLink);
		await waitForDoubleScaleAdmin(adminPage);

		await expect(remoteCalendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
		await expect(
			remoteCalendarsShell(adminPage).getByRole('heading', {
				name: /Connect to remote calendars/i,
			})
		).toBeVisible({ timeout: 45_000 });
	});
});
