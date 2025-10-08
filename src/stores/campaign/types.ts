/**
 * Internal dependencies
 */
import type { Campaign } from '@quillcrm/client';
import { SET_CAMPAIGN, SET_ERROR, SET_LOADING, SET_SAVING, UPDATE_CAMPAIGN, UPDATE_SETTINGS } from './constants';

// Template step data - directly contains template fields without nesting
export interface TemplateStepData {
  name?: string;
  type?: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  body?: string;
  email_body?: {
    type: 'builder' | 'rich-text';
    value: any;
  };
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  preview_text?: string;
  enable_utm?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_name?: string;
  utm_term?: string;
  utm_content?: string;
  lastModified?: string;
  [key: string]: any; // Allow additional fields
}

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

// Extended Campaign Settings with flattened step data
export interface ExtendedCampaignSettings {
  templates: Campaign['settings']['templates'];
  contacts: Campaign['settings']['contacts'];
  filters: Campaign['settings']['filters'];
  ab_test: Campaign['settings']['ab_test'];
  current_step?: Campaign['settings']['current_step'];
  // Flattened step data - each step saves its data directly here
  template_data?: TemplateStepData;
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
