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
import { SET_CAMPAIGN, UPDATE_CAMPAIGN, UPDATE_SETTINGS } from './constants';
import type { Campaign } from '../../types';
import type { CampaignAction } from './types';

const campaign = (state: Campaign | null = null, action: CampaignAction) => {
	switch (action.type) {
		case SET_CAMPAIGN:
			return action.campaign;
		case UPDATE_CAMPAIGN:
			return {
				...state,
				...action.payload,
			};
		case UPDATE_SETTINGS:
			if (!state) {
				return state;
			}
			const newSettings = isObject(state.settings)
				? { ...state.settings }
				: {};

			newSettings[action.key] = action.value;

			return {
				...state,
				settings: newSettings,
			};
		default:
			return state;
	}
};

const CombinedReducer: Reducer = combineReducers({
	campaign,
});

export type State = ReturnType<typeof CombinedReducer>;
export default CombinedReducer;
