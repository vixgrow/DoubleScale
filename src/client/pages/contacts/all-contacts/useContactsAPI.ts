/**
 * wordpress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
/**
 * external dependencies
 */
import { isEmail } from 'validator';
/**
 * internal dependencies
 */
import type { Contact, ContactsResponse } from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
import { formatDateForAPI } from '@quillcrm/utils';
import { useContactsContext } from './contexts';

export const useContactsAPI = () => {
	const {
		page,
		perPage,
		filters,
		dateRange,
		contact,
		selectedRowKeys,
		keywords,
		setTotalRecords,
		setLoading,
		setData,
		setIsFiltering,
		setIsSaving,
		showNotice,
		setSelectedRowKeys,
		setCreateContactVisible,
		setBulkAction,
		setIsApplying,
		openContactDialog,
		setHasRecords,
	} = useContactsContext();

	const fetchContacts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					page,
					per_page: perPage,
					filters: filters,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keywords,
				}),
				method: 'GET',
			})) as ContactsResponse;

			setTotalRecords(response.total || 0);
			setHasRecords((response.total_count || 0) > 0);
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
			setCreateContactVisible(false);
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

			// Close the create contact modal
			setCreateContactVisible(false);

			// Show success message
			showNotice(
				'success',
				__('Contact created successfully', 'quillcrm')
			);

			// Open the contact dialog with the newly created contact
			openContactDialog(response.id.toString());

			// Refresh contacts list
			fetchContacts();
		} catch (error: any) {
			setCreateContactVisible(false);
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
					'Contacts were successfully added to list  — check it out!',
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
