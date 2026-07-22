/**
 * Deep-link helpers: open Contacts pre-filtered by a List or Tag.
 *
 * URL shape (WordPress admin query args):
 *   …&path=contacts&list_id=12
 *   …&path=contacts&tag_id=34
 */

export type ContactsDeepLinkRule = {
	rule: string;
	operator: string;
	value: string[];
	selectedGroup: string;
};

/** Nested RulesBuilder shape: OR groups → AND conditions. */
export type ContactsDeepLinkFilters = ContactsDeepLinkRule[][];

export function buildListContactsFilter(
	listId: number | string
): ContactsDeepLinkFilters {
	return [
		[
			{
				rule: 'lists_segment',
				operator: 'contains',
				value: [String(listId)],
				selectedGroup: 'segments',
			},
		],
	];
}

export function buildTagContactsFilter(
	tagId: number | string
): ContactsDeepLinkFilters {
	return [
		[
			{
				rule: 'tags_segment',
				operator: 'contains',
				value: [String(tagId)],
				selectedGroup: 'segments',
			},
		],
	];
}

/**
 * Read list_id / tag_id from the current admin URL and return filters,
 * or null when neither deep-link param is present.
 */
export function parseContactsDeepLinkFilters(
	search: string = typeof window !== 'undefined' ? window.location.search : ''
): ContactsDeepLinkFilters | null {
	const params = new URLSearchParams(
		search.startsWith('?') ? search.slice(1) : search
	);

	const listId = params.get('list_id');
	if (listId && Number(listId) > 0) {
		return buildListContactsFilter(listId);
	}

	const tagId = params.get('tag_id');
	if (tagId && Number(tagId) > 0) {
		return buildTagContactsFilter(tagId);
	}

	return null;
}
