import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const campaignsShell = (page: Page) => page.locator('.doublescale-campaigns');

/**
 * Email Campaigns — main `path=campaigns` route (free + Pro).
 *
 * Route: admin.php?page=doublescale&path=campaigns
 */
test.describe('Email campaigns', () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale&path=campaigns');

		await expect(
			adminPage.getByRole('heading', {
				level: 1,
				name: /^Email Campaigns$/i,
			})
		).toBeVisible({ timeout: 45_000 });
	});

	test('header, subtitle, and Create Campaign', async ({ adminPage }) => {
		const shell = campaignsShell(adminPage);

		await expect(
			shell.getByText('Campaigns', { exact: true }).first()
		).toBeVisible();

		await expect(
			shell.getByRole('button', { name: /^Create Campaign$/i }).first()
		).toBeVisible();
	});

	test('search field and Filters control', async ({ adminPage }) => {
		const shell = campaignsShell(adminPage);

		await expect(shell.getByPlaceholder(/^Search$/i)).toBeVisible();

		await expect(
			shell.getByRole('button', { name: /^Filters$/i })
		).toBeVisible();
	});

	test('list loads — table or empty onboarding', async ({ adminPage }) => {
		const shell = campaignsShell(adminPage);

		const table = shell.getByRole('table');
		const emptyTitle = shell.getByRole('heading', {
			level: 2,
			name: /Let's Start Email Campaign/i,
		});

		await expect(table.or(emptyTitle)).toBeVisible({ timeout: 45_000 });
	});

	test('Filters dialog — status, type, apply', async ({ adminPage }) => {
		const shell = campaignsShell(adminPage);

		await shell.getByRole('button', { name: /^Filters$/i }).click();

		const dialog = adminPage
			.getByRole('dialog')
			.filter({ hasText: /Apply Filters/i });
		await expect(dialog).toBeVisible({ timeout: 15_000 });
		await expect(
			dialog.getByText('Status', { exact: true }).first()
		).toBeVisible();
		await expect(
			dialog.getByText('Type', { exact: true }).first()
		).toBeVisible();
		await expect(
			dialog.getByRole('button', { name: /^Apply Filters$/i })
		).toBeVisible();

		await adminPage.keyboard.press('Escape');
	});

	test('Create Campaign opens modal', async ({ adminPage }) => {
		const shell = campaignsShell(adminPage);

		await shell
			.getByRole('button', { name: /^Create Campaign$/i })
			.first()
			.click();

		const dialog = adminPage.getByRole('dialog').filter({
			hasText: /Create email campaign|Give your campaign a clear internal name/i,
		});
		await expect(dialog).toBeVisible({ timeout: 10_000 });
		await expect(
			dialog.getByLabel(/Campaign name/i)
		).toBeVisible();

		await adminPage.keyboard.press('Escape');
	});

	test('empty state CTA when no campaigns', async ({ adminPage }) => {
		const shell = campaignsShell(adminPage);

		const emptyTitle = shell.getByRole('heading', {
			level: 2,
			name: /Let's Start Email Campaign/i,
		});
		if (!(await emptyTitle.isVisible().catch(() => false))) {
			test.skip();
		}

		await expect(
			shell.getByText(/Click "Create Campaign" and Select one of the campaign types/i)
		).toBeVisible();
		await expect(
			shell.getByRole('button', { name: /^Create Campaign$/i }).first()
		).toBeVisible();
	});

	test('table row selection enables bulk actions when campaigns exist', async ({
		adminPage,
	}) => {
		const shell = campaignsShell(adminPage);
		const table = shell.getByRole('table');

		if (!(await table.isVisible().catch(() => false))) {
			test.skip();
		}

		const dataRows = table.locator('tbody tr');
		if ((await dataRows.count()) === 0) {
			test.skip();
		}

		await expect(dataRows.first()).toBeVisible({ timeout: 10_000 });

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
});

/**
 * SMS Campaigns — `path=sms-campaigns`. Without Pro (SMS columns bridge), the
 * list is replaced by a Pro upgrade notice.
 */
test.describe('SMS campaigns (Pro only)', () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale&path=sms-campaigns');

		await expect(campaignsShell(adminPage)).toBeVisible({ timeout: 45_000 });
		await expect(
			adminPage.getByRole('heading', {
				level: 1,
				name: /^SMS Campaigns$/i,
			})
		).toBeVisible();

		const upgradeShell = adminPage.locator('.doublescale-pro-feature-notice');
		if (await upgradeShell.isVisible().catch(() => false)) {
			test.skip(
				true,
				'Requires DoubleScale Pro: SMS campaign list needs the Pro SMS bridge (free shows upgrade notice).'
			);
		}
	});

	test('Pro: SMS campaigns header', async ({ adminPage }) => {
		await expect(
			adminPage.getByRole('heading', {
				level: 1,
				name: /^SMS Campaigns$/i,
			})
		).toBeVisible();

		await expect(
			campaignsShell(adminPage)
				.getByText('Campaigns', { exact: true })
				.first()
		).toBeVisible();
	});
});
