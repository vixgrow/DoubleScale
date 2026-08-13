/**
 * When a proposal/invoice is opened from a contact tab, `from` records that
 * tab so Close returns there instead of the standalone Sales list.
 */

import { __ } from '@wordpress/i18n';
import { getToLink } from '@doublescale/navigation';

const CONTACT_SALES_FROM_RE = /^contacts\/\d+\/(proposals|invoices)$/;

export function parseContactSalesFrom(search: string): string | null {
	const from = new URLSearchParams(search).get('from');
	if (from && CONTACT_SALES_FROM_RE.test(from)) {
		return from;
	}
	return null;
}

export function getSalesViewClosePath(search: string, fallback: string): string {
	return parseContactSalesFrom(search) ?? fallback;
}

export function salesViewLink(path: string, search: string): string {
	const from = parseContactSalesFrom(search);
	return getToLink(path, from ? { from } : undefined);
}

export function contactSalesBreadcrumb(
	search: string,
	listFallback: { label: string; href: string },
	detailsLabel: string
): Array<{ label: string; href?: string }> {
	const from = parseContactSalesFrom(search);
	if (!from) {
		return [listFallback, { label: detailsLabel }];
	}

	const isInvoices = from.endsWith('/invoices');
	return [
		{
			label: isInvoices
				? __('Invoices', 'doublescale')
				: __('Proposals', 'doublescale'),
			href: from,
		},
		{ label: detailsLabel },
	];
}
