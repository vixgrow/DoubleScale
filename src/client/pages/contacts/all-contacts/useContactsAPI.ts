/**
 * wordpress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
/**
 * external dependencies
 */
import { useFetchGeneration } from '@doublescale/hooks/use-fetch-generation';
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
import { buildBulkTarget } from './select-all-matching';

/** One round of a resumable membership bulk action. */
interface BulkActionResponse {
	status: 'in_progress' | 'completed';
	total: number;
	processed: number;
	updated: number;
	skipped: number;
	next_after_id: number | null;
}

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
		selectAllMatching,
		clearSelection,
		setBulkProgress,
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
	const { beginFetch, isCurrent } = useFetchGeneration();

	const fetchContacts = async () => {
		const generation = beginFetch();
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

			if (!isCurrent(generation)) {
				return;
			}

			setTotalRecords(response.total || 0);
			setHasRecords((response.total_count || 0) > 0);
			response.data && setData(response.data);
		} catch (error) {
			if (!isCurrent(generation)) {
				return;
			}
			showNotice('error', __('Failed to fetch contacts', 'doublescale'));
		} finally {
			if (!isCurrent(generation)) {
				return;
			}
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
		const hasPhone = phone !== '';

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

	/**
	 * Run a membership bulk action to completion.
	 *
	 * A filter-wide selection is processed server-side one batch per request,
	 * so keep re-posting with the cursor we get back until it reports done.
	 * The explicit-ids path finishes in a single round.
	 */
	const runMembershipBulk = async (
		path: string,
		termsKey: 'tag_ids' | 'list_ids',
		termIds: number[],
		successMessage: string
	) => {
		const target = buildBulkTarget({
			selectAllMatching,
			selectedRowKeys,
			filters,
			keywords,
			dateRange: {
				from: formatDateForAPI(dateRange.from),
				to: formatDateForAPI(dateRange.to),
			},
		});

		setIsApplying(true);

		let afterId = 0;
		let total = 0;
		let updated = 0;
		let skipped = 0;

		try {
			// Bounded so a backend that never reports completion cannot spin
			// the browser forever.
			for (let round = 0; round < 10000; round++) {
				const response = (await apiFetch({
					path,
					method: 'POST',
					data: {
						[termsKey]: termIds,
						...(target.mode === 'ids' ? { ids: target.ids } : {}),
						...(target.mode === 'filter' ? { target } : {}),
						after_id: afterId,
						total,
					},
				})) as BulkActionResponse;

				total = response.total ?? 0;
				updated += response.updated ?? 0;
				skipped += response.skipped ?? 0;

				if (response.status !== 'in_progress') {
					break;
				}

				afterId = response.next_after_id ?? 0;
				setBulkProgress({
					processed: Math.min(updated + skipped, total),
					total,
				});
			}

			clearSelection();
			setBulkAction('');
			showNotice('success', successMessage);
			fetchContacts();
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setBulkProgress(null);
			setIsApplying(false);
		}
	};

	const addToListWithData = async (lists: string[]) => {
		if (lists.length === 0) {
			showNotice('error', __('Please select a list', 'doublescale'));
			return;
		}
		await runMembershipBulk(
			'/doublescale/v1/contacts/add-to-list',
			'list_ids',
			lists.map(Number),
			__(
				'Contacts were successfully added to list  — check it out!',
				'doublescale'
			)
		);
	};

	const removeFromListWithData = async (lists: string[]) => {
		if (lists.length === 0) {
			showNotice('error', __('Please select a list', 'doublescale'));
			return;
		}
		await runMembershipBulk(
			'/doublescale/v1/contacts/remove-from-list',
			'list_ids',
			lists.map(Number),
			__('Contacts removed from list successfully', 'doublescale')
		);
	};

	const addTagWithData = async (tags: string[]) => {
		if (tags.length === 0) {
			showNotice('error', __('Please select a tag', 'doublescale'));
			return;
		}
		await runMembershipBulk(
			'/doublescale/v1/contacts/add-tag',
			'tag_ids',
			tags.map(Number),
			__('Tags added successfully', 'doublescale')
		);
	};

	const removeTagWithData = async (tags: string[]) => {
		if (tags.length === 0) {
			showNotice('error', __('Please select a tag', 'doublescale'));
			return;
		}
		await runMembershipBulk(
			'/doublescale/v1/contacts/remove-tag',
			'tag_ids',
			tags.map(Number),
			__('Tags removed successfully', 'doublescale')
		);
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
		if (
			typeof order.date_created_gmt === 'string' &&
			order.date_created_gmt.trim()
		) {
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
			if (
				!latest ||
				new Date(orderDate).getTime() > new Date(latest).getTime()
			) {
				return orderDate;
			}
			return latest;
		}, '');

		details.lastOrderDate =
			latestOrderDate || contact.orders[0]?.date_created_gmt || '-';

		return details;
	};

	return {
		isWooCommerceActive,
		getContactOrderDetails,
	};
};
