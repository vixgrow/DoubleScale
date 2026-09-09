import { test, expect, type Browser } from '@playwright/test';
import path from 'node:path';
import {
	createEventViaWizard,
	deleteWizardEvent,
	deriveEventSlugs,
	e2eName,
	fillPublicBookingForm,
	pickAvailableSlot,
	publicEventUrl,
} from './booking-public-helpers';

const ADMIN_AUTH = path.resolve(__dirname, '.auth/admin.json');
let seededEventId: number | null = null;
let seededUrl = '';

test.beforeAll(async ({ browser }: { browser: Browser }) => {
	const context = await browser.newContext({ storageState: ADMIN_AUTH });
	const page = await context.newPage();
	const name = e2eName('E2E-Embed');
	seededEventId = await createEventViaWizard(page, name);
	const { eventSlug, calendarSlug } = deriveEventSlugs(seededEventId);
	seededUrl = publicEventUrl(calendarSlug, eventSlug, 'embed_type=Inline');
	await context.close();
});

test.afterAll(async () => {
	if (seededEventId) deleteWizardEvent(seededEventId);
});

test.describe('Booking inline embed', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('embed_type=Inline shows inline confirmation instead of redirecting', async ({
		page,
	}) => {
		test.setTimeout(120_000);
		if (!seededUrl) test.skip(true, 'Wizard event was not seeded.');

		await page.goto(seededUrl);
		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({ timeout: 45_000 });
		await pickAvailableSlot(page);

		const who = e2eName('E2E-Embed');
		await fillPublicBookingForm(page, who, `${who}@example.test`);

		const bookingResponse = page.waitForResponse(
			(r) =>
				r.url().includes('admin-ajax.php') &&
				r.request().postData()?.includes('doublescale_booking_booking') === true,
			{ timeout: 45_000 }
		);
		await page.locator('.schedule-btn').first().click();
		expect((await (await bookingResponse).json()).success).toBe(true);

		await expect(page.getByText(/Booking Confirmed!|Your meeting has been Scheduled/i)).toBeVisible({
			timeout: 30_000,
		});
		expect(page.url()).not.toMatch(/type=confirm/);
	});
});
