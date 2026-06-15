import { filter } from 'lodash';
import type {
	AutomationMergeTags,
	MergeTags,
	MergeTagsGroup,
} from '@doublescale/config';

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
