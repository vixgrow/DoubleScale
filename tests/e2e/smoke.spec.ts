import { test, expect } from './fixtures';

test.describe('Smoke', () => {
	test('plugin is active and admin loads without console errors', async ({ adminPage }) => {
		const consoleErrors: string[] = [];
		adminPage.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		await adminPage.goto('/wp-admin/plugins.php');

		const row = adminPage.locator('tr[data-slug="doublescale"]');
		await expect(row).toBeVisible();
		await expect(row).toHaveClass(/active/);

		await adminPage.goto('/wp-admin/admin.php?page=doublescale');

		await expect(adminPage.locator('[data-testid="doublescale-app"]')).toBeVisible({
			timeout: 15_000,
		});

		expect(
			consoleErrors,
			'Console errors during admin boot: ' + consoleErrors.join('\n')
		).toHaveLength(0);
	});
});
