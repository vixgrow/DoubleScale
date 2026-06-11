/**
 * Map contact records onto sales form fields.
 */

import type { ContactSummary } from '@/types/sales';

const asNullableString = (value: unknown): string | null => {
	if (value === null || value === undefined) {
		return null;
	}
	const text = String(value).trim();
	return text || null;
};

/** Coerce REST/search payloads onto the sales contact shape. */
export const normalizeSalesContact = (raw: unknown): ContactSummary => {
	const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	return {
		id: Number(c.id) || 0,
		email: String(c.email ?? ''),
		first_name: asNullableString(c.first_name),
		last_name: asNullableString(c.last_name),
		phone: asNullableString(c.phone),
		address_1: asNullableString(c.address_1),
		address_2: asNullableString(c.address_2),
		city: asNullableString(c.city),
		state: asNullableString(c.state),
		country: asNullableString(c.country),
		zip: asNullableString(c.zip),
	};
};

export const contactDisplayName = (c: ContactSummary): string =>
	[c.first_name, c.last_name].filter(Boolean).join(' ').trim();

export const contactStreetAddress = (c: ContactSummary): string =>
	[c.address_1, c.address_2].filter(Boolean).join('\n');

const contactCityLine = (c: ContactSummary): string => {
	const cityState = [c.city, c.state].filter(Boolean).join(', ');
	if (cityState && c.zip) {
		return `${cityState} ${c.zip}`.trim();
	}
	return cityState || c.zip || '';
};

/** Multiline billing/shipping block (Perfex-style). */
export const formatContactAddressBlock = (c: ContactSummary): string => {
	const lines: string[] = [];
	const name = contactDisplayName(c);
	if (name) {
		lines.push(name);
	}
	const street = contactStreetAddress(c);
	if (street) {
		lines.push(street);
	}
	const cityLine = contactCityLine(c);
	if (cityLine) {
		lines.push(cityLine);
	}
	if (c.country) {
		lines.push(c.country);
	}
	if (c.email) {
		lines.push(c.email);
	}
	if (c.phone) {
		lines.push(c.phone);
	}
	return lines.join('\n');
};

export interface ProposalContactFields {
	to_name: string;
	address: string;
	city: string;
	state: string;
	country: string;
	zip: string;
	email: string;
	phone: string;
}

export const proposalFieldsFromContact = (
	c: ContactSummary
): ProposalContactFields => ({
	to_name: contactDisplayName(c),
	address: contactStreetAddress(c),
	city: c.city || '',
	state: c.state || '',
	country: c.country || '',
	zip: c.zip || '',
	email: c.email || '',
	phone: c.phone || '',
});
