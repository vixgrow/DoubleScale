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
import type { List as ContactList, Tag as ContactTag } from '@doublescale/client';
import { EditIcon, SortIcon, TimeAgoCell } from '@doublescale/components';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@doublescale/components/ui/button';
import type { TaxonomyItem, TaxonomyType } from '../index';

interface TaxonomyColumnsProps {
	type: TaxonomyType;
	onEditItem: (item: TaxonomyItem) => void;
}

export const getTaxonomyColumns = ({
	type,
	onEditItem,
}: TaxonomyColumnsProps): ColumnDef<TaxonomyItem>[] => {
	const selectionColumn: ColumnDef<TaxonomyItem> = {
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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

	const contactsCountLabel =
		type === 'list' ? __('Contacts No', 'doublescale') : __('Contacts', 'doublescale');

	return [
		selectionColumn,
		{
			accessorKey: 'name',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					{__('Name', 'doublescale')}
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
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					{contactsCountLabel}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => {
				const item = row.original as ContactList | ContactTag;
				return (item as any).contacts_count ?? 0;
			},
		},
		{
			accessorKey: 'created_at',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
					onClick={() => onEditItem(row.original)}
					variant="ghost"
					className="p-0"
				>
					<EditIcon />
					{__('Edit', 'doublescale')}
				</Button>
			),
		},
	];
};

