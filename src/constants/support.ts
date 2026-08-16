/**
 * Support module frontend constants.
 *
 * Mirrors the PHP-side `TicketStatus` / `TicketPriority` constants and the
 * REST namespace registered by `RestTicketController` / `RestReplyController` /
 * `RestMailboxController`. Keep in sync with `includes/Modules/Support/`.
 */

import { __ } from '@wordpress/i18n';

export const NAMESPACE = '/doublescale/v1/support';

export const TICKET_STATUSES = [
	'open',
	'pending',
	'resolved',
	'closed',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = [
	'low',
	'normal',
	'high',
	'urgent',
] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const STATUS_LABELS: Record<TicketStatus, string> = {
	open: __('Open', 'doublescale'),
	pending: __('Pending', 'doublescale'),
	resolved: __('Resolved', 'doublescale'),
	closed: __('Closed', 'doublescale'),
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
	low: __('Low', 'doublescale'),
	normal: __('Normal', 'doublescale'),
	high: __('High', 'doublescale'),
	urgent: __('Urgent', 'doublescale'),
};
