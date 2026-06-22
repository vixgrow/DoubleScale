/**
 * REST DTO shapes for the sales module.
 */

import type { InvoiceStatus, ProposalStatus, ContractStatus } from '@/constants/sales';

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

export interface ContractType {
	id: number;
	name: string;
}

export interface ContractAttachment {
	id: number;
	file_hash: string;
	file_name: string;
	file_size: number;
	file_type: string;
	created_at: string | null;
	uploaded_by: string | null;
	url: string;
}

export interface ContractAttachmentLimits {
	max_file_size_mb: number;
	max_file_size_bytes: number;
	max_file_count: number;
}

export interface ProposalSignature {
	signed_name: string | null;
	signature: string;
	accepted_at: string | null;
	signed_ip: string | null;
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
	// Derived (qty * rate) for display; not persisted on the stored line item.
	// Use computeAmount() rather than reading this directly.
	amount?: number;
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
	sent_at?: string | null;
	viewed_at?: string | null;
	accepted_at?: string | null;
	declined_at?: string | null;
	decline_reason?: string | null;
	public_url?: string | null;
	is_expired?: boolean;
	invoice_id?: number | null;
	signed_name?: string | null;
	has_signature?: boolean;
	created_at: string | null;
	updated_at: string | null;
	contact?: ContactSummary | null;
	assigned_user?: UserSummary | null;
}

export interface Contract {
	id: number;
	contract_number: string;
	hash: string;
	subject: string;
	status: ContractStatus;
	contact_id: number;
	assigned_user_id: number | null;
	contract_type_id: number | null;
	contract_value: number;
	currency: string;
	start_date: string | null;
	end_date: string | null;
	description: string;
	tag_ids: number[];
	hide_from_customer: boolean;
	is_trash: boolean;
	sent_at?: string | null;
	viewed_at?: string | null;
	signed_name?: string | null;
	signed_at?: string | null;
	has_signature?: boolean;
	is_expired?: boolean;
	is_about_to_expire?: boolean;
	public_url?: string | null;
	created_at: string | null;
	updated_at: string | null;
	contact?: ContactSummary | null;
	assigned_user?: UserSummary | null;
	contract_type?: ContractType | null;
}

export interface ContractSignature {
	signed_name: string | null;
	signature: string;
	signed_at: string | null;
	signed_ip: string | null;
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

export interface OnlinePaymentGatewayStatus {
	slug: string;
	name: string;
	description?: string;
	available: boolean;
	configured: boolean;
	enabled_for_sales?: boolean;
	ready?: boolean;
	integration_url?: string;
	can_pay?: boolean;
}

export interface InvoiceOnlineInitResponse {
	gateway?: string;
	publishable_key: string;
	client_secret?: string;
	already_paid?: boolean;
	invoice?: Invoice;
	amount?: number;
	currency?: string;
	pi_status?: string;
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
	sent_at?: string | null;
	viewed_at?: string | null;
	public_url?: string | null;
	balance?: number;
	is_overdue?: boolean;
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

export interface PaymentListItem extends ContactInvoicePayment {
	contact?: ContactSummary | null;
}

export interface PaymentDetail extends PaymentListItem {
	company?: {
		name: string;
		url: string;
		address: string;
	};
	invoice?: {
		id: number;
		invoice_number: string;
		currency: string;
		invoice_date?: string | null;
		total?: number;
		amount_paid?: number;
		billing_address?: string | null;
	};
}

export interface PaymentFilters {
	search?: string;
	sort_by?: string;
	sort_order?: 'asc' | 'desc';
	per_page?: number;
	page?: number;
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

export interface ContractFilters {
	status?: string;
	contact_id?: number;
	contract_type_id?: number;
	is_trash?: boolean;
	search?: string;
	sort_by?: string;
	sort_order?: 'asc' | 'desc';
	per_page?: number;
	page?: number;
}

export interface ContractSummaryByType {
	contract_type_id: number | null;
	name: string;
	count: number;
	value_total: number;
}

export interface ContractSummary {
	active_count: number;
	expired_count: number;
	about_to_expire_count: number;
	recently_added_count: number;
	trash_count: number;
	total_count: number;
	by_status: Record<
		string,
		{ count: number; amount: number; percent: number }
	>;
	by_type: ContractSummaryByType[];
}

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

export type CreateContractPayload = Partial<
	Omit<Contract, 'id' | 'contract_number' | 'hash' | 'created_at' | 'updated_at'>
> & { contact_id: number };

export type CreateInvoicePayload = Partial<
	Omit<Invoice, 'id' | 'invoice_number' | 'hash' | 'created_at' | 'updated_at'>
> & { contact_id: number };

export interface SalesRepNotificationTemplate {
	title: string;
	message: string;
}

export interface SalesSettings {
	proposal_email_subject: string;
	proposal_email_intro: string;
	invoice_email_subject: string;
	invoice_email_intro: string;
	credit_note_email_subject: string;
	credit_note_email_intro: string;
	contract_email_subject: string;
	contract_email_intro: string;
	contract_signed_email_subject: string;
	contract_signed_email_intro: string;
	proposal_expiry_reminder_days: number;
	require_signature_on_accept: boolean;
	enabled_online_gateways: string[];
	default_offline_payment_modes: string[];
	default_online_payment_gateways: string[];
	rep_notification_templates?: Record<string, SalesRepNotificationTemplate>;
	pdf_company_address?: string;
}
