/**
 * Internal dependencies
 */
import type { State } from './reducer';
import type { ExtendedCampaign } from './types';

/**
 * Get campaign data
 */
export const getCampaign = (state: State): ExtendedCampaign | null => {
  return state.campaign;
};

/**
 * Get loading state
 */
export const isLoading = (state: State): boolean => {
  return state.loading;
};

/**
 * Get saving state
 */
export const isSaving = (state: State): boolean => {
  return state.saving;
};

/**
 * Get error state
 */
export const getError = (state: State): string | null => {
  return state.error;
};

/**
 * Get current step
 */
export const getCurrentStep = (state: State): string => {
  return state.campaign?.settings?.current_step || 'template';
};

/**
 * Get step data for a specific step
 */
export const getStepData = (state: State, step: string): any => {
  return state.campaign?.settings?.steps?.[step] || {};
};

/**
 * Get all step data
 */
export const getAllStepData = (state: State): any => {
  return state.campaign?.settings?.steps || {};
};

/**
 * Check if a step has data
 */
export const hasStepData = (state: State, step: string): boolean => {
  const stepData = getStepData(state, step);
  return Object.keys(stepData).length > 0;
};

/**
 * Get campaign settings
 */
export const getCampaignSettings = (state: State): ExtendedCampaign['settings'] => {
  return state.campaign?.settings || {
    templates: [],
    contacts: [],
    filters: [],
    ab_test: false,
    current_step: 'template',
  };
};

/**
 * Check if campaign can proceed to next step
 */
export const canGoToStep = (state: State, step: string): boolean => {
  const campaign = state.campaign;

  if (!campaign) {
    return false;
  }

  switch (step) {
    case 'template':
      return !!campaign.name;
    case 'builder':
      return hasStepData(state, 'template') && !!campaign.name;
    case 'contacts':
      return hasStepData(state, 'template') && !!campaign.name;
    case 'review':
      return hasStepData(state, 'contacts') && hasStepData(state, 'template');
    default:
      return true;
  }
};
