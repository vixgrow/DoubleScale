/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import { useState, useEffect } from 'react';
/**
 * internal dependencies
 */
import { CustomFieldsGroups, CustomField, CustomFieldsGroup } from '@quillcrm/client';

export const useCustomFields = () => {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    groups: CustomFieldsGroups;
  }>({
    loading: true,
    error: null,
    groups: [],
  });

  const { createNotice } = useDispatch('quillcrm/core');

  const fetchGroups = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await apiFetch({
        path: addQueryArgs('/qc/v1/custom-fields-groups'),
      }) as CustomFieldsGroups;

      if (!Array.isArray(response)) {
        throw new Error(__('Invalid response format', 'quillcrm'));
      }

      setState({
        loading: false,
        error: null,
        groups: response,
      });
    } catch (error: any) {
      setState({
        loading: false,
        error: error.message,
        groups: [],
      });
      createNotice({
        type: 'error',
        message: error.message || __('Failed to load custom fields', 'quillcrm'),
      });
    }
  };

  const saveField = async (field: CustomField, isNew: boolean) => {
    try {
      const method = isNew ? 'POST' : 'PUT';
      const path = isNew 
        ? '/qc/v1/custom-fields' 
        : `/qc/v1/custom-fields/${field.id}`;

      const response = await apiFetch({
        path,
        method,
        data: field,
      }) as CustomField;

      setState(prev => ({
        ...prev,
        groups: prev.groups.map(group => {
          if (isNew && group.id === response.group_id) {
            return {
              ...group,
              custom_fields: [...group.custom_fields, response],
            };
          }
          if (!isNew && group.id === response.group_id) {
            return {
              ...group,
              custom_fields: group.custom_fields.map(f => 
                f.id === response.id ? response : f
              ),
            };
          }
          return group;
        })
      }));

      createNotice({
        type: 'success',
        message: isNew 
          ? __('Custom field added', 'quillcrm')
          : __('Custom field updated', 'quillcrm'),
      });
      return true;
    } catch (error: any) {
      createNotice({
        type: 'error',
        message: error.message,
      });
      return false;
    }
  };

  const deleteField = async (field: CustomField) => {
    try {
      await apiFetch({
        path: `/qc/v1/custom-fields/${field.id}`,
        method: 'DELETE',
      });

      setState(prev => ({
        ...prev,
        groups: prev.groups.map(group => {
          if (group.id === field.group_id) {
            return {
              ...group,
              custom_fields: group.custom_fields.filter(f => f.id !== field.id),
            };
          }
          return group;
        })
      }));

      createNotice({
        type: 'success',
        message: __('Field deleted', 'quillcrm'),
      });
    } catch (error: any) {
      createNotice({
        type: 'error',
        message: error.message,
      });
    }
  };

  const saveGroup = async (name: string) => {
    try {
      const response = await apiFetch({
        path: '/qc/v1/custom-fields-groups',
        method: 'POST',
        data: { name },
      }) as CustomFieldsGroup;

      setState(prev => ({
        ...prev,
        groups: [...prev.groups, response],
      }));

      createNotice({
        type: 'success',
        message: __('Group added', 'quillcrm'),
      });
      return true;
    } catch (error: any) {
      createNotice({
        type: 'error',
        message: error.message,
      });
      return false;
    }
  };

  
  const deleteGroup = async (groupId: number, newGroupId?: number) => {
    try {
      // Find the group to check if it has fields
      const groupToDelete = state.groups.find(group => group.id === groupId);
      const hasFields = groupToDelete && groupToDelete.custom_fields.length > 0;
      
      const requestConfig: any = {
        path: `/qc/v1/custom-fields-groups/${groupId}`,
        method: 'DELETE',
      };
      
      // Only include data if the group has fields and newGroupId is provided
      if (hasFields && newGroupId !== undefined) {
        requestConfig.data = { new_group_id: newGroupId };
      }
  
      await apiFetch(requestConfig);
  
      setState(prev => ({
        ...prev,
        groups: prev.groups.map(group => {
          // If this is the target group and we're moving fields to it
          if (hasFields && newGroupId && group.id === newGroupId && groupToDelete) {
            return {
              ...group,
              custom_fields: [
                ...group.custom_fields,
                // Add the moved fields with updated group_id
                ...groupToDelete.custom_fields.map(field => ({
                  ...field,
                  group_id: newGroupId
                }))
              ]
            };
          }
          return group;
        }).filter(group => group.id !== groupId) // Remove the deleted group
      }));
  
      createNotice({
        type: 'success',
        message: __('Group deleted successfully', 'quillcrm'),
      });
      return true;
    } catch (error: any) {
      createNotice({
        type: 'error',
        message: error.message || __('Failed to delete group', 'quillcrm'),
      });
      return false;
    }
  };

  const moveField = async (field: CustomField, newGroupId: number) => {
    // Optimistically update the UI
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(group => {
        if (group.id === newGroupId) {
          return {
            ...group,
            custom_fields: [...group.custom_fields, { ...field, group_id: newGroupId }],
          };
        }
        if (group.id === field.group_id) {
          return {
            ...group,
            custom_fields: group.custom_fields.filter(f => f.id !== field.id),
          };
        }
        return group;
      })
    }));
  
    // Then make the API call
    try {
      await apiFetch({
        path: `/qc/v1/custom-fields/${field.id}`,
        method: 'PUT',
        data: { ...field, group_id: newGroupId },
      });
    } catch (error) {
      // Revert if API call fails
      fetchGroups();
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    ...state,
     moveField,
    fetchGroups,
    saveField,
    deleteField,
    saveGroup,
    deleteGroup,
  };
};