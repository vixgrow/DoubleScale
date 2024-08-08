/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import { Campaign } from '../../types';

export const CampaignContext = createContext<{
	campaign: Campaign | null;
	isLoading: boolean;
	isSaving: boolean;
	setCampaign: (campaign: Campaign) => void;
	setIsLoading: (isLoading: boolean) => void;
	setIsSaving: (isSaving: boolean) => void;
	updateCampaign: (payload: { [key: string]: any }) => void;
	saveCampaign: () => void;
	updateSettings: (key: string, value: any) => void;
}>({
	campaign: null,
	isLoading: false,
	isSaving: false,
	setCampaign: (_campaign: Campaign) => {
		throw new Error('setCampaign() not implemented');
	},
	setIsLoading: (_isLoading: boolean) => {
		throw new Error('setIsLoading() not implemented');
	},
	setIsSaving: (_isSaving: boolean) => {
		throw new Error('setIsSaving() not implemented');
	},
	updateCampaign: (_payload: { [key: string]: any }) => {
		throw new Error('updateCampaign() not implemented');
	},
	saveCampaign: (_payload?: { [key: string]: any }) => {
		throw new Error('saveCampaign() not implemented');
	},
	updateSettings: (_key: string, _value: any) => {
		throw new Error('updateSettings() not implemented');
	},
});

const Provider = CampaignContext.Provider;
const useCampaignContext = () => useContext(CampaignContext);

export { Provider, useCampaignContext };
