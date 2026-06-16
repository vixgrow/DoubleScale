/**
 * Client Portal renderer types. The renderer config is a superset of the
 * support PortalConfig: the Portal handler localizes the shared REST root +
 * nonce and the portal namespace, and the Support module injects the support
 * REST bases + uploader settings via the `doublescale_client_portal_config`
 * filter (so the reused ticket views work unchanged).
 */

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
	start_time?: string;
	timezone?: string;
}

export type PortalDocumentType = 'invoice' | 'proposal';

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

export type PortalCalendarEventKind =
	| 'booking'
	| 'invoice'
	| 'proposal'
	| 'support';

export interface PortalCalendarEvent {
	id: string;
	kind: PortalCalendarEventKind;
	title: string;
	/** Event date(time). All-day events carry a `YYYY-MM-DD` (or datetime) start. */
	start: string;
	end: string | null;
	all_day: boolean;
	/** Booking tz (fallback 'UTC'); null for all-day docs. */
	timezone: string | null;
	status: string;
	/** In-portal navigation target, or null when the event isn't actionable. */
	route: string | null;
}

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

declare global {
	interface Window {
		doublescale_client_portal_config?: PortalRendererConfig;
	}
}
