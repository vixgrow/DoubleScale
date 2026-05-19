import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const sequencesShell = (page: Page) => page.locator('.doublescale-email-sequences');

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
 * Email Sequences — Pro list UI; free plugin shows upgrade notice.
 *
 * Route: admin.php?page=doublescale&path=email-sequences
 */
test.describe('Email sequences (Pro only)', () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto(
			'wp-admin/admin.php?page=doublescale&path=email-sequences'
		);
		await waitForDoubleScaleAdmin(adminPage);

		const proList = sequencesShell(adminPage);
		const upgradeShell = adminPage.locator(
			'.doublescale-pro-feature-notice, .doublescale-email-sequences-upgrade'
		);

		await expect(proList.or(upgradeShell)).toBeVisible({ timeout: 45_000 });

		if (!(await proList.isVisible().catch(() => false))) {
			test.skip(
				true,
				'Requires DoubleScale Pro: Email Sequences list is not loaded (free plugin shows upgrade notice only).'
			);
		}

		await expect(
			adminPage.getByRole('button', { name: /^Create Sequence$/i }).first()
		).toBeVisible({ timeout: 15_000 });
	});

	test('Pro: header, subtitle, and Create Sequence', async ({ adminPage }) => {
		await expect(
			adminPage.getByRole('heading', {
				level: 1,
				name: /^Email Sequences$/i,
			})
		).toBeVisible();

		await expect(
			adminPage.getByText('Manage your email sequences', { exact: true })
		).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /^Create Sequence$/i }).first()
		).toBeVisible();
	});

	test('Pro: search and date range', async ({ adminPage }) => {
		await expect(adminPage.getByPlaceholder(/^Search$/i)).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /Date Range/i })
		).toBeVisible();
	});

	test('Pro: list loads table', async ({ adminPage }) => {
		await expect(adminPage.getByRole('table')).toBeVisible({
			timeout: 45_000,
		});
	});

	test('Pro: Create Sequence opens creation dialog', async ({ adminPage }) => {
		await adminPage
			.getByRole('button', { name: /^Create Sequence$/i })
			.first()
			.click();

		const dialog = adminPage.getByRole('dialog').filter({
			hasText: /Create Email Sequence/i,
		});
		await expect(dialog).toBeVisible({ timeout: 10_000 });
		await expect(
			dialog.getByText(/Create Manually/i)
		).toBeVisible();

		await adminPage.keyboard.press('Escape');
	});

	test('Pro: table row selection enables bulk actions when sequences exist', async ({
		adminPage,
	}) => {
		const table = adminPage.getByRole('table');
		const dataRows = table.locator('tbody tr');

		if ((await dataRows.count()) === 0) {
			test.skip();
		}

		await table
			.getByRole('row')
			.nth(1)
			.getByRole('checkbox', { name: /Select row/i })
			.click();

		const bulkTrigger = adminPage
			.locator('button, [role="combobox"]')
			.filter({ hasText: /^Bulk Actions$/i })
			.first();
		await expect(bulkTrigger).toBeEnabled({ timeout: 10_000 });
	});

	test('Pro: pagination footer when list has records', async ({ adminPage }) => {
		const table = adminPage.getByRole('table');
		const dataRows = table.locator('tbody tr');

		if ((await dataRows.count()) === 0) {
			test.skip();
		}

		await expect(
			adminPage.getByText(/Showing \d+ of \d+ results/i)
		).toBeVisible({ timeout: 10_000 });
		await expect(
			adminPage.getByText('Per page', { exact: true })
		).toBeVisible();
	});
});

test.describe('Email sequences without Pro', () => {
	test('shows upgrade notice when Pro is inactive', async ({ adminPage }) => {
		await adminPage.goto(
			'wp-admin/admin.php?page=doublescale&path=email-sequences'
		);
		await waitForDoubleScaleAdmin(adminPage);

		const proList = sequencesShell(adminPage);
		if (await proList.isVisible().catch(() => false)) {
			test.skip(true, 'DoubleScale Pro is active; Pro UI tests cover this route.');
		}

		await expect(
			adminPage
				.locator(
					'.doublescale-pro-feature-notice, .doublescale-email-sequences-upgrade'
				)
				.first()
		).toBeVisible({ timeout: 15_000 });

		await expect(
			adminPage.getByText(/Email Sequences/i).first()
		).toBeVisible();
	});
});
