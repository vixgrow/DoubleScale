/**
 * Contact email list helpers (subject line + flat threading metadata for the table).
 */
import type { CampaignEmail } from '../../client/types';

export type EmailRow = CampaignEmail & {
	_isReply?: boolean;
	_replyCount?: number;
	_isExpanded?: boolean;
};

/**
 * Resolve a display subject from a tracked message (matches emails table column logic).
 */
export function getSubject(email: CampaignEmail): string {
	const resolvedSubject = email.resolved_subject;
	const templateSubject = email.template?.subject;
	const activitySubject = email.activity?.data?.subject;
	return (
		(resolvedSubject && resolvedSubject.trim()) ||
		(templateSubject && templateSubject.trim()) ||
		(activitySubject && activitySubject.trim()) ||
		''
	);
}

/**
 * Prepare rows for the contact emails table.
 *
 * Full conversation threading is not yet available from the messages API, so each
 * message is emitted as its own row with threading counters cleared. Expand/reply UI
 * stays consistent without merging unrelated messages by subject heuristics.
 */
export function groupMessagesIntoThreads(
	messages: CampaignEmail[],
	_expandedIds: Set<number>
): EmailRow[] {
	if (!Array.isArray(messages) || messages.length === 0) {
		return [];
	}
	return messages.map((m) => ({
		...m,
		_replyCount: 0,
		_isReply: false,
		_isExpanded: false,
	}));
}
