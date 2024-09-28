/* eslint-disable jsdoc/check-line-alignment */
import type {
	ConfigData,
	Forms,
	CustomFieldsTypes,
	FiltersGroups,
	ContactFieldsGroups,
	Integrations,
	AutomationTriggers,
	AutomationActions,
	AutomationGoals,
	AutomationRules,
} from './types/config-data';
import { InitialPayload } from './types/initial-payload';

const configData: ConfigData = {
	initialPayload: {
		business: {
			business_name: '',
			business_address: '',
		},
		email: {
			from_name: '',
			from_email: '',
			reply_to: '',
			email_footer: '',
			max_in_second: 0,
			max_in_day: 0,
		},
		double_optin: {
			email_subject: '',
			email_content: '',
			after_confirmation: '',
			confirmation_message: '',
			confirmation_redirect: '',
		},
	},
	blogName: '',
	adminUrl: '',
	pluginDirUrl: '',
	adminEmail: '',
	ajaxUrl: '',
	nonce: '',
	forms: {},
	customFieldsTypes: {},
	filtersGroups: {
		contact: {
			name: '',
			filters: {},
		},
	},
	contactFieldsGroups: {},
	integrations: {},
	automationTriggers: {},
	automationActions: {},
	automationGoals: {},
	automationRules: {},
	isWoocommerceActive: false,
};

/**
 * Returns configuration value for given key
 *
 * If the requested key isn't defined in the configuration
 * data then this will report the failure with either an
 * error or a console warning.

 * @param {ConfigData} data Configurat data.
 * @returns A function that gets the value of property named by the key
 */
const config =
	(data: ConfigData) =>
	<T>(key: string): T | undefined => {
		if (key in data) {
			return data[key] as T;
		}
		return undefined;
	};

/**
 * set initial builder payload
 *
 * @param data the json environment configuration to use for getting config values
 */
const setInitialPayload = (data: ConfigData) => (value: InitialPayload) => {
	data.initialPayload = value;
};

/**
 * Get initial builder payload
 *
 * @param data the json environment configuration to use for getting config values
 */
const getInitialPayload = (data: ConfigData) => (): InitialPayload => {
	return data.initialPayload;
};

/**
 * Get blog name
 *
 * @param data the json environment configuration to use for getting config values
 * @returns string
 */
const getBlogName = (data: ConfigData) => (): string => {
	return data.blogName;
};

/**
 * Set blog name
 *
 * @param data the json environment configuration to use for getting config values
 */
const setBlogName = (data: ConfigData) => (value: string) => {
	data.blogName = value;
};

/**
 * Get admin url
 *
 * @param data the json environment configuration to use for getting config values
 */
const getAdminUrl = (data: ConfigData) => (): string => {
	return data.adminUrl;
};

/**
 * Set admin url
 *
 * @param data the json environment configuration to use for getting config values
 */
const setAdminUrl = (data: ConfigData) => (value: string) => {
	data.adminUrl = value;
};

/**
 * Get admin email
 *
 * @param data the json environment configuration to use for getting config values
 */
const getAdminEmail = (data: ConfigData) => (): string => {
	return data.adminEmail;
};

/**
 * Set admin email
 *
 * @param data the json environment configuration to use for getting config values
 */
const setAdminEmail = (data: ConfigData) => (value: string) => {
	data.adminEmail = value;
};

/**
 * Get ajax url
 *
 * @param data the json environment configuration to use for getting config values
 */
const getAjaxUrl = (data: ConfigData) => (): string => {
	return data.ajaxUrl;
};

/**
 * Set ajax url
 *
 * @param data the json environment configuration to use for getting config values
 */
const setAjaxUrl = (data: ConfigData) => (value: string) => {
	data.ajaxUrl = value;
};

/**
 * Get nonce
 *
 * @param data the json environment configuration to use for getting config values
 */
const getNonce = (data: ConfigData) => (): string => {
	return data.nonce;
};

/**
 * Set nonce
 *
 * @param data the json environment configuration to use for getting config values
 */
const setNonce = (data: ConfigData) => (value: string) => {
	data.nonce = value;
};

/**
 * Get plugin dir url
 *
 * @param data the json environment configuration to use for getting config values
 */
const getPluginDirUrl = (data: ConfigData) => (): string => {
	return data.pluginDirUrl;
};

/**
 * Set plugin dir url
 *
 * @param data the json environment configuration to use for getting config values
 */
const setPluginDirUrl = (data: ConfigData) => (value: string) => {
	data.pluginDirUrl = value;
};

/**
 * Get forms
 *
 * @param data the json environment configuration to use for getting config values
 * @returns Forms
 */
export const getForms = (data: ConfigData): Forms => {
	return data.forms;
};

/**
 * Set forms
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setForms = (data: ConfigData) => (value: Forms) => {
	data.forms = value;
};

/**
 * Get custom fields types
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns CustomFieldsTypes
 */
export const getCustomFieldsTypes = (data: ConfigData): CustomFieldsTypes => {
	return data.customFieldsTypes;
};

/**
 * Set custom fields types
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setCustomFieldsTypes =
	(data: ConfigData) => (value: CustomFieldsTypes) => {
		data.customFieldsTypes = value;
	};

/**
 * Get filters groups
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns FiltersGroups
 */
export const getFiltersGroups = (data: ConfigData): FiltersGroups => {
	return data.filtersGroups;
};

/**
 * Set filters groups
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setFiltersGroups =
	(data: ConfigData) => (value: FiltersGroups) => {
		data.filtersGroups = value;
	};

/**
 * Get contact fields groups
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns ContactFieldsGroups
 */
export const getContactFieldsGroups = (
	data: ConfigData
): ContactFieldsGroups => {
	return data.contactFieldsGroups;
};

/**
 * Set contact fields groups
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setContactFieldsGroups =
	(data: ConfigData) => (value: ContactFieldsGroups) => {
		data.contactFieldsGroups = value;
	};

/**
 * Get integrations
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns Integrations
 */
export const getIntegrations = (data: ConfigData): Integrations => {
	return data.integrations;
};

/**
 * Set integrations
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setIntegrations = (data: ConfigData) => (value: Integrations) => {
	data.integrations = value;
};

/**
 * Get automation triggers
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns AutomationTriggers
 */
export const getAutomationTriggers = (data: ConfigData): AutomationTriggers => {
	return data.automationTriggers;
};

/**
 * Set automation triggers
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setAutomationTriggers =
	(data: ConfigData) => (value: AutomationTriggers) => {
		data.automationTriggers = value;
	};

/**
 * Get automation actions
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns AutomationActions
 */
export const getAutomationActions = (data: ConfigData): AutomationActions => {
	return data.automationActions;
};

/**
 * Set automation actions
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setAutomationActions =
	(data: ConfigData) => (value: AutomationActions) => {
		data.automationActions = value;
	};

/**
 * Get automation goals
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns AutomationGoals
 */
export const getAutomationGoals = (data: ConfigData): AutomationGoals => {
	return data.automationGoals;
};

/**
 * Set automation goals
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setAutomationGoals =
	(data: ConfigData) => (value: AutomationGoals) => {
		data.automationGoals = value;
	};

/**
 * Get automation rules
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns AutomationRules
 */
export const getAutomationRules = (data: ConfigData): AutomationRules => {
	return data.automationRules;
};

/**
 * Set automation rules
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setAutomationRules =
	(data: ConfigData) => (value: AutomationRules) => {
		data.automationRules = value;
	};

/**
 * Get is woocommerce active
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns boolean
 */
export const isWoocommerceActive = (data: ConfigData): boolean => {
	return data.isWoocommerceActive;
};

/**
 * Set is woocommerce active
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setIsWoocommerceActive =
	(data: ConfigData) => (value: boolean) => {
		data.isWoocommerceActive = value;
	};

export interface ConfigApi {
	<T>(key: string): T;
	setInitialPayload: (value: InitialPayload) => void;
	getInitialPayload: () => InitialPayload;
	getBlogName: () => string;
	setBlogName: (value: string) => void;
	setAdminUrl: (value: string) => void;
	getAdminUrl: () => string;
	setAdminEmail: (value: string) => void;
	getAdminEmail: () => string;
	setAjaxUrl: (value: string) => void;
	getAjaxUrl: () => string;
	setNonce: (value: string) => void;
	getNonce: () => string;
	setPluginDirUrl: (value: string) => void;
	getPluginDirUrl: () => string;
	getForms: () => Forms;
	setForms: (value: Forms) => void;
	getCustomFieldsTypes: () => CustomFieldsTypes;
	setCustomFieldsTypes: (value: CustomFieldsTypes) => void;
	getFiltersGroups: () => FiltersGroups;
	setFiltersGroups: (value: FiltersGroups) => void;
	getContactFieldsGroups: () => ContactFieldsGroups;
	setContactFieldsGroups: (value: ContactFieldsGroups) => void;
	getIntegrations: () => Integrations;
	setIntegrations: (value: Integrations) => void;
	getAutomationTriggers: () => AutomationTriggers;
	setAutomationTriggers: (value: AutomationTriggers) => void;
	getAutomationActions: () => AutomationActions;
	setAutomationActions: (value: AutomationActions) => void;
	getAutomationGoals: () => AutomationGoals;
	setAutomationGoals: (value: AutomationGoals) => void;
	getAutomationRules: () => AutomationRules;
	setAutomationRules: (value: AutomationRules) => void;
	isWoocommerceActive: () => boolean;
	setIsWoocommerceActive: (value: boolean) => void;
}

const createConfig = (data: ConfigData): ConfigApi => {
	const configApi = config(data) as ConfigApi;
	configApi.setInitialPayload = setInitialPayload(data);
	configApi.getInitialPayload = getInitialPayload(data);
	configApi.getBlogName = getBlogName(data);
	configApi.setBlogName = setBlogName(data);
	configApi.getAdminUrl = getAdminUrl(data);
	configApi.setAdminUrl = setAdminUrl(data);
	configApi.getAdminEmail = getAdminEmail(data);
	configApi.setAdminEmail = setAdminEmail(data);
	configApi.getAjaxUrl = getAjaxUrl(data);
	configApi.setAjaxUrl = setAjaxUrl(data);
	configApi.getNonce = getNonce(data);
	configApi.setNonce = setNonce(data);
	configApi.getPluginDirUrl = getPluginDirUrl(data);
	configApi.setPluginDirUrl = setPluginDirUrl(data);
	configApi.getForms = () => getForms(data);
	configApi.setForms = setForms(data);
	configApi.getCustomFieldsTypes = () => getCustomFieldsTypes(data);
	configApi.setCustomFieldsTypes = setCustomFieldsTypes(data);
	configApi.getFiltersGroups = () => getFiltersGroups(data);
	configApi.setFiltersGroups = setFiltersGroups(data);
	configApi.getContactFieldsGroups = () => getContactFieldsGroups(data);
	configApi.setContactFieldsGroups = setContactFieldsGroups(data);
	configApi.getIntegrations = () => getIntegrations(data);
	configApi.setIntegrations = setIntegrations(data);
	configApi.getAutomationTriggers = () => getAutomationTriggers(data);
	configApi.setAutomationTriggers = setAutomationTriggers(data);
	configApi.getAutomationActions = () => getAutomationActions(data);
	configApi.setAutomationActions = setAutomationActions(data);
	configApi.getAutomationGoals = () => getAutomationGoals(data);
	configApi.setAutomationGoals = setAutomationGoals(data);
	configApi.getAutomationRules = () => getAutomationRules(data);
	configApi.setAutomationRules = setAutomationRules(data);
	configApi.isWoocommerceActive = () => isWoocommerceActive(data);
	configApi.setIsWoocommerceActive = setIsWoocommerceActive(data);

	return configApi;
};

const ConfigAPI = createConfig(configData);

// @ts-ignore
if (window.qcrm === undefined) {
	// @ts-ignore
	window.qcrm = {
		config: ConfigAPI,
	};
}

// @ts-ignore
export default window.qcrm.config as ConfigApi;
export * from './types/initial-payload';
export * from './types/config-data';
