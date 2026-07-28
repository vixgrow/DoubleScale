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
	doublescale_crm_manager: 'CRM Manager',
	doublescale_sales_manager: 'Sales Manager',
	doublescale_sales_rep: 'Sales Rep',
	doublescale_support_manager: 'Support Manager',
	doublescale_support_agent: 'Support Agent',
	doublescale_booking_manager: 'Booking Manager',
	doublescale_booking_agent: 'Booking Agent',
	doublescale_project_manager: 'Project Manager',
	doublescale_project_member: 'Project Member',
	ds_crm_manager: 'CRM Manager',
	ds_sales_manager: 'Sales Manager',
	ds_sales_rep: 'Sales Rep',
};
export const ManagerRoleValues = {
	doublescale_crm_manager: 'CRM Manager',
	doublescale_sales_manager: 'Sales Manager',
	doublescale_sales_rep: 'Sales Rep',
	doublescale_support_manager: 'Support Manager',
	doublescale_support_agent: 'Support Agent',
	doublescale_booking_manager: 'Booking Manager',
	doublescale_booking_agent: 'Booking Agent',
	doublescale_project_manager: 'Project Manager',
	doublescale_project_member: 'Project Member',
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
	doublescale_crm_manager:
		'Full CRM admin: all contacts, deals, pipelines, team, settings, reports, import/export, proposals, invoices, and support inbox.',
	doublescale_sales_manager:
		'Manage all contacts and deals, import/export data, and manage every proposal and invoice.',
	doublescale_sales_rep:
		'Work on own contacts and deals, create new records, and manage own proposals and invoices.',
	doublescale_support_manager:
		'View and manage every support ticket; assign agents and reply on any thread.',
	doublescale_support_agent:
		'View the support inbox and reply on tickets assigned to you.',
	doublescale_booking_manager:
		'Read and manage all team calendars, bookings, and availability schedules.',
	doublescale_booking_agent:
		'Manage only your own calendars, bookings, and availability.',
	doublescale_project_manager:
		'Create and manage all projects, kanban statuses, and assignments.',
	doublescale_project_member:
		'View and update projects assigned to you; join discussions and track progress.',
};

export const ManagerRoleOptions = [
	{ id: 'doublescale_crm_manager' as ManagerRole, label: 'CRM Manager' },
	{ id: 'doublescale_sales_manager' as ManagerRole, label: 'Sales Manager' },
	{ id: 'doublescale_sales_rep' as ManagerRole, label: 'Sales Rep' },
	{ id: 'doublescale_support_manager' as ManagerRole, label: 'Support Manager' },
	{ id: 'doublescale_support_agent' as ManagerRole, label: 'Support Agent' },
	{ id: 'doublescale_booking_manager' as ManagerRole, label: 'Booking Manager' },
	{ id: 'doublescale_booking_agent' as ManagerRole, label: 'Booking Agent' },
	{ id: 'doublescale_project_manager' as ManagerRole, label: 'Project Manager' },
	{ id: 'doublescale_project_member' as ManagerRole, label: 'Project Member' },
];
export type ManagerRoleLabel = keyof typeof ManagerRoleLabels;
export type ManagerRoleValue = keyof typeof ManagerRoleValues;
export type ManagerRoleOption = (typeof ManagerRoleOptions)[number];
