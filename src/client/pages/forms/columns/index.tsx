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
import type { Form } from '@quillcrm/client';
import {
	SortIcon,
	DeleteIcon,
	ViewOutlinedIcon,
	ThreeDotsIcon,
	SettingsOutlinedIcon,
	DisactivateIcon,
	TimeAgoCell,
	FormattedDateCell,
} from '@quillcrm/components';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@quillcrm/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@quillcrm/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

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
					{__('Form Name', 'quillcrm')}
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
					{__('Type', 'quillcrm')}
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
					{__('Form ID', 'quillcrm')}
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
					{__('Status', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<div
					className={`capitalize rounded-lg py-1 px-3 border text-base w-fit
				${
					row.original.status === 'active'
						? 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]'
						: 'bg-[#EF44444A] text-destructive border-destructive'
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
					{__('Created At', 'quillcrm')}
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
					{__('Updated At', 'quillcrm')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<FormattedDateCell value={row.getValue('updated_at')} />
			),
		},
		{
			accessorKey: 'actions',
			header: () => __('Actions', 'quillcrm'),
			cell: ({ row }) => {
				const form = row.original;
				return (
					<div className="text-start">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button className="h-6 w-6 bg-accent text-[#1E2125] rounded-lg p-0 hover:bg-accent focus-visible:border-none focus-visible:outline-none focus-visible:box-shadow-none focus-visible:ring-0">
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
										? __('Deactivate', 'quillcrm')
										: __('Activate', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										// Navigate based on form status
										const targetUrl =
											form.status === 'active'
												? `forms/${form.id}/overview`
												: `forms/${form.id}`;
										navigate(targetUrl);
									}}
								>
									<ViewOutlinedIcon />
									{__('View', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => onDelete(form.id)}
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
	return columns;
}
