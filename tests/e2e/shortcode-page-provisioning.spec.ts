import { test, expect } from './fixtures';

/**
 * Shortcode pages must exist before any customer-facing document is sent.
 *
 * Every public surface (proposal, invoice, support portal, booking, plus Pro's
 * credit note / project / contract) renders through a shortcode that has to
 * live on a published page. Without that page the matching `*Url` service
 * resolves to an empty string, so "Send proposal" mails a link to nowhere —
 * silently, with no admin-visible error. These tests assert the pages are
 * provisioned automatically on a normal admin load, which is what fires the
 * `admin_init` provisioning pass.
 */

/**
 * Shortcodes the free plugin provisions a page for.
 *
 * Asserted by shortcode rather than by page title: a page the admin built by
 * hand is adopted keeping its own title ("Doublescale Proposal",
 * "DoubleScaleSupport"), so only the embedded shortcode is a stable contract.
 */
const FREE_SHORTCODES = [
	'doublescale_proposal',
	'doublescale_invoice',
	'doublescale_support_portal',
	'doublescale_booking',
	'doublescale_client_portal',
];

/** Titles the provisioner itself uses when it has to create a page. */
const CREATED_TITLES = [
	'proposal',
	'invoice',
	'support portal',
	'book a meeting',
	'client portal',
];

test.describe('shortcode page provisioning', () => {
	test('the booking page is created automatically', async ({ adminPage }) => {
		// A normal admin load fires `admin_init`, and with it the one-time pass.
		await adminPage.goto('wp-admin/edit.php?post_type=page');

		const rows = adminPage.locator('#the-list tr');
		await expect(rows.first()).toBeVisible();

		const titles = (await rows.locator('a.row-title').allInnerTexts()).map(
			(t) => t.trim().toLowerCase()
		);

		expect(
			titles.length,
			'Page list must be non-empty, or the assertions below pass vacuously.'
		).toBeGreaterThan(0);

		// This is the page the feature actually had to create: before the change
		// no page hosted `[doublescale_booking]` at all.
		expect(titles).toContain('book a meeting');
	});

	test('every customer-facing surface has a page hosting its shortcode', async ({
		adminPage,
	}) => {
		// Load the admin once so the provisioning pass has run.
		await adminPage.goto('wp-admin/edit.php?post_type=page');

		// Search the page list per shortcode: WordPress's built-in search covers
		// post_content, so a hit means some page actually embeds that shortcode —
		// which is exactly what the URL resolver looks for.
		const missing: string[] = [];

		for (const shortcode of FREE_SHORTCODES) {
			await adminPage.goto(
				`wp-admin/edit.php?post_type=page&s=${encodeURIComponent(shortcode)}`
			);

			const rowTitles = adminPage.locator('#the-list tr a.row-title');
			const hits = await rowTitles.count();

			if (hits === 0) {
				missing.push(shortcode);
			}
		}

		expect(missing, `No page hosts: ${missing.join(', ')}`).toEqual([]);
	});

	test('provisioning adopts existing pages instead of duplicating them', async ({
		adminPage,
	}) => {
		await adminPage.goto(
			'wp-admin/edit.php?post_type=page&posts_per_page=100'
		);

		const rows = adminPage.locator('#the-list tr');
		await expect(rows.first()).toBeVisible();

		const titles = (await rows.locator('a.row-title').allInnerTexts()).map(
			(t) => t.trim().toLowerCase()
		);

		expect(
			titles.length,
			'Page list must be non-empty, or the duplicate check is vacuous.'
		).toBeGreaterThan(0);

		// The provisioner adopts a page that already embeds the shortcode rather
		// than creating a second one, so its own titles must never appear twice.
		for (const provisioned of CREATED_TITLES) {
			const occurrences = titles.filter(
				(title) => title === provisioned
			).length;
			expect(
				occurrences,
				`Duplicate page created for "${provisioned}"`
			).toBeLessThan(2);
		}
	});
});
