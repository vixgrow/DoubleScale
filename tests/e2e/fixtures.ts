import { test as base, expect, Page, APIRequestContext } from '@playwright/test';
import { execSync } from 'node:child_process';

/**
 * Extends Playwright's `test` with DoubleScale-specific fixtures.
 *
 * - `adminPage`: page pre-authenticated as the wp-env admin user (via globalSetup).
 * - `restRequest`: authenticated REST client carrying the nonce + cookies.
 * - `resetDatabase`: nukes WP state via `wp-env run tests-cli wp db reset`. Slow;
 *   prefer namespacing (random emails/list names) when possible.
 */
type Fixtures = {
	adminPage: Page;
	restRequest: APIRequestContext;
	resetDatabase: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
	adminPage: async ({ page }, use) => {
		// No leading slash: baseURL may be a subdirectory (e.g. …/wordpress).
		// `/wp-admin/` would resolve to site origin root and 404.
		await page.goto('wp-admin/');
		await use(page);
	},

	restRequest: async ({ request }, use) => {
		await use(request);
	},

	resetDatabase: async ({}, use) => {
		const reset = async () => {
			execSync('npx wp-env run tests-cli wp db reset --yes', { stdio: 'inherit' });
		};
		await use(reset);
	},
});

export { expect };
