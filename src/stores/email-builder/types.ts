import { BlockType } from '../../builder/types';

export type ButtonType = 'primary' | 'secondary' | 'tertiary';

export interface ButtonSettings {
	font: string;
	size: number;
	letterSpacing: string;
	borderRadius: number;
	textColor: string;
	backgroundColor: string;
	borderWidth: number;
	borderColor: string;
	padding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strikethrough: boolean;
}

export interface LinkSettings {
	font: string;
	size: number;
	letterSpacing: string;
	color: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strikethrough: boolean;
}

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
	styles?: Record<string, any>;
}

export interface EmailSectionMeta {
	savedBlockId?: number;
	savedBlockVersion?: number;
}

export interface EmailSection {
	id: string;
	columns: EmailColumn[];
	styles?: Record<string, any>;
	meta?: EmailSectionMeta;
	conditions?: Array<{
		group: string;
		filter: string;
		operator: string;
		value: any;
	}>;
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
	backgroundPosition: string;
	canvasWidth: number;
}

export interface EmailAttachment {
	id: number;
	filename: string;
	mime: string;
	size: number;
}

export interface EmailBuilderState {
	sections: EmailSection[];
	selectedBlockId: string | null;
	selectedSectionId: string | null;
	selectedColumnId: string | null;
	draggedBlock: EmailBlock | null;
	globalSettings: GlobalEmailSettings;
	buttonSettings: Record<ButtonType, ButtonSettings>;
	linkSettings: LinkSettings;
	attachments: EmailAttachment[];
	isLoading: boolean;
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

export interface SelectSectionAction {
	type: 'SELECT_SECTION';
	payload: { sectionId: string };
}

export interface SelectColumnAction {
	type: 'SELECT_COLUMN';
	payload: { sectionId: string; columnId: string };
}

export interface ClearSelectionAction {
	type: 'CLEAR_SELECTION';
}

export interface UpdateColumnAction {
	type: 'UPDATE_COLUMN';
	payload: {
		sectionId: string;
		columnId: string;
		updates: Partial<Pick<EmailColumn, 'styles'>>;
	};
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
		styles?: Record<string, any>;
		conditions?: Array<{
			group: string;
			filter: string;
			operator: string;
			value: any;
		}>;
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

export interface UpdateButtonSettingsAction {
	type: 'UPDATE_BUTTON_SETTINGS';
	payload: {
		buttonType: ButtonType;
		settings: Partial<ButtonSettings>;
	};
}

export interface SetButtonSettingsAction {
	type: 'SET_BUTTON_SETTINGS';
	payload: {
		settings: Record<ButtonType, ButtonSettings>;
	};
}

export interface UpdateLinkSettingsAction {
	type: 'UPDATE_LINK_SETTINGS';
	payload: {
		settings: Partial<LinkSettings>;
	};
}

export interface SetLinkSettingsAction {
	type: 'SET_LINK_SETTINGS';
	payload: {
		settings: LinkSettings;
	};
}

export interface SetAttachmentsAction {
	type: 'SET_ATTACHMENTS';
	payload: {
		attachments: EmailAttachment[];
	};
}

export interface SetLoadingAction {
	type: 'SET_LOADING';
	payload: {
		isLoading: boolean;
	};
}

export type EmailBuilderActionTypes =
	| AddBlockAction
	| UpdateBlockAction
	| DeleteBlockAction
	| MoveBlockAction
	| SelectBlockAction
	| SelectSectionAction
	| SelectColumnAction
	| ClearSelectionAction
	| UpdateColumnAction
	| AddSectionAction
	| DeleteSectionAction
	| UpdateSectionAction
	| ReorderSectionsAction
	| SetBuilderStateAction
	| ResetBuilderAction
	| UpdateGlobalSettingsAction
	| UndoAction
	| RedoAction
	| UpdateButtonSettingsAction
	| SetButtonSettingsAction
	| UpdateLinkSettingsAction
	| SetLinkSettingsAction
	| SetAttachmentsAction
	| SetLoadingAction;
