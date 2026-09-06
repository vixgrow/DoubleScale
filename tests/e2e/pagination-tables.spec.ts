import type { Locator, Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * Server-side DataTable pagination — the bug that showed page 1 again on
 * page 3+ and sliced 50-per-page lists down to 10 rows.
 *
 * Inventory (code vs this spec) lives in the describe block below. Nested
 * contact/campaign tables share the same DataTable + showPagination={false}
 * path; this install does not have enough nested rows to walk pages 1–3.
 */

async function waitForPagedList(adminPage: Page, heading: RegExp) {
	await expect(
		adminPage.getByRole('heading', { name: heading }).first()
	).toBeVisible({ timeout: 45_000 });

	if (
		await adminPage
			.getByText(/Upgrade to DoubleScale Pro/i)
			.first()
			.isVisible()
			.catch(() => false)
	) {
		test.skip(true, 'Screen is Pro-gated on this install.');
	}

	await expect(adminPage.getByRole('table').first()).toBeVisible({
		timeout: 8_000,
	}).catch(() => {
		test.skip(
			true,
			'Empty list — no table on this screen.'
		);
	});

	if (!(await adminPage.getByRole('table').first().isVisible().catch(() => false))) {
		test.skip(true, 'Empty list — no table on this screen.');
	}
	await expect(
		adminPage.getByText(/Showing \d+ of \d+ results/i).first()
	).toBeVisible({ timeout: 20_000 });

	try {
		await expect
			.poll(async () => (await showing(adminPage)).total, {
				timeout: 20_000,
			})
			.toBeGreaterThan(0);
	} catch {
		test.skip(
			true,
			'Empty list — cannot exercise server pagination on this screen.'
		);
	}
}

function parseShowing(text: string): { shown: number; total: number } {
	const match = text.match(/Showing (\d+) of (\d+) results/i);
	if (!match) {
		throw new Error(`Could not parse pagination label: "${text}"`);
	}
	return { shown: Number(match[1]), total: Number(match[2]) };
}

async function showing(adminPage: Page) {
	const label = adminPage.getByText(/Showing \d+ of \d+ results/i).first();
	await expect(label).toBeVisible();
	return parseShowing((await label.innerText()).replace(/\s+/g, ' '));
}

async function rowKeys(table: Locator): Promise<string[]> {
	const rows = table.locator('tbody tr');
	const count = await rows.count();
	const keys: string[] = [];
	for (let i = 0; i < count; i++) {
		const row = rows.nth(i);
		const text = (await row.innerText()).replace(/\s+/g, ' ').trim();
		if (/No results found|Loading log/i.test(text)) {
			continue;
		}
		if (text.length <= 5) {
			continue;
		}
		const labeled = row.locator('[aria-label]');
		const idLabel =
			(await labeled.count()) > 0
				? await labeled.first().getAttribute('aria-label')
				: null;
		keys.push(idLabel ? `${idLabel}|${text}` : text);
	}
	return keys;
}

async function waitForDistinctPage(
	table: Locator,
	previous: string[],
	minCount: number
): Promise<string[]> {
	await expect
		.poll(
			async () => {
				const next = await rowKeys(table);
				if (next.length < minCount) {
					return false;
				}
				return next.some((row) => !previous.includes(row));
			},
			{ timeout: 20_000 }
		)
		.toBe(true);
	return rowKeys(table);
}

async function loadedRowKeys(table: Locator, minCount = 1): Promise<string[]> {
	await expect
		.poll(async () => (await rowKeys(table)).length, { timeout: 20_000 })
		.toBeGreaterThanOrEqual(minCount);
	return rowKeys(table);
}

async function clickPageNumber(adminPage: Page, pageNumber: number) {
	await adminPage
		.locator('button.w-8', { hasText: new RegExp(`^${pageNumber}$`) })
		.click();
}

async function waitForShowing(adminPage: Page, expectedShown: number) {
	await expect
		.poll(async () => (await showing(adminPage)).shown, { timeout: 20_000 })
		.toBe(expectedShown);
}

async function setPerPage(adminPage: Page, size: number) {
	const trigger = adminPage
		.getByRole('combobox')
		.filter({ hasText: /^(10|20|30|40|50)$/ });
	await expect(trigger).toBeVisible();
	const current = (await trigger.innerText()).replace(/\s+/g, '').trim();
	if (current === String(size)) {
		return;
	}
	await trigger.click();
	await adminPage.evaluate((size) => {
		const option = Array.from(
			document.querySelectorAll('[role="option"]')
		).find((el) => el.textContent?.trim() === String(size));
		if (!option) {
			throw new Error(`Per-page option ${size} not found`);
		}
		(option as HTMLElement).click();
	}, size);
	await expect(trigger).toHaveText(String(size), { timeout: 10_000 });
}

/**
 * Walks as far as the list allows:
 * - always asserts 10/page row count matches the pager
 * - page 2 when total > 10 (no overlap with page 1)
 * - page 3 when total > 20 (the original empty-page bug)
 * - 50/page when total > 10 (must not slice down to 10)
 */
async function assertServerPagination(adminPage: Page) {
	const table = adminPage.getByRole('table').first();
	await setPerPage(adminPage, 10);

	await expect
		.poll(async () => (await showing(adminPage)).shown, { timeout: 20_000 })
		.toBeGreaterThan(0);

	const stats = await showing(adminPage);
	const total = stats.total;
	const page1Count = Math.min(10, total);

	expect(stats.shown, 'pager shown-count at 10/page').toBe(page1Count);

	const page1 = await loadedRowKeys(table, page1Count);
	expect(page1, 'page 1 at 10/page').toHaveLength(page1Count);

	let page2: string[] = [];
	if (total > 10) {
		await clickPageNumber(adminPage, 2);
		await waitForShowing(adminPage, Math.min(20, total));
		page2 = await waitForDistinctPage(
			table,
			page1,
			Math.min(10, total - 10)
		);
		expect(page2.length).toBe(Math.min(10, total - 10));
		expect(
			page2.some((row) => page1.includes(row)),
			'page 2 must not repeat page 1 rows'
		).toBe(false);
	}

	if (total > 20) {
		await clickPageNumber(adminPage, 3);
		await expect
			.poll(async () => (await showing(adminPage)).shown, {
				timeout: 20_000,
			})
			.toBeGreaterThanOrEqual(21);
		const page3 = await waitForDistinctPage(table, [...page1, ...page2], 1);
		expect(page3.length).toBeGreaterThan(0);
		expect(
			page3.some((row) => page1.includes(row)),
			'page 3 must not repeat page 1 rows'
		).toBe(false);
		expect(
			page3.some((row) => page2.includes(row)),
			'page 3 must not repeat page 2 rows'
		).toBe(false);
	}

	if (total <= 10) {
		return;
	}

	await setPerPage(adminPage, 50);
	const expectedFifty = Math.min(50, total);
	await expect
		.poll(async () => (await showing(adminPage)).shown, { timeout: 20_000 })
		.toBe(expectedFifty);

	const fifty = await loadedRowKeys(table, expectedFifty);
	expect(
		fifty.length,
		'50/page must not be sliced to 10 rows'
	).toBeGreaterThan(10);
	expect(fifty.length).toBe(expectedFifty);

	if (total <= 50) {
		return;
	}

	await clickPageNumber(adminPage, 2);
	await waitForShowing(adminPage, Math.min(100, total));
	const fiftyPage2 = await waitForDistinctPage(table, fifty, 1);
	expect(fiftyPage2.length).toBeGreaterThan(0);
	expect(
		fiftyPage2.some((row) => fifty.includes(row)),
		'50/page page 2 must not repeat page 1 rows'
	).toBe(false);
}

type PagedScreen = {
	name: string;
	path: string;
	heading: RegExp;
	timeout?: number;
};

const TOP_LEVEL_SCREENS: PagedScreen[] = [
	{ name: 'Contacts', path: 'contacts', heading: /Contacts List/i },
	{ name: 'Lists', path: 'lists', heading: /^Lists$/i },
	{ name: 'Tags', path: 'tags', heading: /^Tags$/i },
	{ name: 'Invoices', path: 'sales/invoices', heading: /^Invoices$/i },
	{ name: 'Payments', path: 'sales/payments', heading: /^Payments$/i },
	{ name: 'Proposals', path: 'sales/proposals', heading: /^Proposals$/i },
	{ name: 'Contracts', path: 'sales/contracts', heading: /^Contracts$/i },
	{ name: 'Credit notes', path: 'sales/credit-notes', heading: /^Credit Notes$/i },
	{ name: 'Campaigns', path: 'campaigns', heading: /Email Campaigns/i },
	{ name: 'SMS campaigns', path: 'sms-campaigns', heading: /SMS Campaigns/i },
	{ name: 'Automations', path: 'automations', heading: /^Automations$/i },
	{ name: 'Forms', path: 'forms', heading: /Forms List/i },
	{ name: 'Support inbox', path: 'support', heading: /Inbox/i },
	{
		name: 'SMTP logs',
		path: 'smtp/logs',
		heading: /^Logs$/i,
		timeout: 90_000,
	},
	{
		name: 'Email sequences',
		path: 'email-sequences',
		heading: /Email Sequences/i,
	},
	{
		name: 'Link triggers',
		path: 'settings/link_triggers',
		heading: /Link Triggers List/i,
	},
	{ name: 'Team', path: 'team-managers', heading: /CRM Managers/i },
	{ name: 'Lead scoring', path: 'lead-scoring', heading: /Lead Score/i },
];

test.describe('Server-side table pagination', () => {
	for (const screen of TOP_LEVEL_SCREENS) {
		test(
			`${screen.name}: pager matches rows; page 3+ and 50/page when data allows`,
			{ timeout: screen.timeout ?? 60_000 },
			async ({ adminPage }) => {
				await adminPage.goto(
					`wp-admin/admin.php?page=doublescale&path=${screen.path}`
				);
				await waitForPagedList(adminPage, screen.heading);
				await assertServerPagination(adminPage);
			}
		);
	}
});
