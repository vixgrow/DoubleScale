/**
 * Internal dependencies
 */
import { SET_CAMPAIGN, UPDATE_CAMPAIGN, UPDATE_SETTINGS } from './constants';
import type { Campaign } from '../../types';

export type setCampaign = {
	type: typeof SET_CAMPAIGN;
	campaign: Campaign;
};

export type updateCampaign = {
	type: typeof UPDATE_CAMPAIGN;
	payload: {
		[key: string]: any;
	};
};

export type updateSettings = {
	type: typeof UPDATE_SETTINGS;
	key: string;
	value: any;
};

export type CampaignAction = setCampaign | updateCampaign | updateSettings;
