/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getCampaignEndpoint } from '@quillcrm/utils';
import {
	SET_CAMPAIGN,
	SET_ERROR,
	SET_LOADING,
	SET_SAVING,
	UPDATE_CAMPAIGN,
	UPDATE_SETTINGS
} from './constants';
import type { ExtendedCampaign } from './types';

/**
 * Set campaign data
 */
export const setCampaign = (campaign: ExtendedCampaign) => ({
	type: SET_CAMPAIGN,
	campaign,
});

/**
 * Update campaign data
 */
export const updateCampaign = (payload: Partial<ExtendedCampaign>) => ({
	type: UPDATE_CAMPAIGN,
	payload,
});

/**
 * Update campaign settings
 */
export const updateSettings = (
	key: keyof ExtendedCampaign['settings'],
	value: ExtendedCampaign['settings'][keyof ExtendedCampaign['settings']]
) => ({
	type: UPDATE_SETTINGS,
	key,
	value,
});

/**
 * Set loading state
 */
export const setLoading = (loading: boolean) => ({
	type: SET_LOADING,
	loading,
});

/**
 * Set saving state
 */
export const setSaving = (saving: boolean) => ({
	type: SET_SAVING,
	saving,
});

/**
 * Set error state
 */
export const setError = (error: string | null) => ({
	type: SET_ERROR,
	error,
});

/**
 * Fetch campaign from API
 */
export const fetchCampaign = (id: string) => async ({ dispatch }: any) => {
	dispatch(setLoading(true));
	dispatch(setError(null));

	try {
		const response = await apiFetch({
			path: `/qc/v1/campaigns/${id}`,
		}) as ExtendedCampaign;

		dispatch(setCampaign(response));
	} catch (error: any) {
		dispatch(setError(error.message || __('Failed to fetch campaign', 'quillcrm')));
	} finally {
		dispatch(setLoading(false));
	}
};

/**
 * Save campaign to API
 */
export const saveCampaign = (data: Partial<ExtendedCampaign> = {}) => async ({ select, dispatch }: any) => {
	const campaign = select.getCampaign();

	if (!campaign) {
		throw new Error(__('Campaign not loaded', 'quillcrm'));
	}

	dispatch(setSaving(true));
	dispatch(setError(null));

	try {
		const endpoint = getCampaignEndpoint(campaign.type);
		if (!endpoint) {
			throw new Error(__('Invalid campaign type', 'quillcrm'));
		}

		const response = await apiFetch({
			path: `${endpoint}/${campaign.id}`,
			method: 'PUT',
			data: {
				...campaign,
				...data,
			},
		}) as ExtendedCampaign;

		dispatch(setCampaign(response));
		return response;
	} catch (error: any) {
		dispatch(setError(error.message));
		throw error;
	} finally {
		dispatch(setSaving(false));
	}
};

/**
 * Save campaign step data to flattened settings structure
 */
export const saveCampaignStep = (step: string, stepData?: any) => async ({ select, dispatch }: any) => {
	const campaign = select.getCampaign();

	if (!campaign) {
		return false;
	}

	dispatch(setSaving(true));
	dispatch(setError(null));

	try {
		// Map step names to their corresponding data fields
		const stepDataMap: Record<string, string> = {
			'template': 'template_data',
			'contacts': 'contacts_data',
			'review': 'review_data',
		};

		const dataKey = stepDataMap[step];

		if (!dataKey) {
			throw new Error(__(`Invalid step: ${step}`, 'quillcrm'));
		}

		// Get existing step data for this specific step
		const existingStepData = (campaign.settings as any)[dataKey] || {};

		// Merge existing step data with new step data
		const updatedStepData = {
			...existingStepData,
			...stepData,
		};

		// Update settings with flattened structure
		const updatedSettings = {
			...campaign.settings,
			current_step: step,
			[dataKey]: updatedStepData,
		};

		const response = await apiFetch({
			path: `/qc/v1/campaigns/${campaign.id}`,
			method: 'POST',
			data: {
				...campaign,
				settings: updatedSettings,
			},
		}) as ExtendedCampaign;

		dispatch(setCampaign(response));
		return true;
	} catch (error: any) {
		dispatch(setError(error.message || __('Failed to save step data. Please try again.', 'quillcrm')));
		return false;
	} finally {
		dispatch(setSaving(false));
	}
};
