import { test, expect, type Page } from './fixtures';

type WpApiSettings = { root: string; nonce: string };

type CreatedContact = {
	id: number;
	email?: string;
	first_name?: string;
	last_name?: string;
	tags?: Array<{ id: number; name: string }>;
};

type CreatedTag = {
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

function bulkTrigger(adminPage: Page) {
	return adminPage
		.locator('.doublescale-all-contacts')
		.getByRole('combobox')
		.first();
}

async function openAddTagModal(adminPage: Page): Promise<void> {
	const trigger = bulkTrigger(adminPage);
	await expect(trigger).toBeEnabled({ timeout: 10_000 });
	await trigger.click();
	await adminPage.getByRole('option', { name: /^Add Tag$/i }).click();
	await expect(
		adminPage.getByText('Select tags to add to contacts')
	).toBeVisible({ timeout: 10_000 });
}

async function pickTagInModal(adminPage: Page, tagName: string): Promise<void> {
	const dialog = adminPage.getByRole('dialog').filter({
		hasText: 'Select tags to add to contacts',
	});
	const select = dialog.locator('.react-select-container').first();
	await expect(select).toBeVisible();
	await select.click();
	const input = dialog.locator('input').first();
	await input.fill(tagName);
	const option = adminPage
		.locator('.react-select__option')
		.filter({ hasText: tagName });
	await expect(option.first()).toBeVisible({ timeout: 15_000 });
	await option.first().click();
}

test.describe('Contacts Bulk Actions and Advanced Filters', () => {
	test('Bulk Actions stays disabled until a row is selected', async ({
		adminPage,
	}) => {
		await gotoContacts(adminPage);

		const stamp = Date.now();
		const email = `e2e-bulk-enable-${stamp}@example.test`;
		await restJson<CreatedContact>(adminPage, 'doublescale/v1/contacts', {
			method: 'POST',
			body: {
				first_name: 'BulkEnable',
				last_name: `E2E${stamp}`,
				email,
			},
		});

		const trigger = bulkTrigger(adminPage);
		await expect(trigger).toBeVisible();
		await expect(trigger).toBeDisabled();

		await searchContacts(adminPage, email);
		await adminPage
			.getByRole('table')
			.getByRole('checkbox', { name: /Select row/i })
			.first()
			.click();
		await expect(trigger).toBeEnabled({ timeout: 10_000 });
	});

	test('Bulk Actions menu lists Add Tag and the other contact actions', async ({
		adminPage,
	}) => {
		await gotoContacts(adminPage);

		const stamp = Date.now();
		const email = `e2e-bulk-menu-${stamp}@example.test`;
		await restJson<CreatedContact>(adminPage, 'doublescale/v1/contacts', {
			method: 'POST',
			body: {
				first_name: 'BulkMenu',
				last_name: `E2E${stamp}`,
				email,
			},
		});

		await searchContacts(adminPage, email);
		await adminPage
			.getByRole('table')
			.getByRole('checkbox', { name: /Select row/i })
			.first()
			.click();

		const trigger = bulkTrigger(adminPage);
		await expect(trigger).toBeEnabled({ timeout: 10_000 });
		await trigger.click();

		await expect(adminPage.getByRole('option', { name: /^Add Tag$/i })).toBeVisible();
		await expect(adminPage.getByRole('option', { name: /^Add to List$/i })).toBeVisible();
		await expect(
			adminPage.getByRole('option', { name: /^Remove from List$/i })
		).toBeVisible();
		await expect(adminPage.getByRole('option', { name: /^Remove Tag$/i })).toBeVisible();
		await expect(adminPage.getByRole('option', { name: /^Delete$/i })).toBeVisible();
	});

	test('Add Tag attaches the chosen tag to the selected contact', async ({
		adminPage,
	}) => {
		test.setTimeout(90_000);

		await gotoContacts(adminPage);

		const stamp = Date.now();
		const tagName = `E2E AddTag ${stamp}`;
		const email = `e2e-add-tag-${stamp}@example.test`;

		const tag = await restJson<CreatedTag>(adminPage, 'doublescale/v1/tags', {
			method: 'POST',
			body: { name: tagName },
		});
		expect(tag.id).toBeGreaterThan(0);

		const contact = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					first_name: 'AddTag',
					last_name: `Target${stamp}`,
					email,
				},
			}
		);
		expect(contact.id).toBeGreaterThan(0);

		await searchContacts(adminPage, email);
		await expect(adminPage.getByText(email)).toBeVisible({ timeout: 20_000 });

		await adminPage
			.getByRole('table')
			.getByRole('checkbox', { name: /Select row/i })
			.first()
			.click();

		await openAddTagModal(adminPage);

		const addButton = adminPage.getByRole('button', { name: /^Add Tags$/i });
		await expect(addButton).toBeDisabled();

		await pickTagInModal(adminPage, tagName);
		await expect(addButton).toBeEnabled();
		await addButton.click();

		await expect(
			adminPage.getByText(/Tags added successfully/i)
		).toBeVisible({ timeout: 20_000 });

		await expect(
			adminPage.getByRole('table').locator('tbody tr').first()
		).toContainText(tagName, { timeout: 20_000 });

		const updated = await restJson<CreatedContact>(
			adminPage,
			`doublescale/v1/contacts/${contact.id}`
		);
		const names = (updated.tags ?? []).map((t) => t.name);
		expect(names.length).toBeGreaterThan(0);
		expect(names).toContain(tagName);
	});

	test('Add Tag keeps tags the contact already had', async ({ adminPage }) => {
		test.setTimeout(90_000);

		await gotoContacts(adminPage);

		const stamp = Date.now();
		const keptName = `E2E Kept ${stamp}`;
		const addedName = `E2E Extra ${stamp}`;
		const email = `e2e-add-keep-${stamp}@example.test`;

		const kept = await restJson<CreatedTag>(adminPage, 'doublescale/v1/tags', {
			method: 'POST',
			body: { name: keptName },
		});
		const extra = await restJson<CreatedTag>(adminPage, 'doublescale/v1/tags', {
			method: 'POST',
			body: { name: addedName },
		});

		const contact = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					first_name: 'KeepTag',
					last_name: `Target${stamp}`,
					email,
				},
			}
		);

		await restJson(adminPage, 'doublescale/v1/contacts/add-tag', {
			method: 'POST',
			body: {
				ids: [contact.id],
				tag_ids: [kept.id],
			},
		});

		await searchContacts(adminPage, email);
		await adminPage
			.getByRole('table')
			.getByRole('checkbox', { name: /Select row/i })
			.first()
			.click();

		await openAddTagModal(adminPage);
		await pickTagInModal(adminPage, addedName);
		await adminPage.getByRole('button', { name: /^Add Tags$/i }).click();

		await expect(
			adminPage.getByText(/Tags added successfully/i)
		).toBeVisible({ timeout: 20_000 });

		const updated = await restJson<CreatedContact>(
			adminPage,
			`doublescale/v1/contacts/${contact.id}`
		);
		const names = (updated.tags ?? []).map((t) => t.name);
		expect(names.length).toBeGreaterThan(0);
		expect(names).toContain(keptName);
		expect(names).toContain(addedName);
		expect(extra.id).toBeGreaterThan(0);
	});

	test('Advanced Filters opens the rules dialog (Pro) or stays gated (Free)', async ({
		adminPage,
	}) => {
		await gotoContacts(adminPage);

		const advFilters = adminPage.getByRole('button', { name: /Advanced Filters/i });
		await expect(advFilters).toBeVisible();

		if (await advFilters.isDisabled()) {
			return;
		}

		await advFilters.click();
		await expect(adminPage.locator('[role="dialog"]').first()).toBeVisible({
			timeout: 10_000,
		});

		const proGate = adminPage.getByRole('heading', { name: /This is a PRO Feature/i });
		const apply = adminPage.getByRole('button', { name: /Apply Filters/i });
		const opened =
			(await proGate.isVisible().catch(() => false)) ||
			(await apply.isVisible().catch(() => false));
		expect(opened).toBe(true);

		if (await apply.isVisible().catch(() => false)) {
			await expect(
				adminPage.getByRole('heading', { name: /Advanced Filters/i })
			).toBeVisible();
			await expect(
				adminPage.getByRole('button', { name: /Clear Filters/i })
			).toBeVisible();
			await apply.click();
			await expect(
				adminPage.getByRole('heading', { name: /Contacts List/i })
			).toBeVisible();
		}
	});

	test('tag deep-link filter shows the tagged contact and hides the untagged one', async ({
		adminPage,
	}) => {
		test.setTimeout(90_000);

		await gotoContacts(adminPage);

		const stamp = Date.now();
		const lastName = `E2EDeeplink${stamp}`;
		const tagName = `E2E LinkTag ${stamp}`;
		const taggedEmail = `e2e-link-tagged-${stamp}@example.test`;
		const plainEmail = `e2e-link-plain-${stamp}@example.test`;

		const tag = await restJson<CreatedTag>(adminPage, 'doublescale/v1/tags', {
			method: 'POST',
			body: { name: tagName },
		});

		const tagged = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					first_name: 'Tagged',
					last_name: lastName,
					email: taggedEmail,
				},
			}
		);
		await restJson<CreatedContact>(adminPage, 'doublescale/v1/contacts', {
			method: 'POST',
			body: {
				first_name: 'Plain',
				last_name: lastName,
				email: plainEmail,
			},
		});
		await restJson(adminPage, 'doublescale/v1/contacts/add-tag', {
			method: 'POST',
			body: {
				ids: [tagged.id],
				tag_ids: [tag.id],
			},
		});

		await adminPage.goto(
			`wp-admin/admin.php?page=doublescale&path=contacts&tag_id=${tag.id}`
		);
		await waitForAdminShell(adminPage);
		await expect(
			adminPage.getByRole('heading', { name: /Contacts List/i })
		).toBeVisible({ timeout: 45_000 });

		const search = adminPage.getByPlaceholder(/Search contacts/i);
		await search.fill(lastName);

		await expect(adminPage.getByText(taggedEmail)).toBeVisible({ timeout: 20_000 });
		await expect(adminPage.getByText(plainEmail)).toHaveCount(0);
	});
});
