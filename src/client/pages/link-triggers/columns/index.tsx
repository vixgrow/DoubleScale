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
import type { LinkTrigger } from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { SortIcon, CopyIcon, TimeAgoCell } from '@quillcrm/components';
import { Checkbox } from '@/components/ui/checkbox';

export const selectionColumn: ColumnDef<LinkTrigger> = {
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

export function getColumns() {
	const columns: ColumnDef<LinkTrigger>[] = [
		selectionColumn,
		{
			accessorKey: 'name',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Name', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<NavLink to={`link-triggers/${row.original.id}`}>
					{row.original.name}
				</NavLink>
			),
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
			cell: ({ row }) => (
				<div
					className={`capitalize rounded-xl py-1 px-3 text-xs w-fit
						${
							row.original.status === 'active'
								? 'bg-[#EFFFF5] text-[#16A34A]'
								: 'bg-[#EF44444A] text-destructive'
						}
					`}
				>
					{row.original.status}
				</div>
			),
		},
		{
			accessorKey: 'click_count',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Clicks', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => row.original.click_count || 0,
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
			cell: ({ row }) => (
				<TimeAgoCell value={row.getValue('created_at')} />
			),
		},
		{
			accessorKey: 'actions',
			header: () => __('Actions', 'quillcrm'),
			cell: ({ row }) => {
				const trigger = row.original;
				return (
					<div
						onClick={() => {
							navigator.clipboard.writeText(trigger.full_url);
						}}
						className="flex items-center gap-2 cursor-pointer"
					>
						<CopyIcon width={16} height={16} />
						{__('Copy', 'quillcrm')}
					</div>
				);
			},
		},
	];
	return columns;
}
