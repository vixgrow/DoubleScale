/**
 * wordpress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useEffect } from 'react';
import { isEmail } from 'validator';
/**
 * internal dependencies
 */
import { useNavigate, getToLink } from '@quillcrm/navigation';
import type { ContactsResponse, Contact } from '@quillcrm/client';
import { useContactsContext } from './contexts';
import ConfigAPI from '@quillcrm/config';

export const useContactsAPI = () => {
	const navigate = useNavigate();
	const {
		page,
		perPage,
		filters,
		dateRange,
		contact,
		selectedRowKeys,
		keywords,
		totalRecords,
		setTotalRecords,
		setLoading,
		setData,
		setTotal,
		setIsFiltering,
		setIsSaving,
		showNotice,
		setSelectedRowKeys,
		setBulkAction,
		setIsApplying,
	} = useContactsContext();

	const fetchContacts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					page,
					per_page: perPage,
					filters: filters,
					from: dateRange.from?.toISOString(),
					to: dateRange.to?.toISOString(),
					keywords,
				}),
				method: 'GET',
			})) as ContactsResponse;

			response.total && setTotalRecords(response.total);
			response.data && setData(response.data);
		} catch (error) {
			showNotice('error', __('Failed to fetch contacts', 'quillcrm'));
		} finally {
			setLoading(false);
			setIsFiltering(false);
		}
	};

	const createContact = async () => {
		if (!isEmail(contact.email)) {
			showNotice('error', __('Invalid email', 'quillcrm'));
			return;
		}

		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: '/qc/v1/contacts',
				method: 'POST',
				data: contact,
			})) as Contact;

			navigate(getToLink(`contacts/${response.id}`));
		} catch (error: any) {
			showNotice(
				'error',
				error.message || __('Failed to create Contact', 'quillcrm')
			);
		} finally {
			setIsSaving(false);
		}
	};

	const deleteSelected = async () => {
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__('Contacts deleted successfully', 'quillcrm')
			);
			fetchContacts();
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const addToListWithData = async (lists: string[]) => {
		if (lists.length === 0) {
			showNotice('error', __('Please select a list', 'quillcrm'));
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/add-to-list',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					list_ids: lists.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__(
					'Your Contact ( contact ) was successfully added to list (list name)  — check it out!',
					'quillcrm'
				)
			);
			fetchContacts();
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const removeFromListWithData = async (lists: string[]) => {
		if (lists.length === 0) {
			showNotice('error', __('Please select a list', 'quillcrm'));
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/remove-from-list',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					list_ids: lists.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__('Contacts removed from list successfully', 'quillcrm')
			);
			fetchContacts();
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const addTagWithData = async (tags: string[]) => {
		if (tags.length === 0) {
			showNotice('error', __('Please select a tag', 'quillcrm'));
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/add-tag',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					tag_ids: tags.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice('success', __('Tags added successfully', 'quillcrm'));
			fetchContacts();
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const removeTagWithData = async (tags: string[]) => {
		if (tags.length === 0) {
			showNotice('error', __('Please select a tag', 'quillcrm'));
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/remove-tag',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					tag_ids: tags.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice('success', __('Tags removed successfully', 'quillcrm'));
			fetchContacts();
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const doBulkAction = async (action: string, data?: any) => {
		switch (action) {
			case 'delete':
				deleteSelected();
				break;
			case 'add_to_list':
				if (data?.lists) {
					await addToListWithData(data.lists);
				}
				break;
			case 'remove_from_list':
				if (data?.lists) {
					await removeFromListWithData(data.lists);
				}
				break;
			case 'add_tag':
				if (data?.tags) {
					await addTagWithData(data.tags);
				}
				break;
			case 'remove_tag':
				if (data?.tags) {
					await removeTagWithData(data.tags);
				}
				break;
			default:
				break;
		}
	};

	// Auto-fetch when dependencies change
	useEffect(() => {
		fetchContacts();
	}, [page, perPage, dateRange, keywords]);

	// useEffect(() => {
	// 	if (dateRange.from || dateRange.to) {
	// 		// Reset to first page when filtering
	// 		// setPage(1); // Commented to avoid circular dependency
	// 		fetchContacts();
	// 	}
	// }, [dateRange]);

	return {
		fetchContacts,
		createContact,
		doBulkAction,
	};
};



export const useContactOrderDetails = () => {
	const isWooCommerceActive = ConfigAPI.isWoocommerceActive();

	const getContactOrderDetails = (contact: Contact) => {
		const details = {
			orders: 0,
			revenue: '-',
			lastOrderDate: '-',
		};

		if (!isWooCommerceActive) {
			return details;
		}

		if (!contact.orders || contact.orders.length === 0) {
			return details;
		}

		details.orders = contact.orders.length;
		details.revenue = contact.revenue || '-';
		details.lastOrderDate = contact.orders[0].date_created_gmt;

		return details;
	};

	return {
		isWooCommerceActive,
		getContactOrderDetails,
	};
};
