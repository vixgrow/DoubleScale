/**
 * Internal dependencies
 */
import { SET_CAMPAIGN, UPDATE_CAMPAIGN, UPDATE_SETTINGS } from './constants';
import type { Campaign } from '@quillcrm/client';

export type setCampaign = {
	type: typeof SET_CAMPAIGN;
	campaign: Campaign;
};

export type updateCampaign = {
	type: typeof UPDATE_CAMPAIGN;
	payload: Partial<Campaign>;
};

export type updateSettings = {
	type: typeof UPDATE_SETTINGS;
	key: keyof Campaign['settings'];
	value: Campaign['settings'][keyof Campaign['settings']];
};

export type CampaignAction = setCampaign | updateCampaign | updateSettings;
