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

/**
 * Author shown on a conversation item. The admin/agent views populate the full
 * {@see AgentSummary} (id + email). Customer-facing payloads (guest + portal)
 * expose only a friendly `display_name` for staff replies — never the agent's
 * WP id or email — so `id`/`email` are optional here.
 */
export interface ConversationAuthor {
	display_name: string;
	id?: number;
	email?: string;
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
	/**
	 * Accumulated union of every CC recipient ever used on this ticket
	 * (surfaced from `custom_data.cc_recipients` for a stable contract).
	 */
	cc_recipients?: string[];
	custom_fields?: Record<string, RenderedCustomField>;
	created_at: string | null;
	updated_at: string | null;
	contact?: ContactSummary | null;
	agent?: AgentSummary | null;
	mailbox?: MailboxSummary | null;
}

export type ConversationKind = 'reply' | 'note' | 'event';

export interface ConversationAttachment {
	file_name: string;
	file_size: number;
	file_type: string;
	url: string;
	/**
	 * True when this attachment is an inline email image already embedded in the
	 * message body (its `cid:` was rewritten to the signed URL). The conversation
	 * UI hides these from the separate attachment row to avoid showing the same
	 * image twice. Optional for backward-compat with cached/older payloads.
	 */
	is_inline?: boolean;
}

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
		cc?: string[];
		[key: string]: unknown;
	};
	/** CC recipients on this reply (also present in `data.cc`). */
	cc?: string[];
	created_at: string | null;
	updated_at: string | null;
	user: ConversationAuthor | null;
	attachments?: ConversationAttachment[];
}

export type SupportCustomFieldType =
	| 'text'
	| 'textarea'
	| 'number'
	| 'select'
	| 'radio'
	| 'checkbox'
	| 'date';

export type CustomFieldConditionSource =
	| 'ticket_title'
	| 'ticket_content'
	| 'ticket_priority'
	| 'custom_field';

export type CustomFieldConditionOperator =
	| 'contains'
	| 'not_contains'
	| 'equals'
	| 'not_equals'
	| 'starts_with'
	| 'ends_with';

export interface CustomFieldCondition {
	source: CustomFieldConditionSource;
	operator: CustomFieldConditionOperator;
	value: string;
	field_key?: string;
}

export interface CustomFieldConditionalLogic {
	enabled: boolean;
	/** @deprecated Use `groups` for OR/AND nesting. Kept for legacy payloads. */
	match: 'all' | 'any';
	/** Flat list of conditions (legacy). Prefer `groups` when present. */
	conditions: CustomFieldCondition[];
	/** OR groups of AND conditions (Advanced Filters UI). */
	groups?: CustomFieldCondition[][];
}

export interface SupportCustomFieldTypeMeta {
	label: string;
	group: 'standard' | 'integration' | string;
	has_options: boolean;
}

export interface SupportCustomFieldDefinition {
	key: string;
	public_label: string;
	admin_label?: string;
	/** @deprecated Use public_label */
	label?: string;
	placeholder?: string;
	type: SupportCustomFieldType | string;
	options?: string[];
	required?: boolean;
	scope: 'admin' | 'portal' | 'both';
	agent_only?: boolean;
	conditional_logic?: CustomFieldConditionalLogic;
}

export interface RenderedCustomField {
	label: string;
	type: SupportCustomFieldType;
	value: string | string[];
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

export interface AttachmentUploadResult {
	file_hash: string;
	file_name: string;
	file_size: number;
	file_type: string;
}

/**
 * Admin-configurable attachment limits, surfaced to every composer so it can
 * pre-validate uploads and show the caps. `max_file_size_bytes` is the effective
 * cap (the configured MB value clamped to the server's upload limit).
 */
export interface AttachmentLimits {
	max_file_size_mb: number;
	max_file_size_bytes: number;
	max_file_count: number;
	accepted_mimes: string[];
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
	attachment_hashes?: string[];
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

export interface ReportFilters {
	from: string;
	to: string;
	mailbox_id?: number;
	agent_user_id?: number;
}

export interface ReportSummary {
	new: number;
	open: number;
	resolved: number;
	closed: number;
	total_responses: number;
}

export interface TimeSeriesPoint {
	date: string;
	created: number;
	resolved: number;
}

export interface TicketsOverTimeReport {
	bucket: 'daily' | 'weekly' | 'monthly';
	series: TimeSeriesPoint[];
}

export interface BreakdownBucket {
	key: string;
	label: string;
	count: number;
}

export interface ReportBreakdown {
	by_status: BreakdownBucket[];
	by_priority: BreakdownBucket[];
}

export interface AgentReportRow {
	agent: AgentSummary;
	assigned: number;
	resolved: number;
	responses: number;
}

export interface MailboxReportRow {
	mailbox: {
		id: number;
		slug: string;
		name: string;
	};
	total: number;
	open: number;
	resolved: number;
	closed: number;
}
