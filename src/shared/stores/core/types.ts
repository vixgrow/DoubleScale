/**
 * QuillSMTP Dependencies.
 */
import type { InitialPayload } from '@doublescale/config';

/**
 * Internal Dependencies.
 */
import {
	ADD_NOTICE,
	DELETE_NOTICE,
	SET_BREADCRUMBS,
	SET_CURRENT_TRIGGER,
	SET_FORM_CONTEXT,
	SET_MERGE_TAG_CALLBACK,
	SET_MERGE_TAGS_VISIBLE,
	SETUP_STORE,
} from './constants';

export type CorePureState = {
	notices: Notices;
	initialAccountData: InitialAccountData;
	breadcrumbs: Record<string, string>;
	mergeTagsVisible: boolean;
	currentTrigger: string;
	mergeTagCallback?: ((tagValue: string) => void) | null;
	formContext?: FormContext | null;
};

export type FormContext = {
	formId?: string | number;
	triggerId?: string;
	automationId?: string | number;
	postId?: string | number; // For Elementor forms (source/page ID)
};

export type InitialAccountData = {
	[key: string]: string;
};

export type Notices = {
	[noteId: string]: Notice;
};

export type Notice = {
	type: string;
	duration?: number;
	message: string;
	placement?: string;
};

interface setupStoreAction {
	type: typeof SETUP_STORE;
	initialPayload: InitialPayload;
}
type addNote = {
	type: typeof ADD_NOTICE;
	notice: Notice;
};

type deleteNote = {
	type: typeof DELETE_NOTICE;
	id: string;
};

export type setBreadcrumbs = {
	type: typeof SET_BREADCRUMBS;
	breadcrumbs: Record<string, string>;
};

export type setMergeTagsVisible = {
	type: typeof SET_MERGE_TAGS_VISIBLE;
	visible: boolean;
};

export type setCurrentTrigger = {
	type: typeof SET_CURRENT_TRIGGER;
	trigger: string;
};

export type setMergeTagCallback = {
	type: typeof SET_MERGE_TAG_CALLBACK;
	callback: ((tagValue: string) => void) | null;
};

export type setFormContext = {
	type: typeof SET_FORM_CONTEXT;
	context: FormContext | null;
};

export type CoreActionTypes =
	| setupStoreAction
	| addNote
	| deleteNote
	| setBreadcrumbs
	| setMergeTagsVisible
	| setCurrentTrigger
	| setMergeTagCallback
	| setFormContext
	| ReturnType<() => { type: 'NOOP' }>;

