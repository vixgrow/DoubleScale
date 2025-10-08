/**
 * Internal dependencies
 */
import type { Campaign } from '@quillcrm/client';
import { SET_CAMPAIGN, SET_ERROR, SET_LOADING, SET_SAVING, UPDATE_CAMPAIGN, UPDATE_SETTINGS } from './constants';

export interface CampaignStepData {
  template?: {
    // Template data is now stored directly in the template object
    // with email_body containing builder or rich-text content
    [key: string]: any;
    lastModified: string;
  };
  contacts?: {
    filters: any[];
    contacts_count: number;
    selected_contacts?: number[];
    lastModified: string;
  };
  review?: {
    send_time?: string;
    test_emails?: string[];
    final_review_completed?: boolean;
    lastModified: string;
  };
}

// Extended Campaign Settings to support step-based data
export interface ExtendedCampaignSettings {
  templates: Campaign['settings']['templates'];
  contacts: Campaign['settings']['contacts'];
  filters: Campaign['settings']['filters'];
  ab_test: Campaign['settings']['ab_test'];
  current_step?: Campaign['settings']['current_step'];
  steps?: CampaignStepData;
}

// Extended Campaign type with step-based settings
export interface ExtendedCampaign extends Omit<Campaign, 'settings'> {
  settings: ExtendedCampaignSettings;
}

export interface CampaignState {
  campaign: ExtendedCampaign | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
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
