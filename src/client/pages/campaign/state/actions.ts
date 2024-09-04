/**
 * Internal dependencies
 */
import type { Campaign } from '@quillcrm/client';
import { SET_CAMPAIGN, UPDATE_CAMPAIGN, UPDATE_SETTINGS } from './constants';
import type { CampaignAction } from './types';

export default (dispatch: React.Dispatch<CampaignAction>) => {
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
		updateSettings: (key: string, value: any) => {
			dispatch({
				type: UPDATE_SETTINGS,
				key,
				value,
			});
		},
	};
};
