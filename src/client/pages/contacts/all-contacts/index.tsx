/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
import React from 'react';

/**
 * Internal dependencies
 */
import type {
	Contact,
	Filter as FilterType,
	ContactsResponse,
	DataTableConfig,
	NoticeMessage,
} from '@quillcrm/client';
import { NavLink, getToLink, useNavigate } from '@quillcrm/navigation';
import { convertDate } from '@quillcrm/utils';
import ConfigAPI from '@quillcrm/config';
import { DataTable } from '@/components/ui/data-table';
import { Checkbox } from '@/components/ui/checkbox';
import {
	SortIcon,
	ViewIcon,
	NoticeBanner,
	Field,
	CustomDialogHeader,
	GradientAddContactIcon,
} from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { isEmail } from 'validator';
import ImportModal from '../../import-modal';
import ExportModal from '../../export-modal';

const selectionColumn: ColumnDef<Contact> = {
	id: 'select',
	header: ({ table }) => (
		<Checkbox
			checked={table.getIsAllPageRowsSelected()}
			onCheckedChange={(value) =>
				table.toggleAllPageRowsSelected(!!value)
			}
			aria-label="Select all"
		/>
	),
	cell: ({ row }) => (
		<Checkbox
			checked={row.getIsSelected()}
			onCheckedChange={(value) => row.toggleSelected(!!value)}
			aria-label="Select row"
		/>
	),
	enableSorting: false,
	enableHiding: false,
};

export interface AllContactsRef {
	openCreateContactModal: () => void;
	openImportModal: () => void;
	openExportModal: () => void;
}

interface AllContactsProps {
	activeTab?: string;
}

const AllContacts = forwardRef<AllContactsRef, AllContactsProps>(
	({ activeTab }, ref) => {
		const navigate = useNavigate();
		const [loading, setLoading] = useState(true);
		const [page, setPage] = useState(1);
		const [perPage, setPerPage] = useState(10);
		const [total, setTotal] = useState(0);
		const [data, setData] = useState<Contact[]>([]);
		const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
		const [selectedLists, setSelectedLists] = useState<string[]>([]);
		const [selectedTags, setSelectedTags] = useState<string[]>([]);
		const [notice, setNotice] = useState<NoticeMessage | null>(null);
		const isWooCommerceActive = ConfigAPI.isWoocommerceActive();
		const [showFilters, setShowFilters] = useState(false);
		const [filters, setFilters] = useState<FilterType[]>([]);
		const [isFiltering, setIsFiltering] = useState(false);
		const [bulkAction, setBulkAction] = useState<string>('');
		const [isApplying, setIsApplying] = useState(false);

		// Modal states
		const [createContactVisible, setCreateContactVisible] = useState(false);
		const [importModalVisible, setImportModalVisible] = useState(false);
		const [exportModalVisible, setExportModalVisible] = useState(false);
		const [isSaving, setIsSaving] = useState(false);
		const [contact, setContact] = useState({
			email: '',
			first_name: '',
			last_name: '',
		});

		const [dateRange, setDateRange] = useState<{
			from: Date | null;
			to: Date | null;
		}>({
			from: null,
			to: null,
		});

		useEffect(() => {
			if (dateRange.from || dateRange.to) {
				setPage(1); // Reset to first page when filtering
				fetchContacts();
			}
		}, [dateRange]);

		// Expose methods to parent component
		useImperativeHandle(ref, () => ({
			openCreateContactModal: () => {
				setContact({
					email: '',
					first_name: '',
					last_name: '',
				});
				setCreateContactVisible(true);
			},
			openImportModal: () => {
				setImportModalVisible(true);
			},
			openExportModal: () => {
				setExportModalVisible(true);
			},
		}));

		const showNotice = (type: 'success' | 'error', message: string) => {
			setNotice({ type, message });
		};

		const closeNotice = () => {
			setNotice(null);
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
			details.lastOrderDate = contact.orders[0].date_created_gmt;

			return details;
		};

		const fetchContacts = async () => {
			setLoading(true);
			try {
				const response = (await apiFetch({
					path: addQueryArgs('/qc/v1/contacts', {
						page,
						per_page: perPage,
						filters: filters,
					}),
					method: 'GET',
				})) as ContactsResponse;

				response.total && setTotal(response.total);
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

		const handleImportCompleted = () => {
			fetchContacts();
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
						`Your Contact ( contact ) was successfully added to list (list name)  — check it out!`,
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
				showNotice(
					'success',
					__('Tags added successfully', 'quillcrm')
				);
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
				showNotice(
					'success',
					__('Tags removed successfully', 'quillcrm')
				);
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
					// Use the lists from data parameter
					if (data?.lists) {
						await addToListWithData(data.lists);
					}
					break;
				case 'remove_from_list':
					// Use the lists from data parameter
					if (data?.lists) {
						await removeFromListWithData(data.lists);
					}
					break;
				case 'add_tag':
					// Use the tags from data parameter
					if (data?.tags) {
						await addTagWithData(data.tags);
					}
					break;
				case 'remove_tag':
					// Use the tags from data parameter
					if (data?.tags) {
						await removeTagWithData(data.tags);
					}
					break;
				default:
					break;
			}
		};
		useEffect(() => {
			fetchContacts();
		}, [page, perPage]);

		const baseColumns: ColumnDef<Contact>[] = [
			{
				accessorKey: 'full_name',
				header: ({ column }) => (
					<div
						className="flex items-center gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					>
						{__('Full Name', 'quillcrm')}
						<SortIcon />
					</div>
				),
				cell: ({ row }) => (
					<NavLink to={`contacts/${row.original.id}`}>
						{row.original.first_name || '-'}{' '}
						{row.original.last_name || '-'}
					</NavLink>
				),
			},
			{
				accessorKey: 'email',
				header: ({ column }) => (
					<div
						className="flex items-center gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					>
						{__('Email', 'quillcrm')}
						<SortIcon />
					</div>
				),
				cell: ({ row }) => (
					<NavLink to={`contacts/${row.original.id}`}>
						{row.original.email}
					</NavLink>
				),
			},
			{
				accessorKey: 'tags',
				header: 'Tag',
				cell: ({ row }) =>
					row.original.tags?.map((tag) => (
						<div key={tag.id}>{tag.name}</div>
					)),
			},
			{
				accessorKey: 'lists',
				header: 'List',
				cell: ({ row }) =>
					row.original.lists?.map((list) => (
						<div key={list.id}>{list.name}</div>
					)),
			},
			{
				accessorKey: 'status',
				header: ({ column }) => (
					<div
						className="flex items-center gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					>
						{__('Status', 'quillcrm')}
						<SortIcon />
					</div>
				),
				cell: ({ row }) => {
					const status = row.original.status || '-';
					let statusClasses = '';

					// Define styles for each status
					switch (status.toLowerCase()) {
						case 'subscribed':
							statusClasses = 'text-[#16A34A] bg-[#EFFFF5]';
							break;
						case 'unsubscribed':
							statusClasses = 'text-[#1C1D22] bg-[#FFF2E2]';
							break;
						case 'bounced':
							statusClasses = 'text-[#5570F1] bg-[#5570F129]';
							break;
						case 'unverified':
							statusClasses = 'text-[#CC5F5F] bg-[#F57E7729]';
							break;
						default:
							statusClasses = 'text-gray-600 bg-gray-100';
					}

					return (
						<div
							className={`text-xs capitalize rounded-lg py-1 px-3 ${statusClasses}`}
						>
							{status}
						</div>
					);
				},
			},
			{
				accessorKey: 'phone',
				header: ({ column }) => (
					<div
						className="flex items-center gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					>
						{__('Phone', 'quillcrm')}
						<SortIcon />
					</div>
				),
				cell: ({ row }) => row.original.phone || '-',
			},
			{
				accessorKey: 'country',
				header: ({ column }) => (
					<div
						className="flex items-center gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					>
						{__('Country', 'quillcrm')}
						<SortIcon />
					</div>
				),
				cell: ({ row }) => row.original.country || '-',
			},
			{
				accessorKey: 'city',
				header: __('City', 'quillcrm'),
				cell: ({ row }) => row.original.city || '-',
			},
			{
				accessorKey: 'address_1',
				header: __('Address 1', 'quillcrm'),
				cell: ({ row }) => row.original.address_1 || '-',
			},
			{
				accessorKey: 'address_2',
				header: __('Address 2', 'quillcrm'),
				cell: ({ row }) => row.original.address_2 || '-',
			},
			{
				accessorKey: 'state',
				header: __('State', 'quillcrm'),
				cell: ({ row }) => row.original.state || '-',
			},
			{
				accessorKey: 'zip',
				header: __('Postal Code', 'quillcrm'),
				cell: ({ row }) => row.original.zip || '-',
			},
			{
				accessorKey: 'created_at',
				header: ({ column }) => (
					<div
						className="flex items-center gap-1"
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					>
						{__('Created At', 'quillcrm')}
						<SortIcon />
					</div>
				),
				cell: ({ row }) => convertDate(row.original.created_at),
			},
			{
				accessorKey: 'view',
				header: __('Actions', 'quillcrm'),
				cell: ({ row }) => (
					<NavLink to={`contacts/${row.original.id}`}>
						<div className="flex items-center gap-1 text-[#3F3F46]">
							<div className="text-[#A1A1AA]">
								<ViewIcon />
							</div>
							View
						</div>
					</NavLink>
				),
			},
		];

		if (isWooCommerceActive) {
			baseColumns.push(
				{
					accessorKey: 'total_orders',
					header: __('Total Orders', 'quillcrm'),
					cell: ({ row }) => {
						const details = getContactOrderDetails(row.original);
						return <>{details.orders}</>;
					},
				},
				{
					accessorKey: 'total_revenue',
					header: __('Total Revenue', 'quillcrm'),
					cell: ({ row }) => {
						const details = getContactOrderDetails(row.original);
						return <>{details.revenue}</>;
					},
				},
				{
					accessorKey: 'last_order_date',
					header: __('Last Order Date', 'quillcrm'),
					cell: ({ row }) => {
						const details = getContactOrderDetails(row.original);
						return (
							<>
								{details.lastOrderDate
									? convertDate(details.lastOrderDate) || '-'
									: '-'}
							</>
						);
					},
				}
			);
		}

		const columns: ColumnDef<Contact>[] = [selectionColumn, ...baseColumns];

		const tableConfig: DataTableConfig<Contact> = {
			manageColumns: {
				enabled: true,
			},
			search: {
				placeholder: __('Search contacts...', 'quillcrm'),
			},
			selection: {
				enabled: true,
				selectedKeys: selectedRowKeys,
				onSelectionChange: setSelectedRowKeys,
			},
			bulkActions: {
				enabled: true,
				currentAction: bulkAction,
				onActionChange: setBulkAction,
				onExecuteAction: doBulkAction,
				lists: {
					selected: selectedLists,
					onSelectionChange: (lists: string[]) =>
						setSelectedLists(lists.map((id) => id.toString())),
				},
				tags: {
					selected: selectedTags,
					onSelectionChange: (tags: string[]) =>
						setSelectedTags(tags),
				},
				activeTab: activeTab,
			},
			filters: {
				enabled: true,
				showFilters: showFilters,
				onToggleFilters: setShowFilters,
				currentFilters: filters,
				onFiltersChange: setFilters,
				onApplyFilters: () => {
					setPage(1);
					fetchContacts();
				},
				isApplying: isFiltering,
			},
			dateRange: {
				enabled: true,
				value: dateRange,
				onDateChange: setDateRange,
				placeholder: __('Date Range', 'quillcrm'),
			},
		};

		return (
			<div className="qcrm-all-contacts w-full">
				{notice && (
					<NoticeBanner notice={notice} closeNotice={closeNotice} />
				)}
				<DataTable
					columns={columns}
					data={data}
					config={tableConfig}
					activeTab={activeTab}
					initialPageSize={perPage}
				/>

				{/* Create Contact Modal */}
				<Dialog
					open={createContactVisible}
					onOpenChange={(open) => {
						setCreateContactVisible(open);
						if (!open) {
							setContact({
								email: '',
								first_name: '',
								last_name: '',
							});
						}
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								<CustomDialogHeader
									title={__('Create Contact', 'quillcrm')}
									subtitle={__(
										'Add basic information below to add new Contact',
										'quillcrm'
									)}
									icon={<GradientAddContactIcon />}
								/>
							</DialogTitle>
						</DialogHeader>

						<div className="qcrm-fields space-y-4">
							<Field
								label={__('First Name', 'quillcrm')}
								value={contact.first_name}
								onChange={(value) =>
									setContact({
										...contact,
										first_name: value,
									})
								}
								type="text"
							/>
							<Field
								label={__('Last Name', 'quillcrm')}
								value={contact.last_name}
								onChange={(value) =>
									setContact({
										...contact,
										last_name: value,
									})
								}
								type="text"
							/>
							<Field
								label={__('Email', 'quillcrm')}
								value={contact.email}
								onChange={(value) =>
									setContact({
										...contact,
										email: value,
									})
								}
								type="email"
							/>
						</div>

						<DialogFooter className="mt-6">
							<Button
								onClick={createContact}
								disabled={isSaving}
								size="xl"
								variant="gradient"
								className="w-full"
							>
								{isSaving
									? __('Submitting...', 'quillcrm')
									: __('Submit', 'quillcrm')}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Import Modal */}
				<ImportModal
					open={importModalVisible}
					onClose={() => setImportModalVisible(false)}
					onCompleted={handleImportCompleted}
				/>

				{/* Export Modal */}
				<ExportModal
					open={exportModalVisible}
					onClose={() => setExportModalVisible(false)}
				/>
			</div>
		);
	}
);

export default AllContacts;
