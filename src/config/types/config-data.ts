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
	mergeTags: AutomationMergeTags;
	importers: Importers;
};

export type Importers = {
	[key: string]: Importer;
};

export type Importer = {
	name: string;
	slug: string;
	credentials: {
		[key: string]: ImporterField;
	},
	is_integration: boolean;
	is_active: boolean;
	fields: {
		[key: string]: ImporterField;
	};
};

export type ImporterField = {
	label: string;
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
};

export type MergeTags = {
	[key: string]: MergeTag;
};

export type MergeTag = {
	name: string;
	value: string;
};

export type AutomationRules = {
	[key: string]: RulesGroup;
};

export type RulesGroup = {
	name: string;
	rules: Rules;
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
		};
	};
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
		groups: ActionsGroup[];
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
