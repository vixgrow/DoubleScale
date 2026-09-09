import { test, expect, type Page } from './fixtures';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

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

function writeTempCsv(
	rows: string[],
	header = 'first_name,last_name,email'
): string {
	const file = path.join(
		os.tmpdir(),
		`ds-e2e-import-${Date.now()}-${Math.random().toString(36).slice(2)}.csv`
	);
	fs.writeFileSync(file, [header, ...rows].join('\n'), 'utf8');
	return file;
}

async function openCsvMappingStep(adminPage: Page, csvPath: string): Promise<void> {
	await adminPage.goto('wp-admin/admin.php?page=doublescale&path=contacts');
	await waitForAdminShell(adminPage);
	await expect(
		adminPage.getByRole('heading', { name: /Contacts List/i })
	).toBeVisible({ timeout: 45_000 });

	const importBtn = adminPage.getByRole('button', { name: /Import Contact/i });
	await expect(importBtn).toBeVisible();
	await importBtn.click();

	await expect(adminPage.locator('[role="dialog"]').first()).toBeVisible({
		timeout: 10_000,
	});

	await adminPage.getByRole('heading', { name: /^Csv$/i }).click();
	await adminPage.getByRole('button', { name: /^Continue$/i }).click();

	await expect(
		adminPage.getByText(/Select CSV file to import/i)
	).toBeVisible({ timeout: 15_000 });

	await adminPage.setInputFiles('input[type="file"][accept=".csv"]', csvPath);

	await expect(adminPage.getByText(/^Completed$/i)).toBeVisible({
		timeout: 20_000,
	});

	await adminPage.getByRole('button', { name: /Next Step/i }).click();

	await expect(
		adminPage.getByRole('heading', { name: /Mapping the file/i })
	).toBeVisible({ timeout: 15_000 });
}

async function mapCsvColumn(
	adminPage: Page,
	column: string,
	contactField: string
): Promise<void> {
	const row = adminPage
		.locator('.contact-mapped-fields-csv-rows > div')
		.filter({ has: adminPage.locator(`input[value="${column}"]`) });
	await row.locator('.react-select-container').click();
	await adminPage
		.locator('.react-select__option')
		.filter({ hasText: new RegExp(`^${contactField}$`) })
		.click();
}

test.describe('Contact CSV import', () => {
	test.setTimeout(90_000);
	test('shows a timeout explanation instead of the stock JSON error', async ({
		adminPage,
	}) => {
		const stamp = Date.now();
		const csvPath = writeTempCsv([
			`Ada,Lovelace,e2e-import-json-${stamp}@example.test`,
		]);

		await openCsvMappingStep(adminPage, csvPath);
		await mapCsvColumn(adminPage, 'first_name', 'First Name');
		await mapCsvColumn(adminPage, 'last_name', 'Last Name');
		await mapCsvColumn(adminPage, 'email', 'Email');

		await adminPage.route('**/doublescale/v1/import-export/import**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: '<html><body>Gateway Timeout</body></html>',
			});
		});

		await adminPage.getByRole('button', { name: /Import contacts/i }).click();

		const notice = adminPage.locator('.doublescale-notices, .components-snackbar');
		await expect(notice.getByText(/timed out|timeout or crash/i)).toBeVisible({
			timeout: 25_000,
		});
		await expect(notice.getByText(/not a valid JSON response/i)).toHaveCount(0);

		fs.unlinkSync(csvPath);
	});

	test('imports a small CSV through the mapping wizard', async ({ adminPage }) => {
		const stamp = Date.now();
		const email = `e2e-import-ok-${stamp}@example.test`;
		const csvPath = writeTempCsv([`Ada,Lovelace,${email}`]);

		await openCsvMappingStep(adminPage, csvPath);
		await mapCsvColumn(adminPage, 'first_name', 'First Name');
		await mapCsvColumn(adminPage, 'last_name', 'Last Name');
		await mapCsvColumn(adminPage, 'email', 'Email');

		await adminPage.getByRole('button', { name: /Import contacts/i }).click();

		await expect(adminPage.getByText('Import Completed!').first()).toBeVisible({
			timeout: 45_000,
		});
		await expect(adminPage.getByText(/1 of 1 contacts processed/i)).toBeVisible();

		fs.unlinkSync(csvPath);
	});

	test('imports a CSV that has phone numbers and no email column', async ({
		adminPage,
	}) => {
		const stamp = Date.now();
		const phone = `+1555${String(stamp).slice(-7)}`;
		const csvPath = writeTempCsv(
			[`Ada,Lovelace,${phone}`],
			'first_name,last_name,phone'
		);

		await openCsvMappingStep(adminPage, csvPath);
		await mapCsvColumn(adminPage, 'first_name', 'First Name');
		await mapCsvColumn(adminPage, 'last_name', 'Last Name');
		await mapCsvColumn(adminPage, 'phone', 'Phone');

		await adminPage.getByRole('button', { name: /Import contacts/i }).click();

		await expect(adminPage.getByText('Import Completed!').first()).toBeVisible({
			timeout: 45_000,
		});
		await expect(adminPage.getByText(/1 of 1 contacts processed/i)).toBeVisible();

		fs.unlinkSync(csvPath);
	});
});
