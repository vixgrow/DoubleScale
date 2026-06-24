/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export const DEFAULT_CONTACTS_COLUMN_VISIBILITY: Record<string, boolean> = {
	contact: true,
	created_at: true,
	lists: true,
	tags: true,
	status: true,
	phone: false,
	country: false,
	city: false,
	address_1: false,
	address_2: false,
	state: false,
	zip: false,
	total_orders: true,
	total_revenue: true,
	last_order_date: true,
	whatsapp_phone: false,
};

export function mergeContactsColumnVisibility(
	saved?: Record<string, boolean> | null
): Record<string, boolean> {
	if (!saved || typeof saved !== 'object') {
		return { ...DEFAULT_CONTACTS_COLUMN_VISIBILITY };
	}

	return {
		...DEFAULT_CONTACTS_COLUMN_VISIBILITY,
		...saved,
	};
}

export function getSavedContactsColumnVisibility(): Record<string, boolean> {
	const config = (
		typeof window !== 'undefined' ? window.doublescaleConfig : undefined
	) as { contactsListPreferences?: { column_visibility?: Record<string, boolean> } } | undefined;

	return mergeContactsColumnVisibility(
		config?.contactsListPreferences?.column_visibility
	);
}

export async function saveContactsColumnVisibility(
	visibility: Record<string, boolean>
): Promise<void> {
	await apiFetch({
		path: '/doublescale/v1/contacts/list-preferences',
		method: 'PUT',
		data: {
			column_visibility: visibility,
		},
	});

	if (typeof window !== 'undefined' && window.doublescaleConfig) {
		window.doublescaleConfig.contactsListPreferences = {
			column_visibility: visibility,
		};
	}
}
