/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
/**
 * internal dependencies
 */
import type { Contact } from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { convertDate } from '@quillcrm/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { SortIcon, TimeAgoCell, ViewIcon } from '@quillcrm/components';
import { useContactOrderDetails } from '../useContactsAPI';

export const selectionColumn: ColumnDef<Contact> = {
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

export const useContactsColumns = () => {
	const { isWooCommerceActive, getContactOrderDetails } =
		useContactOrderDetails();

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
			cell: ({ row }) => <TimeAgoCell value={row.getValue('created_at')} />,
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

	return { columns };
};
