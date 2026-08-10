/**
 * Helpers for proposal/invoice content sections (before items vs after totals).
 */

import type { DocumentSection } from '@/types/sales';

export type DocumentSectionPosition = 'before_items' | 'after_totals';

export function splitDocumentSections(
	sections: DocumentSection[] = []
): {
	beforeItems: DocumentSection[];
	afterTotals: DocumentSection[];
} {
	const beforeItems: DocumentSection[] = [];
	const afterTotals: DocumentSection[] = [];

	for (const section of sections) {
		const row = { title: section.title, body: section.body };
		if (section.position === 'before_items') {
			beforeItems.push(row);
		} else {
			afterTotals.push(row);
		}
	}

	return { beforeItems, afterTotals };
}

export function mergeDocumentSections(
	beforeItems: DocumentSection[],
	afterTotals: DocumentSection[]
): DocumentSection[] {
	return [
		...beforeItems.map((section) => ({
			...section,
			position: 'before_items' as DocumentSectionPosition,
		})),
		...afterTotals.map((section) => ({
			...section,
			position: 'after_totals' as DocumentSectionPosition,
		})),
	];
}
