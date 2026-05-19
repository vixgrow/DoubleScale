import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const formsShell = (page: Page) => page.locator('.doublescale-forms-list');

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

/**
 * Forms list — Pro + forms module enabled; free or inactive module shows upgrade notice.
 *
 * Route: admin.php?page=doublescale&path=forms
 */
test.describe('Forms module (Pro)', () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale&path=forms');
		await waitForDoubleScaleAdmin(adminPage);

		const proList = formsShell(adminPage);
		const upgradeShell = adminPage.locator('.doublescale-pro-feature-notice');

		await expect(proList.or(upgradeShell)).toBeVisible({ timeout: 45_000 });

		if (!(await proList.isVisible().catch(() => false))) {
			test.skip(
				true,
				'Requires DoubleScale Pro with the Forms module enabled (upgrade notice is shown otherwise).'
			);
		}

		await expect(
			adminPage.getByRole('button', { name: /^Create Forms$/i }).first()
		).toBeVisible({ timeout: 15_000 });
	});

	test('header, subtitle, and Create Forms', async ({ adminPage }) => {
		const shell = formsShell(adminPage);

		await expect(
			adminPage.getByRole('heading', {
				level: 1,
				name: /^Forms List$/i,
			})
		).toBeVisible();

		await expect(shell.getByText('Forms', { exact: true }).first()).toBeVisible();

		await expect(
			shell.getByRole('button', { name: /^Create Forms$/i }).first()
		).toBeVisible();
	});

	test('search and date range', async ({ adminPage }) => {
		const shell = formsShell(adminPage);

		await expect(shell.getByPlaceholder(/^Search Forms$/i)).toBeVisible();

		await expect(
			shell.getByRole('button', { name: /Date Range/i })
		).toBeVisible();
	});

	test('list loads — table or empty onboarding', async ({ adminPage }) => {
		const shell = formsShell(adminPage);

		const table = shell.getByRole('table');
		const emptyTitle = shell.getByRole('heading', {
			name: 'No forms yet',
			exact: true,
		});

		await expect(table.or(emptyTitle)).toBeVisible({ timeout: 45_000 });
	});

	test('Create Forms opens the form builder', async ({ adminPage }) => {
		const shell = formsShell(adminPage);

		await shell
			.getByRole('button', { name: /^Create Forms$/i })
			.first()
			.click();

		await expect(
			adminPage.getByText('Basic Information', { exact: true })
		).toBeVisible({ timeout: 15_000 });
		await expect(
			adminPage.getByPlaceholder(/Enter Form Name/i)
		).toBeVisible();
	});

	test('empty state CTA when no forms', async ({ adminPage }) => {
		const shell = formsShell(adminPage);

		const emptyTitle = shell.getByRole('heading', {
			name: 'No forms yet',
			exact: true,
		});
		if (!(await emptyTitle.isVisible().catch(() => false))) {
			test.skip();
		}

		await expect(
			shell.getByText(/creating your first form/i)
		).toBeVisible();
		await expect(
			shell.getByRole('button', { name: /^Create Form$/i }).first()
		).toBeVisible();
	});

	test('table row selection enables bulk actions when forms exist', async ({
		adminPage,
	}) => {
		const shell = formsShell(adminPage);
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
		const shell = formsShell(adminPage);
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

test.describe('Forms without Pro', () => {
	test('shows upgrade notice when Pro is inactive', async ({ adminPage }) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale&path=forms');
		await waitForDoubleScaleAdmin(adminPage);

		const proList = formsShell(adminPage);
		if (await proList.isVisible().catch(() => false)) {
			test.skip(
				true,
				'DoubleScale Pro is active with Forms enabled; Pro UI tests cover this route.'
			);
		}

		await expect(
			adminPage.locator('.doublescale-pro-feature-notice').first()
		).toBeVisible({ timeout: 15_000 });

		await expect(
			adminPage.getByRole('heading', {
				name: /Forms is a Pro Feature/i,
			})
		).toBeVisible();
	});
});
