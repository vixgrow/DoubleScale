import {
	ADD_BLOCK,
	ADD_SECTION,
	CLEAR_SELECTION,
	DELETE_BLOCK,
	DELETE_SECTION,
	MOVE_BLOCK,
	REORDER_SECTIONS,
	RESET_BUILDER,
	SELECT_BLOCK,
	SET_BUILDER_STATE,
	UPDATE_BLOCK,
	UPDATE_SECTION,
	UPDATE_GLOBAL_SETTINGS,
} from './constants';

import type {
	EmailBlock,
	EmailBuilderActionTypes,
	EmailSection,
	GlobalEmailSettings,
} from './types';

// Block actions
export const addBlock = (
	sectionId: string,
	columnId: string,
	block: EmailBlock,
	index?: number
): EmailBuilderActionTypes => ({
	type: ADD_BLOCK,
	payload: { sectionId, columnId, block, index },
});

export const updateBlock = (
	blockId: string,
	props: Record<string, any>
): EmailBuilderActionTypes => ({
	type: UPDATE_BLOCK,
	payload: { blockId, props },
});

export const deleteBlock = (blockId: string): EmailBuilderActionTypes => ({
	type: DELETE_BLOCK,
	payload: { blockId },
});

export const moveBlock = (
	blockId: string,
	fromSectionId: string,
	fromColumnId: string,
	toSectionId: string,
	toColumnId: string,
	toIndex: number
): EmailBuilderActionTypes => ({
	type: MOVE_BLOCK,
	payload: {
		blockId,
		fromSectionId,
		fromColumnId,
		toSectionId,
		toColumnId,
		toIndex,
	},
});

export const selectBlock = (
	blockId: string,
	sectionId?: string,
	columnId?: string
): EmailBuilderActionTypes => ({
	type: SELECT_BLOCK,
	payload: { blockId, sectionId, columnId },
});

export const clearSelection = (): EmailBuilderActionTypes => ({
	type: CLEAR_SELECTION,
});

// Section actions
export const addSection = (
	section: EmailSection,
	index?: number
): EmailBuilderActionTypes => ({
	type: ADD_SECTION,
	payload: { section, index },
});

export const deleteSection = (sectionId: string): EmailBuilderActionTypes => ({
	type: DELETE_SECTION,
	payload: { sectionId },
});

export const updateSection = (
	sectionId: string,
	styles: Record<string, any>
): EmailBuilderActionTypes => ({
	type: UPDATE_SECTION,
	payload: { sectionId, styles },
});

export const reorderSections = (
	activeSectionId: string,
	overSectionId: string
): EmailBuilderActionTypes => ({
	type: REORDER_SECTIONS,
	payload: { activeSectionId, overSectionId },
});

// Builder actions
export const setBuilderState = (
	sections: EmailSection[]
): EmailBuilderActionTypes => ({
	type: SET_BUILDER_STATE,
	payload: { sections },
});

export const resetBuilder = (): EmailBuilderActionTypes => ({
	type: RESET_BUILDER,
});

export const updateGlobalSettings = (
	settings: Partial<GlobalEmailSettings>
): EmailBuilderActionTypes => ({
	type: UPDATE_GLOBAL_SETTINGS,
	payload: { settings },
});
