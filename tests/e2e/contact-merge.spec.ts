import { test, expect, type Page } from './fixtures';

type WpApiSettings = { root: string; nonce: string };

type CreatedContact = {
	id: number;
	email?: string;
	phone?: string;
	first_name?: string;
};

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

async function restJson<T>(
	adminPage: Page,
	path: string,
	init: { method?: string; body?: unknown } = {}
): Promise<T> {
	return adminPage.evaluate(
		async ({ path: restPath, method, body }) => {
			const settings = (
				window as unknown as { wpApiSettings?: WpApiSettings }
			).wpApiSettings;

			if (!settings?.root || !settings.nonce) {
				throw new Error('wpApiSettings is not available');
			}

			const res = await fetch(`${settings.root}${restPath.replace(/^\//, '')}`, {
				method: method ?? 'GET',
				headers: {
					'X-WP-Nonce': settings.nonce,
					'Content-Type': 'application/json',
				},
				credentials: 'same-origin',
				body: body === undefined ? undefined : JSON.stringify(body),
			});

			const payload = await res.json();
			if (!res.ok) {
				throw new Error(
					`${res.status} ${payload?.code ?? ''} ${payload?.message ?? res.statusText}`
				);
			}

			return payload as T;
		},
		{ path, method: init.method, body: init.body }
	);
}

test.describe('Admin contact merge', () => {
	test('edit contact offers merge when phone belongs to another contact', async ({
		adminPage,
	}) => {
		const stamp = Date.now();
		const primaryEmail = `e2e-merge-a-${stamp}@example.test`;
		const sourcePhone = `+1202555${String(stamp).slice(-4)}`;
		const sourceNoteTitle = `E2E merge source note ${stamp}`;

		await adminPage.goto('wp-admin/admin.php?page=doublescale&path=contacts');
		await waitForAdminShell(adminPage);
		await expect(
			adminPage.getByRole('heading', { name: /Contacts List/i })
		).toBeVisible({ timeout: 45_000 });

		const primary = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					first_name: 'MergePrimary',
					last_name: `A${stamp}`,
					email: primaryEmail,
				},
			}
		);
		expect(primary.id).toBeGreaterThan(0);

		const source = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					first_name: 'MergeSource',
					last_name: `B${stamp}`,
					phone: sourcePhone,
				},
			}
		);
		expect(source.id).toBeGreaterThan(0);
		expect(source.id).not.toBe(primary.id);

		await restJson(adminPage, 'doublescale/v1/activities/notes', {
			method: 'POST',
			body: {
				contact_id: source.id,
				title: sourceNoteTitle,
				content: `Note that must survive merge ${stamp}`,
			},
		});

		await adminPage.goto(
			`wp-admin/admin.php?page=doublescale&path=contacts/${primary.id}`
		);
		await waitForAdminShell(adminPage);
		await expect(
			adminPage.getByText('MergePrimary', { exact: false }).first()
		).toBeVisible({ timeout: 45_000 });

		const phoneLabel = adminPage.locator('label').filter({ hasText: /^Phone$/ });
		await expect(phoneLabel).toBeVisible();
		await phoneLabel.locator('..').getByRole('button').click();

		const phoneInput = adminPage.getByRole('textbox').last();
		await expect(phoneInput).toBeVisible();
		await phoneInput.fill(sourcePhone);
		await phoneLabel.locator('..').getByRole('button').first().click();

		const mergeHeading = adminPage.getByRole('heading', {
			name: /Merge contacts/i,
		});
		await expect(mergeHeading).toBeVisible({ timeout: 15_000 });
		await adminPage.waitForTimeout(1500);
		await expect(mergeHeading).toBeVisible();
		await expect(adminPage).toHaveURL(
			new RegExp(`contacts(%2F|/)${primary.id}`)
		);

		await expect(adminPage.getByText(/MergePrimary/i).first()).toBeVisible();
		await expect(adminPage.getByText(/MergeSource/i).first()).toBeVisible();
		await expect(
			adminPage.getByText(/will remain the primary contact/i)
		).toBeVisible();

		await adminPage.getByRole('button', { name: /Confirm merge/i }).click();

		await expect(
			adminPage.getByText(sourcePhone, { exact: false }).first()
		).toBeVisible({ timeout: 20_000 });
		await expect(
			adminPage.getByRole('heading', { name: /Merge contacts/i })
		).toHaveCount(0);

		await adminPage.getByRole('tab', { name: /^Notes$/i }).click();
		await expect(adminPage.getByText(sourceNoteTitle)).toBeVisible({
			timeout: 20_000,
		});
	});

	test('canceling merge leaves both contacts unchanged', async ({
		adminPage,
	}) => {
		const stamp = Date.now();
		const primaryEmail = `e2e-merge-cancel-a-${stamp}@example.test`;
		const sourcePhone = `+1202556${String(stamp).slice(-4)}`;

		await adminPage.goto('wp-admin/admin.php?page=doublescale&path=contacts');
		await waitForAdminShell(adminPage);

		const primary = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					first_name: 'CancelPrimary',
					last_name: `A${stamp}`,
					email: primaryEmail,
				},
			}
		);
		const source = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					first_name: 'CancelSource',
					last_name: `B${stamp}`,
					phone: sourcePhone,
				},
			}
		);

		await adminPage.goto(
			`wp-admin/admin.php?page=doublescale&path=contacts/${primary.id}`
		);
		await waitForAdminShell(adminPage);
		await expect(
			adminPage.getByText('CancelPrimary', { exact: false }).first()
		).toBeVisible({ timeout: 45_000 });

		const phoneLabel = adminPage.locator('label').filter({ hasText: /^Phone$/ });
		await phoneLabel.locator('..').getByRole('button').click();
		const phoneInput = adminPage.getByRole('textbox').last();
		await phoneInput.fill(sourcePhone);
		await phoneInput.press('Enter');

		await expect(
			adminPage.getByRole('heading', { name: /Merge contacts/i })
		).toBeVisible({ timeout: 15_000 });

		await adminPage.getByRole('button', { name: /^Cancel$/i }).click();

		await expect(
			adminPage.getByRole('heading', { name: /Merge contacts/i })
		).toHaveCount(0);

		const stillSource = await restJson<CreatedContact>(
			adminPage,
			`doublescale/v1/contacts/${source.id}`
		);
		expect(stillSource.id).toBe(source.id);
		expect(stillSource.phone).toBe(sourcePhone);
	});
});
