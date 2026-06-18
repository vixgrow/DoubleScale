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
	draft: 'Draft',
	sent: 'Sent',
	open: 'Open',
	declined: 'Declined',
	accepted: 'Accepted',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
	draft: 'Draft',
	sent: 'Sent',
	signed: 'Signed',
	active: 'Active',
	expired: 'Expired',
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

export const OFFLINE_PAYMENT_MODES = [
	'bank_transfer',
	'cash',
	'check',
	'other',
] as const;

export type OfflinePaymentMode = (typeof OFFLINE_PAYMENT_MODES)[number];

/** Online gateway slugs — implementations register via Pro/modules. */
export const ONLINE_PAYMENT_GATEWAYS = ['stripe'] as const;

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
} as const;

export const ONLINE_PAYMENT_GATEWAY_LABELS: Record<OnlinePaymentGatewaySlug, string> = {
	stripe: 'Stripe (online)',
};

export const PAYMENT_MODE_LABELS: Record<
	PaymentMode | keyof typeof LEGACY_PAYMENT_MODE_LABELS,
	string
> = {
	...OFFLINE_PAYMENT_MODE_LABELS,
	...ONLINE_PAYMENT_GATEWAY_LABELS,
	...LEGACY_PAYMENT_MODE_LABELS,
};
