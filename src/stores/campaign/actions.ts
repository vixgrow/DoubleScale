/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	RESET_CAMPAIGN,
	SET_CAMPAIGN,
	SET_ERROR,
	SET_LOADING,
	SET_SAVING,
	UPDATE_CAMPAIGN,
	UPDATE_SETTINGS,
} from './constants';
import type { ExtendedCampaign } from './types';

/**
 * Reset campaign state
 */
export const resetCampaign = () => ({
	type: RESET_CAMPAIGN,
});

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
export const fetchCampaign =
	(id: string, campaignType?: string) =>
		async ({ dispatch }: any) => {
			dispatch(setLoading(true));
			dispatch(setError(null));

			try {
				// Use unified endpoint for all campaign types
				const response = (await apiFetch({
					path: `/qc/v1/campaigns/${id}`,
				})) as ExtendedCampaign;

				dispatch(setCampaign(response));
			} catch (error: any) {
				dispatch(
					setError(
						error.message || __('Failed to fetch campaign', 'quillcrm')
					)
				);
			} finally {
				dispatch(setLoading(false));
			}
		};

/**
 * Save campaign to API
 */
export const saveCampaign =
	(data: Partial<ExtendedCampaign> = {}) =>
		async ({ select, dispatch }: any) => {
			const campaign = select.getCampaign();

			if (!campaign) {
				throw new Error(__('Campaign not loaded', 'quillcrm'));
			}

			dispatch(setSaving(true));
			dispatch(setError(null));

			try {
				// Use unified endpoint - type is auto-detected from campaign
				const response = (await apiFetch({
					path: `/qc/v1/campaigns/${campaign.id}`,
					method: 'PUT',
					data: {
						...campaign,
						...data,
					},
				})) as ExtendedCampaign;

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
 * Save campaign step data
 */
export const saveCampaignStep =
	(step: string, stepData?: any) =>
		async ({ select, dispatch }: any) => {
			const campaign = select.getCampaign();

			if (!campaign) {
				return false;
			}

			dispatch(setSaving(true));
			dispatch(setError(null));

			try {
				let updatedSettings = { ...campaign.settings, current_step: step };
				delete updatedSettings.templates;

				// Handle template step - add template_id to template_ids array
				if (step === 'template' && stepData?.template_id) {
					const templateIds = campaign.settings.template_ids || [];
					const newTemplateIds =
						templateIds.length > 0
							? [stepData.template_id, ...templateIds.slice(1)]
							: [stepData.template_id];

					updatedSettings.template_ids = newTemplateIds;
				}

				// Handle other steps with data
				if (stepData) {
					const stepDataMap: Record<string, string> = {
						contacts: 'contacts_data',
						review: 'review_data',
					};

					const dataKey = stepDataMap[step];

					if (dataKey) {
						const existingStepData =
							(campaign.settings)[dataKey] || {};

						const updatedStepData = {
							...existingStepData,
							...stepData,
						};

						(updatedSettings)[dataKey] = updatedStepData;
					}
				}

				// Use unified endpoint - type is auto-detected from campaign
				const response = (await apiFetch({
					path: `/qc/v1/campaigns/${campaign.id}`,
					method: 'PUT',
					data: {
						...campaign,
						settings: updatedSettings,
					},
				})) as ExtendedCampaign;

				dispatch(setCampaign(response));
				return true;
			} catch (error: any) {
				dispatch(
					setError(
						error.message ||
						__(
							'Failed to save step data. Please try again.',
							'quillcrm'
						)
					)
				);
				return false;
			} finally {
				dispatch(setSaving(false));
			}
		};
