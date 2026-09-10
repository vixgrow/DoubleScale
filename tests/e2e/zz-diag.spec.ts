import { test, expect } from './fixtures';

test('diagnose banner on real page', async ({ adminPage }) => {
  test.setTimeout(120_000);
  const errs: string[] = [];
  adminPage.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  adminPage.on('console', m => { if (m.type()==='error') errs.push('CONSOLE: ' + m.text().slice(0,200)); });

  await adminPage.goto('wp-admin/admin.php?page=doublescale&path=contacts');
  await expect(adminPage.getByRole('heading',{name:/Contacts List/i})).toBeVisible({timeout:45000});

  // Exactly what the user does: search BulkTest
  await adminPage.getByPlaceholder(/Search contacts/i).fill('BulkTest');
  await expect(adminPage.getByRole('table').locator('tbody tr').first()).toBeVisible({timeout:20000});
  await adminPage.waitForTimeout(1500);

  const rows = await adminPage.getByRole('table').locator('tbody tr').count();
  console.log('ROWS ON PAGE:', rows);

  // banner before clicking anything
  console.log('BANNER BEFORE CLICK:', await adminPage.getByTestId('contacts-select-all-banner').count());

  const header = adminPage.getByRole('table').getByRole('checkbox',{name:/Select all/i});
  console.log('HEADER CHECKBOX COUNT:', await header.count());
  await header.click();
  await adminPage.waitForTimeout(1500);

  const banner = adminPage.getByTestId('contacts-select-all-banner');
  console.log('BANNER AFTER CLICK:', await banner.count());
  if (await banner.count()) {
    console.log('BANNER TEXT:', JSON.stringify(await banner.innerText()));
  }
  console.log('BODY CONTAINS "Select all":', (await adminPage.locator('body').innerText()).includes('Select all'));
  console.log('ERRORS:', errs.length ? errs.slice(0,5) : 'none');
});
