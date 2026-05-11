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
import type { Form } from '@doublescale/client';
import {
	SortIcon,
	DeleteIcon,
	ViewOutlinedIcon,
	ThreeDotsIcon,
	DisactivateIcon,
	TimeAgoCell,
	FormattedDateCell,
} from '@doublescale/components';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@doublescale/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@doublescale/components/ui/dropdown-menu';
import { useNavigate, getToLink } from '@doublescale/navigation';

export const selectionColumn: ColumnDef<Form> = {
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

export function getColumns({ formTypes, onDelete, onToggleStatus }) {
	const navigate = useNavigate();
	const columns: ColumnDef<Form>[] = [
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
					{__('Form Name', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => <div>{row.original.name}</div>,
		},
		{
			accessorKey: 'form_type',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Type', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => formTypes[row.original.form_type]?.label || '',
		},
		{
			accessorKey: 'form_id',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Form ID', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => row.original.form_id,
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
				${
					row.original.status === 'active'
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
			accessorKey: 'updated_at',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Updated At', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<FormattedDateCell value={row.getValue('updated_at')} />
			),
		},
		{
			accessorKey: 'actions',
			header: () => __('Actions', 'doublescale'),
			cell: ({ row }) => {
				const form = row.original;
				return (
					<div className="text-start">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground focus-visible:ring-0">
									<ThreeDotsIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() =>
										onToggleStatus(form.id, form.status)
									}
								>
									<DisactivateIcon />
									{form.status === 'active'
										? __('Deactivate', 'doublescale')
										: __('Activate', 'doublescale')}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										// Navigate based on form status
										const targetUrl =
											form.status === 'active'
												? `forms/${form.id}/overview`
												: `forms/${form.id}`;
										navigate(getToLink(targetUrl));
									}}
								>
									<ViewOutlinedIcon />
									{__('View', 'doublescale')}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => onDelete(form.id)}
									className="text-destructive hover:text-destructive focus:text-destructive"
								>
									<DeleteIcon />
									{__('Delete', 'doublescale')}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];
	return columns;
}
