/**
 * WordPress dependencies
 */
import type { Campaign } from '@quillcrm/client';
import { getToLink, useNavigate } from '@quillcrm/navigation';
import { getCampaignEndpoint } from '@quillcrm/utils';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Custom hook for campaign step functionality
 * Provides consistent access to campaign data and actions across all steps
 */
export const useCampaignStep = () => {
  const navigate = useNavigate();

  // Selectors
  const campaign = useSelect(
    (select: any) => select('quillcrm/campaign').getCampaign(),
    []
  ) as Campaign | null;

  const loading = useSelect(
    (select: any) => select('quillcrm/campaign').isLoading(),
    []
  );

  const saving = useSelect(
    (select: any) => select('quillcrm/campaign').isSaving(),
    []
  );

  const currentStep = useSelect(
    (select: any) => select('quillcrm/campaign').getCurrentStep(),
    []
  );

  // Actions
  const dispatch = useDispatch('quillcrm/campaign');
  const { updateSettings, updateCampaign } = dispatch;

  /**
   * Navigate to a specific campaign step
   */
  type CampaignStatus = 'processed' | 'archived' | string;
  type CampaignWithStatus = Campaign & Partial<{ status: CampaignStatus }>;

  const goToStep = (step: string) => {
    if (!campaign) return;
    const status = (campaign as CampaignWithStatus)?.status;
    if (status === 'processed' || status === 'archived') {
      // Lock steps: show overview details only
      navigate(getToLink(`campaigns/${campaign.id}/overview`));
      return;
    }
    navigate(getToLink(`campaigns/${campaign.id}/${step}`));
  };

  /**
   * Save campaign step data
   * Properly typed wrapper around the dispatch action
   */
  const saveCampaignStep = async (step: string, stepData?: any): Promise<boolean> => {
    return (dispatch.saveCampaignStep(step, stepData) as any) as Promise<boolean>;
  };

  /**
   * Save current step data and navigate to next step
   */
  const saveAndGoToStep = async (
    step: string,
    nextStep: string,
    stepData?: any
  ): Promise<boolean> => {
    const success = await saveCampaignStep(step, stepData);
    if (success) {
      goToStep(nextStep);
      return true;
    }
    return false;
  };

  /**
   * Shared method to save campaign settings via API
   * This centralizes the campaign update logic to avoid duplication
   */
  const saveCampaignSettings = async (data: Partial<Campaign>) => {
    if (!campaign) {
      throw new Error(__('Campaign not loaded', 'quillcrm'));
    }

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
    });

    // Update Redux store with new campaign data
    updateCampaign(response as any);

    return response;
  };

  return {
    // State
    campaign,
    loading,
    saving,
    currentStep,

    // Actions
    saveCampaignStep,
    updateSettings,
    updateCampaign,
    saveCampaignSettings,

    // Navigation helpers
    goToStep,
    saveAndGoToStep,
  };
};

