/**
 * Internal Dependencies
 */
import { State } from './reducer';
import { Notices, FormContext } from './types';

/**
 * Get notices.
 *
 * @param {State} state State.
 *
 * @return {Notices} Notices.
 */
export const getNotices = (state: State): Notices => {
	return state.notices;
};

/**
 * Get breadcrumbs.
 *
 * @param {State} state State.
 *
 * @return {Record<string, string>} Breadcrumbs.
 */
export const getBreadcrumbs = (state: State): Record<string, string> => {
	return state.breadcrumbs;
};

/**
 * Get merge tags visibility.
 *
 * @param {State} state State.
 *
 * @return {boolean} Merge tags visibility.
 */
export const getMergeTagsVisible = (state: State): boolean => {
	return state.mergeTagsVisible;
};

/**
 * Get current trigger.
 *
 * @param {State} state State.
 *
 * @return {string} Current trigger.
 */
export const getCurrentTrigger = (state: State): string => {
	return state.currentTrigger;
};

/**
 * Get merge tag callback.
 *
 * @param {State} state State.
 *
 * @return {((tagValue: string) => void) | null} Merge tag callback.
 */
export const getMergeTagCallback = (
	state: State
): ((tagValue: string) => void) | null => {
	return state.mergeTagCallback;
};

/**
 * Get form context.
 *
 * @param {State} state State.
 *
 * @return {FormContext | null} Form context.
 */
export const getFormContext = (state: State): FormContext | null => {
	return state.formContext;
};
