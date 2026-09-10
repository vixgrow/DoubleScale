import { test, expect, type Page } from './fixtures';

type WpApiSettings = { root: string; nonce: string };

type CreatedContact = {
	id: number;
	email?: string;
	tags?: Array<{ id: number; name: string }>;
};

type CreatedTag = { id: number; name: string };

type ContactsList = { data: CreatedContact[]; total?: number };

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

			const res = await fetch(
				`${settings.root}${restPath.replace(/^\//, '')}`,
				{
					method: method ?? 'GET',
					headers: {
						'X-WP-Nonce': settings.nonce,
						'Content-Type': 'application/json',
					},
					credentials: 'same-origin',
					body: body === undefined ? undefined : JSON.stringify(body),
				}
			);

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
	// No leading slash — baseURL may be a subdirectory.
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

function bulkTrigger(adminPage: Page) {
	return adminPage
		.locator('.doublescale-all-contacts')
		.getByRole('combobox')
		.first();
}

const banner = (adminPage: Page) =>
	adminPage.getByTestId('contacts-select-all-banner');

/**
 * Seed `count` contacts sharing a unique last name so the list can be filtered
 * down to exactly them without resetting the database.
 */
async function seedContacts(
	adminPage: Page,
	lastName: string,
	count: number
): Promise<number[]> {
	const ids: number[] = [];
	for (let i = 0; i < count; i++) {
		const contact = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					first_name: `Bulk${i}`,
					last_name: lastName,
					email: `e2e-select-all-${lastName}-${i}@example.test`,
				},
			}
		);
		ids.push(contact.id);
	}
	return ids;
}

test.describe('Contacts select all matching', () => {
	test('applies a tag to every contact matching the filter, across pages', async ({
		adminPage,
	}) => {
		test.setTimeout(180_000);

		await gotoContacts(adminPage);

		const stamp = Date.now();
		const lastName = `E2ESelectAll${stamp}`;
		const tagName = `E2E SelectAll ${stamp}`;

		const tag = await restJson<CreatedTag>(
			adminPage,
			'doublescale/v1/tags',
			{
				method: 'POST',
				body: { name: tagName },
			}
		);
		expect(tag.id).toBeGreaterThan(0);

		// 25 contacts at the default page size of 10 spans three pages, so a
		// page-scoped selection cannot reach them all.
		const seeded = await seedContacts(adminPage, lastName, 25);
		expect(seeded).toHaveLength(25);

		await searchContacts(adminPage, lastName);

		// Check the header box: selects this page only.
		await adminPage
			.getByRole('table')
			.getByRole('checkbox', { name: /Select all/i })
			.click();

		await expect(banner(adminPage)).toBeVisible({ timeout: 10_000 });
		await expect(banner(adminPage)).toContainText(
			/contacts on this page are selected/i
		);

		const selectAllLink = adminPage.getByRole('button', {
			name: /Select all 25 contacts matching this filter/i,
		});
		await expect(selectAllLink).toBeVisible({ timeout: 10_000 });
		await selectAllLink.click();

		await expect(banner(adminPage)).toContainText(
			/All 25 contacts matching this filter are selected/i
		);

		const trigger = bulkTrigger(adminPage);
		await expect(trigger).toBeEnabled({ timeout: 10_000 });
		await trigger.click();
		await adminPage.getByRole('option', { name: /^Add Tag$/i }).click();

		const dialog = adminPage.getByRole('dialog').filter({
			hasText: 'Select tags to add to contacts',
		});
		await expect(dialog).toBeVisible({ timeout: 10_000 });

		const select = dialog.locator('.react-select-container').first();
		await select.click();
		await dialog.locator('input').first().fill(tagName);
		const option = adminPage
			.locator('.react-select__option')
			.filter({ hasText: tagName });
		await expect(option.first()).toBeVisible({ timeout: 15_000 });
		await option.first().click();

		await adminPage.getByRole('button', { name: /^Add Tags$/i }).click();

		await expect(
			adminPage.getByText(/Tags added successfully/i)
		).toBeVisible({ timeout: 60_000 });

		// The assertion that actually proves the feature: every seeded contact
		// carries the tag, including the ones never rendered on screen.
		const listed = await restJson<ContactsList>(
			adminPage,
			`doublescale/v1/contacts?keywords=${lastName}&per_page=100`
		);
		expect(listed.data.length).toBe(25);
		for (const contact of listed.data) {
			const names = (contact.tags ?? []).map((t) => t.name);
			expect(names).toContain(tagName);
		}
	});

	test('changing the search clears a filter-wide selection', async ({
		adminPage,
	}) => {
		test.setTimeout(120_000);

		await gotoContacts(adminPage);

		const stamp = Date.now();
		const lastName = `E2EClearSel${stamp}`;
		await seedContacts(adminPage, lastName, 12);

		await searchContacts(adminPage, lastName);
		await adminPage
			.getByRole('table')
			.getByRole('checkbox', { name: /Select all/i })
			.click();

		const selectAllLink = adminPage.getByRole('button', {
			name: /Select all 12 contacts matching this filter/i,
		});
		await expect(selectAllLink).toBeVisible({ timeout: 10_000 });
		await selectAllLink.click();
		await expect(bulkTrigger(adminPage)).toBeEnabled({
			timeout: 10_000,
		});

		// Narrowing the filter invalidates "all 12 matching" — carrying it over
		// would let the next bulk action hit a set the user never saw.
		await adminPage
			.getByPlaceholder(/Search contacts/i)
			.fill(`${lastName}-nothing-matches`);

		await expect(banner(adminPage)).toHaveCount(0, { timeout: 20_000 });
		await expect(bulkTrigger(adminPage)).toBeDisabled({
			timeout: 20_000,
		});
	});

	test('Delete is disabled while the selection spans the filter', async ({
		adminPage,
	}) => {
		test.setTimeout(120_000);

		await gotoContacts(adminPage);

		const stamp = Date.now();
		const lastName = `E2ENoDelete${stamp}`;
		await seedContacts(adminPage, lastName, 12);

		await searchContacts(adminPage, lastName);
		await adminPage
			.getByRole('table')
			.getByRole('checkbox', { name: /Select all/i })
			.click();

		const selectAllLink = adminPage.getByRole('button', {
			name: /Select all 12 contacts matching this filter/i,
		});
		await expect(selectAllLink).toBeVisible({ timeout: 10_000 });
		await selectAllLink.click();

		const trigger = bulkTrigger(adminPage);
		await expect(trigger).toBeEnabled({ timeout: 10_000 });
		await trigger.click();

		const deleteOption = adminPage.getByRole('option', {
			name: /^Delete$/i,
		});
		// Contacts the user cannot delete never render the option at all.
		if (await deleteOption.isVisible().catch(() => false)) {
			await expect(deleteOption).toBeDisabled();
		}

		// Tagging stays available.
		await expect(
			adminPage.getByRole('option', { name: /^Add Tag$/i })
		).toBeEnabled();
	});
});
