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
import type { Contact } from '@doublescale/client';
import { convertDate } from '@doublescale/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { SortIcon, TimeAgoCell } from '@doublescale/components';
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
			accessorKey: 'id',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('ID', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => <span className="text-muted-foreground font-mono text-xs">{row.original.id}</span>,
		},
		{
			accessorKey: 'contact',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Contact', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => {
				const contact = row.original;
				const fullName =
					`${contact.first_name || ''} ${contact.last_name || ''}`.trim();
				const initials = getContactInitials(
					contact.first_name,
					contact.last_name
				);
				const avatarUrl = (contact as any).avatar_url;

				return (
					<Button
						variant="ghost"
						onClick={() =>
							openContactDialog(row.original.id.toString())
						}
						className="h-auto p-0 text-left hover:bg-transparent cursor-pointer bg-transparent shadow-none border-none"
					>
						<div className="flex items-center gap-2.5">
							<Avatar className="w-9 h-9 rounded-full">
								{avatarUrl ? (
									<AvatarImage
										src={avatarUrl}
										alt={fullName || contact.email}
										className="rounded-full"
									/>
								) : null}
								<AvatarFallback className="rounded-full bg-primary/10 text-primary font-semibold text-xs">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col gap-0.5">
								{fullName && (
									<div className="font-medium capitalize text-sm text-foreground max-w-[180px] truncate leading-tight">
										{fullName}
									</div>
								)}
								<div className="text-xs text-muted-foreground">
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
					{__('Phone', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => <span className="text-sm text-foreground">{row.original.phone || '-'}</span>,
		},
		{
			accessorKey: 'whatsapp_phone',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('WhatsApp Phone', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => <span className="text-sm text-foreground">{row.original.whatsapp_phone || '-'}</span>,
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
					{__('Country', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => <span className="text-sm text-foreground">{row.original.country || '-'}</span>,
		},
		{
			accessorKey: 'city',
			header: __('City', 'doublescale'),
			cell: ({ row }) => <span className="text-sm text-foreground">{row.original.city || '-'}</span>,
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
					{__('Status', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => {
				const contact = row.original as any;

				const emailStatus = contact.email_status || '';
				const smsStatus = contact.sms_status || '';
				const whatsappStatus = contact.whatsapp_status || '';

				const isSubscribed =
					emailStatus.toLowerCase() === 'subscribed' ||
					smsStatus.toLowerCase() === 'subscribed' ||
					whatsappStatus.toLowerCase() === 'subscribed';

				const status = isSubscribed ? 'subscribed' : 'unsubscribed';
				let statusClasses = '';

				switch (status.toLowerCase()) {
					case 'subscribed':
						statusClasses =
							'text-emerald-700 bg-emerald-50 border-emerald-200';
						break;
					case 'unsubscribed':
						statusClasses =
							'text-amber-700 bg-amber-50 border-amber-200';
						break;
					case 'bounced':
						statusClasses =
							'text-primary bg-primary/5 border-primary/20';
						break;
					case 'unverified':
						statusClasses =
							'text-destructive bg-destructive/5 border-destructive/20';
						break;
					default:
						statusClasses =
							'text-muted-foreground bg-muted/50 border-border';
				}

				return (
					<span
						className={`inline-flex items-center text-xs font-medium capitalize rounded-full border py-0.5 px-2.5 ${statusClasses}`}
					>
						{status}
					</span>
				);
			},
		},
		{
			accessorKey: 'tags',
			header: __('Tag', 'doublescale'),
			cell: ({ row }) => {
				const tags = row.original.tags;
				if (!tags || tags.length === 0) return <span className="text-muted-foreground">-</span>;
				return (
					<div className="flex flex-wrap gap-1">
						{tags.slice(0, 2).map((tag) => (
							<span key={tag.id} className="inline-flex items-center text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5">
								{tag.name}
							</span>
						))}
						{tags.length > 2 && (
							<span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
								+{tags.length - 2}
							</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'lists',
			header: __('List', 'doublescale'),
			cell: ({ row }) => {
				const lists = row.original.lists;
				if (!lists || lists.length === 0) return <span className="text-muted-foreground">-</span>;
				return (
					<div className="flex flex-wrap gap-1">
						{lists.slice(0, 2).map((list) => (
							<span key={list.id} className="inline-flex items-center text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
								{list.name}
							</span>
						))}
						{lists.length > 2 && (
							<span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
								+{lists.length - 2}
							</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'address_1',
			header: __('Address 1', 'doublescale'),
			cell: ({ row }) => row.original.address_1 || '-',
		},
		{
			accessorKey: 'address_2',
			header: __('Address 2', 'doublescale'),
			cell: ({ row }) => row.original.address_2 || '-',
		},
		{
			accessorKey: 'state',
			header: __('State', 'doublescale'),
			cell: ({ row }) => row.original.state || '-',
		},
		{
			accessorKey: 'zip',
			header: __('Postal Code', 'doublescale'),
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
					{__('Created At', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<TimeAgoCell value={row.getValue('created_at')} />
			),
		},
	];

	if (isWooCommerceActive) {
		baseColumns.push(
			{
				accessorKey: 'total_orders',
				header: __('Total Orders', 'doublescale'),
				cell: ({ row }) => {
					const details = getContactOrderDetails(row.original);
					return <>{details.orders}</>;
				},
			},
			{
				accessorKey: 'total_revenue',
				header: __('Total Revenue', 'doublescale'),
				cell: ({ row }) => {
					const details = getContactOrderDetails(row.original);
					return <>{details.revenue}</>;
				},
			},
			{
				accessorKey: 'last_order_date',
				header: __('Last Order Date', 'doublescale'),
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
