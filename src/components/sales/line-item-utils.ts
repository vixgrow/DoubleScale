/**
 * Shared line-item math and tax helpers.
 */

import type { LineItem } from '@/types/sales';

export const getLineItemTaxRate = (item: LineItem): number => {
	if (item.tax_rate != null && !Number.isNaN(Number(item.tax_rate))) {
		return Number(item.tax_rate);
	}
	return (item.tax || []).reduce((sum, tax) => sum + (Number(tax.rate) || 0), 0);
};

export const syncLineItemTax = (item: LineItem, taxRate: number): LineItem => {
	const rate = Math.max(0, Number(taxRate) || 0);
	if (rate <= 0) {
		return { ...item, tax_rate: 0, tax: [] };
	}
	const existing = item.tax?.[0];
	return {
		...item,
		tax_rate: rate,
		tax: [
			{
				id: existing?.id,
				name: existing?.name || 'Tax',
				rate,
			},
		],
	};
};

/** Line subtotal after per-line discount (taxable base). */
export const computeLineSubtotal = (item: LineItem): number => {
	const qty = Number(item.qty) || 0;
	const rate = Number(item.rate) || 0;
	const discount = Math.min(100, Math.max(0, Number(item.discount_percentage) || 0));
	return Math.round(qty * rate * (1 - discount / 100) * 100) / 100;
};

/** Mirrors backend TotalsCalculator: discounted qty × rate. */
export const computeAmount = (item: LineItem): number => computeLineSubtotal(item);

/** Row total including tax (exclusive). */
export const computeLineTotalWithTax = (item: LineItem): number => {
	const subtotal = computeLineSubtotal(item);
	const taxRate = getLineItemTaxRate(item);
	const tax = subtotal * (taxRate / 100);
	return Math.round((subtotal + tax) * 100) / 100;
};

export const normalizeLineItem = (item: LineItem): LineItem => {
	const taxRate = getLineItemTaxRate(item);
	return {
		...item,
		discount_percentage: Number(item.discount_percentage) || 0,
		tax_rate: taxRate,
		product_source: item.product_source || (item.product_id ? 'local' : 'custom'),
		amount: computeAmount(item),
	};
};
