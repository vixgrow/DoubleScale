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
 * Get error for a specific operation
 */
export const getError = (state: State, errorKey: string = 'general'): string => {
  return state.errors[errorKey] || '';
};

/**
 * Get all errors
 */
export const getErrors = (state: State): Record<string, string> => {
  return state.errors;
};

/**
 * Get current step
 */
export const getCurrentStep = (state: State): string => {
  const isAutomated = state.campaign?.settings?.automated === true;
  const stored = state.campaign?.settings?.current_step;

  if (!stored) {
    return isAutomated ? 'trigger' : 'template';
  }

  return stored;
};

/**
 * Get step data for a specific step
 */
export const getStepData = (state: State, step: string): any => {
  const settings = state.campaign?.settings;
  if (!settings) return {};

  // For template step, return the first template_id from the array
  if (step === 'template') {
    const templateIds = settings.template_ids || [];
    return {
      template_id: templateIds.length > 0 ? templateIds[0] : undefined,
    };
  }

  // Map other step names to their corresponding data fields
  const stepDataMap: Record<string, string> = {
    'contacts': 'contacts_data',
    'review': 'review_data',
  };

  const dataKey = stepDataMap[step];
  return dataKey ? (settings as any)[dataKey] || {} : {};
};

/**
 * Get all step data in a single object
 */
export const getAllStepData = (state: State): any => {
  const settings = state.campaign?.settings;
  if (!settings) return {};

  const templateIds = settings.template_ids || [];

  return {
    template: {
      template_id: templateIds.length > 0 ? templateIds[0] : undefined,
    },
    contacts: settings.contacts_data || {},
    review: settings.review_data || {},
  };
};

/**
 * Check if a step has data
 */
export const hasStepData = (state: State, step: string): boolean => {
  const settings = state.campaign?.settings;
  if (!settings) return false;

  // For template step, check if template_ids array has entries
  if (step === 'template') {
    return (settings.template_ids || []).length > 0;
  }

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
    case 'email-templates':
      return hasStepData(state, 'template') && !!campaign.name;
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
