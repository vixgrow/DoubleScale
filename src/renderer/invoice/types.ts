/**
 * Public invoice renderer config and DTOs.
 */

import type { InvoiceStatus, LineItem, OnlinePaymentGatewayStatus } from '@/types/sales';

export interface InvoiceRendererConfig {
	public_rest_url: string;
	lang: string;
	mount_id: string;
}

export interface PublicPayment {
	amount: number;
	payment_mode: string | null;
	payment_date: string | null;
	transaction_id: string | null;
}

export interface PublicInvoice {
	invoice_number: string;
	status: InvoiceStatus;
	template?: number;
	template_color?: string | null;
	invoice_date: string | null;
	due_date: string | null;
	currency: string;
	allowed_payment_modes: string[];
	discount_type: string;
	discount_value: number;
	line_items: LineItem[];
	subtotal: number;
	total_tax: number;
	adjustment: number;
	total: number;
	amount_paid: number;
	balance: number;
	is_overdue: boolean;
	can_pay: boolean;
	online_payment_gateways?: OnlinePaymentGatewayStatus[];
	billing_address: string | null;
	shipping_address: string | null;
	client_note: string | null;
	terms: string | null;
	contact: { first_name: string | null; last_name: string | null } | null;
	payments?: PublicPayment[];
}

export interface OnlinePaymentInitResponse {
	gateway?: string;
	publishable_key?: string;
	client_secret?: string;
	client_id?: string;
	order_id?: string;
	redirect_url?: string;
	already_paid?: boolean;
	invoice?: PublicInvoice;
	amount?: number;
	currency?: string;
	status?: string;
}

/** @deprecated Use OnlinePaymentInitResponse */
export type StripeInitResponse = OnlinePaymentInitResponse;

declare global {
	interface Window {
		doublescale_invoice_config?: InvoiceRendererConfig;
	}
}
