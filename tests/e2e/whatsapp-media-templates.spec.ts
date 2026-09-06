import { test, expect } from './fixtures';

/**
 * WhatsApp media-header templates (bug #82).
 *
 * A template approved with an IMAGE/VIDEO/DOCUMENT header must be sent with a
 * matching header component, or Meta rejects the message (error 132000) and the
 * recipient never receives it.
 *
 * The fix is server-side — the admin UI has no media picker — so these specs
 * assert what a browser can genuinely observe:
 *
 *   1. the WhatsApp-facing admin surfaces still load after the change, and
 *   2. any template exposing a media header also exposes its media, which is
 *      the pairing bug #82 was missing.
 *
 * The send itself needs live Meta credentials, so it is covered by PHPUnit.
 */

test.describe('WhatsApp media templates', () => {
	test('contacts screen loads', async ({ adminPage }) => {
		await adminPage.goto(
			'wp-admin/admin.php?page=doublescale&path=contacts'
		);

		await expect(
			adminPage
				.getByRole('heading', { level: 1, name: /Contacts/i })
				.first()
		).toBeVisible({ timeout: 45_000 });
	});

	test('integrations screen mentions WhatsApp', async ({ adminPage }) => {
		await adminPage.goto(
			'wp-admin/admin.php?page=doublescale&path=settings/integrations'
		);

		await expect(adminPage.getByText(/WhatsApp/i).first()).toBeVisible({
			timeout: 45_000,
		});
	});

	test('a media-header template always carries its media', async ({
		adminPage,
	}) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale');

		const result = await adminPage.evaluate(async () => {
			const settings = (
				window as unknown as {
					wpApiSettings?: { root: string; nonce: string };
				}
			).wpApiSettings;

			if (!settings?.root) {
				return { unavailable: true };
			}

			const res = await fetch(
				`${settings.root}doublescale/v1/templates?type=whatsapp&per_page=50`,
				{
					headers: { 'X-WP-Nonce': settings.nonce },
					credentials: 'same-origin',
				}
			);

			if (!res.ok) {
				return { status: res.status };
			}

			return { body: await res.json() };
		});

		// A route or auth failure is a real signal — fail rather than skip.
		expect(result).not.toHaveProperty('status');

		if (result.unavailable) {
			test.skip(true, 'wpApiSettings not exposed on this screen');
			return;
		}

		const body = result.body as { templates?: unknown };
		const rows = (body?.templates ?? []) as Array<{
			name?: string;
			settings?: Record<string, unknown>;
		}>;

		// The endpoint envelope is `{ templates: [...] }`. Assert we actually got
		// rows: an empty list would make the loop below vacuously pass and hide
		// exactly the defect this test exists to catch.
		expect(
			rows.length,
			'no WhatsApp templates returned to inspect'
		).toBeGreaterThan(0);

		for (const row of rows) {
			const templateSettings = row?.settings ?? {};
			const format = templateSettings.header_format as string | undefined;

			if (format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(format)) {
				expect(
					templateSettings.header_media,
					`template "${row?.name}" declares a ${format} header but carries no media`
				).toBeTruthy();
			}
		}
	});
});
