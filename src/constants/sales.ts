/**
 * Sales module frontend constants.
 */

import { __ } from '@wordpress/i18n';

export const NAMESPACE = '/doublescale/v1/sales';

export const PROPOSAL_STATUSES = [
	'draft',
	'sent',
	'open',
	'declined',
	'accepted',
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const CONTRACT_STATUSES = [
	'draft',
	'sent',
	'signed',
	'active',
	'expired',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const INVOICE_STATUSES = [
	'draft',
	'unpaid',
	'partially_paid',
	'paid',
	'overdue',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
	draft: __('Draft', 'doublescale'),
	sent: __('Sent', 'doublescale'),
	open: __('Open', 'doublescale'),
	declined: __('Declined', 'doublescale'),
	accepted: __('Accepted', 'doublescale'),
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
	draft: __('Draft', 'doublescale'),
	sent: __('Sent', 'doublescale'),
	signed: __('Signed', 'doublescale'),
	active: __('Active', 'doublescale'),
	expired: __('Expired', 'doublescale'),
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
	draft: __('Draft', 'doublescale'),
	unpaid: __('Unpaid', 'doublescale'),
	partially_paid: __('Partially Paid', 'doublescale'),
	paid: __('Paid', 'doublescale'),
	overdue: __('Overdue', 'doublescale'),
};

export const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

export const DISCOUNT_TYPES = [
	{ value: 'none', label: 'No discount' },
	{ value: 'percent', label: 'Percent (%)' },
	{ value: 'fixed', label: 'Fixed amount' },
	{ value: 'before_tax', label: 'Before Tax' },
	{ value: 'after_tax', label: 'After Tax' },
] as const;

/**
 * Whole-month shortcuts offered by the recurring-invoice dropdown. Anything
 * outside this range (days, weeks, years, longer month spans) goes through the
 * Custom option.
 */
export const MONTHLY_RECURRENCE_CHOICES = [
	1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const;

export const RECURRENCE_UNITS = [
	{ value: 'day', label: __('Day(s)', 'doublescale') },
	{ value: 'week', label: __('Week(s)', 'doublescale') },
	{ value: 'month', label: __('Month(s)', 'doublescale') },
	{ value: 'year', label: __('Year(s)', 'doublescale') },
] as const;

export const OFFLINE_PAYMENT_MODES = [
	'bank_transfer',
	'cash',
	'check',
	'other',
] as const;

export type OfflinePaymentMode = (typeof OFFLINE_PAYMENT_MODES)[number];

/** Online gateway slugs — implementations register via Pro/modules. */
export const ONLINE_PAYMENT_GATEWAYS = [
	'stripe',
	'paypal',
	'woocommerce',
	'square',
] as const;

export type OnlinePaymentGatewaySlug = (typeof ONLINE_PAYMENT_GATEWAYS)[number];

/** All modes selectable on an invoice (offline + online). */
export const PAYMENT_MODES = [
	...OFFLINE_PAYMENT_MODES,
	...ONLINE_PAYMENT_GATEWAYS,
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const OFFLINE_PAYMENT_MODE_LABELS: Record<OfflinePaymentMode, string> = {
	bank_transfer: 'Bank Transfer',
	cash: 'Cash',
	check: 'Check',
	other: 'Other',
};

/** Legacy/offline modes kept for display on existing records. */
const LEGACY_PAYMENT_MODE_LABELS = {
	credit_card: 'Credit Card',
	credit_note: 'Credit Note',
} as const;

export const ONLINE_PAYMENT_GATEWAY_LABELS: Record<OnlinePaymentGatewaySlug, string> = {
	stripe: 'Stripe (online)',
	paypal: 'PayPal (online)',
	woocommerce: 'WooCommerce Checkout (online)',
	square: 'Square (online)',
};

export const PAYMENT_MODE_LABELS: Record<
	PaymentMode | keyof typeof LEGACY_PAYMENT_MODE_LABELS,
	string
> = {
	...OFFLINE_PAYMENT_MODE_LABELS,
	...ONLINE_PAYMENT_GATEWAY_LABELS,
	...LEGACY_PAYMENT_MODE_LABELS,
};
