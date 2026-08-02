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
import type { Contact, ContactsResponse, Order } from '@doublescale/client';
import ConfigAPI from '@doublescale/config';
import { formatDateForAPI } from '@doublescale/utils';
import {
	mapContactIdentifierError,
	type ContactIdentifierField,
} from '@doublescale/shared/utils/contact-identifier-errors';
import { useContactsContext } from './contexts';

interface ContactPayload {
	email?: string;
	first_name: string;
	last_name: string;
	phone?: string;
	whatsapp_phone?: string;
}

export type CreateContactResult =
	| { success: true; contact: Contact }
	| {
			success: false;
			message: string;
			field?: ContactIdentifierField;
	  };

interface UseContactsAPIOptions {
	readonly openDialogOnCreate?: boolean;
}

export const useContactsAPI = (options?: UseContactsAPIOptions) => {
	const {
		page,
		perPage,
		filters,
		dateRange,
		selectedRowKeys,
		keywords,
		sort,
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

	const { openDialogOnCreate = true } = options || {};

	const fetchContacts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/contacts', {
					page,
					per_page: perPage,
					filters: filters,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keywords,
					...(sort
						? { orderby: sort.orderby, order: sort.order }
						: {}),
				}),
				method: 'GET',
			})) as ContactsResponse;

			setTotalRecords(response.total || 0);
			setHasRecords((response.total_count || 0) > 0);
			response.data && setData(response.data);
		} catch (error) {
			showNotice('error', __('Failed to fetch contacts', 'doublescale'));
		} finally {
			setLoading(false);
			setIsFiltering(false);
		}
	};

	const createContact = async (
		contactPayload: ContactPayload
	): Promise<CreateContactResult> => {
		const email =
			typeof contactPayload.email === 'string'
				? contactPayload.email.trim()
				: '';
		const phone =
			typeof contactPayload.phone === 'string'
				? contactPayload.phone.trim()
				: '';
		const whatsappPhone =
			typeof contactPayload.whatsapp_phone === 'string'
				? contactPayload.whatsapp_phone.trim()
				: '';

		const hasEmail = email !== '' && isEmail(email);
		const hasPhone = phone !== '' || whatsappPhone !== '';

		if (!hasEmail && !hasPhone) {
			const message = __(
				'Contact must have an email address or phone number.',
				'doublescale'
			);
			showNotice('error', message);
			return { success: false, message };
		}

		if (email !== '' && !isEmail(email)) {
			const message = __('Invalid email address', 'doublescale');
			showNotice('error', message);
			return { success: false, message, field: 'email' };
		}

		setIsSaving(true);

		try {
			const payload: ContactPayload = {
				...contactPayload,
				first_name: contactPayload.first_name,
				last_name: contactPayload.last_name,
			};

			if (hasEmail) {
				payload.email = email;
			} else {
				delete payload.email;
			}

			if (phone !== '') {
				payload.phone = phone;
			}

			if (whatsappPhone !== '') {
				payload.whatsapp_phone = whatsappPhone;
			}

			const response = (await apiFetch({
				path: '/doublescale/v1/contacts',
				method: 'POST',
				data: payload,
			})) as Contact;

			// Close the create contact modal
			setCreateContactVisible(false);

			// Show success message
			showNotice(
				'success',
				__('Contact created successfully', 'doublescale')
			);

			// Open the contact dialog with the newly created contact (configurable)
			if (openDialogOnCreate) {
				openContactDialog(response.id.toString());
			}

			fetchContacts();
			return { success: true, contact: response };
		} catch (error: any) {
			const mapped = mapContactIdentifierError(error);
			showNotice('error', mapped.message);
			return {
				success: false,
				message: mapped.message,
				field: mapped.field,
			};
		} finally {
			setIsSaving(false);
		}
	};

	const deleteSelected = async (force = false) => {
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/contacts',
				method: 'DELETE',
				data: { ids: selectedRowKeys, force },
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__('Contacts deleted successfully', 'doublescale')
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
			showNotice('error', __('Please select a list', 'doublescale'));
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/contacts/add-to-list',
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
					'doublescale'
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
			showNotice('error', __('Please select a list', 'doublescale'));
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/contacts/remove-from-list',
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
				__('Contacts removed from list successfully', 'doublescale')
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
			showNotice('error', __('Please select a tag', 'doublescale'));
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/contacts/add-tag',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					tag_ids: tags.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice('success', __('Tags added successfully', 'doublescale'));
			fetchContacts();
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const removeTagWithData = async (tags: string[]) => {
		if (tags.length === 0) {
			showNotice('error', __('Please select a tag', 'doublescale'));
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/contacts/remove-tag',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					tag_ids: tags.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice('success', __('Tags removed successfully', 'doublescale'));
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
				deleteSelected(Boolean(data?.force));
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

	const getOrderDate = (order: Order): string => {
		if (typeof order.date_created_gmt === 'string' && order.date_created_gmt.trim()) {
			return order.date_created_gmt;
		}
		if (order.date?.date) {
			return order.date.date;
		}
		return '';
	};

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

		const latestOrderDate = contact.orders.reduce((latest, order) => {
			const orderDate = getOrderDate(order);
			if (!orderDate) {
				return latest;
			}
			if (!latest || new Date(orderDate).getTime() > new Date(latest).getTime()) {
				return orderDate;
			}
			return latest;
		}, '');

		details.lastOrderDate = latestOrderDate || contact.orders[0]?.date_created_gmt || '-';

		return details;
	};

	return {
		isWooCommerceActive,
		getContactOrderDetails,
	};
};
