/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * external dependencies
 */
import { useState, useEffect } from 'react';
/**
 * internal dependencies
 */
import {
	CustomFieldsGroups,
	CustomField,
	CustomFieldsGroup,
	NoticeMessage,
} from '@quillcrm/client';

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

	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	const showNotice = (noticeData: NoticeMessage) => {
		setNotice(noticeData);
	};

	const closeNotice = () => {
		setNotice(null);
	};

	const fetchGroups = async () => {
		try {
			setState((prev) => ({ ...prev, loading: true, error: null }));

			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/custom-fields-groups'),
			})) as CustomFieldsGroups;

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
			showNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to load custom fields', 'quillcrm'),
			});
		}
	};

	const saveField = async (field: CustomField, isNew: boolean) => {
		try {
			const method = isNew ? 'POST' : 'PUT';
			const path = isNew
				? '/qc/v1/custom-fields'
				: `/qc/v1/custom-fields/${field.id}`;

			const response = (await apiFetch({
				path,
				method,
				data: field,
			})) as CustomField;

			setState((prev) => ({
				...prev,
				groups: prev.groups.map((group) => {
					if (isNew && group.id === response.group_id) {
						return {
							...group,
							custom_fields: [...group.custom_fields, response],
						};
					}
					if (!isNew && group.id === response.group_id) {
						return {
							...group,
							custom_fields: group.custom_fields.map((f) =>
								f.id === response.id ? response : f
							),
						};
					}
					return group;
				}),
			}));

			showNotice({
				type: 'success',
				message: isNew
					? __('Custom field added', 'quillcrm')
					: __('Custom field updated', 'quillcrm'),
			});
			return true;
		} catch (error: any) {
			showNotice({
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

			setState((prev) => ({
				...prev,
				groups: prev.groups.map((group) => {
					if (group.id === field.group_id) {
						return {
							...group,
							custom_fields: group.custom_fields.filter(
								(f) => f.id !== field.id
							),
						};
					}
					return group;
				}),
			}));

			showNotice({
				type: 'success',
				message: __('Field deleted', 'quillcrm'),
			});
		} catch (error: any) {
			showNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	// New function for bulk delete
	const deleteSelectedFields = async (fieldIds: number[]) => {
		try {
			await apiFetch({
				path: '/qc/v1/custom-fields',
				method: 'DELETE',
				data: { ids: fieldIds },
			});

			setState((prev) => ({
				...prev,
				groups: prev.groups.map((group) => ({
					...group,
					custom_fields: group.custom_fields.filter(
						(field) => !fieldIds.includes(field.id)
					),
				})),
			}));

			showNotice({
				type: 'success',
				message: __('Selected fields deleted', 'quillcrm'),
			});
		} catch (error: any) {
			showNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const saveGroup = async (name: string) => {
		try {
			const response = (await apiFetch({
				path: '/qc/v1/custom-fields-groups',
				method: 'POST',
				data: { name },
			})) as CustomFieldsGroup;

			setState((prev) => ({
				...prev,
				groups: [...prev.groups, response],
			}));

			showNotice({
				type: 'success',
				message: __('Group added', 'quillcrm'),
			});
			return true;
		} catch (error: any) {
			showNotice({
				type: 'error',
				message: error.message,
			});
			return false;
		}
	};

	const updateGroup = async (groupId: number, name: string) => {
		try {
			const response = (await apiFetch({
				path: `/qc/v1/custom-fields-groups/${groupId}`,
				method: 'PUT',
				data: { name }, // Only send name, no slug
			})) as CustomFieldsGroup;

			setState((prev) => ({
				...prev,
				groups: prev.groups.map((group) =>
					group.id === groupId ? { ...group, ...response } : group
				),
			}));

			showNotice({
				type: 'success',
				message: __('Group updated', 'quillcrm'),
			});
			return true;
		} catch (error: any) {
			showNotice({
				type: 'error',
				message: error.message,
			});
			return false;
		}
	};

	const duplicateGroup = async (groupId: number, name?: string) => {
		try {
			const response = (await apiFetch({
				path: `/qc/v1/custom-fields-groups/${groupId}/duplicate`,
				method: 'POST',
				data: { name },
			})) as CustomFieldsGroup;

			setState((prev) => ({
				...prev,
				groups: [...prev.groups, response],
			}));

			showNotice({
				type: 'success',
				message: __('Group duplicated successfully', 'quillcrm'),
			});
			return true;
		} catch (error: any) {
			showNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to duplicate group', 'quillcrm'),
			});
			return false;
		}
	};

	const deleteGroup = async (groupId: number, newGroupId?: number) => {
		try {
			// Find the group to check if it has fields
			const groupToDelete = state.groups.find(
				(group) => group.id === groupId
			);
			const hasFields =
				groupToDelete && groupToDelete.custom_fields.length > 0;

			// Always send new_group_id in the request data, just like the working function
			await apiFetch({
				path: `/qc/v1/custom-fields-groups/${groupId}`,
				method: 'DELETE',
				data: {
					new_group_id: newGroupId || 0, // Send 0 if newGroupId is undefined, matching working function
				},
			});

			setState((prev) => ({
				...prev,
				groups: prev.groups
					.map((group) => {
						// If this is the target group and we're moving fields to it
						if (
							hasFields &&
							newGroupId &&
							group.id === newGroupId &&
							groupToDelete
						) {
							return {
								...group,
								custom_fields: [
									...group.custom_fields,
									// Add the moved fields with updated group_id
									...groupToDelete.custom_fields.map(
										(field) => ({
											...field,
											group_id: newGroupId,
										})
									),
								],
							};
						}
						return group;
					})
					.filter((group) => group.id !== groupId), // Remove the deleted group
			}));

			showNotice({
				type: 'success',
				message: __('Group deleted successfully', 'quillcrm'),
			});
			return true;
		} catch (error: any) {
			showNotice({
				type: 'error',
				message:
					error.message || __('Failed to delete group', 'quillcrm'),
			});
			return false;
		}
	};

	const moveField = async (field: CustomField, newGroupId: number) => {
		// Optimistically update the UI
		setState((prev) => ({
			...prev,
			groups: prev.groups.map((group) => {
				if (group.id === newGroupId) {
					return {
						...group,
						custom_fields: [
							...group.custom_fields,
							{ ...field, group_id: newGroupId },
						],
					};
				}
				if (group.id === field.group_id) {
					return {
						...group,
						custom_fields: group.custom_fields.filter(
							(f) => f.id !== field.id
						),
					};
				}
				return group;
			}),
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
		notice,
		closeNotice,
		showNotice,
		moveField,
		fetchGroups,
		saveField,
		deleteField,
		deleteSelectedFields,
		saveGroup,
		updateGroup,
		duplicateGroup,
		deleteGroup,
	};
};
