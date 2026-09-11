import { test, expect, type Page } from './fixtures';

type WpApiSettings = { root: string; nonce: string };

type WhatsAppTemplate = {
	sid?: string;
	name: string;
	settings?: {
		template_type?: string;
		variables?: unknown;
		components?: Array<{ type?: string; format?: string }>;
		buttons?: Array<{ type?: string; url?: string }>;
		header_format?: string;
	};
};

type CreatedContact = { id: number };

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

function templateIsCarousel(template: WhatsAppTemplate): boolean {
	if (
		String(template.settings?.template_type ?? '').toUpperCase() ===
		'CAROUSEL'
	) {
		return true;
	}

	return (template.settings?.components ?? []).some(
		(component) =>
			String(component?.type ?? '').toUpperCase() === 'CAROUSEL'
	);
}

function templateHasCatalogButton(template: WhatsAppTemplate): boolean {
	const buttons = template.settings?.buttons ?? [];
	return buttons.some((button) =>
		['CATALOG', 'MPM'].includes(String(button?.type ?? '').toUpperCase())
	);
}

function templateHasVariables(template: WhatsAppTemplate): boolean {
	const variables = template.settings?.variables;
	if (!variables) {
		return false;
	}
	if (Array.isArray(variables)) {
		return variables.length > 0;
	}
	return Object.keys(variables as object).length > 0;
}

function templateHasMediaHeader(template: WhatsAppTemplate): boolean {
	const format = String(template.settings?.header_format ?? '').toUpperCase();
	return ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(format);
}

function templateHasLocationHeader(template: WhatsAppTemplate): boolean {
	const stored = String(template.settings?.header_format ?? '').toUpperCase();
	if (stored === 'LOCATION') {
		return true;
	}

	return (template.settings?.components ?? []).some(
		(component) =>
			String(component?.type ?? '').toUpperCase() === 'HEADER' &&
			String(component?.format ?? '').toUpperCase() === 'LOCATION'
	);
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

function sendDialog(adminPage: Page) {
	return adminPage.locator('[data-doublescale-dialog-center]');
}

async function selectTemplate(
	adminPage: Page,
	templateName: string
): Promise<void> {
	const dialog = sendDialog(adminPage);
	const trigger = dialog.getByRole('combobox').first();
	await trigger.click();
	await adminPage.getByRole('option', { name: templateName }).click();
}

test.describe('WhatsApp template guidance', () => {
	test('shows per-template guidance and carousel send guard', async ({
		adminPage,
	}) => {
		await adminPage.goto('wp-admin/admin.php?page=doublescale');
		await expect(
			adminPage.locator('.doublescale-layout__main')
		).toBeVisible({ timeout: 45_000 });

		let templates: WhatsAppTemplate[] = [];
		try {
			const response = await restJson<{
				success: boolean;
				templates: WhatsAppTemplate[];
			}>(adminPage, 'doublescale/v1/whatsapp/templates');
			templates = response.templates ?? [];
		} catch {
			test.skip(true, 'WhatsApp templates API unavailable');
			return;
		}

		expect(
			templates.length,
			'no WhatsApp templates returned to inspect'
		).toBeGreaterThan(0);

		const stamp = Date.now();
		const contact = await restJson<CreatedContact>(
			adminPage,
			'doublescale/v1/contacts',
			{
				method: 'POST',
				body: {
					email: `e2e-wa-guidance-${stamp}@example.test`,
					first_name: 'E2E',
					last_name: 'Guidance',
					whatsapp_phone: `+1202555${String(stamp).slice(-4)}`,
				},
			}
		);

		await openSendDialog(adminPage, contact.id);

		const dialog = sendDialog(adminPage);

		const plainTemplate = templates.find(
			(template) =>
				!templateHasVariables(template) &&
				!templateHasMediaHeader(template) &&
				!templateHasLocationHeader(template) &&
				!templateHasCatalogButton(template) &&
				!templateIsCarousel(template)
		);
		if (plainTemplate) {
			await selectTemplate(adminPage, plainTemplate.name);
			await expect(
				dialog.getByTestId('whatsapp-template-guidance')
			).toContainText(/ready to send as-is/i);
		}

		const variableTemplate = templates.find((template) =>
			templateHasVariables(template)
		);
		if (variableTemplate) {
			await selectTemplate(adminPage, variableTemplate.name);
			await expect(
				dialog.getByTestId('whatsapp-template-guidance')
			).toContainText(
				/Fill in the values below|Fill in each section below/i
			);
			await expect(
				dialog.getByText(
					/Each \{\{n\}\} in the message is replaced by the value you type next to it/i
				)
			).toBeVisible();
		}

		const mediaTemplate = templates.find((template) =>
			templateHasMediaHeader(template)
		);
		if (mediaTemplate) {
			await selectTemplate(adminPage, mediaTemplate.name);
			await expect(
				dialog.getByTestId('whatsapp-header-media')
			).toBeVisible();
			await expect(
				dialog.getByText(/Paste a public image URL/i)
			).toBeVisible();
		}

		const catalogTemplate = templates.find((template) =>
			templateHasCatalogButton(template)
		);
		if (catalogTemplate) {
			await selectTemplate(adminPage, catalogTemplate.name);
			await expect(
				dialog.getByTestId('whatsapp-catalog-warning')
			).toContainText(/product catalog is connected/i);
		}

		const carouselTemplate = templates.find((template) =>
			templateIsCarousel(template)
		);
		if (carouselTemplate) {
			await selectTemplate(adminPage, carouselTemplate.name);
			await expect(
				dialog.getByTestId('whatsapp-carousel-cards')
			).toBeVisible();
			await expect(
				dialog
					.getByTestId('whatsapp-carousel-cards')
					.getByText(/Paste a public image URL for each card/i)
			).toBeVisible();
			const cardInputs = dialog
				.getByTestId('whatsapp-carousel-cards')
				.locator('input');
			await expect(cardInputs.first()).toBeVisible();
			await expect(
				dialog.getByRole('button', { name: /Send Template/i })
			).toBeDisabled();
			const count = await cardInputs.count();
			for (let i = 0; i < count; i++) {
				await cardInputs.nth(i).fill(
					`https://www.gstatic.com/webp/gallery/${i + 1}.jpg`
				);
			}
			await expect(
				dialog.getByRole('button', { name: /Send Template/i })
			).toBeEnabled();
		}
	});
});
