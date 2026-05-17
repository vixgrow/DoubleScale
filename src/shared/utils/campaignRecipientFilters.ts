/**
 * Parse campaign recipient filters for display (Review step) and API (Contacts).
 *
 * Contacts step stores list/tag picks as nested rows:
 *   [ includeRows[], excludeRows[] ]  where each row is { list, tag }.
 *
 * Legacy/automation format uses flat segment filters:
 *   { group: 'segments', filter: 'lists_segment'|'tags_segment', operator, value }.
 */

export type ListTagFilterRow = {
	list?: string;
	tag?: string;
};

export type SegmentFilter = {
	group?: string;
	filter?: string;
	operator?: string;
	value?: unknown[];
};

export type ParsedRecipientFilters = {
	includeListIds: number[];
	includeTagIds: number[];
	excludeListIds: number[];
	excludeTagIds: number[];
};

const isListTagRow = (row: unknown): row is ListTagFilterRow =>
	typeof row === 'object' &&
	row !== null &&
	('list' in row || 'tag' in row);

const isListTagNestedFormat = (filters: unknown[]): boolean => {
	if (filters.length !== 2) {
		return false;
	}
	if (!Array.isArray(filters[0]) || !Array.isArray(filters[1])) {
		return false;
	}
	const include = filters[0] as unknown[];
	const exclude = filters[1] as unknown[];
	if (include.length === 0 && exclude.length === 0) {
		return true;
	}
	const firstInclude = include[0];
	const firstExclude = exclude[0];
	return (
		(include.length > 0 && isListTagRow(firstInclude)) ||
		(exclude.length > 0 && isListTagRow(firstExclude))
	);
};

const pushId = (target: number[], raw: string | undefined) => {
	if (!raw || raw === 'all') {
		return;
	}
	const id = Number(raw);
	if (!Number.isNaN(id) && id > 0) {
		target.push(id);
	}
};

const dedupe = (ids: number[]) => [...new Set(ids)];

const parseListTagRows = (
	rows: unknown[],
	target: ParsedRecipientFilters,
	mode: 'include' | 'exclude'
) => {
	if (!Array.isArray(rows)) {
		return;
	}
	rows.forEach((row) => {
		if (!isListTagRow(row)) {
			return;
		}
		if (mode === 'include') {
			pushId(target.includeListIds, row.list);
			pushId(target.includeTagIds, row.tag);
		} else {
			pushId(target.excludeListIds, row.list);
			pushId(target.excludeTagIds, row.tag);
		}
	});
};

const parseSegmentFilters = (
	filters: SegmentFilter[],
	target: ParsedRecipientFilters
) => {
	filters.forEach((filter) => {
		if (filter.group !== 'segments' || !filter.value?.[0]) {
			return;
		}
		const id = Number(filter.value[0]);
		if (Number.isNaN(id) || id <= 0) {
			return;
		}
		const isInclude = filter.operator === 'contains';
		if (filter.filter === 'lists_segment') {
			if (isInclude) {
				target.includeListIds.push(id);
			} else {
				target.excludeListIds.push(id);
			}
		} else if (filter.filter === 'tags_segment') {
			if (isInclude) {
				target.includeTagIds.push(id);
			} else {
				target.excludeTagIds.push(id);
			}
		}
	});
};

/**
 * Normalize campaign.settings.filters (or contacts_data.filters) into list/tag IDs.
 */
export const parseCampaignRecipientFilters = (
	filters: unknown
): ParsedRecipientFilters => {
	const result: ParsedRecipientFilters = {
		includeListIds: [],
		includeTagIds: [],
		excludeListIds: [],
		excludeTagIds: [],
	};

	if (!Array.isArray(filters) || filters.length === 0) {
		return result;
	}

	if (isListTagNestedFormat(filters)) {
		parseListTagRows(filters[0], result, 'include');
		parseListTagRows(filters[1], result, 'exclude');
	} else if (filters.every((f) => typeof f === 'object' && f !== null && 'group' in f)) {
		parseSegmentFilters(filters as SegmentFilter[], result);
	}

	result.includeListIds = dedupe(result.includeListIds);
	result.includeTagIds = dedupe(result.includeTagIds);
	result.excludeListIds = dedupe(result.excludeListIds);
	result.excludeTagIds = dedupe(result.excludeTagIds);

	return result;
};

/**
 * Resolve filters from campaign settings (prefers top-level settings.filters).
 */
export const getCampaignFiltersFromSettings = (
	settings: Record<string, unknown> | undefined | null
): unknown => {
	if (!settings || typeof settings !== 'object') {
		return [];
	}
	const top = settings.filters;
	if (Array.isArray(top) && top.length > 0) {
		return top;
	}
	const contactsData = settings.contacts_data as { filters?: unknown } | undefined;
	if (Array.isArray(contactsData?.filters) && contactsData.filters.length > 0) {
		return contactsData.filters;
	}
	return top ?? [];
};
