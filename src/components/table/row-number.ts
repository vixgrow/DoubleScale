/**
 * Computes the display number for a table row.
 *
 * Lists are paginated server-side, so the row's position within the current
 * page has to be offset by the pages before it to produce a running count.
 *
 * `index` must come from `row.index`, which TanStack assigns from the original
 * data array when the core row model is built. Sorting reorders the row model
 * but leaves `index` untouched, so the numbering stays tied to the order the
 * server returned rather than shuffling with the active sort.
 */
export const getRowNumber = (
	index: number,
	page: number,
	perPage: number
): number => (page - 1) * perPage + index + 1;
