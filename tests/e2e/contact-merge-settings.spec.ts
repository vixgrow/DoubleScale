import { test, expect, type Page } from './fixtures';

/**
 * The automatic-merge notification address, from the admin's side.
 *
 * The notifier and its REST schema shipped first, with no field anywhere in the
 * admin — so the only way to turn the feature on was to call REST by hand. These
 * tests cover the screen that makes it reachable.
 */

async function waitForAdminShell(adminPage: Page): Promise<void> {
	const wpDenied = adminPage.getByText(
		/sorry, you are not allowed to access this page/i
	);
	const layout = adminPage.locator('.doublescale-layout__main');

	await expect(wpDenied.or(layout)).toBeVisible({ timeout: 45_000 });

	if (await wpDenied.isVisible().catch(() => false)) {
		throw new Error('WordPress blocked the DoubleScale admin URL.');
	}
}

async function openBusinessSettings(adminPage: Page): Promise<void> {
	await adminPage.goto(
		'wp-admin/admin.php?page=doublescale&path=settings/business'
	);
	await waitForAdminShell(adminPage);
	await expect(
		adminPage.getByText('Duplicate contacts', { exact: true })
	).toBeVisible({ timeout: 45_000 });
}

function notifyEmailInput(adminPage: Page) {
	// The shared Field component renders its label as a plain <div>, not a
	// <label for=…>, so getByLabel cannot reach the input. Walk from the label
	// text to the input inside the same .doublescale-field wrapper instead.
	return adminPage
		.locator('.doublescale-field')
		.filter({ hasText: 'Merge notification email' })
		.locator('input');
}

test.describe('Contact merge notification settings', () => {
	test('admin can set the merge notification address and it survives a reload', async ({
		adminPage,
	}) => {
		const address = `merge-notice-${Date.now()}@example.test`;

		await openBusinessSettings(adminPage);

		const input = notifyEmailInput(adminPage);
		await expect(input).toBeVisible();

		await input.fill(address);
		await adminPage.getByRole('button', { name: /^Save/i }).click();

		await expect(
			adminPage.getByText(/Settings updated successfully/i)
		).toBeVisible({ timeout: 20_000 });

		// The value has to come back from the server, not just linger in state.
		await openBusinessSettings(adminPage);
		await expect(notifyEmailInput(adminPage)).toHaveValue(address);
	});

	test('a malformed address is refused instead of silently saved', async ({
		adminPage,
	}) => {
		await openBusinessSettings(adminPage);

		const input = notifyEmailInput(adminPage);
		await input.fill('not-an-email');
		await adminPage.getByRole('button', { name: /^Save/i }).click();

		await expect(
			adminPage.getByText(/not a valid email address/i)
		).toBeVisible({ timeout: 20_000 });

		// And the bad value must not have been written: a reload shows it gone.
		await openBusinessSettings(adminPage);
		await expect(notifyEmailInput(adminPage)).not.toHaveValue(
			'not-an-email'
		);
	});

	test('clearing the address is accepted — that is how notices are turned off', async ({
		adminPage,
	}) => {
		const address = `merge-clear-${Date.now()}@example.test`;

		await openBusinessSettings(adminPage);
		await notifyEmailInput(adminPage).fill(address);
		await adminPage.getByRole('button', { name: /^Save/i }).click();
		await expect(
			adminPage.getByText(/Settings updated successfully/i)
		).toBeVisible({ timeout: 20_000 });

		await openBusinessSettings(adminPage);
		await notifyEmailInput(adminPage).fill('');
		await adminPage.getByRole('button', { name: /^Save/i }).click();
		await expect(
			adminPage.getByText(/Settings updated successfully/i)
		).toBeVisible({ timeout: 20_000 });

		await openBusinessSettings(adminPage);
		await expect(notifyEmailInput(adminPage)).toHaveValue('');
	});
});
