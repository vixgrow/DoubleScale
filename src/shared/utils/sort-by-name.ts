/**
 * Alphabetical compare for named records (tags, lists, filter chips).
 */
export function compareByName(
	a: { name?: string | null },
	b: { name?: string | null }
): number {
	return (a.name ?? '').localeCompare(b.name ?? '', undefined, {
		sensitivity: 'base',
		numeric: true,
	});
}

export function sortByName<T extends { name?: string | null }>(
	items: T[] | null | undefined
): T[] {
	return [...(items ?? [])].sort(compareByName);
}

export function sortNames(names: string[]): string[] {
	return [...names].sort((a, b) =>
		a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
	);
}
