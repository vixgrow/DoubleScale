/**
 * Company / From block for document templates (name, address, logo).
 */

import { __ } from '@wordpress/i18n';

import type { DocumentDesignParty } from './designs/types';

export type BusinessBranding = {
	business_name?: string;
	business_address?: string;
	business_logo?: string;
};

const splitAddressLines = (address: string): string[] =>
	String(address)
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

/**
 * Read business branding from the admin or public bootstrap config.
 */
export const getBusinessBranding = (): BusinessBranding => {
	if (typeof window === 'undefined') {
		return {};
	}

	const cfg = window.doublescaleConfig as
		| {
				business?: BusinessBranding;
				initialPayload?: { business?: BusinessBranding };
				blogName?: string;
		  }
		| undefined;

	return (
		cfg?.business ||
		cfg?.initialPayload?.business ||
		{}
	);
};

export const getCompanyFrom = (): DocumentDesignParty => {
	const cfg =
		typeof window !== 'undefined' ? window.doublescaleConfig : undefined;
	const business = getBusinessBranding();
	const name =
		business.business_name ||
		(cfg?.blogName as string | undefined) ||
		'';
	const lines = [name].filter(Boolean) as string[];

	if (business.business_address) {
		lines.push(...splitAddressLines(business.business_address));
	}

	const logoUrl = business.business_logo?.trim() || undefined;

	return {
		label: __('From', 'doublescale'),
		lines: lines.length ? lines : [__('Your Company', 'doublescale')],
		logoUrl,
	};
};
