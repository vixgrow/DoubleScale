import { __ } from '@wordpress/i18n';

export type ManagerRole =
	| 'doublescale_crm_manager'
	| 'doublescale_sales_manager'
	| 'doublescale_sales_rep'
	| 'doublescale_support_manager'
	| 'doublescale_support_agent'
	| 'doublescale_booking_manager'
	| 'doublescale_booking_agent'
	| 'doublescale_project_manager'
	| 'doublescale_project_member';

/** Display labels; includes legacy keys for rows not yet migrated. */
export const ManagerRoleLabels: Record<string, string> = {
	doublescale_crm_manager: __('CRM Manager', 'doublescale'),
	doublescale_sales_manager: __('Sales Manager', 'doublescale'),
	doublescale_sales_rep: __('Sales Rep', 'doublescale'),
	doublescale_support_manager: __('Support Manager', 'doublescale'),
	doublescale_support_agent: __('Support Agent', 'doublescale'),
	doublescale_booking_manager: __('Booking Manager', 'doublescale'),
	doublescale_booking_agent: __('Booking Agent', 'doublescale'),
	doublescale_project_manager: __('Project Manager', 'doublescale'),
	doublescale_project_member: __('Project Member', 'doublescale'),
	ds_crm_manager: __('CRM Manager', 'doublescale'),
	ds_sales_manager: __('Sales Manager', 'doublescale'),
	ds_sales_rep: __('Sales Rep', 'doublescale'),
};
export const ManagerRoleValues = {
	doublescale_crm_manager: __('CRM Manager', 'doublescale'),
	doublescale_sales_manager: __('Sales Manager', 'doublescale'),
	doublescale_sales_rep: __('Sales Rep', 'doublescale'),
	doublescale_support_manager: __('Support Manager', 'doublescale'),
	doublescale_support_agent: __('Support Agent', 'doublescale'),
	doublescale_booking_manager: __('Booking Manager', 'doublescale'),
	doublescale_booking_agent: __('Booking Agent', 'doublescale'),
	doublescale_project_manager: __('Project Manager', 'doublescale'),
	doublescale_project_member: __('Project Member', 'doublescale'),
};
/** Module slug required before the role can be newly assigned (Settings → Modules). */
export const ManagerRoleModuleRequirements: Partial<
	Record<ManagerRole, string>
> = {
	doublescale_sales_manager: 'deals',
	doublescale_sales_rep: 'deals',
	doublescale_support_manager: 'support',
	doublescale_support_agent: 'support',
	doublescale_booking_manager: 'booking',
	doublescale_booking_agent: 'booking',
	doublescale_project_manager: 'projects',
	doublescale_project_member: 'projects',
};

/** Roles that require DoubleScale Pro to be active. */
export const ManagerRoleProRequirements: ManagerRole[] = [
	'doublescale_crm_manager',
	'doublescale_sales_manager',
	'doublescale_sales_rep',
	'doublescale_project_manager',
	'doublescale_project_member',
];

/** Short capability summary shown under each role in Add/Edit Manager. */
export const ManagerRoleDescriptions: Record<ManagerRole, string> = {
	doublescale_crm_manager: __(
		'Full CRM admin: all contacts, deals, pipelines, team, settings, reports, import/export, proposals, invoices, and support inbox.',
		'doublescale'
	),
	doublescale_sales_manager: __(
		'Manage all contacts and deals, import/export data, and manage every proposal and invoice.',
		'doublescale'
	),
	doublescale_sales_rep: __(
		'Work on own contacts and deals, create new records, and manage own proposals and invoices.',
		'doublescale'
	),
	doublescale_support_manager: __(
		'View and manage every support ticket; assign agents and reply on any thread.',
		'doublescale'
	),
	doublescale_support_agent: __(
		'View the support inbox and reply on tickets assigned to you.',
		'doublescale'
	),
	doublescale_booking_manager: __(
		'Read and manage all team calendars, bookings, and availability schedules.',
		'doublescale'
	),
	doublescale_booking_agent: __(
		'Manage only your own calendars, bookings, and availability.',
		'doublescale'
	),
	doublescale_project_manager: __(
		'Create and manage all projects, kanban statuses, and assignments.',
		'doublescale'
	),
	doublescale_project_member: __(
		'View and update projects assigned to you; join discussions and track progress.',
		'doublescale'
	),
};

export const ManagerRoleOptions = [
	{ id: 'doublescale_crm_manager' as ManagerRole, label: __('CRM Manager', 'doublescale') },
	{ id: 'doublescale_sales_manager' as ManagerRole, label: __('Sales Manager', 'doublescale') },
	{ id: 'doublescale_sales_rep' as ManagerRole, label: __('Sales Rep', 'doublescale') },
	{ id: 'doublescale_support_manager' as ManagerRole, label: __('Support Manager', 'doublescale') },
	{ id: 'doublescale_support_agent' as ManagerRole, label: __('Support Agent', 'doublescale') },
	{ id: 'doublescale_booking_manager' as ManagerRole, label: __('Booking Manager', 'doublescale') },
	{ id: 'doublescale_booking_agent' as ManagerRole, label: __('Booking Agent', 'doublescale') },
	{ id: 'doublescale_project_manager' as ManagerRole, label: __('Project Manager', 'doublescale') },
	{ id: 'doublescale_project_member' as ManagerRole, label: __('Project Member', 'doublescale') },
];
export type ManagerRoleLabel = keyof typeof ManagerRoleLabels;
export type ManagerRoleValue = keyof typeof ManagerRoleValues;
export type ManagerRoleOption = (typeof ManagerRoleOptions)[number];
