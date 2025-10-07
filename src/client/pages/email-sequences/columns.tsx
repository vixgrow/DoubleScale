/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { ColumnDef } from '@tanstack/react-table';

/**
 * Internal dependencies
 */
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
	DeleteIcon,
	FallbackCell,
	FormattedDateCell,
	SettingsOutlinedIcon,
	SortedHeaderCell,
	ViewOutlinedIcon,
} from '@/components';
import { CopyIcon, PencilIcon } from 'lucide-react';

// Import types
import { EmailSequence } from './types';

// Column props interface
interface ColumnProps {
	onDelete: (id: number) => void;
	onEdit: (id: number, name: string) => void;
	onDuplicate: (id: number) => void;
	navigate: (path: string) => void;
	onShowSubscribers: (id: number, name: string) => void;
}

export const emailSequenceColumns = ({
	onDelete,
	onEdit,
	onDuplicate,
	navigate,
	onShowSubscribers,
}: ColumnProps): ColumnDef<EmailSequence>[] => [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && 'indeterminate')
				}
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
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			SortedHeaderCell({
				column,
				header: __('Sequence Name', 'quillcrm'),
			}),
	},
	{
		accessorKey: 'email_count',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Emails', 'quillcrm') }),
		cell: ({ row }) => {
			return (
				<Badge variant="secondary" className="rounded-[88px]">
					{row.getValue('email_count')} {__('Email(s)', 'quillcrm')}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'subscriber_count',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Subscribers', 'quillcrm') }),
		cell: ({ row }) => {
			const sequence = row.original;
			const subscriberCount = row.getValue('subscriber_count') as string;

			// Extract the number from the subscriber count string (e.g., "5 Subscribers" -> 5)
			const count = parseInt(subscriberCount.split(' ')[0]) || 0;

			return (
				<Button
					variant="ghost"
					className="h-auto p-0 font-normal text-blue-600 hover:text-blue-800 hover:bg-blue-50"
					onClick={() =>
						onShowSubscribers(sequence.id, sequence.name)
					}
					disabled={count === 0}
				>
					<FallbackCell value={subscriberCount} />
				</Button>
			);
		},
	},
	{
		accessorKey: 'created_at',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Created At', 'quillcrm') }),
		cell: ({ row }) => (
			<FormattedDateCell value={row.getValue('created_at')} />
		),
	},
	{
		accessorKey: 'actions',
		header: () => (
			<div className="text-center">{__('Actions', 'quillcrm')}</div>
		),
		cell: ({ row }) => {
			const sequence = row.original;
			return (
				<div className="text-center">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="h-8 w-8 p-0 focus-visible:border-none focus-visible:outline-none focus-visible:box-shadow-none focus-visible:ring-0"
							>
								<SettingsOutlinedIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									navigate(
										`admin.php?page=quillcrm&path=email-sequences/${sequence.id}`
									);
								}}
							>
								<ViewOutlinedIcon />
								{__('View Details', 'quillcrm')}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onDuplicate(sequence.id)}
							>
								<CopyIcon />
								{__('Duplicate', 'quillcrm')}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									onEdit(sequence.id, sequence.name)
								}
							>
								<PencilIcon className="h-4 w-4 mr-2" />
								{__('Edit', 'quillcrm')}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onDelete(sequence.id)}
								className="text-red-500 hover:text-red-500 focus:text-red-500"
							>
								<DeleteIcon />
								{__('Delete', 'quillcrm')}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		},
	},
];
