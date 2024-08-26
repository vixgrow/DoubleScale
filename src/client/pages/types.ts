export type List = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	status: string;
	created_at: string;
	updated_at: string;
};

export type Tag = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	status: string;
	created_at: string;
	updated_at: string;
};

export type Note = {
	id: number;
	title: string;
	type: string;
	note: string;
	created_at: string;
	updated_at: string;
};

export type Contact = {
	id: number;
	email: string;
	first_name: string;
	last_name: string;
	phone: string;
	address_1: string;
	address_2: string;
	city: string;
	state: string;
	country: string;
	zip: string;
	status: string;
	source: string;
	created_at: string;
	updated_at: string;
	lists: List[];
	tags: Tag[];
	notes: Note[];
};

export type AutomationContact = {
	id: number;
	contact_id: string;
	automation_id: string;
	current_step: string;
	next_step: string;
	status: string;
	execution_time: string;
	created_at: string;
	updated_at: string;
	automation: Automation;
};

type Automation = {
	id: number;
	name: string;
	trigger: string;
	status: string;
	created_at: string;
	updated_at: string;
};

export type CustomField = {
	id: number;
	name: string;
	slug: string;
	type: string;
	attributes: any | null; // Adjust the type if the structure of attributes is known
	group_id: number;
	created_at: string;
	updated_at: string;
};

export type CustomFieldsGroup = {
	id: number;
	name: string;
	slug: string;
	created_at: string;
	updated_at: string;
	custom_fields: CustomField[];
};

// The array type
export type CustomFieldsGroups = CustomFieldsGroup[];

export type Template = {
	from_name: string;
	from_email: string;
	reply_to: string;
	subject: string;
	preview_text: string;
	body: string;
	enable_utm: boolean;
	utm_source: string;
	utm_medium: string;
	utm_name: string;
	utm_term: string;
	utm_content: string;
};

type CampaignSettings = {
	templates: Template[];
	contacts: number[];
	filters: Filter[];
	ab_test: boolean;
};

export type Filter = {
	group: string;
	filter: string;
	operator: string;
	value: any;
};

export type Campaign = {
	id: number;
	name: string;
	description: string;
	status: string;
	settings: CampaignSettings;
	parent_id: string;
	count: string;
	execute_at: string;
	created_at: string;
	updated_at: string;
	contacts_count: number;
	sent_count: number;
	opened_count: number;
	clicked_count: number;
};

export type Campaigns = Campaign[];

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

type MappedFields = {
	first_name: string;
	last_name: string;
	email: string;
	[key: string]: string;
};

type FormData = {
	mapped_fields: MappedFields;
	[key: string]: any;
};

export type Form = {
	id: number;
	name: string;
	form_type: string;
	form_id: string;
	data: FormData;
	status: string;
	created_at: string;
	updated_at: string;
	[temp: string]: any;
};

export type Forms = Form[];

export type LinkTrigger = {
	id: number;
	name: string;
	hash: string;
	status: string;
	settings: {
		redirect_url: string;
		auto_login: boolean;
		add_tags: number[];
		remove_tags: number[];
		add_lists: number[];
		remove_lists: number[];
	};
	click_count: string;
	created_at: string;
	updated_at: string;
	full_url: string;
};

export type LinkTriggers = LinkTrigger[];

export type CustomTemplate = {
	id: number;
	name: string;
	body: string;
	subject: string;
	settings: {
		preview_text: string;
		from_name: string;
		from_email: string;
		reply_to: string;
		enable_utm: boolean;
		utm_source: string;
		utm_medium: string;
		utm_name: string;
		utm_term: string;
		utm_content: string;
	};
	created_at: string;
	updated_at: string;
};
