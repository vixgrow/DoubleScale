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
import type { LinkTrigger } from '@doublescale/client';
import { SortIcon, CopyIcon, TimeAgoCell } from '@doublescale/components';
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

export function getColumns(onEdit?: (id: number) => void) {
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
					{__('Name', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<button
					type="button"
					onClick={() => onEdit?.(row.original.id)}
					className="text-left hover:underline cursor-pointer bg-transparent border-none p-0"
				>
					{row.original.name}
				</button>
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
					{__('Status', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<div
					className={`inline-flex items-center text-xs font-medium capitalize rounded-full py-0.5 px-2.5 border w-fit
						${row.original.status === 'active'
							? 'bg-emerald-50 text-emerald-700 border-emerald-200'
							: 'bg-destructive/5 text-destructive border-destructive/20'
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
					{__('Clicks', 'doublescale')}
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
					{__('Created At', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<TimeAgoCell value={row.getValue('created_at')} />
			),
		},
		{
			accessorKey: 'actions',
			header: () => __('Actions', 'doublescale'),
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
						{__('Copy', 'doublescale')}
					</div>
				);
			},
		},
	];
	return columns;
}
