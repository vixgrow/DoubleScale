/**
 * Saved block content migration and section helpers.
 */

import {
	generateBlockId,
	generateColumnId,
	generateSectionId,
} from '@doublescale/utils/idGenerator';
import type {
	EmailSection,
	SavedBlockContent,
} from '../types/common';

const SAVED_BLOCK_CONTENT_VERSION = 1;

/**
 * Wrap a section in the versioned content envelope for persistence.
 */
export const wrapSectionAsSavedBlockContent = (
	section: EmailSection
): SavedBlockContent => ({
	version: SAVED_BLOCK_CONTENT_VERSION,
	section,
});

/**
 * Migrate saved block content to the current schema.
 */
export const migrateSavedBlockContent = (
	content: SavedBlockContent
): EmailSection => {
	if (content.version === 1 && content.section) {
		return content.section;
	}

	throw new Error(`Unsupported saved block content version: ${content.version}`);
};

/**
 * Regenerate all IDs in a section tree (section, columns, blocks).
 */
export const regenerateSectionIds = (section: EmailSection): EmailSection => {
	const { meta: _meta, ...sectionWithoutMeta } = section;

	return {
		...sectionWithoutMeta,
		id: generateSectionId(),
		columns: section.columns.map((column) => ({
			...column,
			id: generateColumnId(),
			blocks: column.blocks.map((block) => ({
				...block,
				id: generateBlockId(),
			})),
		})),
	};
};

/**
 * Build a section ready to insert from a saved block record.
 */
export const buildSectionFromSavedBlock = (
	savedBlockId: number,
	content: SavedBlockContent
): EmailSection => {
	const section = migrateSavedBlockContent(content);
	const rebuilt = regenerateSectionIds(section);

	return {
		...rebuilt,
		meta: {
			savedBlockId,
			savedBlockVersion: content.version,
		},
	};
};

/**
 * Strip origin metadata before persisting a section as a saved block.
 */
export const stripSectionMetaForSave = (section: EmailSection): EmailSection => {
	const { meta: _meta, ...rest } = section;
	return rest;
};
