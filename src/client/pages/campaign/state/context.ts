/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import { Campaign } from '@quillcrm/client';

export const CampaignContext = createContext<{
	campaign: Campaign | null;
	isLoading: boolean;
	isSaving: boolean;
	setCampaign: (campaign: Campaign) => void;
	setIsLoading: (isLoading: boolean) => void;
	setIsSaving: (isSaving: boolean) => void;
	updateCampaign: (payload: Partial<Campaign>) => void;
	saveCampaign: (payload?: Partial<Campaign>) => void;
	updateSettings: (
		key: keyof Campaign['settings'],
		value: Campaign['settings'][keyof Campaign['settings']]
	) => void;
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
	updateCampaign: (_payload: Partial<Campaign>) => {
		throw new Error('updateCampaign() not implemented');
	},
	saveCampaign: (_payload?: Partial<Campaign>) => {
		throw new Error('saveCampaign() not implemented');
	},
	updateSettings: (
		_key: keyof Campaign['settings'],
		_value: Campaign['settings'][keyof Campaign['settings']]
	) => {
		throw new Error('updateSettings() not implemented');
	},
});

const Provider = CampaignContext.Provider;
const useCampaignContext = () => useContext(CampaignContext);

export { Provider, useCampaignContext };
