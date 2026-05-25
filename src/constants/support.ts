/**
 * Support module frontend constants.
 *
 * Mirrors the PHP-side `TicketStatus` / `TicketPriority` constants and the
 * REST namespace registered by `RestTicketController` / `RestReplyController` /
 * `RestMailboxController`. Keep in sync with `includes/Modules/Support/`.
 */

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
	open: 'Open',
	pending: 'Pending',
	resolved: 'Resolved',
	closed: 'Closed',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
	low: 'Low',
	normal: 'Normal',
	high: 'High',
	urgent: 'Urgent',
};
