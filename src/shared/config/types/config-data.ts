import { __ } from '@wordpress/i18n';
import type { InitialPayload } from './initial-payload';

export type TimezoneOption = {
	/** Timezone identifier, e.g. 'Africa/Cairo'. Labels are derived from this. */
	value: string;
	/** Current UTC offset, e.g. 'UTC+03:00'. */
	offset: string;
};

export type ConfigData = Record<string, unknown> & {
	initialPayload: InitialPayload;
	blogName: string;
	adminUrl: string;
	siteUrl: string;
	/** WordPress timezone identifier, e.g. 'Africa/Cairo'. Date/time controls default to this instead of UTC. */
	siteTimezone: string;
	/** Every selectable timezone, with a readable label and current UTC offset. */
	timezones: TimezoneOption[];
	pluginDirUrl: string;
	/** Pro plugin base URL when Pro is active; used for assets bundled only in Pro (e.g. SMTP mailer logos). */
	proPluginDirUrl: string;
	adminEmail: string;
	ajaxUrl: string;
	nonce: string;
	forms: Forms;
	/** WordPress form-plugin slugs actually installed/active on this site, independent of Free/Pro Form-model coverage. */
	activeFormPlugins: string[];
	customFieldsTypes: CustomFieldsTypes;
	filtersGroups: FiltersGroups;
	contactFieldsGroups: ContactFieldsGroups;
	integrations: Integrations;
	automationTriggers: AutomationTriggers;
	automationActions: AutomationActions;
	automationGoals: AutomationGoals;
	automationRules: AutomationRules;
	isWoocommerceActive: boolean;
	isEddActive: boolean;
	isSurecartActive: boolean;
	isLmsActive: boolean;
	mergeTags: AutomationMergeTags;
	importers: Importers;
	userCapabilities: UserCapabilities;
	defaultStages: DefaultStage[];
	dealPriorities: Record<string, DealPriority>;
	doublescaleInfo: DoubleScaleInfo;
	license: License | false;
	/** License plan hierarchy for the extensions store. */
	planLevels: PlanLevels;
	proPluginData: ProPluginData;
	currency: string;
	urlDoubleScalePro: string;
	modules: ModuleInfo[];
	/** Sales approval workflow toggle from server settings (admin bootstrap). */
	salesApprovalWorkflowEnabled: boolean;
	/**
	 * First day of the week for CRM calendars (date-fns weekStartsOn).
	 * 0 = Sunday, 1 = Monday, … 6 = Saturday.
	 */
	calendarWeekStartsOn: number;
	/** Add-on plugin catalog + install state from the store. */
	addons: Addons;
	/** Nonce for in-app store / installer requests. */
	storeNonce: string;
	/** Whether AI credentials are configured (OpenAI etc.). */
	aiConfigured: boolean;
	/**
	 * White-label settings. Pro-only: the free server never injects this, so it
	 * stays `undefined` on a free install. Declared here so shared components
	 * (e.g. notification preferences) can call `ConfigAPI.getWhiteLabel()`
	 * without crashing when Pro is inactive.
	 */
	whiteLabel?: WhiteLabel;
	/** Whether the white-label settings tab should be shown (Pro-only). */
	whiteLabelShowSettings?: boolean;
	/** Per-user contacts list UI preferences from server bootstrap. */
	contactsListPreferences?: {
		column_visibility?: Record<string, boolean>;
	};
	/** Per-user list table UI preferences keyed by list slug. */
	listPreferences?: Partial<
		Record<
			string,
			{
				per_page?: number;
				column_visibility?: Record<string, boolean>;
				show_filters?: boolean;
				filters?: unknown[];
				keyword?: string;
				date_range?: { from: string | null; to: string | null };
				campaign_filters?: {
					status?: string;
					type?: string;
					createDate?: { from: string | null; to: string | null };
					updatedAt?: { from: string | null; to: string | null };
				};
			}
		>
	>;
};

/**
 * White-label configuration. Populated by Pro only; on free this is always
 * absent (so {@link ConfigApi.getWhiteLabel} returns `undefined`).
 */
export type WhiteLabel = {
	enabled: boolean;
	pluginName: string;
	logoUrl: string;
	menuIconUrl: string;
	primaryColor: string;
	accentColor: string;
	hideLicense: boolean;
	hideExtensions: boolean;
	hideAiAssistant: boolean;
	/** Hide the White Labeling tab inside Settings (addon self-hide). */
	hideSettingsTab: boolean;
	/** Hide the Settings item from the left sidebar menu. */
	hideSettingsMenu?: boolean;
};

export type ModuleInfo = {
	slug: string;
	label: string;
	description: string;
	enabled: boolean;
	/** Same as `enabled` when present (REST 1.13+). */
	active?: boolean;
	/**
	 * Stored toggle intent without the parent gate: a child module (e.g. the
	 * pipeline under Sales) keeps its remembered position here while its
	 * parent is off. Children default to true when no key is stored.
	 */
	setting_enabled?: boolean;
	is_toggleable: boolean;
	/** True when doublescale_enabled_modules contains an explicit entry for this slug. */
	is_explicit?: boolean;
	dependencies: string[];
};
export type License = {
	upgrades: {
		[key: string]: Upgrade;
	};
	[key: string]: any;
};
export type Upgrade = {
	[key: string]: any;
};


export type ProPluginData = {
	is_installed: boolean;
	is_active: boolean;
};

export type PlanLevel = {
	label: string;
	level: number;
};

export type PlanLevels = {
	[key: string]: PlanLevel;
};

/**
 * Store add-on (DoubleScale, etc.) — serialized from {@see \DoubleScale\Admin\AdminConfig::get_addons_status()}.
 */
export type Addon = {
	slug: string;
	label: string;
	description: string;
	plugin_file: string;
	image: string;
	plan: string;
	is_installed: boolean;
	is_active: boolean;
};

export type Addons = {
	[key: string]: Addon;
};

export type UserCapabilities = {
	doublescale_crm_manager: boolean;
	doublescale_sales_manager: boolean;
	doublescale_sales_rep: boolean;
	/** Server-computed: Sales-only users limited to Mailbox + Notifications. */
	doublescale_limited_settings?: boolean;
	doublescale_support_manager?: boolean;
	doublescale_support_agent?: boolean;
	doublescale_booking_manager?: boolean;
	doublescale_booking_agent?: boolean;
	doublescale_project_manager?: boolean;
	doublescale_project_member?: boolean;
	doublescale_is_project_only?: boolean;
	doublescale_is_booking_only?: boolean;
	doublescale_is_support_only?: boolean;
	doublescale_view_support?: boolean;
	doublescale_manage_all_tickets?: boolean;
	doublescale_manage_support_settings?: boolean;
	doublescale_can_assign_project_owner?: boolean;
	doublescale_can_assign_task_assignee?: boolean;
	doublescale_can_assign_sales_rep?: boolean;
};

export type DefaultStage = {
	name: string;
	color: string;
	win_probability: number;
};

export type DealPriority = {
	label: string;
	color: string;
};

export type VerifiedSender = {
	email: string;
	name: string;
	connection_id: string;
};

export type DoubleScaleInfo = {
	configured: boolean;
	verified_senders?: VerifiedSender[];
	config_url?: string;
	plugin_url?: string;
};

export type Importers = {
	[key: string]: Importer;
};

export type Importer = {
	name: string;
	slug: string;
	credentials: {
		[key: string]: ImporterField;
	};
	is_integration: boolean;
	is_active: boolean;
	fields: {
		[key: string]: ImporterField;
	};
};

export type ImporterField = {
	label: string;
	tooltip?: string;
	type: string;
	options: {
		key: string;
		label: string;
	}[];
	conditions?: {
		[key: string]: {
			operator: string;
			value?: string;
		};
	};
};

export type AutomationMergeTags = {
	[key: string]: MergeTagsGroup;
};

export type MergeTagsGroup = {
	name: string;
	mergeTags: MergeTags;
	triggers?: string[];
	is_disabled?: boolean;
};

export type MergeTags = {
	[key: string]: MergeTag;
};

export type MergeTag = {
	name: string;
	value: string;
	required_triggers?: string[];
};

export type AutomationRules = {
	[key: string]: RulesGroup;
};

export type RulesGroup = {
	name: string;
	rules: Rules;
	key: string;
	triggers?: string[];
	is_disabled?: boolean;
};

export type Rules = {
	[key: string]: Rule;
};

export type Rule = {
	name: string;
	type: string;
	operators: {
		[key: string]: string;
	};
	options: {
		[key: string]: string;
	};
	endpoint?: string;
	settings?: {
		apiParams?: Record<string, unknown>;
		searchParamName?: string;
		perPage?: number;
		dataPath?: string;
		totalPath?: string;
		rootArrayResponse?: boolean;
	};
	required_triggers?: string[];
	is_automation?: boolean;
};

export type TriggerDocumentation = {
	title?: string;
	intro?: string;
	steps?: string[];
	tip?: string;
};

export type Trigger = {
	label: string;
	description: string;
	fields: {
		[key: string]: {
			label: string;
			type: string;
			options?: {
				[key: string]: string;
			};
			multiple?: boolean;
			helperText?: string;
		};
	};
	is_form?: boolean;
	is_pro?: boolean;
	is_featured?: boolean;
	documentation?: TriggerDocumentation;
};

export type TriggersGroup = {
	label: string;
	triggers: {
		[triggerName: string]: Trigger;
	};
	is_disabled?: boolean;
	disabled_reason?: string;
};

export type TriggerCategoryTab = {
	label: string;
	groups: TriggersGroup[] | Record<string, TriggersGroup>;
	is_disabled?: boolean;
};

export type AutomationTriggerCategory = {
	label: string;
	groups?: TriggersGroup[] | Record<string, TriggersGroup>;
	tabs?: Record<string, TriggerCategoryTab>;
};

export type AutomationTriggers = {
	[key: string]: AutomationTriggerCategory;
};

export type Action = {
	label: string;
	description: string;
	fields: {
		[key: string]: {
			label: string;
			type: string;
			options?: {
				[key: string]: string;
			};
			multiple?: boolean;
			helperText?: string;
		};
	};
	required_triggers?: string[];
	is_pro?: boolean;
};

export type ActionsGroup = {
	label: string;
	actions: {
		[key: string]: Action;
	};
	is_disabled?: boolean;
};

export type ActionCategoryTab = {
	label: string;
	groups: ActionsGroup[] | Record<string, ActionsGroup>;
};

export type AutomationActionCategory = {
	label: string;
	groups?: ActionsGroup[] | Record<string, ActionsGroup>;
	tabs?: Record<string, ActionCategoryTab>;
};

export type AutomationActions = {
	[key: string]: AutomationActionCategory;
};

export type Goal = {
	label: string;
	description: string;
	fields: {
		[key: string]: {
			label: string;
			type: string;
			options?: {
				[key: string]: string;
			};
			multiple?: boolean;
		};
	};
	is_integration: boolean;
};

export type GoalsGroup = {
	label: string;
	goals: {
		[key: string]: Goal;
	};
	is_disabled?: boolean;
};

export type AutomationGoals = {
	[key: string]: {
		label: string;
		groups: GoalsGroup[];
	};
};

export type Integrations = {
	[key: string]: Integration;
};

export type Integration = {
	label: string;
	description: string;
	fields: IntegrationFields;
	is_connected: boolean;
	is_pro?: boolean;
	/** When true, Integrations page shows a card (set from PHP Integration::$show_in_catalog). */
	show_in_catalog?: boolean;
	/** Absolute image URL from PHP Integration::get_icon_url(). */
	icon_url?: string;
	required_plan?: string | null;
	settings: {
		[key: string]: string;
	};
};

export type IntegrationFields = {
	[key: string]: IntegrationField;
};

export type IntegrationField = {
	label: string;
	type: string;
	conditions?: {
		[key: string]: {
			operator: string;
			value?: string;
		};
	};
	has_options?: boolean;
	endpoint?: string;
};

export type ContactFieldsGroups = {
	[key: string]: {
		label: string;
		fields: ContactFields;
	};
};

type ContactFields = {
	[key: string]: ContactField;
};

type ContactField = {
	label: string;
	type: string;
};

type ConditionRule = {
	field: string;
	operator: string;
};

type Condition = {
	relation: string;
	rules: ConditionRule[];
};

type Option = {
	label: string;
	type: string;
	help?: string;
	ajax_action: string;
	conditions?: Condition;
	parent?: string;
};

type FormOptions = {
	[key: string]: Option;
};

export type Form = {
	label: string;
	description: string;
	options: FormOptions;
	fields_settings: {
		action: string;
		fields: {
			[key: string]: string;
		};
	};
	is_enabled: boolean;
	is_pro?: boolean;
	platform?: 'wordpress' | 'saas';
};

export type Forms = {
	[key: string]: Form;
};

export type CustomFieldsTypes = {
	[key: string]: CustomFieldsType;
};

type CustomFieldsType = {
	name: string;
};

type OperatorOptions = {
	is: string;
	is_not: string;
	contains: string;
	does_not_contain: string;
	starts_with: string;
	ends_with: string;
	is_empty: string;
	is_not_empty: string;
};

export type FilterSettings = {
	name: string;
	type: string;
	operators: OperatorOptions;
	options: {
		[key: string]: string;
	};
	is_dynamic: boolean;
	dynamic_args: {
		endpoint: string;
		key: string;
		label: string;
		[key: string]: string;
	};
};

export type Filters = {
	[key: string]: FilterSettings;
};

export type FiltersGroup = {
	name: string;
	filters: Filters;
};

export type FiltersGroups = {
	contact: FiltersGroup;
};

export const SOURCE_OPTIONS = [
	{ value: 'website', label: __('Website', 'doublescale') },
	{ value: 'referral', label: __('Referral', 'doublescale') },
	{ value: 'social_media', label: __('Social Media', 'doublescale') },
	{ value: 'email_campaign', label: __('Email Campaign', 'doublescale') },
	{ value: 'cold_call', label: __('Cold Call', 'doublescale') },
	{ value: 'trade_show', label: __('Trade Show', 'doublescale') },
	{ value: 'partner', label: __('Partner', 'doublescale') },
	{ value: 'other', label: __('Other', 'doublescale') },
] as const;
