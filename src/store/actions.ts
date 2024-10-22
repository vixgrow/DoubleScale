/**
 * QuillSMTP Dependencies.
 */
import type { InitialPayload } from '@quillcrm/config';

/**
 * Internal Dependencies.
 */
import { SETUP_STORE, ADD_NOTICE, DELETE_NOTICE, SET_MERGE_TAGS_VISIBLE, SET_CURRENT_TRIGGER } from './constants';
import { CoreActionTypes, Notice } from './types';

/**
 * Setup Store Action.
 * @param {InitialPayload} initialPayload Initial payload object.
 * @returns {CoreActionTypes} Setup Store Action.
 */
export const setupStore = (
	initialPayload: InitialPayload
): CoreActionTypes => ({
	type: SETUP_STORE,
	initialPayload,
});

/**
 * Add Notice Action.
 * @param {Notice} notice Notice.
 * @returns {CoreActionTypes} Add Notice Action.
 */
export const createNotice = (notice: Notice): CoreActionTypes => ({
	type: ADD_NOTICE,
	notice,
});

/**
 * Delete Notice Action.
 * @param {string} id Notice ID.
 * @returns {CoreActionTypes} Delete Notice Action.
 */
export const deleteNotice = (id: string): CoreActionTypes => ({
	type: DELETE_NOTICE,
	id,
});

/**
 * Set Merge Tags Visibility Action.
 * @param {boolean} visible Visibility.
 * @returns {CoreActionTypes} Set Merge Tags Visibility Action.
 */
export const setMergeTagsVisible = (
	visible: boolean
): CoreActionTypes => ({
	type: SET_MERGE_TAGS_VISIBLE,
	visible,
});

/**
 * Set Current Trigger Action.
 * @param {string} trigger Trigger.
 * @returns {CoreActionTypes} Set Current Trigger Action.
 */
export const setCurrentTrigger = (
	trigger: string
): CoreActionTypes => ({
	type: SET_CURRENT_TRIGGER,
	trigger,
});