/**
 * Sales module frontend constants.
 */

export const NAMESPACE = '/doublescale/v1/sales';

export const PROPOSAL_STATUSES = [
	'draft',
	'sent',
	'open',
	'declined',
	'accepted',
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const INVOICE_STATUSES = [
	'draft',
	'unpaid',
	'partially_paid',
	'paid',
	'overdue',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
	draft: 'Draft',
	sent: 'Sent',
	open: 'Open',
	declined: 'Declined',
	accepted: 'Accepted',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
	draft: 'Draft',
	unpaid: 'Unpaid',
	partially_paid: 'Partially Paid',
	paid: 'Paid',
	overdue: 'Overdue',
};

export const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

export const DISCOUNT_TYPES = [
	{ value: 'none', label: 'No discount' },
	{ value: 'percent', label: 'Percent (%)' },
	{ value: 'fixed', label: 'Fixed amount' },
	{ value: 'before_tax', label: 'Before Tax' },
	{ value: 'after_tax', label: 'After Tax' },
] as const;

export const PAYMENT_MODES = [
	'bank_transfer',
	'cash',
	'check',
	'credit_card',
	'paypal',
	'stripe',
	'other',
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
	bank_transfer: 'Bank Transfer',
	cash: 'Cash',
	check: 'Check',
	credit_card: 'Credit Card',
	paypal: 'PayPal',
	stripe: 'Stripe',
	other: 'Other',
};
