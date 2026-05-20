/**
 *
 * Reads the server-injected payload from window.doublescaleConfig.booking
 * (set by includes/Admin/AdminConfig.php when the Booking module is enabled).
 */

import type { Availability } from '@/types/booking';
import type {
	Capabilities,
	ConfigData,
	CurrentUser,
	Integrations,
	Locations,
	MergeTagGroups,
	PaymentGateways,
	ProPluginData,
	License,
} from './types/config-data';

// `window.doublescaleConfig` is declared in src/config/index.ts. The booking
// payload is injected as a `booking` sub-key by BookingAdminConfig.php when
// the Booking module is enabled. Booking-specific fields live in the sub-key;
// shared fields (siteUrl, nonce, adminUrl, …) come from the parent payload so
// we don't have to duplicate them server-side.
const parentData: Partial<ConfigData> =
	(typeof window !== 'undefined' && window.doublescaleConfig
		? (window.doublescaleConfig as Partial<ConfigData>)
		: {}) as Partial<ConfigData>;

// The public booking renderer is a separate SPA bundled at build/renderer/
// and gets its own `window.doublescale_booking_config` payload (set by
// BookingFrontendHandler.php). When the admin payload is absent, fall back
// to the renderer payload so shared booking utilities (timezones, locale, …)
// work on the public booking page too.
const rendererData: Partial<ConfigData> =
	(typeof window !== 'undefined' &&
	(window as unknown as { doublescale_booking_config?: Partial<ConfigData> })
		.doublescale_booking_config
		? ((window as unknown as { doublescale_booking_config: Partial<ConfigData> })
				.doublescale_booking_config)
		: {}) as Partial<ConfigData>;

const serverData: Partial<ConfigData> =
	((typeof window !== 'undefined' && window.doublescaleConfig) as
		| { booking?: Partial<ConfigData> }
		| undefined
	)?.booking ?? rendererData;

const configData: ConfigData = {
	blogName: serverData.blogName || parentData.blogName || '',
	adminUrl: serverData.adminUrl || parentData.adminUrl || '',
	pluginDirUrl: serverData.pluginDirUrl || parentData.pluginDirUrl || '',
	adminEmail: serverData.adminEmail || parentData.adminEmail || '',
	ajaxUrl: serverData.ajaxUrl || parentData.ajaxUrl || '',
	siteUrl: serverData.siteUrl || parentData.siteUrl || '',
	nonce: serverData.nonce || parentData.nonce || '',
	hasCalendars: serverData.hasCalendars || false,
	hasAvailability: serverData.hasAvailability || false,
	isWoocommerceActive: serverData.isWoocommerceActive || false,
	proPluginData: serverData.proPluginData || {
		is_installed: true,
		is_active: true,
	},
	license: serverData.license ?? false,
	timezones: serverData.timezones || {},
	integrations: serverData.integrations || {},
	locations: serverData.locations || {},
	availabilities: serverData.availabilities || [],
	capabilities: serverData.capabilities || {},
	paymentGateways: serverData.paymentGateways || {},
	fieldsTypes: serverData.fieldsTypes || {},
	mergeTags: serverData.mergeTags || {},
	currentUser:
		serverData.currentUser ||
		({
			id: 0,
			email: '',
			display_name: '',
			is_admin: false,
			capabilities: {},
		} as CurrentUser),
};

const config =
	(data: ConfigData) =>
		<T>(key: string): T | undefined => {
			if (key in data) {
				return data[key] as T;
			}
			return undefined;
		};

export const getBlogName = (data: ConfigData) => (): string => data.blogName;
const setBlogName = (data: ConfigData) => (value: string) => {
	data.blogName = value;
};

export const getAdminUrl = (data: ConfigData) => (): string => data.adminUrl;
export const setAdminUrl = (data: ConfigData) => (value: string) => {
	data.adminUrl = value;
};

export const getAdminEmail = (data: ConfigData) => (): string => data.adminEmail;
export const setAdminEmail = (data: ConfigData) => (value: string) => {
	data.adminEmail = value;
};

export const getAjaxUrl = (data: ConfigData) => (): string => data.ajaxUrl;
export const setAjaxUrl = (data: ConfigData) => (value: string) => {
	data.ajaxUrl = value;
};

export const getNonce = (data: ConfigData) => (): string => data.nonce;
export const setNonce = (data: ConfigData) => (value: string) => {
	data.nonce = value;
};

const getPluginDirUrl = (data: ConfigData) => (): string => data.pluginDirUrl;
const setPluginDirUrl = (data: ConfigData) => (value: string) => {
	data.pluginDirUrl = value;
};

export const isWoocommerceActive = (data: ConfigData): boolean =>
	data.isWoocommerceActive;
export const setIsWoocommerceActive =
	(data: ConfigData) => (value: boolean) => {
		data.isWoocommerceActive = value;
	};

export const getSiteUrl = (data: ConfigData) => (): string => data.siteUrl;
export const setSiteUrl = (data: ConfigData) => (value: string) => {
	data.siteUrl = value;
};

export const getTimezones = (data: ConfigData): Record<string, string> =>
	data.timezones;
export const setTimezones =
	(data: ConfigData) => (value: Record<string, string>) => {
		data.timezones = value;
	};

export const getIntegrations = (data: ConfigData): Integrations =>
	data.integrations;
export const setIntegrations = (data: ConfigData) => (value: Integrations) => {
	data.integrations = value;
};

export const getLocations = (data: ConfigData): Locations => data.locations;
export const setLocations = (data: ConfigData) => (value: Locations) => {
	data.locations = value;
};

export const getAvailabilities = (data: ConfigData): Availability[] =>
	data.availabilities;
export const setAvailabilities =
	(data: ConfigData) => (value: Availability[]) => {
		data.availabilities = value;
	};

export const getCapabilities = (data: ConfigData): Capabilities =>
	data.capabilities;
export const setCapabilities = (data: ConfigData) => (value: Capabilities) => {
	data.capabilities = value;
};

export const getPaymentGateways = (data: ConfigData): PaymentGateways =>
	data.paymentGateways;
export const setPaymentGateways =
	(data: ConfigData) => (value: PaymentGateways) => {
		data.paymentGateways = value;
	};

export const getCurrentUser = (data: ConfigData): CurrentUser =>
	data.currentUser;
export const setCurrentUser = (data: ConfigData) => (value: CurrentUser) => {
	data.currentUser = value;
};

export const getMergeTags = (data: ConfigData): MergeTagGroups =>
	data.mergeTags;
export const setMergeTags = (data: ConfigData) => (value: MergeTagGroups) => {
	data.mergeTags = value;
};

export const getHasCalendars = (data: ConfigData) => (): boolean =>
	data.hasCalendars;
export const setHasCalendars = (data: ConfigData) => (value: boolean) => {
	data.hasCalendars = value;
};

export const getHasAvailability = (data: ConfigData) => (): boolean =>
	data.hasAvailability;
export const setHasAvailability = (data: ConfigData) => (value: boolean) => {
	data.hasAvailability = value;
};

export const setLicense =
	(data: ConfigData) => (value: License | false) => {
		data.license = value;
	};
export const getLicense = (data: ConfigData) => (): License | false =>
	data.license;

export const setProPluginData =
	(data: ConfigData) => (value: ProPluginData) => {
		data.proPluginData = value;
	};
export const getProPluginData = (data: ConfigData) => (): ProPluginData =>
	data.proPluginData;

export interface ConfigApi {
	<T>(key: string): T;
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
	isWoocommerceActive: () => boolean;
	setIsWoocommerceActive: (value: boolean) => void;
	getSiteUrl: () => string;
	setSiteUrl: (value: string) => void;
	getTimezones: () => Record<string, string>;
	setTimezones: (value: Record<string, string>) => void;
	getIntegrations: () => Integrations;
	setIntegrations: (value: Integrations) => void;
	getLocations: () => Locations;
	setLocations: (value: Locations) => void;
	getAvailabilities: () => Availability[];
	setAvailabilities: (value: Availability[]) => void;
	getCapabilities: () => Capabilities;
	setCapabilities: (value: Capabilities) => void;
	getPaymentGateways: () => PaymentGateways;
	setPaymentGateways: (value: PaymentGateways) => void;
	getCurrentUser: () => CurrentUser;
	setCurrentUser: (value: CurrentUser) => void;
	getMergeTags: () => MergeTagGroups;
	setMergeTags: (value: MergeTagGroups) => void;
	getHasCalendars: () => boolean;
	setHasCalendars: (value: boolean) => void;
	getHasAvailability: () => boolean;
	setHasAvailability: (value: boolean) => void;
	getLicense: () => License | false;
	setLicense: (value: License | false) => void;
	getProPluginData: () => ProPluginData;
	setProPluginData: (value: ProPluginData) => void;
}

const createConfig = (data: ConfigData): ConfigApi => {
	const configApi = config(data) as ConfigApi;
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
	configApi.isWoocommerceActive = () => isWoocommerceActive(data);
	configApi.setIsWoocommerceActive = setIsWoocommerceActive(data);
	configApi.getSiteUrl = getSiteUrl(data);
	configApi.setSiteUrl = setSiteUrl(data);
	configApi.getTimezones = () => getTimezones(data);
	configApi.setTimezones = setTimezones(data);
	configApi.getIntegrations = () => getIntegrations(data);
	configApi.setIntegrations = setIntegrations(data);
	configApi.getLocations = () => getLocations(data);
	configApi.setLocations = setLocations(data);
	configApi.getAvailabilities = () => getAvailabilities(data);
	configApi.setAvailabilities = setAvailabilities(data);
	configApi.getCapabilities = () => getCapabilities(data);
	configApi.setCapabilities = setCapabilities(data);
	configApi.getPaymentGateways = () => getPaymentGateways(data);
	configApi.setPaymentGateways = setPaymentGateways(data);
	configApi.getCurrentUser = () => getCurrentUser(data);
	configApi.setCurrentUser = setCurrentUser(data);
	configApi.getMergeTags = () => getMergeTags(data);
	configApi.setMergeTags = setMergeTags(data);
	configApi.getHasCalendars = getHasCalendars(data);
	configApi.setHasCalendars = setHasCalendars(data);
	configApi.getHasAvailability = getHasAvailability(data);
	configApi.setHasAvailability = setHasAvailability(data);
	configApi.getLicense = getLicense(data);
	configApi.setLicense = setLicense(data);
	configApi.getProPluginData = getProPluginData(data);
	configApi.setProPluginData = setProPluginData(data);
	return configApi;
};

const ConfigAPI = createConfig(configData);

export default ConfigAPI;
export * from './types/config-data';
