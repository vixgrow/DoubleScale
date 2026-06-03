/**
 * Renderer-only portal types. Reuses the admin support DTOs where the REST
 * contract is identical (Ticket shape mirrors RestTicketController), but the
 * portal returns trimmed payloads that omit agent-internal fields and add a
 * `is_self` marker on conversation items so we can right-align the customer's
 * own replies in the thread.
 *
 * Update `RestPortalController::shape_portal_ticket()` /
 * `shape_portal_activity()` in lockstep with these.
 */

import type {
	ConversationItem,
	Ticket as AdminTicket,
} from '@/types/support';

export type PortalTicket = Omit<AdminTicket, 'agent_user_id' | 'agent' | 'custom_data'>;

export interface PortalConversationItem extends ConversationItem {
	is_self?: boolean;
}

export interface PortalConfig {
	rest_url: string;
	rest_root: string;
	nonce: string;
	user: {
		id: number;
		email: string;
		display_name: string;
	};
	lang: string;
	mount_id: string;
	// Optional mailbox scope from the shortcode's `box_id` attribute (0/absent
	// = unscoped). Set in index.tsx from the mount node's data-box-id; locks
	// new tickets and filters the list to this mailbox.
	box_id?: number;
}

declare global {
	interface Window {
		doublescale_support_portal_config?: PortalConfig;
	}
}
