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
import { convertDate } from '@quillcrm/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { SortIcon, TimeAgoCell } from '@quillcrm/components';
import { useContactOrderDetails } from '../useContactsAPI';
import { useContactsContext } from '../contexts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Helper function to generate contact initials
const getContactInitials = (firstName: string, lastName: string): string => {
	const first = firstName?.charAt(0)?.toUpperCase() || '';
	const last = lastName?.charAt(0)?.toUpperCase() || '';
	return first + last || '?';
};

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
	const { openContactDialog } = useContactsContext();

	const baseColumns: ColumnDef<Contact>[] = [
		{
			accessorKey: 'contact',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Contact', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => {
				const contact = row.original;
				const fullName = `${contact.first_name} ${contact.last_name}`.trim();
				const initials = getContactInitials(contact.first_name, contact.last_name);
				const hasImage = (contact as any).img;

				return (
					<Button
						variant="ghost"
						onClick={() => openContactDialog(row.original.id.toString())}
						className="h-auto p-0 text-left hover:bg-transparent cursor-pointer bg-transparent shadow-none border-none"
					>
						<div className="flex items-center gap-3">
							{hasImage ? (
								<Avatar className="w-12 h-12 rounded-lg">
									<AvatarImage src={(contact as any).img} alt={fullName || contact.email} className="rounded-lg" />
								</Avatar>
							) : (
								<Avatar className="w-12 h-12 rounded-lg">
									<AvatarFallback className="rounded-lg bg-[#E3EEFF99] text-secondary font-bold text-lg">
										{initials}
									</AvatarFallback>
								</Avatar>
							)}
							<div className="flex flex-col">
								{fullName && (
									<div className="font-semibold capitalize text-base text-[#09090B]">
										{fullName}
									</div>
								)}
								<div className="text-base text-gray-500">
									{contact.email}
								</div>
							</div>
						</div>
					</Button>
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
						className={`text-xs capitalize w-fit rounded-lg py-1 px-3 ${statusClasses}`}
					>
						{status}
					</div>
				);
			},
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
