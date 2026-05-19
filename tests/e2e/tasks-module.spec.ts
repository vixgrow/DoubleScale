import { test, expect } from './fixtures';

/**
 * CRM Tasks E2E — DoubleScale Pro only.
 *
 * The free plugin shows a Pro upgrade notice at `path=tasks`; Pro replaces it
 * with the tasks list from doublescale-pro.
 *
 * Route: admin.php?page=doublescale&path=tasks
 */
test.describe('Tasks module (Pro only)', () => {
	test.beforeEach(async ({ adminPage }) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale&path=tasks');

		const tasksHeading = adminPage.getByRole('heading', {
			level: 1,
			name: /^Tasks$/i,
		});
		const upgradeShell = adminPage.locator('.doublescale-pro-feature-notice');

		await expect(tasksHeading.or(upgradeShell)).toBeVisible({
			timeout: 45_000,
		});

		if (!(await tasksHeading.isVisible().catch(() => false))) {
			test.skip(
				true,
				'Requires DoubleScale Pro: Tasks UI is not loaded (free plugin shows upgrade notice only).'
			);
		}
	});

	test('Pro: page header and Add New Task', async ({ adminPage }) => {
		await expect(
			adminPage.getByRole('heading', { level: 1, name: /^Tasks$/i })
		).toBeVisible();

		await expect(
			adminPage.getByText('Manage your CRM tasks', { exact: true })
		).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /Add New Task/i })
		).toBeVisible();
	});

	test('Pro: search, status filter, and Filters control', async ({
		adminPage,
	}) => {
		await expect(
			adminPage.getByPlaceholder(/Search tasks/i)
		).toBeVisible();

		// Radix Select trigger may be `button` or `combobox`; visible label is "All Status".
		await expect(
			adminPage
				.locator('.filter-main')
				.locator('button, [role="combobox"]')
				.filter({ hasText: /^All Status$/i })
				.first()
		).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /^Filters$/i })
		).toBeVisible();
	});

	test('Pro: list loads — table or empty state', async ({ adminPage }) => {
		const table = adminPage.getByRole('table');
		const emptyHeading = adminPage.getByRole('heading', {
			name: 'No tasks yet',
			exact: true,
		});

		await expect(table.or(emptyHeading)).toBeVisible({ timeout: 45_000 });
	});

	test('Pro: Filters dialog — assigned to and apply', async ({
		adminPage,
	}) => {
		await adminPage.getByRole('button', { name: /^Filters$/i }).click();

		const dialog = adminPage
			.getByRole('dialog')
			.filter({ hasText: /Assigned to/i });
		await expect(dialog).toBeVisible({ timeout: 10_000 });
		await expect(dialog.getByText(/^Task Type$/i)).toBeVisible();
		await expect(dialog.getByText(/^Priority$/i)).toBeVisible();
		await expect(
			dialog.getByRole('button', { name: /^Apply Filter$/i })
		).toBeVisible();

		await adminPage.keyboard.press('Escape');
	});

	test('Pro: Add New Task opens dialog', async ({ adminPage }) => {
		await adminPage.getByRole('button', { name: /Add New Task/i }).click();

		const dialog = adminPage.getByRole('dialog').filter({
			hasText: /Add Task to the contact|Update task details/i,
		});
		await expect(dialog).toBeVisible({ timeout: 10_000 });
		await expect(dialog.getByText(/^Add Task$/i).first()).toBeVisible();

		await adminPage.keyboard.press('Escape');
	});

	test('Pro: empty state CTA when no tasks', async ({ adminPage }) => {
		const emptyHeading = adminPage.getByRole('heading', {
			name: 'No tasks yet',
			exact: true,
		});
		if (!(await emptyHeading.isVisible().catch(() => false))) {
			test.skip();
		}

		await expect(
			adminPage.getByText(/add one to start tracking contact follow-ups/i)
		).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /Add New Task/i })
		).toBeVisible();
	});

	test('Pro: table and row selection when tasks exist', async ({
		adminPage,
	}) => {
		const table = adminPage.getByRole('table');
		if (!(await table.isVisible().catch(() => false))) {
			test.skip();
		}

		const dataRows = table.locator('tbody tr');
		if ((await dataRows.count()) === 0) {
			test.skip();
		}

		await expect(dataRows.first()).toBeVisible({ timeout: 10_000 });

		const selectAll = adminPage.getByRole('checkbox', {
			name: /Select all/i,
		});
		await selectAll.click();

		await expect(
			adminPage.getByText(/\d+\s+selected/i).first()
		).toBeVisible({ timeout: 5_000 });

		await expect(
			adminPage.getByRole('button', { name: /Mark Complete/i })
		).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /Mark Pending/i })
		).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /^Delete$/i })
		).toBeVisible();
	});

	test('Pro: pagination footer when more than one page', async ({
		adminPage,
	}) => {
		const table = adminPage.getByRole('table');
		if (!(await table.isVisible().catch(() => false))) {
			test.skip();
		}

		const showing = adminPage.getByText(/Showing \d+ to \d+ of \d+ results/i);
		if (!(await showing.isVisible().catch(() => false))) {
			test.skip(
				true,
				'Tasks pagination appears only when total_pages > 1.'
			);
		}

		await expect(showing).toBeVisible();
		await expect(
			adminPage.getByRole('navigation', { name: /pagination/i })
		).toBeVisible();
	});
});
