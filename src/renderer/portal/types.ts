/**
 * Client Portal renderer types. The renderer config is a superset of the
 * support PortalConfig: the Portal handler localizes the shared REST root +
 * nonce and the portal namespace, and the Support module injects the support
 * REST bases + uploader settings via the `doublescale_client_portal_config`
 * filter (so the reused ticket views work unchanged).
 */

import type { CalendarEvent, CalendarEventKind } from '@doublescale/shared/calendar';

export interface PortalUser {
	id: number;
	email: string;
	display_name: string;
	avatar?: string;
}

export interface PortalRendererConfig {
	rest_root: string;
	nonce: string;
	portal_rest_url: string;
	user: PortalUser;
	lang: string;
	mount_id: string;
	is_guest?: boolean;
	guest_hash?: string;
	/** First day of week for calendars (0 = Sunday … 6 = Saturday). */
	calendarWeekStartsOn?: number;
	/** True when the Credit Notes sales child module toggle is on. */
	credit_notes_module_enabled?: boolean;
	/** True when DoubleScale Pro is active and credit notes are available. */
	credit_notes_pro_active?: boolean;
	/** True when DoubleScale Pro is active and invoices/payments are available. */
	invoices_payments_pro_active?: boolean;
	/** True when the Contracts sales child module toggle is on. */
	contracts_module_enabled?: boolean;
	/** True when DoubleScale Pro is active and contracts are available. */
	contracts_pro_active?: boolean;
	/** Public REST base for credit note hash lookups (Pro). */
	credit_note_public_rest_url?: string;
	/** Mailbox scope for the Tickets section (from the shortcode `box_id`). */
	box_id?: number;
	/** Injected by the Support module for the reused ticket views. */
	rest_url?: string;
	public_rest_url?: string;
	custom_fields_enabled?: boolean;
	attachment_limits?: unknown;
}

export interface PortalSection {
	slug: string;
	label: string;
	icon: string;
	order: number;
	badge: number;
}

export interface PortalIdentity {
	name: string;
	email: string;
	avatar: string;
	has_contact: boolean;
}

export interface PortalSummaryCard {
	key: string;
	label: string;
	value: string | number;
	route?: string;
}

export interface PortalBootstrap {
	identity: PortalIdentity;
	sections: PortalSection[];
	summary: {
		cards: PortalSummaryCard[];
	};
}

export interface PortalTimelineItem {
	id: string | number;
	kind: 'activity' | 'booking' | 'document';
	type: string;
	date: string | null;
	title?: string;
	author?: string;
	is_self?: boolean;
	status?: string;
	ticket_id?: number;
	booking_id?: number;
	document_type?: PortalDocumentType;
	public_url?: string;
	hash?: string;
	start_time?: string;
	timezone?: string;
}

export type PortalDocumentType = 'invoice' | 'proposal' | 'contract' | 'credit_note';

export interface PortalDocument {
	id: number;
	type: PortalDocumentType;
	number: string;
	subject: string | null;
	status: string;
	date: string | null;
	due_date: string | null;
	open_till: string | null;
	currency: string;
	total: number;
	amount_paid: number | null;
	balance: number | null;
	is_overdue: boolean;
	is_expired: boolean;
	invoice_id: number | null;
	/** Raw 32-char hash — drives the in-portal detail view (mounts the public renderer). */
	hash: string;
	public_url: string;
}

export interface PortalPayment {
	id: number;
	amount: number;
	currency: string;
	payment_mode: string;
	payment_date: string | null;
	transaction_id: string;
	invoice_id: number;
	invoice_number: string;
	invoice_hash: string;
	invoice_public_url: string;
}

export interface PortalPaymentsResponse {
	data: PortalPayment[];
	total_paid: number;
	currency: string;
}

export interface PortalTimelineResponse {
	data: PortalTimelineItem[];
	page: number;
	per_page: number;
	total: number;
}

export interface PortalProjectStatus {
	id?: number;
	name: string;
	/** Text / accent color from the admin project board status. */
	color?: string;
	/** Soft header/pill background from the admin project board status. */
	bg_color?: string;
	is_completed: boolean;
	position?: number;
}

export interface PortalProjectFinancials {
	total: number;
	paid: number;
	due: number;
}

export interface PortalProject {
	id: number;
	title: string;
	description: string;
	status: PortalProjectStatus | null;
	budget: number | null;
	currency: string;
	start_date: string | null;
	due_date: string | null;
	created_at: string;
	financials?: PortalProjectFinancials;
}

// The calendar event model now lives in the shared foundation layer so the admin
// staff calendar can reuse the same grid/chip/colors. The portal feed emits only
// booking/invoice/proposal and never the staff-facing extras, but the shape is a
// superset — these aliases keep the portal's existing imports working unchanged.
export type PortalCalendarEventKind = CalendarEventKind;
export type PortalCalendarEvent = CalendarEvent;

export interface PortalCalendarResponse {
	data: PortalCalendarEvent[];
}

export interface PortalBookingLocation {
	label: string;
	value: string;
}

export interface PortalBookingPayment {
	total: string | number | null;
	currency: string | null;
	status: string;
}

export interface PortalBooking {
	id: number;
	hash_id: string;
	status: string;
	event: {
		name: string;
		duration: number | null;
	};
	start_time: string;
	end_time: string;
	timezone: string;
	location: PortalBookingLocation | null;
	payment: PortalBookingPayment | null;
	can_cancel: boolean;
	can_reschedule: boolean;
}

export interface PortalSubscription {
	id: number;
	name: string;
	status: string;
	status_label: string;
	currency: string;
	amount: number;
	quantity: number;
	billing_interval: string;
	billing_interval_count: number;
	current_period_end: string | null;
	cancel_at_period_end: boolean;
	started_at: string | null;
	canceled_at: string | null;
	can_cancel: boolean;
}

declare global {
	interface Window {
		doublescale_client_portal_config?: PortalRendererConfig;
	}
}
