import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const automationsShell = (page: Page) => page.locator('.doublescale-automations-list');

/**
 * Wait for DoubleScale admin shell or fail with a clear message when WordPress blocks the URL.
 */
async function waitForAutomationsApp(adminPage: Page): Promise<void> {
	await adminPage.goto('wp-admin/admin.php?page=doublescale&path=automations');

	const wpDenied = adminPage.getByText(
		/sorry, you are not allowed to access this page/i
	);
	const layout = adminPage.locator('.doublescale-layout__main');

	await expect(wpDenied.or(layout)).toBeVisible({ timeout: 45_000 });

	if (await wpDenied.isVisible().catch(() => false)) {
		throw new Error(
			'WordPress blocked admin.php?page=doublescale&path=automations. ' +
				'Use an Administrator (or a role with doublescale_access and doublescale_crm_manager). ' +
				'After changing WP_BASE_URL or WP_ADMIN_USER, delete tests/e2e/.auth/admin.json and re-run the tests so global-setup can log in again.'
		);
	}

	await expect(layout).toBeVisible({ timeout: 45_000 });

	await expect(
		adminPage.getByPlaceholder(/Search Automations/i)
	).toBeVisible({ timeout: 45_000 });
	await expect(
		adminPage.getByRole('button', { name: /^Create Automation$/i }).first()
	).toBeVisible({ timeout: 15_000 });
}

/**
 * Automations list — `path=automations`.
 *
 * Route: admin.php?page=doublescale&path=automations
 */
test.describe('Automations module', () => {
	test.beforeEach(async ({ adminPage }) => {
		await waitForAutomationsApp(adminPage);
	});

	test('header and Create Automation', async ({ adminPage }) => {
		const shell = automationsShell(adminPage);

		await expect(
			shell.getByRole('button', { name: /^Create Automation$/i }).first()
		).toBeVisible();
	});

	test('search and date range', async ({ adminPage }) => {
		const shell = automationsShell(adminPage);

		await expect(
			shell.getByPlaceholder(/Search Automations/i)
		).toBeVisible();

		await expect(
			shell.getByRole('button', { name: /Date Range/i })
		).toBeVisible();
	});

	test('list loads — table or empty onboarding', async ({ adminPage }) => {
		const shell = automationsShell(adminPage);

		const table = shell.getByRole('table');
		const emptyTitle = shell.getByRole('heading', {
			name: 'No automations yet',
			exact: true,
		});

		await expect(table.or(emptyTitle)).toBeVisible({ timeout: 45_000 });
	});

	test('Create Automation opens modal', async ({ adminPage }) => {
		const shell = automationsShell(adminPage);

		await shell
			.getByRole('button', { name: /^Create Automation$/i })
			.first()
			.click();

		const dialog = adminPage.getByRole('dialog').filter({
			hasText: /automation|trigger/i,
		});
		await expect(dialog).toBeVisible({ timeout: 10_000 });

		await adminPage.keyboard.press('Escape');
	});

	test('empty state CTA when no automations', async ({ adminPage }) => {
		const shell = automationsShell(adminPage);

		const emptyTitle = shell.getByRole('heading', {
			name: 'No automations yet',
			exact: true,
		});
		if (!(await emptyTitle.isVisible().catch(() => false))) {
			test.skip();
		}

		await expect(
			shell.getByText(/build your first workflow/i)
		).toBeVisible();
		await expect(
			shell.getByRole('button', { name: /^Create Automation$/i }).first()
		).toBeVisible();
	});

	test('table row selection enables bulk actions when automations exist', async ({
		adminPage,
	}) => {
		const shell = automationsShell(adminPage);
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
			.getByRole('checkbox', { name: /Select row/i })
			.click();

		const bulkTrigger = shell
			.locator('button, [role="combobox"]')
			.filter({ hasText: /^Bulk Actions$/i })
			.first();
		await expect(bulkTrigger).toBeEnabled({ timeout: 10_000 });
	});

	test('pagination footer when list has records', async ({ adminPage }) => {
		const shell = automationsShell(adminPage);
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
		await expect(
			shell.getByText('Per page', { exact: true })
		).toBeVisible();
	});
});
