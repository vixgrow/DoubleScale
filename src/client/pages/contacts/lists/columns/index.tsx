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
import type { List as ContactList } from '@doublescale/client';
import { SortIcon, TimeAgoCell } from '@doublescale/components';
import EditHeaderIcon from '@/components/icons/edit-header';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@doublescale/components/ui/button';

interface ListColumnsProps {
	onEditList: (list: ContactList) => void;
	onViewContacts: (list: ContactList) => void;
}

export const getListColumns = ({
	onEditList,
	onViewContacts,
}: ListColumnsProps): ColumnDef<ContactList>[] => {
	const selectionColumn: ColumnDef<ContactList> = {
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

	return [
		selectionColumn,
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
					{__('Contacts No', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<Button
					variant="ghost"
					onClick={() => onViewContacts(row.original)}
					className="h-auto p-0 text-left font-medium text-primary hover:bg-transparent hover:underline cursor-pointer bg-transparent shadow-none border-none"
				>
					{row.original.contacts_count ?? 0}
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
					onClick={() => onEditList(row.original)}
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
