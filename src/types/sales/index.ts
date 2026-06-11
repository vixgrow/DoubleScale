/**
 * REST DTO shapes for the sales module.
 */

import type { InvoiceStatus, ProposalStatus } from '@/constants/sales';

export interface ContactSummary {
	id: number;
	email: string;
	first_name: string | null;
	last_name: string | null;
	phone?: string | null;
	address_1?: string | null;
	address_2?: string | null;
	city?: string | null;
	state?: string | null;
	country?: string | null;
	zip?: string | null;
}

export interface UserSummary {
	id: number;
	display_name: string;
	email: string;
}

export interface SalesAssignableUser {
	id: number;
	display_name: string;
	email: string;
}

export interface SalesTax {
	id: number;
	name: string;
	rate: number;
}

export interface LineItemTax {
	id?: number;
	name: string;
	rate: number;
}

export interface LineItem {
	description: string;
	long_description?: string;
	qty: number;
	unit?: string;
	rate: number;
	tax?: LineItemTax[];
	amount: number;
	optional?: boolean;
}

export interface Proposal {
	id: number;
	proposal_number: string;
	hash: string;
	subject: string;
	status: ProposalStatus;
	contact_id: number;
	assigned_user_id: number | null;
	date: string | null;
	open_till: string | null;
	currency: string;
	discount_type: string;
	discount_value: number;
	tag_ids: number[];
		line_items: LineItem[];
		subtotal: number;
		adjustment: number;
		total: number;
		to_name: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	zip: string | null;
	email: string | null;
	phone: string | null;
	allow_comments: boolean;
	sent_at?: string | null;
	accepted_at?: string | null;
	declined_at?: string | null;
	decline_reason?: string | null;
	public_url?: string | null;
	is_expired?: boolean;
	invoice_id?: number | null;
	created_at: string | null;
	updated_at: string | null;
	contact?: ContactSummary | null;
	assigned_user?: UserSummary | null;
}

export interface InvoicePayment {
	id: number;
	invoice_id: number;
	amount: number;
	payment_mode: string | null;
	payment_date: string | null;
	transaction_id: string | null;
	note: string | null;
	recorded_by_user_id: number | null;
	created_at: string | null;
	updated_at: string | null;
	recorded_by?: UserSummary | null;
}

export interface RecordPaymentPayload {
	amount: number;
	payment_mode?: string;
	payment_date?: string;
	transaction_id?: string;
	note?: string;
}

export interface ConvertProposalResponse {
	invoice: Invoice;
	proposal: Proposal;
}

export interface Invoice {
	id: number;
	invoice_number: string;
	hash: string;
	status: InvoiceStatus;
	contact_id: number;
	proposal_id?: number | null;
	sale_agent_user_id: number | null;
	invoice_date: string | null;
	due_date: string | null;
	currency: string;
	allowed_payment_modes: string[];
	discount_type: string;
	discount_value: number;
	tag_ids: number[];
		line_items: LineItem[];
		subtotal: number;
		total_tax: number;
	adjustment: number;
	total: number;
	amount_paid: number;
	billing_address: string | null;
	shipping_address: string | null;
	client_note: string | null;
	terms: string | null;
	created_at: string | null;
	updated_at: string | null;
	contact?: ContactSummary | null;
	sale_agent?: UserSummary | null;
	proposal?: {
		id: number;
		proposal_number: string;
		subject: string;
	} | null;
}

export interface ContactInvoicePayment extends InvoicePayment {
	invoice?: {
		id: number;
		invoice_number: string;
		currency: string;
	};
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		total: number;
		per_page: number;
		current_page: number;
		last_page: number;
	};
}

export interface ProposalFilters {
	status?: string;
	contact_id?: number;
	search?: string;
	sort_by?: string;
	sort_order?: 'asc' | 'desc';
	per_page?: number;
	page?: number;
}

export interface InvoiceFilters extends ProposalFilters {}

export interface InvoiceSummary {
	paid_total: number;
	outstanding_total: number;
	overdue_total: number;
	total_count: number;
	by_status: Record<
		string,
		{ count: number; amount: number; percent: number }
	>;
}

export type CreateProposalPayload = Partial<
	Omit<Proposal, 'id' | 'proposal_number' | 'hash' | 'created_at' | 'updated_at'>
> & { contact_id: number };

export type CreateInvoicePayload = Partial<
	Omit<Invoice, 'id' | 'invoice_number' | 'hash' | 'created_at' | 'updated_at'>
> & { contact_id: number };
