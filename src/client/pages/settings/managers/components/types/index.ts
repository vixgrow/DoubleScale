export type ManagerRole = 'quillcrm_crm_manager' | 'quillcrm_sales_manager' | 'quillcrm_sales_rep';
export const ManagerRoleLabels = {
    'quillcrm_crm_manager': 'CRM Manager',
    'quillcrm_sales_manager': 'Sales Manager',
    'quillcrm_sales_rep': 'Sales Rep',
};
export const ManagerRoleValues = {
    'quillcrm_crm_manager': 'CRM Manager',
    'quillcrm_sales_manager': 'Sales Manager',
    'quillcrm_sales_rep': 'Sales Rep',
};
export const ManagerRoleOptions = [
    { id: 'quillcrm_crm_manager' as ManagerRole, label: 'CRM Manager' },
    { id: 'quillcrm_sales_manager' as ManagerRole, label: 'Sales Manager' },
    { id: 'quillcrm_sales_rep' as ManagerRole, label: 'Sales Rep' },
];
export type ManagerRoleLabel = keyof typeof ManagerRoleLabels;
export type ManagerRoleValue = keyof typeof ManagerRoleValues;
export type ManagerRoleOption = typeof ManagerRoleOptions[number];