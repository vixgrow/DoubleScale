import type { InitialPayload } from './initial-payload';

export type ConfigData = Record<string, unknown> & {
	initialPayload: InitialPayload;
	adminUrl: string;
	pluginDirUrl: string;
	adminEmail: string;
	ajaxUrl: string;
	nonce: string;
	forms: Forms;
	customFieldsTypes: CustomFieldsTypes;
	filtersGroups: FiltersGroups;
	contactFieldsGroups: ContactFieldsGroups;
	integrations: Integrations;
};

export type Integrations = {
	[key: string]: Integration;
};

export type Integration = {
	label: string;
	desciption: string;
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
};

type FormOptions = {
	[key: string]: Option;
};

type Form = {
	label: string;
	description: string;
	options: FormOptions;
	fields_settings: {
		action: string;
		fields: {
			form_id: string;
			[key: string]: string;
		};
	};
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

type Filters = {
	[key: string]: FilterSettings;
};

type FiltersGroup = {
	name: string;
	filters: Filters;
};

export type FiltersGroups = {
	contact: FiltersGroup;
};
