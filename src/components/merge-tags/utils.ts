import { filter } from 'lodash';
import type {
	AutomationMergeTags,
	MergeTags,
	MergeTagsGroup,
} from '@doublescale/config';

/** Sales settings email templates — limits which {{sales:…}} slugs appear per document. */
export type SalesEmailDocumentType =
	| 'proposal'
	| 'invoice'
	| 'credit_note'
	| 'contract'
	| 'subscription';

const SALES_EMAIL_TAG_SLUGS: Record<SalesEmailDocumentType, string[]> = {
	proposal: [
		'customer_name',
		'company_name',
		'proposal_subject',
		'proposal_number',
		'proposal_total',
		'proposal_url',
		'proposal_open_till',
	],
	invoice: [
		'customer_name',
		'company_name',
		'invoice_number',
		'invoice_total',
		'invoice_balance',
		'invoice_due_date',
		'invoice_url',
	],
	credit_note: [
		'customer_name',
		'company_name',
		'credit_note_number',
		'credit_note_total',
		'credit_note_remaining',
		'credit_note_date',
		'credit_note_url',
	],
	contract: [
		'customer_name',
		'company_name',
		'contract_subject',
		'contract_number',
		'contract_value',
		'contract_end_date',
		'contract_url',
	],
	subscription: [
		'customer_name',
		'company_name',
		'subscription_name',
		'subscription_amount',
		'subscription_url',
	],
};

/**
 * Merge tags allowed in Sales → Settings email templates for a given document type.
 * Unlike automations, invoice emails must not offer proposal tags (no proposal context).
 */
export function getVisibleMergeTagsForSalesEmail(
	mergeTags: MergeTags,
	documentType: SalesEmailDocumentType
): MergeTags {
	const allowed = SALES_EMAIL_TAG_SLUGS[documentType] ?? [];
	return filter(mergeTags, (_tag, slug) => allowed.includes(slug));
}

/**
 * Groups shown when editing a sales customer email template.
 */
export function filterMergeTagGroupsForSalesEmail(
	groups: AutomationMergeTags,
	documentType: SalesEmailDocumentType
): Array<{ id: string; group: MergeTagsGroup }> {
	return Object.entries(groups)
		.filter(([groupId, group]) => {
			if (group.is_disabled) {
				return false;
			}
			if ('sales' === groupId) {
				return (
					Object.keys(
						getVisibleMergeTagsForSalesEmail(group.mergeTags, documentType)
					).length > 0
				);
			}
			if ('contact' === groupId || 'general' === groupId) {
				return Object.keys(group.mergeTags ?? {}).length > 0;
			}
			return false;
		})
		.map(([id, group]) => ({ id, group }));
}

/**
 * Tags visible for the current automation trigger.
 */
export function getVisibleMergeTagsForTrigger(
	mergeTags: MergeTags,
	activeTrigger?: string
): MergeTags {
	return filter(mergeTags, (tag) => {
		if (!tag.required_triggers || tag.required_triggers.length === 0) {
			return true;
		}
		if (!activeTrigger) {
			return false;
		}
		return tag.required_triggers.includes(activeTrigger);
	});
}

/**
 * Whether a merge-tag group should appear in the selector UI.
 */
export function isMergeTagGroupVisibleForTrigger(
	group: MergeTagsGroup,
	activeTrigger?: string
): boolean {
	if (group.is_disabled) {
		return false;
	}

	const matchesTrigger =
		!group.triggers || group.triggers.includes(activeTrigger ?? '');
	if (!matchesTrigger) {
		return false;
	}

	const visibleTags = getVisibleMergeTagsForTrigger(
		group.mergeTags,
		activeTrigger
	);
	return Object.keys(visibleTags).length > 0;
}

/**
 * Filter merge-tag groups by trigger and drop groups with no visible tags.
 */
export function filterMergeTagGroups(
	groups: AutomationMergeTags,
	activeTrigger?: string
): MergeTagsGroup[] {
	return filter(groups, (group) =>
		isMergeTagGroupVisibleForTrigger(group, activeTrigger)
	);
}
