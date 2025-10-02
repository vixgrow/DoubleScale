export type ManagerRole = 'quillcrm_crm_manager' | 'quillcrm_deal_owner';
export const ManagerRoleLabels = {
    'quillcrm_crm_manager': 'CRM Manager',
    'quillcrm_deal_owner': 'Deal Owner',
};
export const ManagerRoleValues = {
    'quillcrm_crm_manager': 'CRM Manager',
    'quillcrm_deal_owner': 'Deal Owner',
};
export const ManagerRoleOptions = [
    { id: 'quillcrm_crm_manager' as ManagerRole, label: 'CRM Manager' },
    { id: 'quillcrm_deal_owner' as ManagerRole, label: 'Deal Owner' },
];
export type ManagerRoleLabel = keyof typeof ManagerRoleLabels;
export type ManagerRoleValue = keyof typeof ManagerRoleValues;
export type ManagerRoleOption = typeof ManagerRoleOptions[number];