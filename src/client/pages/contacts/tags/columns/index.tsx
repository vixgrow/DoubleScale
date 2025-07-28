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
import type { Tag as ContactTag } from '@quillcrm/client';
import { EditIcon, SortIcon } from '@quillcrm/components';
import { convertDate } from '@quillcrm/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@quillcrm/components/ui/button';

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
}

export const useTagsColumns = ({
	onEditTag,
}: UseTagsColumnsProps): ColumnDef<ContactTag>[] => {
	return [
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
			cell: ({ row }) => <span>{row.original.name}</span>,
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
					{__('Description', 'quillcrm')}
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
					{__('Contacts', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (row.original as any).contacts_count ?? 0,
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
			accessorKey: 'actions',
			header: () => __('Actions', 'quillcrm'),
			cell: ({ row }) => (
				<Button
					onClick={() => onEditTag(row.original)}
					variant="ghost"
					className="p-0"
				>
					<EditIcon />
					{__('Edit', 'quillcrm')}
				</Button>
			),
		},
	];
};
