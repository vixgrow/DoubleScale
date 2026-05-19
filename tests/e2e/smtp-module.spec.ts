import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const smtpShell = (page: Page) => page.locator('.smtp-hub');

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
				'Use an Administrator (or a role with doublescale_access and doublescale_crm_manager). ' +
				'After changing WP_BASE_URL or WP_ADMIN_USER, delete tests/e2e/.auth/admin.json and re-run tests.'
		);
	}

	await expect(layout).toBeVisible({ timeout: 45_000 });
}

async function gotoSmtp(
	adminPage: Page,
	tab: 'settings' | 'logs' | 'email-test' | 'alerts'
): Promise<void> {
	await adminPage.goto(
		`wp-admin/admin.php?page=doublescale&path=smtp/${tab}`
	);
	await waitForDoubleScaleAdmin(adminPage);
	await expect(smtpShell(adminPage)).toBeVisible({ timeout: 45_000 });
}

/**
 * SMTP hub — free plugin; requires the smtp module toggle.
 *
 * Routes: admin.php?page=doublescale&path=smtp/{settings|logs|email-test|alerts}
 */
test.describe('SMTP module', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoSmtp(adminPage, 'settings');

		if (
			await adminPage
				.getByText(/SMTP \(built-in\) is turned off/i)
				.isVisible()
				.catch(() => false)
		) {
			test.skip(
				true,
				'SMTP module is disabled. Enable it under Settings → Modules.'
			);
		}

		await expect(
			adminPage.getByRole('heading', { name: /^Connections$/i })
		).toBeVisible({ timeout: 15_000 });
	});

	test('connections: header and Add connection', async ({ adminPage }) => {
		const shell = smtpShell(adminPage);

		await expect(
			shell.getByRole('heading', { name: /^Connections$/i })
		).toBeVisible();

		await expect(
			shell.getByRole('button', { name: /^Add connection$/i }).first()
		).toBeVisible();
	});

	test('connections: table or card layout toggle', async ({ adminPage }) => {
		await expect(
			adminPage.getByRole('group', { name: /Connections layout/i })
		).toBeVisible();
	});
});

test.describe('SMTP email logs', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoSmtp(adminPage, 'logs');

		if (
			await adminPage
				.getByText(/SMTP \(built-in\) is turned off/i)
				.isVisible()
				.catch(() => false)
		) {
			test.skip(
				true,
				'SMTP module is disabled. Enable it under Settings → Modules.'
			);
		}

		await expect(
			adminPage.getByRole('heading', { name: /^Logs$/i })
		).toBeVisible({ timeout: 15_000 });
	});

	test('logs: status filters, search, and date range', async ({ adminPage }) => {
		const shell = smtpShell(adminPage);

		await expect(
			shell.getByRole('button', { name: /^All Logs$/i })
		).toBeVisible();
		await expect(
			shell.getByRole('button', { name: /^Successful$/i })
		).toBeVisible();
		await expect(
			shell.getByRole('button', { name: /^Failed$/i })
		).toBeVisible();

		await expect(
			shell.getByPlaceholder(/Search by title/i)
		).toBeVisible();

		await expect(
			shell.getByRole('button', { name: /Date Range/i })
		).toBeVisible();
	});

	test('logs: Refresh log action', async ({ adminPage }) => {
		await expect(
			adminPage.getByRole('button', { name: /^Refresh log$/i }).first()
		).toBeVisible();
	});

	test('logs: list loads table or empty message', async ({ adminPage }) => {
		const shell = smtpShell(adminPage);
		const table = shell.getByRole('table');
		const empty = shell.getByText(/No log rows found/i);

		await expect(table.or(empty)).toBeVisible({ timeout: 45_000 });
	});

	test('logs: row selection enables Delete selected when rows exist', async ({
		adminPage,
	}) => {
		const shell = smtpShell(adminPage);
		const table = shell.getByRole('table');

		if (!(await table.isVisible().catch(() => false))) {
			test.skip();
		}

		const dataRows = table.locator('tbody tr');
		if ((await dataRows.count()) === 0) {
			test.skip();
		}

		await table
			.getByRole('row')
			.nth(1)
			.getByRole('checkbox')
			.first()
			.click();

		await expect(
			adminPage.getByRole('button', { name: /Delete selected/i }).first()
		).toBeEnabled({ timeout: 10_000 });
	});

	test('logs: pagination footer when log rows exist', async ({ adminPage }) => {
		const shell = smtpShell(adminPage);
		const table = shell.getByRole('table');

		if (!(await table.isVisible().catch(() => false))) {
			test.skip();
		}

		const dataRows = table.locator('tbody tr');
		if ((await dataRows.count()) === 0) {
			test.skip();
		}

		await expect(
			shell.getByText(/Showing \d+ of \d+ results/i)
		).toBeVisible({ timeout: 10_000 });
		await expect(shell.getByText('Per page', { exact: true })).toBeVisible();
	});
});

test.describe('SMTP module disabled', () => {
	test('shows module disabled notice when SMTP toggle is off', async ({
		adminPage,
	}) => {
		await gotoSmtp(adminPage, 'settings');

		const disabled = adminPage.getByText(/SMTP \(built-in\) is turned off/i);
		if (!(await disabled.isVisible().catch(() => false))) {
			test.skip(
				true,
				'SMTP module is enabled; enable-module tests cover the active UI.'
			);
		}

		await expect(disabled).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /Open Modules settings/i })
		).toBeVisible();
	});
});
