import { test, expect } from './fixtures';

/**
 * Contacts CRM list — verifies header, toolbar, and modal entry points.
 * Route: admin.php?page=doublescale&path=contacts (see `getHistory()`).
 */
test.describe('Contacts module (frontend)', () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale&path=contacts');
		// SPA mounts after ~1.5s delay in client/index.tsx; no data-testid on shell.
		await expect(
			adminPage.getByRole('heading', { name: /Contacts List/i })
		).toBeVisible({ timeout: 45_000 });
	});

	test('Contacts List header and Add Contact', async ({ adminPage }) => {
		await expect(
			adminPage.getByRole('heading', { name: /Contacts List/i })
		).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /Add Contact/i })
		).toBeVisible();
	});

	test('Export / Import (CRM manager only)', async ({ adminPage }) => {
		const exportBtn = adminPage.getByRole('button', { name: /Export Contact/i });
		const importBtn = adminPage.getByRole('button', { name: /Import Contact/i });

		if (await exportBtn.isVisible()) {
			await exportBtn.click();
			await expect(
				adminPage.getByRole('heading', { name: /Export contacts/i })
			).toBeVisible({ timeout: 10_000 });
			await adminPage.keyboard.press('Escape');
		}

		if (await importBtn.isVisible()) {
			await importBtn.click();
			// Import flow uses shared import modal — title varies; wait for dialog surface
			await expect(adminPage.locator('[role="dialog"]').first()).toBeVisible({
				timeout: 10_000,
			});
			await adminPage.keyboard.press('Escape');
		}
	});

	test('Search, date range, bulk actions, advanced filters, manage columns', async ({
		adminPage,
	}) => {
		const search = adminPage.getByPlaceholder(/Search contacts/i);
		await expect(search).toBeVisible();
		await search.fill('e2e-query');
		await expect(search).toHaveValue('e2e-query');
		await search.clear();

		await expect(
			adminPage.getByRole('button', { name: /Date Range/i })
		).toBeVisible();

		const bulkTrigger = adminPage
			.locator('.doublescale-all-contacts')
			.getByRole('combobox')
			.first();
		await expect(bulkTrigger).toBeVisible();
		await expect(bulkTrigger).toBeDisabled();

		const advFilters = adminPage.getByRole('button', { name: /Advanced Filters/i });
		await expect(advFilters).toBeVisible();
		await advFilters.click();

		await expect(adminPage.locator('[role="dialog"]').first()).toBeVisible({
			timeout: 10_000,
		});
		const proGate = adminPage.getByRole('heading', { name: /This is a PRO Feature/i });
		const rulesUi = adminPage.getByText(/Apply Filters/i);
		expect(await proGate.isVisible().catch(() => false) || await rulesUi.isVisible().catch(() => false)).toBe(
			true
		);
		await adminPage.keyboard.press('Escape');

		const manageCols = adminPage.getByRole('button', { name: /Manage Columns/i });
		await expect(manageCols).toBeVisible();
		await manageCols.click();
		await expect(
			adminPage.getByText(/Select Columns that you want/i)
		).toBeVisible({ timeout: 10_000 });
		await adminPage.keyboard.press('Escape');
	});

	test('Add Contact opens create dialog', async ({ adminPage }) => {
		await adminPage.getByRole('button', { name: /Add Contact/i }).click();
		await expect(adminPage.locator('[role="dialog"]').first()).toBeVisible({
			timeout: 10_000,
		});
		await adminPage.keyboard.press('Escape');
	});
});
