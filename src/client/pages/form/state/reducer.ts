/**
 * WordPress Dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * External dependencies
 */
import type { Reducer } from 'redux';
import { isObject } from 'lodash';

/**
 * Internal dependencies
 */
import { SET_FORM, UPDATE_FORM, UPDATE_SETTINGS } from './constants';
import type { Form } from '@quillcrm/client';
import type { FormAction } from './types';

const form = (state: Form | null = null, action: FormAction) => {
	switch (action.type) {
		case SET_FORM:
			return action.form;
		case UPDATE_FORM:
			return {
				...state,
				...action.payload,
			};
		case UPDATE_SETTINGS:
			if (!state) {
				return state;
			}
			const newSettings = isObject(state.data) ? { ...state.data } : {};

			newSettings[action.key] = action.value;

			return {
				...state,
				data: newSettings,
			};
		default:
			return state;
	}
};

const CombinedReducer: Reducer = combineReducers({
	form,
});

export type State = ReturnType<typeof CombinedReducer>;
export default CombinedReducer;
