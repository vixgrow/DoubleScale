/**
 * Helpers for the "select all matching this filter" mode on the contacts list.
 *
 * Page-scoped checkboxes cap a bulk action at one page of rows. When the user
 * opts into filter-wide selection instead, the request has to carry the filter
 * criteria rather than an id list — these helpers translate between the two.
 */

export type BulkTargetMode = 'ids' | 'filter';

export interface BulkTarget {
	mode: BulkTargetMode;
	ids?: number[];
	filters?: unknown[];
	keywords?: string;
	from?: string;
	to?: string;
	confirm_all: boolean;
}

/** Matches React.Key without importing React into a pure module. */
type SelectionKey = string | number | bigint | symbol;

interface SelectionCountInput {
	selectAllMatching: boolean;
	selectedRowKeys: readonly SelectionKey[];
	total: number;
}

interface BulkTargetInput {
	selectAllMatching: boolean;
	selectedRowKeys: readonly SelectionKey[];
	filters: unknown;
	keywords: string;
	dateRange: { from?: string | null; to?: string | null };
}

/**
 * How many contacts the pending bulk action will actually touch.
 *
 * In filter-wide mode that is the matched total the list endpoint reported,
 * not the handful of rows rendered on screen.
 */
export function getEffectiveSelectionCount( {
	selectAllMatching,
	selectedRowKeys,
	total,
}: SelectionCountInput ): number {
	if ( ! selectAllMatching ) {
		return selectedRowKeys.length;
	}

	return Number.isFinite( total ) ? total : 0;
}

/**
 * Build the `target` payload for a bulk membership request.
 *
 * The backend refuses a request carrying both an id list and a filter, so the
 * two modes are kept strictly exclusive here.
 */
export function buildBulkTarget( {
	selectAllMatching,
	selectedRowKeys,
	filters,
	keywords,
	dateRange,
}: BulkTargetInput ): BulkTarget {
	if ( ! selectAllMatching ) {
		return {
			mode: 'ids',
			ids: selectedRowKeys.map( ( key ) =>
				Number( key as string | number | bigint )
			),
			confirm_all: false,
		};
	}

	const trimmedKeywords = ( keywords ?? '' ).trim();
	const filterList = Array.isArray( filters ) ? ( filters as unknown[] ) : [];
	const hasFilters = filterList.length > 0;
	const hasDateRange = Boolean( dateRange?.from || dateRange?.to );

	// Nothing narrows the set, so this addresses every contact in the
	// database. The backend rejects that unless we say we meant it.
	const confirmAll = ! hasFilters && ! hasDateRange && trimmedKeywords === '';

	const target: BulkTarget = {
		mode: 'filter',
		confirm_all: confirmAll,
	};

	if ( hasFilters ) {
		target.filters = filterList;
	}
	if ( trimmedKeywords !== '' ) {
		target.keywords = keywords;
	}
	if ( dateRange?.from ) {
		target.from = dateRange.from;
	}
	if ( dateRange?.to ) {
		target.to = dateRange.to;
	}

	return target;
}
