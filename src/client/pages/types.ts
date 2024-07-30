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

type CampaignSettings = {
	template_id: number;
	[setting: string]: any;
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
};

export type Campaigns = Campaign[];

export type Template = {
	id: number;
	name: string;
	type: string;
	subject: string;
	body: string;
	settings: any | null;
	created_at: string;
	updated_at: string;
};
