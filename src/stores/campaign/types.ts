/**
 * Internal dependencies
 */
import type { Campaign } from '@quillcrm/client';
import { SET_CAMPAIGN, SET_ERROR, SET_LOADING, SET_SAVING, UPDATE_CAMPAIGN, UPDATE_SETTINGS } from './constants';

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

export type CampaignAction =
  | SetCampaignAction
  | UpdateCampaignAction
  | UpdateSettingsAction
  | SetLoadingAction
  | SetSavingAction
  | SetErrorAction;
