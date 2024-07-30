/**
 * Internal dependencies
 */
import type { Campaign, Template } from '../../types';
import {
	SET_CAMPAIGN,
	UPDATE_CAMPAIGN,
	SET_TEMPLATE,
	UPDATE_TEMPLATE,
} from './constants';
import type { CampaignAction, TemplateAction } from './types';

export default (dispatch: React.Dispatch<CampaignAction | TemplateAction>) => {
	return {
		setCampaign: (campaign: Campaign) => {
			dispatch({
				type: SET_CAMPAIGN,
				campaign,
			});
		},
		updateCampaign: (payload: Record<string, any>) => {
			dispatch({
				type: UPDATE_CAMPAIGN,
				payload,
			});
		},
		setTemplate: (template: Template) => {
			dispatch({
				type: SET_TEMPLATE,
				template,
			});
		},
		updateTemplate: (payload: Record<string, any>) => {
			dispatch({
				type: UPDATE_TEMPLATE,
				payload,
			});
		},
	};
};
