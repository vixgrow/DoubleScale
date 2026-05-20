/* eslint-disable jsdoc/check-line-alignment */
import type {
	Addons,
	AutomationActions,
	AutomationGoals,
	AutomationMergeTags,
	AutomationRules,
	AutomationTriggers,
	ConfigData,
	ContactFieldsGroups,
	CustomFieldsTypes,
	DealPriority,
	DefaultStage,
	FiltersGroups,
	Forms,
	Importers,
	Integrations,
	License,
	ModuleInfo,
	ProPluginData,
	DoubleScaleInfo,
	UserCapabilities,
} from './types/config-data';
import { InitialPayload } from './types/initial-payload';

declare global {
	interface Window {
		/** Injected by {@see DoubleScale\Admin\AdminConfig::set_admin_config} before the admin bundle runs. */
		doublescaleConfig?: Partial<ConfigData> & Record<string, unknown>;
	}
}

/**
 * PHP prints `window.doublescaleConfig = {...}` inline before `build/client/index.js`.
 * Without merging it here, `userCapabilities` stay at defaults (all false) and every
 * `ProtectedRoute` shows Access Denied — including Administrators.
 */
const serverData: Partial<ConfigData> & Record<string, unknown> =
	typeof window !== 'undefined' && window.doublescaleConfig
		? window.doublescaleConfig
		: {};

const defaultUserCapabilities: UserCapabilities = {
	doublescale_crm_manager: false,
	doublescale_sales_manager: false,
	doublescale_sales_rep: false,
};

const configData: ConfigData = {
	initialPayload:
		(serverData.initialPayload as InitialPayload | undefined) ?? {
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
			sms: {
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
	blogName: (serverData.blogName as string | undefined) ?? '',
	adminUrl: (serverData.adminUrl as string | undefined) ?? '',
	pluginDirUrl: (serverData.pluginDirUrl as string | undefined) ?? '',
	proPluginDirUrl: (serverData.proPluginDirUrl as string | undefined) ?? '',
	license: (serverData.license as License | false | undefined) ?? false,
	adminEmail: (serverData.adminEmail as string | undefined) ?? '',
	ajaxUrl: (serverData.ajaxUrl as string | undefined) ?? '',
	siteUrl: (serverData.siteUrl as string | undefined) ?? '',
	nonce: (serverData.nonce as string | undefined) ?? '',
	forms: (serverData.forms as Forms | undefined) ?? {},
	customFieldsTypes:
		(serverData.customFieldsTypes as CustomFieldsTypes | undefined) ?? {},
	filtersGroups:
		(serverData.filtersGroups as FiltersGroups | undefined) ?? {
			contact: {
				name: '',
				filters: {},
			},
		},
	contactFieldsGroups:
		(serverData.contactFieldsGroups as ContactFieldsGroups | undefined) ?? {},
	integrations: (serverData.integrations as Integrations | undefined) ?? {},
	automationTriggers:
		(serverData.automationTriggers as AutomationTriggers | undefined) ?? {},
	automationActions:
		(serverData.automationActions as AutomationActions | undefined) ?? {},
	automationGoals:
		(serverData.automationGoals as AutomationGoals | undefined) ?? {},
	automationRules:
		(serverData.automationRules as AutomationRules | undefined) ?? {},
	isWoocommerceActive: serverData.isWoocommerceActive ?? false,
	isEddActive: serverData.isEddActive ?? false,
	isSurecartActive: serverData.isSurecartActive ?? false,
	isLmsActive: serverData.isLmsActive ?? false,
	mergeTags: (serverData.mergeTags as AutomationMergeTags | undefined) ?? {},
	importers: (serverData.importers as Importers | undefined) ?? {},
	userCapabilities:
		(serverData.userCapabilities as UserCapabilities | undefined) ??
		defaultUserCapabilities,
	defaultStages: (serverData.defaultStages as DefaultStage[] | undefined) ?? [],
	dealPriorities:
		(serverData.dealPriorities as Record<string, DealPriority> | undefined) ?? {},
	doublescaleInfo:
		(serverData.smtpInfo as DoubleScaleInfo | undefined) ??
		(serverData.doublescaleInfo as DoubleScaleInfo | undefined) ?? {
			configured: false,
		},
	currency: (serverData.currency as string | undefined) ?? 'USD',
	urlDoubleScalePro: (serverData.urlDoubleScalePro as string | undefined) ?? '',
	proPluginData:
		(serverData.proPluginData as ProPluginData | undefined) ?? {
			is_installed: false,
			is_active: false,
		},
	addons: (serverData.addons as Addons | undefined) ?? {},
	storeNonce: (serverData.storeNonce as string | undefined) ?? '',
	modules: (serverData.modules as ModuleInfo[] | undefined) ?? [],
	aiConfigured: Boolean(serverData.aiConfigured),
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

const getProPluginDirUrl = (data: ConfigData) => (): string => {
	return data.proPluginDirUrl;
};

const setProPluginDirUrl = (data: ConfigData) => (value: string) => {
	data.proPluginDirUrl = value;
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

/**
 * Get is edd active
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns boolean
 */
export const isEddActive = (data: ConfigData): boolean => {
	return data.isEddActive;
};

/**
 * Set is edd active
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setIsEddActive = (data: ConfigData) => (value: boolean) => {
	data.isEddActive = value;
};

/**
 * Get is surecart active
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns boolean
 */
export const isSurecartActive = (data: ConfigData): boolean => {
	return data.isSurecartActive;
};

/**
 * Set is surecart active
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setIsSurecartActive = (data: ConfigData) => (value: boolean) => {
	data.isSurecartActive = value;
};

/**
 * Get is lms active
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns boolean
 */
export const isLmsActive = (data: ConfigData): boolean => {
	return data.isLmsActive;
};

/**
 * Set is lms active
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setIsLmsActive = (data: ConfigData) => (value: boolean) => {
	data.isLmsActive = value;
}

/**
 * Get site url
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns string
 */
export const getSiteUrl = (data: ConfigData) => (): string => {
	return data.siteUrl;
};

/**
 * Set site url
 *
 * @param data the json environment configuration to use for getting config values
 */
export const setSiteUrl = (data: ConfigData) => (value: string) => {
	data.siteUrl = value;
};

/**
 * Get merge tags
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns AutomationMergeTags
 */
export const getMergeTags = (data: ConfigData): AutomationMergeTags => {
	return data.mergeTags;
};

/**
 * Set merge tags
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setMergeTags = (data: ConfigData) => (value: AutomationMergeTags) => {
	data.mergeTags = value;
};

/**
 * Get importers
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns Importers
 */
export const getImporters = (data: ConfigData): Importers => {
	return data.importers;
};

/**
 * Set importers
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setImporters = (data: ConfigData) => (value: Importers) => {
	data.importers = value;
};

/**
 * Get user capabilities
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns UserCapabilities
 */
export const getUserCapabilities = (data: ConfigData): UserCapabilities => {
	return data.userCapabilities;
};

/**
 * Set user capabilities
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setUserCapabilities = (data: ConfigData) => (value: UserCapabilities) => {
	data.userCapabilities = value;
};

/**
 * Get default stages
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns DefaultStage[]
 */
export const getDefaultStages = (data: ConfigData): DefaultStage[] => {
	return data.defaultStages;
};

/**
 * Set default stages
 * 
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setDefaultStages = (data: ConfigData) => (value: DefaultStage[]) => {
	data.defaultStages = value;
};

/**
 * Get deal priorities
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns DealPriority[]
 */
export const getDealPriorities = (data: ConfigData): Record<string, DealPriority> => {
	return data.dealPriorities;
};

/**
 * Set deal priorities
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setDealPriorities = (data: ConfigData) => (value: Record<string, DealPriority>) => {
	data.dealPriorities = value;
};

/**
 * Get DoubleScale connection info
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns DoubleScaleInfo
 */
export const getDoubleScaleInfo = (data: ConfigData): DoubleScaleInfo => {
	return data.doublescaleInfo;
};

/**
 * Set DoubleScale connection info
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setDoubleScaleInfo = (data: ConfigData) => (value: DoubleScaleInfo) => {
	data.doublescaleInfo = value;
};

/**
 * Get DoubleScale Pro URL
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns string
 */
export const getUrlDoubleScalePro = (data: ConfigData): string => {
	return data.urlDoubleScalePro;
};

/**
 * Set DoubleScale Pro URL
 *
 * @param data the json environment configuration to use for getting config values
 * @param value the value to set
 */
export const setUrlDoubleScalePro = (data: ConfigData) => (value: string) => {
	data.urlDoubleScalePro = value;
};

/**
 * Gets global currency code
 *
 * @param data - configuration data
 * @returns Currency code (e.g., 'USD', 'EUR')
 */
export const getCurrency = (data: ConfigData): string => {
	return data.currency;
};

/**
 * Sets global currency code
 *
 * @param data - configuration data
 * @param value the currency code to set
 */
export const setCurrency = (data: ConfigData) => (value: string) => {
	data.currency = value;
};

export const getModules = (data: ConfigData) => (): ModuleInfo[] => {
	return data.modules;
};

export const setModules = (data: ConfigData) => (value: ModuleInfo[]) => {
	data.modules = value;
	if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent('doublescale:modules-updated', { detail: value })
		);
	}
};

export const isModuleEnabled =
	(data: ConfigData) =>
		(slug: string): boolean => {
			const mod = data.modules.find((m) => m.slug === slug);
			return mod ? mod.enabled : true;
		};

/**
 * Whether the slug appears in {@link ConfigData.modules} and is enabled.
 * When the slug is missing from the payload (older caches, partial merges), defaults to **true**
 * so routes and UI match {@see doublescale_is_module_enabled()} (unknown slugs stay on).
 */
export const isModuleToggleEnabled =
	(data: ConfigData) =>
		(slug: string): boolean => {
			const mod = data.modules.find((m) => m.slug === slug);
			if (!mod) {
				return true;
			}
			return Boolean(mod.enabled);
		};

/** @since 1.0.0 — alias of {@link isModuleToggleEnabled}; prefer for new code. */
export const isModuleActive = isModuleToggleEnabled;

/**
 * Set license
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns {License | false} license
 */
export const setLicense = (data: ConfigData) => (value: License | false) => {
	data.license = value;
};

/**
 * Get license
 *
 * @param data the json environment configuration to use for getting config values
 *
 * @returns {License | false} license
 */
export const getLicense = (data: ConfigData) => (): License | false => {
	return data.license;
};

/**
 * Set pro plugin data
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns {ProPluginData} proPluginData
 */
export const setProPluginData = (data: ConfigData) => (value: ProPluginData) => {
	data.proPluginData = value;
};

/**
 * Get pro plugin data
 * 
 * @param data the json environment configuration to use for getting config values
 * 
 * @returns {ProPluginData} proPluginData
 */
export const getProPluginData = (data: ConfigData) => (): ProPluginData => {
	return data.proPluginData as unknown as ProPluginData;
};

export const getAddons = (data: ConfigData) => (): Addons => {
	return data.addons;
};

export const setAddons = (data: ConfigData) => (value: Addons) => {
	data.addons = value;
};

export const getStoreNonce = (data: ConfigData) => (): string => {
	return data.storeNonce;
};

export const setStoreNonce = (data: ConfigData) => (value: string) => {
	data.storeNonce = value;
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
	getLicense: () => License | false;
	setLicense: (value: License | false) => void;
	setPluginDirUrl: (value: string) => void;
	getPluginDirUrl: () => string;
	setProPluginDirUrl: (value: string) => void;
	getProPluginDirUrl: () => string;
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
	getSiteUrl: () => string;
	setSiteUrl: (value: string) => void;
	getMergeTags: () => AutomationMergeTags;
	setMergeTags: (value: AutomationMergeTags) => void;
	getImporters: () => Importers;
	setImporters: (value: Importers) => void;
	isEddActive: () => boolean;
	setIsEddActive: (value: boolean) => void;
	isSurecartActive: () => boolean;
	setIsSurecartActive: (value: boolean) => void;
	isLmsActive: () => boolean;
	setIsLmsActive: (value: boolean) => void;
	getUserCapabilities: () => UserCapabilities;
	setUserCapabilities: (value: UserCapabilities) => void;
	getDefaultStages: () => DefaultStage[];
	setDefaultStages: (value: DefaultStage[]) => void;
	getDealPriorities: () => Record<string, DealPriority>;
	setDealPriorities: (value: Record<string, DealPriority>) => void;
	getDoubleScaleInfo: () => DoubleScaleInfo;
	setDoubleScaleInfo: (value: DoubleScaleInfo) => void;
	getCurrency: () => string;
	setCurrency: (value: string) => void;
	getUrlDoubleScalePro: () => string;
	setUrlDoubleScalePro: (value: string) => void;
	getProPluginData: () => ProPluginData;
	setProPluginData: (value: ProPluginData) => void;
	getAddons: () => Addons;
	setAddons: (value: Addons) => void;
	getStoreNonce: () => string;
	setStoreNonce: (value: string) => void;
	isModuleEnabled: (slug: string) => boolean;
	isModuleToggleEnabled: (slug: string) => boolean;
	isModuleActive: (slug: string) => boolean;
	getModules: () => ModuleInfo[];
	setModules: (value: ModuleInfo[]) => void;
	isAiConfigured: () => boolean;
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
	configApi.getProPluginDirUrl = getProPluginDirUrl(data);
	configApi.setProPluginDirUrl = setProPluginDirUrl(data);
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
	configApi.getLicense = getLicense(data);
	configApi.setLicense = setLicense(data);
	configApi.getProPluginData = getProPluginData(data);
	configApi.setProPluginData = setProPluginData(data);
	configApi.getAddons = getAddons(data);
	configApi.setAddons = setAddons(data);
	configApi.getStoreNonce = getStoreNonce(data);
	configApi.setStoreNonce = setStoreNonce(data);
	configApi.getSiteUrl = getSiteUrl(data);
	configApi.setSiteUrl = setSiteUrl(data);
	configApi.getMergeTags = () => getMergeTags(data);
	configApi.setMergeTags = setMergeTags(data);
	configApi.getImporters = () => getImporters(data);
	configApi.setImporters = setImporters(data);
	configApi.isEddActive = () => isEddActive(data);
	configApi.setIsEddActive = setIsEddActive(data);
	configApi.isSurecartActive = () => isSurecartActive(data);
	configApi.setIsSurecartActive = setIsSurecartActive(data);
	configApi.isLmsActive = () => isLmsActive(data);
	configApi.setIsLmsActive = setIsLmsActive(data);
	configApi.getUserCapabilities = () => getUserCapabilities(data);
	configApi.setUserCapabilities = setUserCapabilities(data);
	configApi.getDefaultStages = () => getDefaultStages(data);
	configApi.setDefaultStages = setDefaultStages(data);
	configApi.getDealPriorities = () => getDealPriorities(data);
	configApi.setDealPriorities = setDealPriorities(data);
	configApi.getDoubleScaleInfo = () => getDoubleScaleInfo(data);
	configApi.setDoubleScaleInfo = setDoubleScaleInfo(data);
	configApi.getCurrency = () => getCurrency(data);
	configApi.setCurrency = setCurrency(data);
	configApi.getUrlDoubleScalePro = () => getUrlDoubleScalePro(data);
	configApi.setUrlDoubleScalePro = setUrlDoubleScalePro(data);
	configApi.getModules = getModules(data);
	configApi.setModules = setModules(data);
	configApi.isModuleEnabled = isModuleEnabled(data);
	configApi.isModuleToggleEnabled = isModuleToggleEnabled(data);
	configApi.isModuleActive = isModuleActive(data);
	configApi.isAiConfigured = () => Boolean(data.aiConfigured);
	return configApi;
};

const ConfigAPI = createConfig(configData);

// Always attach the API — another bundle may have set `window.doublescale = {}` first
// (e.g. ContactContext singleton) and skipped creating `config`.
if (typeof window !== 'undefined') {
	// @ts-ignore
	window.doublescale = window.doublescale ?? {};
	// @ts-ignore
	window.doublescale.config = ConfigAPI;
}

export default ConfigAPI;
export * from './types/config-data';
export * from './types/icons-type';
export * from './types/initial-payload';
