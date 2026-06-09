export type ManagerRole =
	| 'doublescale_crm_manager'
	| 'doublescale_sales_manager'
	| 'doublescale_sales_rep'
	| 'doublescale_support_manager'
	| 'doublescale_support_agent';

/** Display labels; includes legacy keys for rows not yet migrated. */
export const ManagerRoleLabels: Record<string, string> = {
	doublescale_crm_manager: 'CRM Manager',
	doublescale_sales_manager: 'Sales Manager',
	doublescale_sales_rep: 'Sales Rep',
	doublescale_support_manager: 'Support Manager',
	doublescale_support_agent: 'Support Agent',
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
};
/** Module slug required before the role can be newly assigned (Settings → Modules). */
export const ManagerRoleModuleRequirements: Partial<
	Record<ManagerRole, string>
> = {
	doublescale_sales_manager: 'deals',
	doublescale_sales_rep: 'deals',
	doublescale_support_manager: 'support',
	doublescale_support_agent: 'support',
};

/** Roles that require DoubleScale Pro to be active. */
export const ManagerRoleProRequirements: ManagerRole[] = [
	'doublescale_crm_manager',
	'doublescale_sales_manager',
	'doublescale_sales_rep',
];

export const ManagerRoleOptions = [
	{ id: 'doublescale_crm_manager' as ManagerRole, label: 'CRM Manager' },
	{ id: 'doublescale_sales_manager' as ManagerRole, label: 'Sales Manager' },
	{ id: 'doublescale_sales_rep' as ManagerRole, label: 'Sales Rep' },
	{ id: 'doublescale_support_manager' as ManagerRole, label: 'Support Manager' },
	{ id: 'doublescale_support_agent' as ManagerRole, label: 'Support Agent' },
];
export type ManagerRoleLabel = keyof typeof ManagerRoleLabels;
export type ManagerRoleValue = keyof typeof ManagerRoleValues;
export type ManagerRoleOption = (typeof ManagerRoleOptions)[number];
