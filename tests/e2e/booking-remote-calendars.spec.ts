import type { Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
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

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';

function db(sql: string): string {
	return execFileSync(
		'wp',
		['db', 'query', sql, '--skip-column-names', `--path=${WP_PATH}`],
		{ encoding: 'utf8', timeout: 30_000 }
	).trim();
}

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

async function stubEmptyGoogleAccounts(adminPage: Page): Promise<void> {
	await adminPage.route(/integrations\/google\/[^/?]+\/accounts/i, (route) => {
		if (route.request().method() !== 'GET') {
			return route.continue();
		}
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});
	});
}

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
		await expect(adminPage).toHaveURL(/provider=google/, {
			timeout: 45_000,
		});
	});

	test('remote calendars page lists every provider', async ({
		adminPage,
	}) => {
		const button = connectButton(adminPage);
		await expect(button).toBeVisible({ timeout: 45_000 });
		await button.click();

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

		await expect(
			shell.getByRole('button', { name: /Google Calendar/i }).first()
		).toHaveAttribute('aria-pressed', 'true');
		await expect(
			shell.getByRole('button', { name: /Choose a different service/i })
		).toHaveCount(0);
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
	 * does not exist — the page falls back to Google rather than an empty panel.
	 */
	test('an unknown provider in the URL falls back to Google', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();
		await expect(adminPage).toHaveURL(/remote-calendars/, {
			timeout: 45_000,
		});

		const bogus = new URL(adminPage.url());
		bogus.searchParams.set('provider', 'not-a-provider');
		await adminPage.goto(bogus.href);
		await waitForDoubleScaleAdmin(adminPage);

		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });
		await expect(
			shell.getByRole('button', { name: /Google Calendar/i }).first()
		).toHaveAttribute('aria-pressed', 'true', { timeout: 45_000 });
		await expect(adminPage).toHaveURL(/provider=google/);
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
/**
 * Picking a Remote Calendar must take effect on the FIRST attempt and survive a
 * reload. The stub is stateful — the PUT stores what the UI sends and the GET
 * replays it — so these assertions fail if the click is swallowed or if what was
 * persisted is not what gets read back.
 */
test.describe('Booking: remote calendar selection persists', () => {
	test.beforeEach(async ({ adminPage }) => {
		test.setTimeout(120_000);
		// Server-side state, mutated by the PUT the component issues.
		const stored: Record<string, unknown> = {
			'acct-persist-1': {
				name: 'e2e-persist@example.test',
				config: {},
				calendars: [
					{
						id: 'ar.eg#holiday@group.v.calendar.google.com',
						name: 'Holidays',
						can_edit: false,
					},
					{ id: 'cal-a', name: 'Primary', can_edit: true },
					{ id: 'cal-b', name: 'Team', can_edit: true },
				],
				app_credentials: {},
			},
		};

		// Regex, not a glob: Playwright globs missed this site's REST URLs
		// (same class of miss as the Apple connect stub).
		await adminPage.route(
			/integrations\/google\/[^/?]+\/accounts/i,
			async (route) => {
				const request = route.request();
				const method = request.method();
				const path = new URL(request.url()).pathname;
				// Sub-resources (check-teams, calendars) are not part of this
				// flow; answer them benignly so an unrelated 404 notice cannot
				// be mistaken for the behavior under test.
				const isSubResource = /\/accounts\/[^/]+\/[^/]+/.test(path);

				if (isSubResource) {
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
						body: JSON.stringify(stored),
					});
				}

				if (method === 'PUT' || method === 'POST') {
					// URL tail is the account id: .../accounts/<id>
					const id = new URL(request.url()).pathname
						.split('/')
						.filter(Boolean)
						.pop() as string;
					let payload: { config?: unknown } = {};
					try {
						payload = JSON.parse(request.postData() || '{}');
					} catch {
						payload = {};
					}
					const existing = (stored[id] || {}) as Record<
						string,
						unknown
					>;
					const existingConfig = (existing.config || {}) as Record<
						string,
						unknown
					>;
					stored[id] = {
						...existing,
						config: {
							...existingConfig,
							...((payload.config || {}) as Record<
								string,
								unknown
							>),
						},
					};
					return route.fulfill({
						status: 200,
						contentType: 'application/json',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(stored[id]),
					});
				}

				return route.continue();
			}
		);

		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
		await expect(connectButton(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	test('a single selection is applied and saved — no second attempt', async ({
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
			shell.getByText(/e2e-persist@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		const savePut = adminPage.waitForRequest(
			(req) =>
				(req.method() === 'PUT' || req.method() === 'POST') &&
				/integrations\/google\/.*\/accounts/.test(req.url())
		);

		// Exactly ONE interaction with the dropdown.
		const trigger = shell.getByRole('combobox').first();
		await expect(trigger).toBeEnabled({ timeout: 45_000 });
		await trigger.click();
		await adminPage
			.getByRole('option', { name: /Primary/i })
			.first()
			.click();

		await savePut;

		// The trigger must show the chosen calendar right away — the bug was that
		// the Select remounted and dropped back to the placeholder.
		await expect(trigger).toContainText(/Primary/i, { timeout: 30_000 });
		await expect(trigger).not.toContainText(/Select a Remote Calendar/i);
	});

	test('the selection survives a page reload', async ({ adminPage }) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await shell
			.getByRole('button', { name: /Google Calendar/i })
			.first()
			.click();
		await expect(
			shell.getByText(/e2e-persist@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		const savePut = adminPage.waitForRequest(
			(req) =>
				(req.method() === 'PUT' || req.method() === 'POST') &&
				/integrations\/google\/.*\/accounts/.test(req.url())
		);
		const trigger = shell.getByRole('combobox').first();
		await expect(trigger).toBeEnabled({ timeout: 45_000 });
		await trigger.click();
		await adminPage
			.getByRole('option', { name: /Primary/i })
			.first()
			.click();
		await savePut;

		// Reload — the same cold load the OAuth return performs.
		await adminPage.goto(adminPage.url());
		await waitForDoubleScaleAdmin(adminPage);

		const reloaded = remoteCalendarsShell(adminPage);
		await expect(reloaded).toBeVisible({ timeout: 45_000 });
		await expect(
			reloaded.getByText(/e2e-persist@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		await expect(reloaded.getByRole('combobox').first()).toContainText(
			/Primary/i,
			{ timeout: 30_000 }
		);
	});

	test('holiday calendars with # in the id do not empty the dropdown', async ({
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
			shell.getByText(/e2e-persist@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		const trigger = shell.getByRole('combobox').first();
		await expect(trigger).toBeEnabled({ timeout: 45_000 });
		await trigger.click();
		await expect(
			adminPage.getByRole('option', { name: /Primary/i }).first()
		).toBeVisible();
		await expect(
			adminPage.getByRole('option', { name: /Holidays/i }).first()
		).toBeDisabled();
	});

	test('the selection survives switching provider and coming back', async ({
		adminPage,
	}) => {
		// Apple must not strand the user — an unconfigured real account would
		// block switching back to Google via the leave guard.
		await adminPage.route(/integrations\/apple/i, (route) => {
			const method = route.request().method();
			const url = route.request().url();
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
						settings: { app: { enabled: true, cache_time: 300 } },
					}),
				});
			}
			return route.continue();
		});

		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });
		await expect(adminPage).toHaveURL(/provider=google/, {
			timeout: 45_000,
		});
		await expect(
			shell.getByText(/e2e-persist@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		const savePut = adminPage.waitForRequest(
			(req) =>
				(req.method() === 'PUT' || req.method() === 'POST') &&
				/integrations\/google\/.*\/accounts/.test(req.url())
		);
		const trigger = shell.getByRole('combobox').first();
		await expect(trigger).toBeEnabled({ timeout: 45_000 });
		await trigger.click();
		await adminPage
			.getByRole('option', { name: /Primary/i })
			.first()
			.click();
		await savePut;
		await expect(trigger).toContainText(/Primary/i, { timeout: 30_000 });

		await shell
			.getByRole('button', { name: /Apple Calendar/i })
			.first()
			.click();
		await expect(adminPage).toHaveURL(/provider=apple/, {
			timeout: 45_000,
		});

		await shell
			.getByRole('button', { name: /Google Calendar/i })
			.first()
			.click();
		await expect(adminPage).toHaveURL(/provider=google/, {
			timeout: 45_000,
		});
		await expect(
			shell.getByText(/e2e-persist@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });
		await expect(shell.getByRole('combobox').first()).toContainText(
			/Primary/i,
			{ timeout: 30_000 }
		);
	});
});

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

		// Google is already selected on open — wait for the stubbed account
		// then Back must be blocked until a Remote Calendar is chosen.
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
		await stubEmptyGoogleAccounts(adminPage);
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
		await stubEmptyGoogleAccounts(adminPage);
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

test.describe('Booking: remote calendars provider panels', () => {
	test.beforeEach(async ({ adminPage }) => {
		await stubEmptyGoogleAccounts(adminPage);
		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	test('back to calendars is allowed when no account is connected', async ({
		adminPage,
	}) => {
		await adminPage.route(/integrations\/google\/[^/?]+\/accounts/i, (route) => {
			if (route.request().method() !== 'GET') {
				return route.continue();
			}
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});
		});

		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });
		await expect(
			shell.getByRole('button', { name: /Google Calendar/i }).first()
		).toHaveAttribute('aria-pressed', 'true');

		await shell.getByRole('button', { name: /Back to calendars/i }).click();
		await expect(adminPage).toHaveURL(
			/path=booking(%2F|\/)calendars(?!.*remote)/,
			{ timeout: 45_000 }
		);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	test('does not offer choose a different service', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await expect(
			shell.getByRole('button', { name: /Choose a different service/i })
		).toHaveCount(0);

		await shell
			.getByRole('button', { name: /Apple Calendar/i })
			.first()
			.click();
		await expect(adminPage).toHaveURL(/provider=apple/, {
			timeout: 45_000,
		});
		await expect(
			shell.getByRole('button', { name: /Choose a different service/i })
		).toHaveCount(0);
	});

	test('apple deep link opens the Apple panel', async ({ adminPage }) => {
		await connectButton(adminPage).click();
		await expect(adminPage).toHaveURL(/remote-calendars/, {
			timeout: 45_000,
		});

		const appleLink = new URL(adminPage.url());
		appleLink.searchParams.set('provider', 'apple');
		await adminPage.goto(appleLink.href);
		await waitForDoubleScaleAdmin(adminPage);

		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });
		await expect(
			shell.getByRole('button', { name: /Apple Calendar/i }).first()
		).toHaveAttribute('aria-pressed', 'true', { timeout: 45_000 });
		await expect(
			shell.getByRole('button', { name: /^Add New$/i })
		).toBeVisible();
		await expect(
			shell.getByText(/Enable Apple Calendar Integration/i)
		).toBeVisible();
	});

	test('zoom panel shows credential fields', async ({ adminPage }) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await shell.getByRole('button', { name: /Zoom/i }).first().click();
		await expect(adminPage).toHaveURL(/provider=zoom/, { timeout: 45_000 });

		await expect(shell.getByLabel(/Account ID/i)).toBeVisible({
			timeout: 45_000,
		});
		await expect(shell.getByLabel(/Client ID/i)).toBeVisible();
		await expect(shell.getByLabel(/Secret Key/i)).toBeVisible();
		await expect(
			shell.getByRole('button', {
				name: /Save & Validate Credentials/i,
			})
		).toBeVisible();
	});

	test('outlook selection is recorded in the URL', async ({ adminPage }) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });

		await shell
			.getByRole('button', { name: /Outlook/i })
			.first()
			.click();
		await expect(adminPage).toHaveURL(/provider=outlook/, {
			timeout: 45_000,
		});
		await expect(
			shell.getByRole('button', { name: /Outlook/i }).first()
		).toHaveAttribute('aria-pressed', 'true');
	});

	test('google invalid auth URL shows the reason', async ({ adminPage }) => {
		await adminPage.route(/integrations\/google/i, (route) => {
			const method = route.request().method();
			const url = route.request().url();
			if (method === 'GET' && /\/auth/i.test(url)) {
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ auth_uri: '' }),
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
			return route.continue();
		});

		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });
		await shell
			.getByRole('button', { name: /Google Calendar/i })
			.first()
			.click();

		await expect(
			shell.getByRole('button', { name: /^Add New$/i })
		).toBeVisible({ timeout: 45_000 });
		await shell.getByRole('button', { name: /^Add New$/i }).click();

		await expect(
			adminPage.getByText(
				/Could not start sign-in \(invalid authorization URL\)/i
			)
		).toBeVisible({ timeout: 30_000 });
	});

	test('browser back after selecting Apple returns to Google', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });
		await expect(adminPage).toHaveURL(/provider=google/, {
			timeout: 45_000,
		});

		await shell
			.getByRole('button', { name: /Apple Calendar/i })
			.first()
			.click();
		await expect(adminPage).toHaveURL(/provider=apple/, {
			timeout: 45_000,
		});

		await adminPage.goBack();
		await waitForDoubleScaleAdmin(adminPage);

		await expect(adminPage).toHaveURL(/remote-calendars/);
		await expect(adminPage).toHaveURL(/provider=google/);
		await expect(
			remoteCalendarsShell(adminPage)
				.getByRole('button', { name: /Google Calendar/i })
				.first()
		).toHaveAttribute('aria-pressed', 'true', { timeout: 45_000 });
	});
});

test.describe('Booking: Apple Calendar leave guard', () => {
	test.beforeEach(async ({ adminPage }) => {
		await stubEmptyGoogleAccounts(adminPage);
		await adminPage.route(/integrations\/apple/i, (route) => {
			const method = route.request().method();
			const url = route.request().url();
			if (method === 'GET' && /accounts/i.test(url)) {
				return route.fulfill({
					status: 200,
					contentType: 'application/json',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						'acct-apple-e2e': {
							name: 'e2e-apple-guard@example.test',
							config: {},
							calendars: [
								{
									id: 'cal-apple-a',
									name: 'iCloud',
									can_edit: true,
								},
							],
							app_credentials: {},
						},
					}),
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

	test('refuses to leave Apple while no remote calendar is selected', async ({
		adminPage,
	}) => {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });
		await shell
			.getByRole('button', { name: /Apple Calendar/i })
			.first()
			.click();

		await expect(
			shell.getByText(/e2e-apple-guard@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		await shell.getByRole('button', { name: /Back to calendars/i }).click();
		await expect(
			adminPage.getByText(/Remote calendar required/i).first()
		).toBeVisible({ timeout: 30_000 });
		await expect(adminPage).toHaveURL(/provider=apple/);
	});
});

test.describe('Booking: remote calendar read-only option', () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.route(/integrations\/google/i, (route) => {
			if (route.request().method() !== 'GET') {
				return route.continue();
			}
			if (!/accounts/i.test(route.request().url())) {
				return route.continue();
			}
			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'acct-ro-e2e': {
						name: 'e2e-readonly@example.test',
						config: {},
						calendars: [
							{
								id: 'cal-ro',
								name: 'Holidays',
								can_edit: false,
							},
							{
								id: 'cal-rw',
								name: 'Work',
								can_edit: true,
							},
						],
						app_credentials: {},
					},
				}),
			});
		});

		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
	});

	test('read-only remote calendars cannot be chosen as the default', async ({
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
			shell.getByText(/e2e-readonly@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		await shell.getByRole('combobox').first().click();
		await expect(
			adminPage.getByRole('option', { name: /Holidays/i }).first()
		).toBeDisabled();
		await adminPage.getByRole('option', { name: /Work/i }).first().click();

		await shell.getByRole('button', { name: /Back to calendars/i }).click();
		await expect(adminPage).toHaveURL(
			/path=booking(%2F|\/)calendars(?!.*remote)/,
			{ timeout: 45_000 }
		);
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

/**
 * Two connected accounts, one shared selection.
 *
 * Choosing a calendar writes to EVERY account: the chosen one gets the
 * `default_calendar`, its siblings get `null`. The server stores all accounts
 * under a single host meta key and `update_account()` is a read-modify-write
 * over that whole array (`includes/Modules/Booking/Integration/Accounts.php`),
 * so two writes issued together both read the same starting state and the last
 * one to land overwrites the other. When the clearing write wins, the value the
 * user just picked is erased — the field comes back empty after a reload and
 * the user has to pick a second time.
 *
 * The stub below reproduces that server: it snapshots the store *before*
 * yielding, exactly as PHP reads the option before writing it back. A frontend
 * that fires the writes concurrently loses the update here too.
 */
test.describe('Booking: remote calendar selection with two accounts', () => {
	const ACCOUNT_ONE = '101430818806126115244';
	const ACCOUNT_TWO = '109009665404577674870';

	test.beforeEach(async ({ adminPage }) => {
		test.setTimeout(120_000);

		const stored: Record<string, Record<string, unknown>> = {
			[ACCOUNT_ONE]: {
				name: 'first@example.test',
				config: {},
				calendars: [
					{
						id: 'first-primary',
						name: 'First Primary',
						can_edit: true,
					},
				],
				app_credentials: {},
			},
			[ACCOUNT_TWO]: {
				name: 'second@example.test',
				config: {},
				calendars: [
					{
						id: 'second-primary',
						name: 'Second Primary',
						can_edit: true,
					},
				],
				app_credentials: {},
			},
		};

		await adminPage.route(
			/integrations\/google\/[^/?]+\/accounts/i,
			async (route) => {
				const request = route.request();
				const method = request.method();
				const path = new URL(request.url()).pathname;

				if (/\/accounts\/[^/]+\/[^/]+/.test(path)) {
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
						body: JSON.stringify(stored),
					});
				}

				if (method === 'PUT' || method === 'POST') {
					const id = path.split('/').filter(Boolean).pop() as string;
					let payload: { config?: Record<string, unknown> } = {};
					try {
						payload = JSON.parse(request.postData() || '{}');
					} catch {
						payload = {};
					}

					// Read first, write later — the PHP read-modify-write. The
					// snapshot is taken before the await, so a concurrent
					// sibling write is invisible to this one and gets clobbered.
					const snapshot = JSON.parse(
						JSON.stringify(stored)
					) as typeof stored;
					const existing = snapshot[id] || {};
					const existingConfig = (existing.config || {}) as Record<
						string,
						unknown
					>;
					snapshot[id] = {
						...existing,
						config: {
							...existingConfig,
							...(payload.config || {}),
						},
					};

					// Yield, so overlapping requests interleave the way real
					// HTTP round trips do.
					await new Promise((resolve) => setTimeout(resolve, 60));

					for (const key of Object.keys(snapshot)) {
						stored[key] = snapshot[key];
					}

					return route.fulfill({
						status: 200,
						contentType: 'application/json',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(stored[id]),
					});
				}

				return route.continue();
			}
		);

		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
		await expect(calendarsShell(adminPage)).toBeVisible({
			timeout: 45_000,
		});
		await expect(connectButton(adminPage)).toBeVisible({ timeout: 45_000 });
	});

	async function openGoogleAccounts(adminPage: Page) {
		await connectButton(adminPage).click();
		const shell = remoteCalendarsShell(adminPage);
		await expect(shell).toBeVisible({ timeout: 45_000 });
		await shell
			.getByRole('button', { name: /Google Calendar/i })
			.first()
			.click();
		await expect(
			shell.getByText(/first@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });
		return shell;
	}

	test('a first-time pick is not wiped by the sibling account write', async ({
		adminPage,
	}) => {
		const shell = await openGoogleAccounts(adminPage);

		const trigger = shell.getByRole('combobox').first();
		await expect(trigger).toBeEnabled({ timeout: 45_000 });
		await trigger.click();
		await adminPage
			.getByRole('option', { name: /Second Primary/i })
			.first()
			.click();

		await expect(trigger).toContainText(/Second Primary/i, {
			timeout: 30_000,
		});

		// The reload is what exposes the lost update: the UI looked right, but
		// the clearing write landed last and erased what was just saved.
		await adminPage.goto(adminPage.url());
		await waitForDoubleScaleAdmin(adminPage);

		const reloaded = remoteCalendarsShell(adminPage);
		await expect(reloaded).toBeVisible({ timeout: 45_000 });
		await expect(
			reloaded.getByText(/first@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		await expect(reloaded.getByRole('combobox').first()).toContainText(
			/Second Primary/i,
			{ timeout: 30_000 }
		);
	});

	test('switching back and forth keeps the last pick', async ({
		adminPage,
	}) => {
		const shell = await openGoogleAccounts(adminPage);
		const trigger = shell.getByRole('combobox').first();
		await expect(trigger).toBeEnabled({ timeout: 45_000 });

		for (const name of [
			/First Primary/i,
			/Second Primary/i,
			/First Primary/i,
		]) {
			await trigger.click();
			await adminPage.getByRole('option', { name }).first().click();
			await expect(trigger).toContainText(name, { timeout: 30_000 });
		}

		await adminPage.goto(adminPage.url());
		await waitForDoubleScaleAdmin(adminPage);

		const reloaded = remoteCalendarsShell(adminPage);
		await expect(reloaded).toBeVisible({ timeout: 45_000 });
		await expect(
			reloaded.getByText(/first@example\.test/i).first()
		).toBeVisible({ timeout: 45_000 });

		// The last thing the user chose must be what survives.
		await expect(reloaded.getByRole('combobox').first()).toContainText(
			/First Primary/i,
			{ timeout: 30_000 }
		);
	});
});

test.describe('Booking: external busy stub', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('stubbed external busy time removes a slot from the public picker', async ({
		page,
	}) => {
		const row = db(
			`SELECT e.slug, c.slug FROM wp_doublescale_booking_events e
			 JOIN wp_doublescale_booking_calendars c ON c.id = e.calendar_id
			 ORDER BY e.id DESC LIMIT 1`
		);
		if (!row) test.skip(true, 'No booking event for stub test.');
		const [eventSlug, calendarSlug] = row.split('\t');
		const url = `${process.env.WP_BASE_URL ?? 'http://localhost/wordpress'}/?doublescale_booking_calendar=${encodeURIComponent(calendarSlug)}&event=${encodeURIComponent(eventSlug)}`;

		await page.goto(url);
		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({ timeout: 45_000 });
		let stubbed = false;
		await page.route('**/admin-ajax.php', async (route) => {
			const post = route.request().postData() ?? '';
			if (post.includes('doublescale_booking_booking_slots')) {
				stubbed = true;
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ success: true, data: [] }),
				});
				return;
			}
			await route.continue();
		});
		await page.locator('.highlight-date').first().click();
		await page.waitForTimeout(2_000);
		expect(stubbed, 'Public picker must request booking slots via AJAX.').toBe(true);
		await expect(page.locator('.time-slot:not(.time-slot-waiting)')).toHaveCount(0, {
			timeout: 15_000,
		});
	});
});
