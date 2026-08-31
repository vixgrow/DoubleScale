import type {
	ButtonSettings,
	ButtonType,
	EmailBlock,
	EmailBuilderState,
	EmailColumn,
	EmailSection,
	GlobalEmailSettings,
	LinkSettings,
} from './types';

// Section selectors
export const getSections = (state: EmailBuilderState): EmailSection[] => {
	return state.sections;
};

export const getSectionById = (
	state: EmailBuilderState,
	sectionId: string
): EmailSection | undefined => {
	return state.sections.find((section) => section.id === sectionId);
};

// Column selectors
export const getColumnById = (
	state: EmailBuilderState,
	sectionId: string,
	columnId: string
): EmailColumn | undefined => {
	const section = getSectionById(state, sectionId);
	return section?.columns.find((column) => column.id === columnId);
};

// Block selectors
export const getAllBlocks = (state: EmailBuilderState): EmailBlock[] => {
	const blocks: EmailBlock[] = [];

	state.sections.forEach((section) => {
		section.columns.forEach((column) => {
			blocks.push(...column.blocks);
		});
	});

	return blocks;
};

export const getBlockById = (
	state: EmailBuilderState,
	blockId: string
): EmailBlock | undefined => {
	return getAllBlocks(state).find((block) => block.id === blockId);
};

export const getBlockLocation = (state: EmailBuilderState, blockId: string) => {
	for (const section of state.sections) {
		for (const column of section.columns) {
			const blockIndex = column.blocks.findIndex(
				(block) => block.id === blockId
			);
			if (blockIndex !== -1) {
				return {
					sectionId: section.id,
					columnId: column.id,
					blockIndex,
				};
			}
		}
	}
	return null;
};

// Selection selectors
export const getSelectedBlockId = (state: EmailBuilderState): string | null => {
	return state.selectedBlockId;
};

export const getSelectedBlock = (
	state: EmailBuilderState
): EmailBlock | undefined => {
	if (!state.selectedBlockId) return undefined;
	return getBlockById(state, state.selectedBlockId);
};

export const getSelectedSectionId = (
	state: EmailBuilderState
): string | null => {
	return state.selectedSectionId;
};

export const getSelectedSection = (
	state: EmailBuilderState
): EmailSection | undefined => {
	if (!state.selectedSectionId) return undefined;
	return getSectionById(state, state.selectedSectionId);
};

export const getSelectedColumnId = (
	state: EmailBuilderState
): string | null => {
	return state.selectedColumnId;
};

// Drag & Drop selectors
export const getDraggedBlock = (
	state: EmailBuilderState
): EmailBlock | null => {
	return state.draggedBlock;
};

// History selectors
export const getHistory = (state: EmailBuilderState) => {
	return state.history;
};

export const canUndo = (state: EmailBuilderState): boolean => {
	return state.history.past.length > 0;
};

export const canRedo = (state: EmailBuilderState): boolean => {
	return state.history.future.length > 0;
};

// Global settings selectors
export const getGlobalSettings = (
	state: EmailBuilderState
): GlobalEmailSettings => {
	return state.globalSettings;
};

// Button settings selectors
export const getAllButtonSettings = (
	state: EmailBuilderState
): Record<ButtonType, ButtonSettings> => {
	return state.buttonSettings;
};

export const getAttachments = (state: EmailBuilderState) => {
	return state.attachments;
};

export const getButtonSettings = (
	state: EmailBuilderState,
	buttonType: ButtonType
): ButtonSettings => {
	return state.buttonSettings[buttonType];
};

export const getLinkSettings = (state: EmailBuilderState): LinkSettings => {
	return state.linkSettings;
};

// Loading selectors
export const getIsLoading = (state: EmailBuilderState): boolean => {
	return state.isLoading;
};
