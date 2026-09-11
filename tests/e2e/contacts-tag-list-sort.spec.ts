import { test, expect, type Page } from './fixtures';

type WpApiSettings = { root: string; nonce: string };

type CreatedContact = {
	id: number;
};

type CreatedTerm = {
	id: number;
	name: string;
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

async function gotoContacts(adminPage: Page): Promise<void> {
	await adminPage.goto('wp-admin/admin.php?page=doublescale&path=contacts');
	await waitForAdminShell(adminPage);
	await expect(
		adminPage.getByRole('heading', { name: /Contacts List/i })
	).toBeVisible({ timeout: 45_000 });
}

async function searchContacts(adminPage: Page, query: string): Promise<void> {
	const search = adminPage.getByPlaceholder(/Search contacts/i);
	await expect(search).toBeVisible();
	await search.fill(query);
	await expect(
		adminPage.getByRole('table').locator('tbody tr').first()
	).toBeVisible({ timeout: 20_000 });
}

async function ensureTermColumnsVisible(adminPage: Page): Promise<void> {
	await adminPage.getByRole('button', { name: /Manage Columns/i }).click();
	await expect(
		adminPage.getByText(/Select Columns that you want/i)
	).toBeVisible({ timeout: 10_000 });

	for (const columnId of ['tags', 'lists'] as const) {
		const checkbox = adminPage.locator(`#col-${columnId}`);
		await expect(checkbox).toBeVisible();
		if (!(await checkbox.isChecked())) {
			await checkbox.click();
		}
	}

	await adminPage.getByRole('button', { name: /^Submit$/i }).click();
	await expect(
		adminPage.getByText(/Select Columns that you want/i)
	).toBeHidden({ timeout: 10_000 });
}

test.describe('Contacts table tag and list chip order', () => {
	test('shows Tag and List chips alphabetically, not in attach order', async ({
		adminPage,
	}) => {
		test.setTimeout(90_000);

		await gotoContacts(adminPage);

		const stamp = Date.now();
		const email = `e2e-sort-${stamp}@example.test`;
		const zebraTag = `E2E Zebra ${stamp}`;
		const mangoTag = `E2E Mango ${stamp}`;
		const alphaTag = `E2E Alpha ${stamp}`;
		const zebraList = `E2E Zebra List ${stamp}`;
		const mangoList = `E2E Mango List ${stamp}`;
		const alphaList = `E2E Alpha List ${stamp}`;

		const zebra = await restJson<CreatedTerm>(adminPage, 'doublescale/v1/tags', {
			method: 'POST',
			body: { name: zebraTag },
		});
		const mango = await restJson<CreatedTerm>(adminPage, 'doublescale/v1/tags', {
			method: 'POST',
			body: { name: mangoTag },
		});
		const alpha = await restJson<CreatedTerm>(adminPage, 'doublescale/v1/tags', {
			method: 'POST',
			body: { name: alphaTag },
		});
		const zebraL = await restJson<CreatedTerm>(adminPage, 'doublescale/v1/lists', {
			method: 'POST',
			body: { name: zebraList },
		});
		const mangoL = await restJson<CreatedTerm>(adminPage, 'doublescale/v1/lists', {
			method: 'POST',
			body: { name: mangoList },
		});
		const alphaL = await restJson<CreatedTerm>(adminPage, 'doublescale/v1/lists', {
			method: 'POST',
			body: { name: alphaList },
		});

		const contact = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					first_name: 'Sort',
					last_name: `Chips${stamp}`,
					email,
				},
			}
		);

		await restJson(adminPage, 'doublescale/v1/contacts/add-tag', {
			method: 'POST',
			body: {
				ids: [contact.id],
				tag_ids: [zebra.id, mango.id, alpha.id],
			},
		});
		await restJson(adminPage, 'doublescale/v1/contacts/add-to-list', {
			method: 'POST',
			body: {
				ids: [contact.id],
				list_ids: [zebraL.id, mangoL.id, alphaL.id],
			},
		});

		await searchContacts(adminPage, email);
		await ensureTermColumnsVisible(adminPage);

		const row = adminPage
			.getByRole('table')
			.locator('tbody tr')
			.filter({ hasText: email });
		await expect(row).toBeVisible({ timeout: 20_000 });

		const tagChips = row.locator('.bg-violet-50');
		const listChips = row.locator('.bg-blue-50');

		await expect(tagChips).toHaveCount(2);
		await expect(tagChips.nth(0)).toHaveText(alphaTag);
		await expect(tagChips.nth(1)).toHaveText(mangoTag);

		await expect(listChips).toHaveCount(2);
		await expect(listChips.nth(0)).toHaveText(alphaList);
		await expect(listChips.nth(1)).toHaveText(mangoList);

		await expect(row.getByText('+1').first()).toBeVisible();
	});
});
