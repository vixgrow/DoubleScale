import { test, expect, type Page } from './fixtures';

type WpApiSettings = { root: string; nonce: string };

type CreatedContact = { id: number };

const LOCATION_TEMPLATE = {
	sid: 'e2e_map_location:en_US',
	name: 'E2E Map Location (EN)',
	body: 'Meet us here.',
	language: 'en_US',
	category: 'UTILITY',
	settings: {
		header_format: 'LOCATION',
		components: [
			{ type: 'HEADER', format: 'LOCATION' },
			{ type: 'BODY', text: 'Meet us here.' },
		],
	},
};

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
					body:
						body === undefined ? undefined : JSON.stringify(body),
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

function sendDialog(adminPage: Page) {
	return adminPage.locator('[data-doublescale-dialog-center]');
}

async function stubLocationTemplateApis(adminPage: Page): Promise<{
	getLastSendBody: () => Promise<Record<string, unknown> | null>;
}> {
	let lastSendBody: Record<string, unknown> | null = null;

	await adminPage.route(
		'**/doublescale/v1/whatsapp/conversation-window/**',
		async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					window: {
						active: false,
						expires_at: null,
						minutes_left: 0,
						last_inbound: null,
						reason: null,
					},
				}),
			});
		}
	);

	await adminPage.route('**/doublescale/v1/whatsapp/templates**', async (route) => {
		const url = route.request().url();
		const method = route.request().method();

		if (url.includes('/templates/save') && method === 'POST') {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					template_id: 999001,
				}),
			});
			return;
		}

		if (method === 'GET') {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					templates: [LOCATION_TEMPLATE],
				}),
			});
			return;
		}

		await route.continue();
	});

	await adminPage.route(
		'**/doublescale/v1/contacts/**/send-message**',
		async (route) => {
			if (route.request().method() !== 'POST') {
				await route.continue();
				return;
			}

			lastSendBody = route.request().postDataJSON() as Record<
				string,
				unknown
			>;

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					message: 'WhatsApp sent successfully',
				}),
			});
		}
	);

	return {
		getLastSendBody: async () => lastSendBody,
	};
}

async function openSendDialog(
	adminPage: Page,
	contactId: number
): Promise<void> {
	await adminPage.goto(
		`wp-admin/admin.php?page=doublescale&path=contacts/${contactId}&tab=whatsapp`
	);

	const sendButton = adminPage.getByRole('button', {
		name: /Send Whatsapp Message/i,
	});

	await expect(sendButton).toBeVisible({ timeout: 45_000 });
	await sendButton.click();
	await expect(adminPage.locator('[data-doublescale-dialog-center]')).toBeVisible(
		{
			timeout: 15_000,
		}
	);
}

test.describe('WhatsApp location templates', () => {
	test('asks for latitude and longitude and sends them as header_media', async ({
		adminPage,
	}) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale');
		await expect(
			adminPage.locator('.doublescale-layout__main')
		).toBeVisible({ timeout: 45_000 });

		const stamp = Date.now();
		const contact = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					email: `e2e-wa-location-${stamp}@example.test`,
					first_name: 'E2E',
					last_name: 'Location',
					whatsapp_phone: `+1202555${String(stamp).slice(-4)}`,
				},
			}
		);

		const { getLastSendBody } = await stubLocationTemplateApis(adminPage);

		await openSendDialog(adminPage, contact.id);

		const dialog = sendDialog(adminPage);
		const templateTrigger = dialog.getByRole('combobox').first();
		await expect(templateTrigger).toBeVisible({ timeout: 15_000 });
		await templateTrigger.click();
		await adminPage
			.getByRole('option', { name: LOCATION_TEMPLATE.name })
			.click();

		const locationFields = dialog.getByTestId('whatsapp-location-header');
		await expect(locationFields).toBeVisible();
		await expect(
			dialog.getByTestId('whatsapp-template-guidance')
		).toContainText(/latitude and longitude/i);
		await expect(locationFields.getByLabel(/^latitude$/i)).toBeVisible();
		await expect(locationFields.getByLabel(/^longitude$/i)).toBeVisible();

		await dialog.getByRole('button', { name: /Send Template/i }).click();
		await expect(
			dialog.getByText(
				/needs a latitude and longitude before it can be sent/i
			)
		).toBeVisible();
		expect(await getLastSendBody()).toBeNull();

		await locationFields.getByLabel(/^latitude$/i).fill('37.483307');
		await locationFields.getByLabel(/^longitude$/i).fill('-122.148981');
		await locationFields.getByLabel(/^place name/i).fill('Head office');
		await locationFields.getByLabel(/^address/i).fill('1 Hacker Way');

		await dialog.getByRole('button', { name: /Send Template/i }).click();

		await expect
			.poll(async () => getLastSendBody(), { timeout: 10_000 })
			.not.toBeNull();

		const sent = (await getLastSendBody()) as {
			header_media?: Record<string, string>;
		};
		expect(sent.header_media).toMatchObject({
			type: 'location',
			latitude: '37.483307',
			longitude: '-122.148981',
			name: 'Head office',
			address: '1 Hacker Way',
		});
	});
});
