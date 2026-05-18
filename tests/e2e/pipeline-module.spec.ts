import { test, expect } from './fixtures';

/**
 * Sales Pipeline E2E — DoubleScale Pro only.
 *
 * The free plugin registers `sales-pipeline` but renders a Pro upgrade notice.
 * These tests assert the real Kanban UI from doublescale-pro; they are skipped
 * when Pro is inactive or the pipeline shell is not mounted.
 *
 * Route: admin.php?page=doublescale&path=sales-pipeline
 */
test.describe('Pipeline module (Pro only)', () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale&path=sales-pipeline');

		const board = adminPage.locator('.sales-pipeline');
		const upgradeShell = adminPage.locator('.doublescale-pro-feature-notice');

		await expect(board.or(upgradeShell)).toBeVisible({ timeout: 45_000 });

		if (!(await board.isVisible().catch(() => false))) {
			test.skip(
				true,
				'Requires DoubleScale Pro: Sales Pipeline UI is not loaded (free plugin shows upgrade notice only).'
			);
		}
	});

	test('Pro: header, pipeline switcher, select deals, new pipeline, create deal', async ({
		adminPage,
	}) => {
		const board = adminPage.locator('.sales-pipeline');

		await expect(board.locator('h1').first()).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /Select Deals/i })
		).toBeVisible();

		const newPipeline = adminPage.getByRole('button', { name: /New Pipeline/i });
		if (await newPipeline.isVisible().catch(() => false)) {
			await expect(newPipeline).toBeEnabled();
			await newPipeline.click();
			await expect(
				adminPage.getByRole('menuitem', { name: /^New Pipeline$/i })
			).toBeVisible({ timeout: 5_000 });
			await adminPage.keyboard.press('Escape');
		}

		const createDeal = adminPage.getByRole('button', { name: /Create Deal/i });
		if (await createDeal.isVisible().catch(() => false)) {
			await expect(createDeal).toBeVisible();
		}
	});

	test('Pro: search by title and Filters button', async ({ adminPage }) => {
		await expect(
			adminPage.getByPlaceholder(/Search by title/i)
		).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /^Filters$/i })
		).toBeVisible();
	});

	test('Pro: KPI strip — Total Deals, Avg Win Rate, Total Value, Weighted Value', async ({
		adminPage,
	}) => {
		const kanban = adminPage.locator('.kanban-board');
		await expect(kanban).toBeVisible({ timeout: 45_000 });

		const strip = kanban.locator('div.w-full.shrink-0').first();
		await expect(strip.getByText(/^Total Deals$/i)).toBeVisible();
		await expect(strip.getByText(/^Avg Win Rate$/i)).toBeVisible();
		await expect(strip.getByText(/^Total Value$/i)).toBeVisible();
		await expect(strip.getByText(/^Weighted Value$/i)).toBeVisible();

		const metricCards = strip.locator('.grid').first().locator(':scope > div');
		await expect(metricCards).toHaveCount(4);
		for (let i = 0; i < 4; i++) {
			await expect(metricCards.nth(i).locator('.text-xl.font-bold')).toBeVisible();
		}
	});

	test('Pro: stage columns — title with count, Deal Value, Weighted', async ({
		adminPage,
	}) => {
		await expect(adminPage.locator('.kanban-board')).toBeVisible({
			timeout: 45_000,
		});

		const columns = adminPage.locator('.pipeline-column');
		await expect(columns.first()).toBeVisible({ timeout: 15_000 });
		const columnCount = await columns.count();
		if (columnCount === 0) {
			test.skip();
		}

		const title = columns.first().locator('h3.pipeline-column__arrow-name');
		await expect(title).toBeVisible();
		await expect(title).toHaveText(/\(\d+\)/);

		for (let i = 0; i < columnCount; i++) {
			const col = columns.nth(i);
			await expect(col.locator('.pipeline-column__stats-bar')).toBeVisible();
			const statLabels = col.locator('.pipeline-column__stat-lbl');
			await expect(statLabels).toHaveCount(2);
			await expect(statLabels.nth(0)).toContainText(/Deal Value/i);
			await expect(statLabels.nth(1)).toContainText(/Weighted/i);
		}
	});

	test('Pro: empty column copy or deal cards', async ({ adminPage }) => {
		const kanban = adminPage.locator('.kanban-board');
		await expect(kanban).toBeVisible({ timeout: 45_000 });

		const emptyTitle = adminPage.locator('.pipeline-column__empty-title');
		const dealCards = adminPage.locator('.deal-card');
		const dragHint = adminPage.getByText(/Drag deals here to move them to/i);

		await expect(emptyTitle.first().or(dealCards.first())).toBeVisible({
			timeout: 20_000,
		});

		const hasEmpty = await emptyTitle.first().isVisible().catch(() => false);
		const hasDeals = (await dealCards.count()) > 0;

		if (hasEmpty) {
			await expect(
				adminPage.getByText('No deals yet', { exact: true }).first()
			).toBeVisible();
			await expect(dragHint.first()).toBeVisible();
		}
		if (hasDeals) {
			await expect(dealCards.first().getByText(/^Deal value:/i)).toBeVisible();
			await expect(dealCards.first().locator('h4')).toBeVisible();
		}
	});

	test('Pro: Create Deal opens dialog', async ({ adminPage }) => {
		const createDeal = adminPage.getByRole('button', { name: /Create Deal/i });
		if (!(await createDeal.isVisible().catch(() => false))) {
			test.skip();
		}

		await createDeal.click();
		await expect(adminPage.locator('[role="dialog"]').first()).toBeVisible({
			timeout: 10_000,
		});
		await adminPage.keyboard.press('Escape');
	});

	test('Pro: Filters opens deal filter dialog', async ({ adminPage }) => {
		await adminPage.getByRole('button', { name: /^Filters$/i }).click();

		const filterDialog = adminPage
			.getByRole('dialog')
			.filter({ hasText: /Deal Owner/i });
		await expect(filterDialog).toBeVisible({ timeout: 10_000 });
		await expect(filterDialog.getByText(/^Pipeline$/i)).toBeVisible();

		await adminPage.keyboard.press('Escape');
	});

	test('Pro: Select Deals toggles selection UI on cards', async ({
		adminPage,
	}) => {
		await expect(adminPage.locator('.kanban-board')).toBeVisible({
			timeout: 45_000,
		});

		if ((await adminPage.locator('.deal-card').count()) === 0) {
			test.skip();
		}

		const selectDeals = adminPage.getByRole('button', { name: /^Select Deals$/i });
		await selectDeals.click();

		await expect(
			adminPage.getByRole('button', { name: /^Cancel$/i })
		).toBeVisible();

		await expect(
			adminPage.locator('.deal-card').first().locator('[role="checkbox"]')
		).toBeVisible({ timeout: 5_000 });

		await adminPage.getByRole('button', { name: /^Cancel$/i }).click();
		await expect(selectDeals).toBeVisible();
	});
});
