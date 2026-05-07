export type ManagerRole = 'doublescale_crm_manager' | 'doublescale_sales_manager' | 'doublescale_sales_rep';
export const ManagerRoleLabels = {
    'doublescale_crm_manager': 'CRM Manager',
    'doublescale_sales_manager': 'Sales Manager',
    'doublescale_sales_rep': 'Sales Rep',
};
export const ManagerRoleValues = {
    'doublescale_crm_manager': 'CRM Manager',
    'doublescale_sales_manager': 'Sales Manager',
    'doublescale_sales_rep': 'Sales Rep',
};
export const ManagerRoleOptions = [
    { id: 'doublescale_crm_manager' as ManagerRole, label: 'CRM Manager' },
    { id: 'doublescale_sales_manager' as ManagerRole, label: 'Sales Manager' },
    { id: 'doublescale_sales_rep' as ManagerRole, label: 'Sales Rep' },
];
export type ManagerRoleLabel = keyof typeof ManagerRoleLabels;
export type ManagerRoleValue = keyof typeof ManagerRoleValues;
export type ManagerRoleOption = typeof ManagerRoleOptions[number];