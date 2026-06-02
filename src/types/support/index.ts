/**
 * REST DTO shapes for the support module.
 *
 * These mirror the JSON the `RestTicketController` / `RestReplyController` /
 * `RestMailboxController` shape methods produce. Update both sides together
 * when fields change.
 */

import type { TicketStatus, TicketPriority } from '@/constants/support';

export interface ContactSummary {
	id: number;
	email: string;
	first_name: string | null;
	last_name: string | null;
}

export interface AgentSummary {
	id: number;
	display_name: string;
	email: string;
}

export interface MailboxSummary {
	id: number;
	slug: string;
	email: string;
	name: string;
}

export interface Mailbox {
	id: number;
	slug: string;
	email: string;
	box_type: 'web' | 'email';
	is_default: boolean;
	name: string;
	data: Record<string, unknown>;
	created_at: string | null;
	updated_at: string | null;
}

export interface Ticket {
	id: number;
	hash: string;
	title: string;
	status: TicketStatus;
	priority: TicketPriority;
	mailbox_id: number | null;
	contact_id: number;
	agent_user_id: number | null;
	product: string | null;
	response_count: number;
	tag_ids: number[];
	custom_data: Record<string, unknown>;
	created_at: string | null;
	updated_at: string | null;
	contact?: ContactSummary | null;
	agent?: AgentSummary | null;
	mailbox?: MailboxSummary | null;
}

export type ConversationKind = 'reply' | 'note' | 'event';

export interface ConversationItem {
	id: number;
	kind: ConversationKind;
	type: string;
	contact_id: number | null;
	user_id: number | null;
	data: {
		content?: string;
		event_key?: string;
		from?: string | number | null;
		to?: string | number | null;
		[key: string]: unknown;
	};
	created_at: string | null;
	updated_at: string | null;
	user: AgentSummary | null;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		total: number;
		per_page: number;
		current_page: number;
		last_page: number;
		ticket_id?: number;
	};
}

export interface TicketFilters {
	status?: string;
	priority?: TicketPriority;
	agent_user_id?: number;
	contact_id?: number;
	mailbox_id?: number;
	tag_id?: number;
	search?: string;
	sort_by?: 'created_at' | 'updated_at' | 'priority';
	sort_order?: 'asc' | 'desc';
	per_page?: number;
	page?: number;
}

export interface CreateTicketPayload {
	title: string;
	// Customer: either an existing CRM contact by id, OR an email (+ optional
	// name) which the backend find_or_creates. The server requires one of the
	// two (see TicketService::resolve_contact); the modal sends contact_id when
	// a contact is picked, email otherwise.
	contact_id?: number;
	email?: string;
	first_name?: string;
	last_name?: string;
	content: string;
	mailbox_id?: number;
	priority?: TicketPriority;
	product?: string;
	agent_user_id?: number;
	custom_data?: Record<string, unknown>;
	tag_ids?: number[];
}

export interface UpdateTicketPayload {
	title?: string;
	status?: TicketStatus;
	priority?: TicketPriority;
	mailbox_id?: number | null;
	agent_user_id?: number | null;
	product?: string | null;
	tag_ids?: number[];
	custom_data?: Record<string, unknown>;
}
