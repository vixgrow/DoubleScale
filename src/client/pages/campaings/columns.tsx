import { ColumnDef } from '@tanstack/react-table';
import { Campaign } from '../../types';
import { Checkbox } from '../../../components/ui/checkbox';

// You can use a Zod schema here if you want.
export const columns: ColumnDef<Campaign>[] = [
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
		header: 'Campaign Name',
	},
	{
		accessorKey: 'status',
		header: 'Status',
	},
	{
		accessorKey: 'broadcast',
		header: 'Broadcast',
	},
	{
		accessorKey: 'created_at',
		header: 'Created At',
	},
	{
		accessorKey: 'updated_at',
		header: 'Updated At',
	},
	{
		accessorKey: 'recipients',
		header: 'Recipients',
	},
	{
		accessorKey: 'open_rate',
		header: 'Open Rate',
	},
	{
		accessorKey: 'actions',
		header: 'Actions',
	},
];
