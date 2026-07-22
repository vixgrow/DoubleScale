import type { TimelineItem } from '@doublescale/services/activities-service';

export type ActivityTimelineTypeFilter =
	| 'all'
	| 'task'
	| 'project'
	| 'note'
	| 'call_logged'
	| 'email_sent'
	| 'meeting_scheduled'
	| 'proposals'
	| 'invoices'
	| 'files';

export const resolveDocumentLinkEventKey = (
	activityType: string,
	data?: Record<string, unknown>
): 'proposal_linked' | 'invoice_linked' | null => {
	if (activityType !== 'status_changed' || !data) {
		return null;
	}
	if (data.proposal_id) {
		return 'proposal_linked';
	}
	if (data.invoice_id) {
		return 'invoice_linked';
	}
	return null;
};

const isProposalLinkedTimelineItem = (item: TimelineItem): boolean =>
	item.type === 'activity' &&
	resolveDocumentLinkEventKey(item.icon_type, item.data) === 'proposal_linked';

const isInvoiceLinkedTimelineItem = (item: TimelineItem): boolean =>
	item.type === 'activity' &&
	resolveDocumentLinkEventKey(item.icon_type, item.data) === 'invoice_linked';

export interface TaskActivityFilterEntry {
	activity_type: string;
	event_key?: string | null;
	data?: Record<string, unknown>;
}

export const resolveTaskActivityEventKey = (
	entry: TaskActivityFilterEntry
): string => {
	const data = entry.data || {};
	return String(entry.event_key || data.event_key || '');
};

export const resolveTypeFilterParam = (
	typeFilter: ActivityTimelineTypeFilter
): string | undefined => {
	if (typeFilter === 'all' || typeFilter === 'task') {
		return undefined;
	}
	if (typeFilter === 'files') {
		return 'file_attached,file_removed';
	}
	return typeFilter;
};

export const filterTimelineByType = (
	items: TimelineItem[],
	typeFilter: ActivityTimelineTypeFilter
): TimelineItem[] => {
	if (typeFilter === 'task') {
		return items.filter((item) => item.type === 'task');
	}
	if (typeFilter === 'all') {
		return items.filter(
			(item) => item.type !== 'task' && item.icon_type !== 'task_event'
		);
	}

	if (typeFilter === 'files') {
		return items.filter(
			(item) =>
				item.icon_type === 'file_attached' ||
				item.icon_type === 'file_removed'
		);
	}

	if (typeFilter === 'proposals') {
		return items.filter(isProposalLinkedTimelineItem);
	}

	if (typeFilter === 'invoices') {
		return items.filter(isInvoiceLinkedTimelineItem);
	}

	if (
		typeFilter === 'note' ||
		typeFilter === 'call_logged' ||
		typeFilter === 'email_sent' ||
		typeFilter === 'meeting_scheduled'
	) {
		return items;
	}

	return items;
};

export const filterTaskActivityByType = <T extends TaskActivityFilterEntry>(
	entries: T[],
	typeFilter: ActivityTimelineTypeFilter
): T[] => {
	if (typeFilter === 'all') {
		return entries;
	}

	if (typeFilter === 'files') {
		return entries.filter((entry) => {
			const key = resolveTaskActivityEventKey(entry);
			return key === 'file_attached' || key === 'file_removed';
		});
	}

	if (typeFilter === 'note') {
		return entries.filter(
			(entry) =>
				entry.activity_type === 'note' ||
				entry.activity_type === 'comment_reply'
		);
	}

	if (typeFilter === 'task') {
		return entries.filter((entry) => {
			if (entry.activity_type !== 'task_event') {
				return false;
			}
			const key = resolveTaskActivityEventKey(entry);
			return key !== 'file_attached' && key !== 'file_removed';
		});
	}

	return entries.filter((entry) => entry.activity_type === typeFilter);
};
