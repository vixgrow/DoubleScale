/**
 * WordPress dependencies
 */
import type { Campaign } from '@doublescale/client';
import { getToLink, useLocation, useNavigate } from '@doublescale/navigation';
import { getCampaignEndpoint } from '@doublescale/utils';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Custom hook for campaign step functionality
 * Provides consistent access to campaign data and actions across all steps
 */
export const useCampaignStep = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isNewCampaign = !!(location.state as any)?.isNew;

  // Selectors
  const campaign = useSelect(
    (select: any) => select('doublescale/campaign').getCampaign(),
    []
  ) as Campaign | null;

  const loading = useSelect(
    (select: any) => select('doublescale/campaign').isLoading(),
    []
  );

  const saving = useSelect(
    (select: any) => select('doublescale/campaign').isSaving(),
    []
  );

  const currentStep = useSelect(
    (select: any) => select('doublescale/campaign').getCurrentStep(),
    []
  );

  // Actions
  const dispatch = useDispatch('doublescale/campaign');
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
      navigate(getToLink(`campaigns/${campaign.id}/overview`));
      return;
    }
    const navOptions = isNewCampaign ? { state: { isNew: true } } : undefined;
    navigate(getToLink(`campaigns/${campaign.id}/${step}`), navOptions);
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
      throw new Error(__('Campaign not loaded', 'doublescale'));
    }

    const endpoint = getCampaignEndpoint(campaign.type);
    if (!endpoint) {
      throw new Error(__('Invalid campaign type', 'doublescale'));
    }

    const cleanSettings = { ...campaign.settings, ...(data.settings || {}) };
    delete (cleanSettings as any).templates;
    delete (cleanSettings as any).is_attached;

    const response = await apiFetch({
      path: `${endpoint}/${campaign.id}`,
      method: 'PUT',
      data: {
        ...campaign,
        ...data,
        settings: cleanSettings,
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
    isNewCampaign,

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

