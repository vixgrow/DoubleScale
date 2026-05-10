/**
 * Internal dependencies
 */
import type { Campaign } from '@doublescale/client';
import { RESET_CAMPAIGN, SET_CAMPAIGN, SET_ERROR, SET_LOADING, SET_SAVING, UPDATE_CAMPAIGN, UPDATE_SETTINGS } from './constants';

// Contacts step data
export interface ContactsStepData {
  filters: any[];
  contacts_count: number;
  selected_contacts?: number[];
  lastModified: string;
}

// Review step data
export interface ReviewStepData {
  send_time?: string;
  test_emails?: string[];
  final_review_completed?: boolean;
  lastModified: string;
}

// Extended Campaign Settings
export interface ExtendedCampaignSettings {
  templates: Campaign['settings']['templates'];
  contacts: Campaign['settings']['contacts'];
  filters: Campaign['settings']['filters'];
  ab_test: Campaign['settings']['ab_test'];
  automated?: Campaign['settings']['automated'];
  trigger?: Campaign['settings']['trigger'];
  current_step?: Campaign['settings']['current_step'];
  // Template IDs stored in array (for A/B testing support)
  template_ids?: number[];
  // Step-specific data
  contacts_data?: ContactsStepData;
  review_data?: ReviewStepData;
}

// Extended Campaign type with step-based settings
export interface ExtendedCampaign extends Omit<Campaign, 'settings'> {
  settings: ExtendedCampaignSettings;
}

export interface CampaignState {
  campaign: ExtendedCampaign | null;
  loading: boolean;
  saving: boolean;
  errors: Record<string, string>;
}

// Action types
export type SetCampaignAction = {
  type: typeof SET_CAMPAIGN;
  campaign: ExtendedCampaign;
};

export type UpdateCampaignAction = {
  type: typeof UPDATE_CAMPAIGN;
  payload: Partial<ExtendedCampaign>;
};

export type UpdateSettingsAction = {
  type: typeof UPDATE_SETTINGS;
  key: keyof ExtendedCampaignSettings;
  value: ExtendedCampaignSettings[keyof ExtendedCampaignSettings];
};

export type SetLoadingAction = {
  type: typeof SET_LOADING;
  loading: boolean;
};

export type SetSavingAction = {
  type: typeof SET_SAVING;
  saving: boolean;
};

export type SetErrorAction = {
  type: typeof SET_ERROR;
  error: string | null;
};

export type ResetCampaignAction = {
  type: typeof RESET_CAMPAIGN;
};

export type CampaignAction =
  | SetCampaignAction
  | ResetCampaignAction
  | UpdateCampaignAction
  | UpdateSettingsAction
  | SetLoadingAction
  | SetSavingAction
  | SetErrorAction;
