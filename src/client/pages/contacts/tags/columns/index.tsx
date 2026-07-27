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
import type { Tag as ContactTag } from '@doublescale/client';
import { SortIcon, TimeAgoCell, getRowNumber } from '@doublescale/components';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@doublescale/components/ui/button';
import EditHeaderIcon from '@/components/icons/edit-header';

const selectionColumn: ColumnDef<ContactTag> = {
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

interface UseTagsColumnsProps {
	onEditTag: (tag: ContactTag) => void;
	onViewContacts: (tag: ContactTag) => void;
	page: number;
	perPage: number;
}

export const useTagsColumns = ({
	onEditTag,
	onViewContacts,
	page,
	perPage,
}: UseTagsColumnsProps): ColumnDef<ContactTag>[] => {
	return [
		selectionColumn,
		{
			id: 'row_number',
			header: () => __('#', 'doublescale'),
			cell: ({ row }) => (
				<span className="text-muted-foreground font-mono text-xs">
					{getRowNumber(row.index, page, perPage)}
				</span>
			),
			enableSorting: false,
			enableHiding: false,
		},
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
				<Button
					variant="ghost"
					onClick={() => onViewContacts(row.original)}
					className="h-auto p-0 text-left font-medium text-primary hover:bg-transparent hover:underline cursor-pointer bg-transparent shadow-none border-none"
				>
					{row.original.name}
				</Button>
			),
		},
		{
			accessorKey: 'description',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Description', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => row.original.description || '-',
		},
		{
			accessorKey: 'contacts_count',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Contacts', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<Button
					variant="ghost"
					onClick={() => onViewContacts(row.original)}
					className="h-auto p-0 text-left font-medium text-primary hover:bg-transparent hover:underline cursor-pointer bg-transparent shadow-none border-none"
				>
					{(row.original as any).contacts_count ?? 0}
				</Button>
			),
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
			cell: ({ row }) => <TimeAgoCell value={row.getValue('created_at')} />,
		},
		{
			accessorKey: 'actions',
			header: () => __('Actions', 'doublescale'),
			cell: ({ row }) => (
				<Button
					onClick={() => onEditTag(row.original)}
					variant="ghost"
					className="p-0"
				>
					<EditHeaderIcon/>
					{__('Edit', 'doublescale')}
				</Button>
			),
		},
	];
};
