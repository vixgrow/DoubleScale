/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import { Campaign, Template } from '../../types';

export const CampaignContext = createContext<{
	campaign: Campaign | null;
	template: Template | null;
	isLoading: boolean;
	isSaving: boolean;
	setCampaign: (campaign: Campaign) => void;
	setIsLoading: (isLoading: boolean) => void;
	setIsSaving: (isSaving: boolean) => void;
	updateCampaign: (payload: { [key: string]: any }) => void;
	saveCampaign: () => void;
	setTemplate: (template: Template) => void;
	updateTemplate: (payload: { [key: string]: any }) => void;
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
	saveCampaign: () => {
		throw new Error('saveCampaign() not implemented');
	},
	template: null,
	setTemplate: (_template: Template) => {
		throw new Error('setTemplate() not implemented');
	},
	updateTemplate: (_payload: { [key: string]: any }) => {
		throw new Error('updateTemplate() not implemented');
	},
});

const Provider = CampaignContext.Provider;
const useCampaignContext = () => useContext(CampaignContext);

export { Provider, useCampaignContext };
