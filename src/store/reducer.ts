/* eslint-disable no-nested-ternary */
/**
 * External dependencies
 */
import { cloneDeep, forEach } from 'lodash';
import type { Reducer } from 'redux';

/**
 * Internal Dependencies.
 */
import { SETUP_STORE, ADD_NOTICE, DELETE_NOTICE } from './constants';
import { CorePureState, CoreActionTypes } from './types';

// Initial State
const initialState: CorePureState = {
	notices: {},
	initialAccountData: {},
};

// Reducer.

/**
 * Reducer returning the core data object.
 *
 * @param {CorePureState}  state  Current state.
 * @param {CoreActionTypes} action Dispatched action.
 *
 * @return {CorePureState} Updated state.
 */
const reducer: Reducer<CorePureState, CoreActionTypes> = (
	state = initialState,
	action
) => {
	switch (action.type) {
		case SETUP_STORE: {
			const { initialPayload } = action;

			return {
				...state,
				initialAccountData: initialPayload,
			};
		}
		case ADD_NOTICE: {
			const { notice } = action;
			const randomId = () => Math.random().toString(36).substr(2, 9);
			const id = randomId();

			return {
				...state,
				notices: {
					[id]: notice,
				},
			};
		}
		case DELETE_NOTICE: {
			const { id } = action;
			const { notices } = state;
			const updatedNotices = cloneDeep(notices);
			// @ts-ignore.
			forEach(updatedNotices, (notice, noticeId) => {
				if (noticeId === id) {
					delete updatedNotices[noticeId];
				}
			});
			return {
				...state,
				notices: updatedNotices,
			};
		}
		default:
			return state;
	}
};

export type State = ReturnType<typeof reducer>;
export default reducer;
