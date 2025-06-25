/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
import { Tag as AntTag } from 'antd';

/**
 * Internal dependencies
 */
import type {
	Contact,
	Filter as FilterType,
	ContactsResponse,
	DataTableConfig,
} from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { convertDate } from '@quillcrm/utils';
import ConfigAPI from '@quillcrm/config';
import { DataTable } from '@/components/ui/data-table';
import { Checkbox } from '@/components/ui/checkbox'; // adjust path if needed
import { SortIcon, ViewIcon } from '@quillcrm/components';

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

const AllContacts: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<Contact[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [selectedLists, setSelectedLists] = useState<string[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const { createNotice } = useDispatch('quillcrm/core');
	const isWooCommerceActive = ConfigAPI.isWoocommerceActive();
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<FilterType[]>([]);
	const [isFiltering, setIsFiltering] = useState(false);
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState(false);

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
			createNotice({
				type: 'error',
				message: __('Failed to fetch contacts', 'quillcrm'),
			});
		} finally {
			setLoading(false);
			setIsFiltering(false);
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
			fetchContacts();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const addToList = async () => {
		if (selectedLists.length === 0) {
			createNotice({
				type: 'error',
				message: __('Please select a list', 'quillcrm'),
			});
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/add-to-list',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					list_ids: selectedLists.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchContacts();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const removeFromList = async () => {
		if (selectedLists.length === 0) {
			createNotice({
				type: 'error',
				message: __('Please select a list', 'quillcrm'),
			});
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/remove-from-list',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					list_ids: selectedLists.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchContacts();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const addTag = async () => {
		if (selectedTags.length === 0) {
			createNotice({
				type: 'error',
				message: __('Please select a tag', 'quillcrm'),
			});
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/add-tag',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					tag_ids: selectedTags.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchContacts();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const removeTag = async () => {
		if (selectedTags.length === 0) {
			createNotice({
				type: 'error',
				message: __('Please select a tag', 'quillcrm'),
			});
			return;
		}
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/contacts/remove-tag',
				method: 'POST',
				data: {
					ids: selectedRowKeys,
					tag_ids: selectedTags.map(Number),
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchContacts();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const doBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelected();
				break;
			case 'add_to_list':
				addToList();
				break;
			case 'remove_from_list':
				removeFromList();
				break;
			case 'add_tag':
				addTag();
				break;
			case 'remove_tag':
				removeTag();
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
				<div className='flex items-center gap-1'
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
				<div className='flex items-center gap-1'
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
					<AntTag key={tag.id}>{tag.name}</AntTag>
				)),
		},
		{
			accessorKey: 'lists',
			header: 'List',
			cell: ({ row }) =>
				row.original.lists?.map((list) => (
					<AntTag key={list.id}>{list.name}</AntTag>
				)),
		},
		{
			accessorKey: 'status',
			header: ({ column }) => (
				<div className='flex items-center gap-1'
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Status', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<div className="text-[#16A34A] text-xs capitalize bg-[#EFFFF5] rounded-lg py-1 px-3">
					{row.original.status || '-'}
				</div>
			),
		},
		{
			accessorKey: 'phone',
			header: ({ column }) => (
				<div className='flex items-center gap-1'
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
				<div className='flex items-center gap-1'
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
				<div className='flex items-center gap-1'
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
				onSelectionChange: (tags: string[]) => setSelectedTags(tags),
			},
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
	};

	return (
		<div className="qcrm-all-contacts w-full">
			{/* DataTable now includes search, filters, bulk actions, and column management */}
			<DataTable columns={columns} data={data} config={tableConfig} />
		</div>
	);
};

export default AllContacts;
