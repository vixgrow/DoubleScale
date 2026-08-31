import {
	ADD_BLOCK,
	ADD_SECTION,
	CLEAR_SELECTION,
	DELETE_BLOCK,
	DELETE_SECTION,
	MOVE_BLOCK,
	REDO,
	REORDER_SECTIONS,
	RESET_BUILDER,
	SELECT_BLOCK,
	SELECT_COLUMN,
	SELECT_SECTION,
	SET_BUILDER_STATE,
	SET_ATTACHMENTS,
	SET_BUTTON_SETTINGS,
	SET_LINK_SETTINGS,
	SET_LOADING,
	UNDO,
	UPDATE_BLOCK,
	UPDATE_BUTTON_SETTINGS,
	UPDATE_LINK_SETTINGS,
	UPDATE_COLUMN,
	UPDATE_GLOBAL_SETTINGS,
	UPDATE_SECTION,
} from './constants';

import type {
	ButtonSettings,
	ButtonType,
	EmailBlock,
	EmailAttachment,
	EmailBuilderActionTypes,
	EmailSection,
	GlobalEmailSettings,
	LinkSettings,
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

// Selection actions
export const selectSection = (sectionId: string): EmailBuilderActionTypes => ({
	type: SELECT_SECTION,
	payload: { sectionId },
});

export const selectColumn = (
	sectionId: string,
	columnId: string
): EmailBuilderActionTypes => ({
	type: SELECT_COLUMN,
	payload: { sectionId, columnId },
});

// Column actions
export const updateColumn = (
	sectionId: string,
	columnId: string,
	updates: Partial<{ styles: Record<string, any> }>
): EmailBuilderActionTypes => ({
	type: UPDATE_COLUMN,
	payload: { sectionId, columnId, updates },
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
	updates: {
		styles?: Record<string, any>;
		conditions?: Array<{
			group: string;
			filter: string;
			operator: string;
			value: any;
		}>;
	}
): EmailBuilderActionTypes => ({
	type: UPDATE_SECTION,
	payload: { sectionId, ...updates },
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

export const setAttachments = (
	attachments: EmailAttachment[]
): EmailBuilderActionTypes => ({
	type: SET_ATTACHMENTS,
	payload: { attachments },
});

// History actions
export const undo = (): EmailBuilderActionTypes => ({
	type: UNDO,
});

export const redo = (): EmailBuilderActionTypes => ({
	type: REDO,
});

// Button settings actions
export const updateButtonSettings = (
	buttonType: ButtonType,
	settings: Partial<ButtonSettings>
): EmailBuilderActionTypes => ({
	type: UPDATE_BUTTON_SETTINGS,
	payload: { buttonType, settings },
});

export const setButtonSettings = (
	settings: Record<ButtonType, ButtonSettings>
): EmailBuilderActionTypes => ({
	type: SET_BUTTON_SETTINGS,
	payload: { settings },
});

export const updateLinkSettings = (
	settings: Partial<LinkSettings>
): EmailBuilderActionTypes => ({
	type: UPDATE_LINK_SETTINGS,
	payload: { settings },
});

export const setLinkSettings = (
	settings: LinkSettings
): EmailBuilderActionTypes => ({
	type: SET_LINK_SETTINGS,
	payload: { settings },
});

// Loading actions
export const setLoading = (isLoading: boolean): EmailBuilderActionTypes => ({
	type: SET_LOADING,
	payload: { isLoading },
});
