import type { ConversationAttachment } from '@/types/support';

export type List = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	status: string;
	contacts_count: number;
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
	contact_id?: number;
	deal_id?: number | null;
	title: string;
	type: string;
	note: string;
	user_id?: number;
	created_at: string;
	updated_at: string;
};

export type Contact = {
	id: number;
	email: string;
	first_name: string;
	last_name: string;
	phone: string;
	whatsapp_phone: string;
	address_1: string;
	address_2: string;
	city: string;
	state: string;
	country: string;
	zip: string;
	email_status: string;
	sms_status: string;
	whatsapp_status: string;
	source: string;
	created_at: string;
	updated_at: string;
	lists: List[];
	tags: Tag[];
	notes: Note[];
	orders?: Order[];
	revenue?: string;
	custom_fields: (CustomField & {
		pivot: {
			value: string;
		};
	})[];
	lead_score?: LeadScoreData;
};

export type LeadScoreLevel = {
	id: number;
	name: string;
	slug: string;
	points: number;
};

export type LeadScoreData = {
	points: number;
	level: LeadScoreLevel | null;
};

export type Order = {
	id: number;
	status: string;
	currency: string;
	type: string;
	tax_amount: string;
	total_amount: string;
	customer_id: string;
	billing_email: string;
	date_created_gmt: string;
	date_updated_gmt: string;
	date: {
		date: string;
		timezone: string;
		timezone_type: number;
	}
	parent_order_id: string;
	payment_method: string;
	payment_method_title: string;
	transaction_id: string;
	ip_address: string;
	user_agent: string;
	customer_note: string;
	url: string;
};

export type EddOrder = {
	id: number;
	status: string;
	user_id: number;
	email: string;
	currency: string;
	subtotal: number;
	discount: number;
	tax: number;
	total: number;
	date_created: string;
	date_modified: string;
	date_completed: string;
	date_refundable: string;
	url: string;
};

export type SurecartOrder = {
	id: string;
	number: string;
	total_amount: number;
	date: string;
	url: string;
	status: string;
	order_type: string;
	currency: string;
};

export type LMSCourse = {
	id: number;
	name: string;
	status: string;
	url: string;
	completed_on: string;
	started_on: string;
	lms?: 'learndash' | 'tutorlms' | 'lifterlms' | 'learnpress';
};

export type LMSCoursesResponse = {
	data: LMSCourse[];
	total: number;
};

export type AutomationContact = {
	id: number;
	contact_id: number;
	automation_id: number;
	current_step: AutomationStep;
	next_step: AutomationStep;
	status: string;
	execution_time: string;
	created_at: string;
	updated_at: string;
	contact: Contact;
	processes: AutomationProcess[];
};

export type AutomationProcess = {
	id: number;
	step_id: number;
	contact_id: number;
	automation_id: number;
	automation_contact_id: number;
	status: string;
	step: AutomationStep;
	created_at: string;
	updated_at: string;
};

export type Automation = {
	id: number;
	name: string;
	trigger: string;
	status: string;
	settings: {
		multiple_runs: boolean;
		_trigger_label?: string;
		_trigger_warning?: boolean;
		_trigger_warning_message?: string;
		[key: string]: any;
	};
	created_by?: number | null;
	created_at: string;
	updated_at: string;
	steps: AutomationStep[];
	_warnings?: Array<{
		type: string;
		slug: string;
		message: string;
		plugin_label?: string;
		plugin_labels?: any[];
		step_id?: number;
	}>;
};

export type CustomField = {
	id: number;
	name: string;
	slug: string;
	type: string;
	attributes: any | null; // Adjust the type if the structure of attributes is known
	group_id: number;
	scope: string;
	pivot: {
		entity_id: string;
		custom_field_id: string;
		value: string;
	};
	created_at: string;
	updated_at: string;
};

export type CustomFieldsGroup = {
	id: number;
	name: string;
	slug: string;
	scope: string;
	created_at: string;
	updated_at: string;
	custom_fields: CustomField[];
};

// The array type
export type CustomFieldsGroups = CustomFieldsGroup[];

// Email Template Type
export type EmailBodyContent = {
	type: 'rich-text' | 'builder';
	value: any; // For rich-text: string, for builder: sections/globalSettings/buttonSettings
};

// Email template settings (stored in settings JSON column)
export type EmailTemplateSettings = {
	from_name: string;
	from_email: string;
	reply_to: string;
	subject: string;
	preview_text: string;
	enable_utm: boolean;
	utm_source: string;
	utm_medium: string;
	utm_name: string;
	utm_term: string;
	utm_content: string;
};

// Email Template Type (matches database structure)
export type EmailTemplate = {
	id?: number;
	name: string;
	type: 'email'; // Campaign channel type
	body?: string | EmailBodyContent; // Can be string (rich-text) or EmailBodyContent (builder)
	thumbnail?: string;
	hidden?: boolean;
	/** Campaign to link this template to; consumed by /templates/save. */
	campaign_id?: number;
	settings?: EmailTemplateSettings;
	created_at?: string;
	updated_at?: string;
};

// SMS Template Type (for frontend use)
// Note: SMS uses STOP keyword for unsubscribe, not URL links
export type SMSTemplate = {
	id?: number;
	name: string;
	type: 'sms';
	body: string;
	subject?: never; // SMS doesn't have subject
	settings?: Record<string, never>; // No settings needed - unsubscribe via STOP keyword
	created_at?: string;
	updated_at?: string;
};

// WhatsApp Template Type (for frontend use)
// Note: WhatsApp uses STOP keyword for unsubscribe, not URL links
export type WhatsAppTemplate = {
	id?: number;
	name: string;
	type: 'whatsapp';
	body: string;
	subject?: never; // WhatsApp doesn't have subject
	settings?: Record<string, never>; // No settings needed - unsubscribe via STOP keyword
	created_at?: string;
	updated_at?: string;
};

// Discriminated Union for all template types
export type Template = EmailTemplate | SMSTemplate | WhatsAppTemplate;

// Contacts step data
export type ContactsStepData = {
	filters?: any[];
	contacts_count?: number;
	selected_contacts?: number[];
	filter_type?: string;
	lastModified?: string;
};

// Review step data
export type ReviewStepData = {
	send_time?: string;
	test_emails?: string[];
	final_review_completed?: boolean;
	lastModified?: string;
};

export type AutomatedTriggerType = 'event' | 'schedule';

export type ScheduleFrequency =
	| 'daily'
	| 'weekly'
	| 'monthly'
	| 'custom';

export type ScheduleDay =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday'
	| 'saturday'
	| 'sunday';

export type EventTrigger = {
	event_type: 'post_published';
	post_type?: string;
	post_status?: string;
	categories?: number[];
};

export type ScheduleTrigger = {
	frequency: ScheduleFrequency;
	time: string;
	timezone?: string;
	day_of_week?: ScheduleDay;
	day_of_month?: number;
	custom_interval?: number;
	custom_unit?: 'hours' | 'days' | 'weeks';
};

export type AutomatedTriggerConfig = {
	trigger_type: AutomatedTriggerType;
	event?: EventTrigger;
	schedule?: ScheduleTrigger;
};

type CampaignSettings = {
	templates: Template[];
	contacts: number[];
	filters: Filter[];
	ab_test: boolean;
	automated?: boolean;
	trigger?: AutomatedTriggerConfig;
	current_step?: string;
	// Template IDs stored in array (for A/B testing support)
	template_ids?: number[];
	// Step-specific data
	contacts_data?: ContactsStepData;
	review_data?: ReviewStepData;
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
	type: 'email' | 'sms' | 'whatsapp' | 'sequence_mail' | 'email_sequence'; // Campaign channel type
	settings: CampaignSettings;
	parent_id: string;
	count: string;
	execute_at: string;
	created_by?: number | null;
	created_at: string;
	updated_at: string;
	contacts_count: number;
	sent_count: number;
	failed_count: number;
	templates_count: {
		[key: string]: number;
	};
	// Email-specific analytics
	opened_count?: number;
	open_rate?: number;
	// Shared analytics (email, SMS, WhatsApp)
	clicked_count: number;
	click_rate?: number;
	// SMS & WhatsApp analytics
	pending_count?: number;
	delivered_count?: number;
	delivery_rate?: number;
	// WhatsApp-specific analytics
	read_count?: number;
	read_rate?: number;
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

export type MappedFields = {
	[key: string]: string;
};

export type KeyValuePair = {
	id: string;
	key: string;
	value: string;
};

export type DynamicKeyValueData = {
	[key: string]: any;
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
	post_id?: number;
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
	subject?: string; // Email subject (for campaign emails)
	body: string;
	settings: {
		// Common settings
		subject?: string;
		preview_text?: string;
		from_name?: string;
		// Email-specific settings
		from_email?: string;
		reply_to?: string;
		// SMS/WhatsApp campaign settings
		message?: string;
		add_unsubscribe?: boolean;
	};
	created_at: string;
	updated_at: string;
};

export type Automations = Automation[];

export type AutomationStep = {
	id: number;
	parent_id: number;
	automation_id: number;
	action: string;
	type: string;
	condition: string;
	// This type is any because the structure of fields is different for each action
	settings: {
		_action_label?: string;
		_action_warning?: boolean;
		_action_warning_message?: string;
		_condition_warning?: boolean;
		[key: string]: any;
	};

	_action_label?: string;
	_action_warning?: boolean;
	_condition_warning?: boolean;
	_unavailable_rules_count?: number;
	_unavailable_rules?: any[];

	order: number;
	status: string;
	created_at: string;
	updated_at: string;
};

export type OrganizedSteps = OrganizedStep[];

export type OrganizedStep = AutomationStep & {
	children: OrganizedStep[];
};

export type AbandonedCart = {
	id: number;
	hash_key: string;
	user_id: string;
	email: string;
	fields: {
		[key: string]: string;
	};
	items: {
		[key: string]: CartItem;
	};
	coupons: string[];
	total: string;
	fees: string[];
	taxes: string[];
	shipping: string;
	currency: string;
	order_id: string;
	status: 'pending' | 'recovered' | 'lost' | 'skipped' | 'processing';
	created_at: string;
	updated_at: string;
};

export type CartItem = {
	key: string;
	product_id: number;
	variation_id: number;
	variation: string[];
	quantity: number;
	data_hash: string;
	line_tax_data: LineTaxData;
	line_subtotal: number;
	line_subtotal_tax: number;
	line_total: number;
	line_tax: number;
	data: string[];
	product: WCProduct;
};

export type WCProduct = {
	id: number;
	image: string;
	name: string;
	price: string;
};

type LineTaxData = {
	subtotal: string[];
	total: string[];
};

// Communication tracking meta entry (for merge tags, WhatsApp template params, etc.)
export type CommunicationTrackingMeta = {
	id: number;
	communication_tracking_id: number;
	meta_key: string;
	meta_value: any; // Can be object or string depending on meta_key
};

// Error information for failed messages
export type MessageErrorInfo = {
	code: string;
	message: string;
	updated_at?: string;
} | null;

// Represents a tracked message (email/SMS/WhatsApp) from any source (campaign, automation, or individual)
export type TrackedMessage = {
	id: number;
	campaign_id: string;
	contact_id: string;
	template_id: string;
	hash_key: string;
	recipient: string; // Unified recipient field (email address or phone number)
	direction: number; // Message direction: 1=Outbound, 2=Inbound
	direction_slug: 'outbound' | 'inbound'; // Direction slug for display
	source_type: number; // Message source: 1=Campaign, 2=Automation, 3=Individual
	source_id: number; // Polymorphic FK: campaign_id, automation_id, or activity_id
	opened: string;
	clicked: string;
	status: number; // Integer status code (1=pending, 2=sent, 3=failed, etc.)
	status_slug: string; // String slug ('pending', 'sent', 'failed', etc.)
	status_name: string; // Human-readable name
	sent_at: string;
	opened_at: string;
	clicked_at: string;
	created_at: string;
	updated_at: string;
	contact: Contact;
	template?: CustomTemplate | null; // Optional for individual messages
	activity?: {
		id: number;
		contact_id: number;
		deal_id: number | null;
		activity_type: string;
		data: {
			subject?: string;
			body?: string;
			[key: string]: any;
		};
		created_at: string;
	} | null; // Activity for individual messages (unified activities model)
	campaign?: Partial<Campaign>;
	unsubscribe_reason?: string; // Extracted from contact notes
	communication_tracking_meta?: CommunicationTrackingMeta[]; // Meta data including merge tags and WhatsApp template params
	error_info?: MessageErrorInfo; // Error information for failed messages (code and message from provider)
	attachments?: ConversationAttachment[]; // Inbound/outbound email file attachments (individual messages only)
};

// Legacy alias for backward compatibility
export type CampaignEmail = TrackedMessage;

export type AutomationRules = Rules[];

export type Rules = Rule[];

export type Rule = {
	rule: string;
	value: string;
	operator: string;
};

export type DashboardData = {
	total_contacts: number;
	total_sent_emails: number;
	total_tags: number;
	total_lists: number;
	total_automations: number;
	total_email_templates: number;
	deals: number;
	deals_closed_won: number;
	deals_won_value: number;
	total_orders: number;
	total_revenue: string;
	recent_contacts: Contact[];
	recent_unsubscribed_contacts: Contact[];
	recent_abandoned_carts: AbandonedCart[];
	recent_recoverd_carts: AbandonedCart[];
	top_campaigns: Campaign[];
	top_automations: Automation[];
	recent_emails: CampaignEmail[];
};

export type CartAnalytics = {
	carts: {
		[date: string]: AbandonedCart[];
	};
	revenue: {
		[date: string]: number;
	};
	data: {
		dates: string[];
		type: 'hour' | 'day' | 'month';
	};
	total: {
		carts: number;
		revenue: number;
	};
};

export type ContactAnalytics = {
	contacts: {
		[date: string]: number;
	};
	data: {
		dates: string[];
		type: 'hour' | 'day' | 'month';
	};
	total: string;
	total_subscribed: number;
	total_unsubscribed: number;
};

export type EmailsAnalytics = {
	email: {
		[date: string]: number;
	};
	data: {
		dates: string[];
		type: 'hour' | 'day' | 'month' | 'year';
	};
	total: number;
	total_sent: number;
	total_opened: number;
	total_clicked: number;
	open_rate: number;
	click_rate: number;
};

export type Settings = {
	business: {
		business_name: string;
		business_address: string;
		business_logo?: string;
	};
	email: {
		from_name: string;
		from_email: string;
		reply_to: string;
		email_footer: string;
		max_in_second: number;
		max_in_day: number;
	};
	sms: {
		max_in_second: number;
		max_in_day: number;
	};
	double_optin: {
		email_subject: string;
		email_content: string;
		after_confirmation: string;
		confirmation_message: string;
		confirmation_redirect: string;
	};
	cart: {
		enable_cart_tracking: boolean;
		wait_period: number;
		cool_off_period: number;
		lost_cart_days: number;
		gdpr_compliance: boolean;
		gdpr_message: string;
		tags: number[];
		lists: number[];
		lost_tags: number[];
		lost_lists: number[];
	};
	currency: {
		currency: string;
	};
	website_tracking: {
		enabled: boolean;
		retention_type: 'days' | 'never' | null;
		retention_days: string | null;
	};
	notifications: {
		retention_type: 'days' | 'never' | null;
		retention_days: string | null;
	};
};

export type Response = {
	current_page: number;
	first_page_url: string;
	from: number;
	last_page: number;
	last_page_url: string;
	next_page_url: string;
	path: string;
	prev_page_url: string;
	per_page: number;
	to: number;
	total: number;
};

export type ContactsResponse = Response & {
	data: Contact[];
	total_count: number;
};

export type ListsResponse = Response & {
	data: List[];
	total_count: number;
};

export type TagsResponse = Response & {
	data: Tag[];
	total_count: number;
};

export type AutomationsResponse = Response & {
	data: Automation[];
	total_count: number;
};

export type CampaignType = 'standard' | 'ab_test' | 'email_sequence';

export type CampaignsResponse = Response & {
	data: Campaign[];
	total_count: number;
};

export type CampaignEmailsResponse = Response & {
	data: CampaignEmail[];
};

export type CustomFieldsResponse = Response & {
	data: CustomField[];
};

export type CustomFieldsGroupsResponse = Response & {
	data: CustomFieldsGroups;
};

export type FormsResponse = Response & {
	data: Form[];
	total_count: number;
};

export type LinkTriggersResponse = Response & {
	data: LinkTrigger[];
	total_count: number;
};

export type TemplatesResponse = Response & {
	data: CustomTemplate[];
};

export type AbandonedCartsResponse = Response & {
	data: AbandonedCart[];
};

export type AutomationContactsResponse = Response & {
	data: AutomationContact[];
};

export type AutomationStepsResponse = Response & {
	data: AutomationStep[];
};

export type NotesResponse = Response & {
	data: Note[];
};

export type IntegrationSelectOptions = {
	name: string;
	id: string;
}[];

export type ReactSelectOptions = {
	label: string;
	value: string | number;
	style?: React.CSSProperties;
}[];

export type Log = {
	level: string;
	message: string;
	source: string;
	datetime: string;
	local_datetime: string;
	context: {
		[key: string]: string;
	};
};

export interface DataTableConfig<TData> {
	manageColumns?: {
		enabled: boolean;
		onSubmit?: (columnVisibility: Record<string, boolean>) => void;
	};
	search?: {
		placeholder?: string;
		onChange?: (value: string) => void;
		value?: string;
		className?: string;
	};
	selection?: {
		enabled: boolean;
		selectedKeys: React.Key[];
		onSelectionChange: (keys: React.Key[]) => void;
	};
	bulkActions?: {
		enabled: boolean;
		currentAction: string;
		onActionChange: (action: string) => void;
		onExecuteAction: (action: string) => void;
		lists?: {
			selected: string[];
			onSelectionChange: (lists: string[]) => void;
		};
		tags?: {
			selected: string[];
			onSelectionChange: (tags: string[]) => void;
		};
		activeTab?: string;
	};
	filters?: {
		enabled: boolean;
		showFilters: boolean;
		onToggleFilters: (show: boolean) => void;
		currentFilters: any[];
		onFiltersChange: (filters: any[]) => void;
		onApplyFilters: () => void;
		isApplying: boolean;
	};
	dateRange?: {
		enabled: boolean;
		value: { from: Date | null; to: Date | null };
		onDateChange: (range: { from: Date | null; to: Date | null }) => void;
		placeholder?: string;
	};
	campaignFilters?: {
		filters: {
			status: string;
			type: string;
			createDate: { from: Date | null; to: Date | null };
			updatedAt: { from: Date | null; to: Date | null };
		};
		onFiltersChange: (filters: any) => void;
		onClear: () => void;
	};
	initialColumnVisibility?: Record<string, boolean>;
	toolbarClassName?: string;
}

export type NoticeMessage = {
	type: 'success' | 'error' | 'warning';
	message: string;
};

export interface CustomFieldsRef {
	openCreateGroupModal: () => void;
	openCreateFieldModal: () => void;
}

export interface CustomFieldsProps {
	activeTab?: string;
	scope?: string; // Add scope parameter with default 'contact'
}

export interface FieldDialogProps {
	visible: boolean;
	onClose: () => void;
	field?: CustomField | null;
	groups: CustomFieldsGroup[];
	fieldTypes: Record<string, any>;
	onSave: (field: CustomField, isNew: boolean) => Promise<boolean>;
}

export interface GroupDialogProps {
	visible: boolean;
	onClose: () => void;
	onSave: (name: string, scope: string) => Promise<boolean>;
}

export interface DeleteGroupDialogProps {
	visible: boolean;
	onClose: () => void;
	groupId: number;
	groups: CustomFieldsGroup[];
	onDelete: (groupId: number, newGroupId?: number) => Promise<boolean>;
}

export const CAMPAIGN_STATUS = {
	DRAFT: 'draft',
	INACTIVE: 'inactive',
	ACTIVE: 'active',
	SCHEDULED: 'schedule',
	PROCESSING: 'processing',
	COMPLETED: 'completed',
	RESENDING: 'resending',
	PAUSED: 'paused',
	CANCELLED: 'cancelled',
} as const;

export type CampaignStatus =
	(typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

// Contact subscription status constants
export const CONTACT_STATUS = {
	EMAIL: {
		SUBSCRIBED: 'subscribed',
		UNSUBSCRIBED: 'unsubscribed',
		BOUNCED: 'bounced',
		BLOCKED: 'blocked',
		UNVERIFIED: 'unverified',
	},
	SMS: {
		SUBSCRIBED: 'subscribed',
		UNSUBSCRIBED: 'unsubscribed',
		BLOCKED: 'blocked',
	},
	WHATSAPP: {
		SUBSCRIBED: 'subscribed',
		UNSUBSCRIBED: 'unsubscribed',
		BLOCKED: 'blocked',
	},
} as const;

export type EmailStatus = (typeof CONTACT_STATUS.EMAIL)[keyof typeof CONTACT_STATUS.EMAIL];
export type SmsStatus = (typeof CONTACT_STATUS.SMS)[keyof typeof CONTACT_STATUS.SMS];
export type WhatsAppStatus = (typeof CONTACT_STATUS.WHATSAPP)[keyof typeof CONTACT_STATUS.WHATSAPP];

export type CampaignModalStep = 'campaign-types' | 'campaign-name' | null;
