import { BlockType } from '../../builder/types';

export interface EmailBlock {
	id: string;
	type: BlockType;
	props: Record<string, any>;
	styles?: Record<string, any>;
}

export interface EmailColumn {
	id: string;
	width: number; // Percentage (e.g., 50 for 50%)
	blocks: EmailBlock[];
}

export interface EmailSection {
	id: string;
	columns: EmailColumn[];
	styles?: Record<string, any>;
}

export interface GlobalEmailSettings {
	canvasColor: string;
	backgroundImage: {
		id: number;
		name: string;
		url: string;
		size: number;
	} | null;
	backgroundRepeat: string;
	backgroundSize: string;
	canvasWidth: number;
}

export interface EmailBuilderState {
	sections: EmailSection[];
	selectedBlockId: string | null;
	selectedSectionId: string | null;
	selectedColumnId: string | null;
	draggedBlock: EmailBlock | null;
	globalSettings: GlobalEmailSettings;
	history: {
		past: EmailSection[][];
		present: EmailSection[];
		future: EmailSection[][];
	};
}

// Action types
export interface AddBlockAction {
	type: 'ADD_BLOCK';
	payload: {
		sectionId: string;
		columnId: string;
		block: EmailBlock;
		index?: number;
	};
}

export interface UpdateBlockAction {
	type: 'UPDATE_BLOCK';
	payload: {
		blockId: string;
		props: Record<string, any>;
	};
}

export interface DeleteBlockAction {
	type: 'DELETE_BLOCK';
	payload: {
		blockId: string;
	};
}

export interface MoveBlockAction {
	type: 'MOVE_BLOCK';
	payload: {
		blockId: string;
		fromSectionId: string;
		fromColumnId: string;
		toSectionId: string;
		toColumnId: string;
		toIndex: number;
	};
}

export interface SelectBlockAction {
	type: 'SELECT_BLOCK';
	payload: {
		blockId: string;
		sectionId?: string;
		columnId?: string;
	};
}

export interface ClearSelectionAction {
	type: 'CLEAR_SELECTION';
}

export interface AddSectionAction {
	type: 'ADD_SECTION';
	payload: {
		section: EmailSection;
		index?: number;
	};
}

export interface DeleteSectionAction {
	type: 'DELETE_SECTION';
	payload: {
		sectionId: string;
	};
}

export interface UpdateSectionAction {
	type: 'UPDATE_SECTION';
	payload: {
		sectionId: string;
		styles: Record<string, any>;
	};
}

export interface ReorderSectionsAction {
	type: 'REORDER_SECTIONS';
	payload: {
		activeSectionId: string;
		overSectionId: string;
	};
}

export interface SetBuilderStateAction {
	type: 'SET_BUILDER_STATE';
	payload: {
		sections: EmailSection[];
	};
}

export interface ResetBuilderAction {
	type: 'RESET_BUILDER';
}

export interface UpdateGlobalSettingsAction {
	type: 'UPDATE_GLOBAL_SETTINGS';
	payload: {
		settings: Partial<GlobalEmailSettings>;
	};
}

export interface UndoAction {
	type: 'UNDO';
}

export interface RedoAction {
	type: 'REDO';
}

export type EmailBuilderActionTypes =
	| AddBlockAction
	| UpdateBlockAction
	| DeleteBlockAction
	| MoveBlockAction
	| SelectBlockAction
	| ClearSelectionAction
	| AddSectionAction
	| DeleteSectionAction
	| UpdateSectionAction
	| ReorderSectionsAction
	| SetBuilderStateAction
	| ResetBuilderAction
	| UpdateGlobalSettingsAction
	| UndoAction
	| RedoAction;
