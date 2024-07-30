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

export type setTemplate = {
	type: typeof SET_TEMPLATE;
	template: Template;
};

export type updateTemplate = {
	type: typeof UPDATE_TEMPLATE;
	payload: {
		[key: string]: any;
	};
};

export type CampaignAction = setCampaign | updateCampaign;

export type TemplateAction = setTemplate | updateTemplate;
