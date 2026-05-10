import { __ } from '@wordpress/i18n';
import type { InitialPayload } from './initial-payload';

export type ConfigData = Record<string, unknown> & {
	initialPayload: InitialPayload;
	blogName: string;
	adminUrl: string;
	siteUrl: string;
	pluginDirUrl: string;
	adminEmail: string;
	ajaxUrl: string;
	nonce: string;
	forms: Forms;
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
	dealPriorities: DealPriority[];
	quillsmtpInfo: QuillSMTPInfo;
	license: License | false;
	proPluginData: ProPluginData;
	currency: string;
	urlDoubleScalePro: string;
	modules: ModuleInfo[];
	/** Whether AI credentials are configured (OpenAI etc.). */
	aiConfigured: boolean;
};

export type ModuleInfo = {
	slug: string;
	label: string;
	description: string;
	enabled: boolean;
	is_toggleable: boolean;
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


export type UserCapabilities = {
	doublescale_crm_manager: boolean;
	doublescale_sales_manager: boolean;
	doublescale_sales_rep: boolean;
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

export type QuillSMTPInfo = {
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
	required_triggers?: string[];
	is_automation?: boolean;
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
		};
	};
	is_form?: boolean;
	is_pro?: boolean;
};

export type TriggersGroup = {
	label: string;
	triggers: {
		[triggerName: string]: Trigger;
	};
	is_disabled?: boolean;
};

export type AutomationTriggers = {
	[key: string]: {
		label: string;
		groups: TriggersGroup[];
	};
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

export type AutomationActions = {
	[key: string]: {
		label: string;
		groups: {
			[key: string]: ActionsGroup;
		};
	};
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
