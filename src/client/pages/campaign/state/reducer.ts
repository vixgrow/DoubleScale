/**
 * WordPress Dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * External dependencies
 */
import type { Reducer } from 'redux';

/**
 * Internal dependencies
 */
import {
	SET_CAMPAIGN,
	UPDATE_CAMPAIGN,
	SET_TEMPLATE,
	UPDATE_TEMPLATE,
} from './constants';

import type { Campaign, Template } from '../../types';

import type { CampaignAction, TemplateAction } from './types';

const campaign = (state: Campaign | null = null, action: CampaignAction) => {
	switch (action.type) {
		case SET_CAMPAIGN:
			return action.campaign;
		case UPDATE_CAMPAIGN:
			return {
				...state,
				...action.payload,
			};
		default:
			return state;
	}
};

const template = (state: Template | null = null, action: TemplateAction) => {
	switch (action.type) {
		case SET_TEMPLATE:
			return action.template;
		case UPDATE_TEMPLATE:
			return {
				...state,
				...action.payload,
			};
		default:
			return state;
	}
};

const CombinedReducer: Reducer = combineReducers({
	campaign,
	template,
});

export type State = ReturnType<typeof CombinedReducer>;
export default CombinedReducer;
