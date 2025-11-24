/**
 * External dependencies
 */
import { isObject } from 'lodash';
import type { Reducer } from 'redux';

/**
 * Internal dependencies
 */
import {
	RESET_CAMPAIGN,
	SET_CAMPAIGN,
	SET_ERROR,
	SET_LOADING,
	SET_SAVING,
	UPDATE_CAMPAIGN,
	UPDATE_SETTINGS
} from './constants';
import type { CampaignAction, CampaignState, ExtendedCampaignSettings } from './types';

// Initial State
const initialState: CampaignState = {
	campaign: null,
	loading: false,
	saving: false,
	errors: {},
};

/**
 * Reducer returning the campaign data object.
 */
const reducer: Reducer<CampaignState, CampaignAction> = (
	state = initialState,
	action
) => {
	switch (action.type) {
		case RESET_CAMPAIGN:
			return {
				...initialState,
			};

		case SET_CAMPAIGN:
			return {
				...state,
				campaign: action.campaign,
				errors: {},
			};

		case UPDATE_CAMPAIGN:
			return {
				...state,
				campaign: state.campaign ? {
					...state.campaign,
					...action.payload,
				} : null,
			};

		case UPDATE_SETTINGS:
			if (!state.campaign) {
				return state;
			}

			const newSettings: ExtendedCampaignSettings = isObject(state.campaign.settings)
				? { ...state.campaign.settings }
				: {
					templates: [],
					contacts: [],
					filters: [],
					ab_test: false,
					current_step: 'template',
				};

			(newSettings as any)[action.key] = action.value;

			return {
				...state,
				campaign: {
					...state.campaign,
					settings: newSettings,
				},
			};

		case SET_LOADING:
			return {
				...state,
				loading: action.loading,
			};

		case SET_SAVING:
			return {
				...state,
				saving: action.saving,
			};

		case SET_ERROR:
			return {
				...state,
				errors: action.error
					? { ...state.errors, general: action.error }
					: {},
			};

		default:
			return state;
	}
};

export type State = ReturnType<typeof reducer>;
export default reducer;
