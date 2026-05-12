/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
/**
 * internal dependencies
 */
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteIcon, SortIcon, TimeAgoCell } from '@doublescale/components';
import { CustomField } from '@doublescale/client';
import { DraggableField } from '../draggable-field';
import { MoveIcon } from '@doublescale/components';
import EditHeaderIcon from '@doublescale/shared/icons/edit-header';

interface FieldTableProps {
	fields: CustomField[];
	fieldTypes: Record<string, any>;
	selectedRowKeys: React.Key[];
	onSelectionChange: (keys: React.Key[]) => void;
	onEdit: (field: CustomField) => void;
	onDelete: (field: CustomField) => void;
}

export const FieldTable: React.FC<FieldTableProps> = ({
	fields,
	fieldTypes,
	selectedRowKeys,
	onSelectionChange,
	onEdit,
	onDelete,
}) => {
	const columns: ColumnDef<CustomField>[] = [
		{
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
		},
		{
			accessorKey: 'name',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1 cursor-pointer select-none"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Name', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<div className="font-medium">{row.original.name}</div>
				</div>
			),
		},
		{
			accessorKey: 'type',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1 cursor-pointer select-none"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Type', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<div className="capitalize">
					{fieldTypes[row.original.type]?.name || row.original.type}
				</div>
			),
		},
		{
			accessorKey: 'created_at',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1 cursor-pointer select-none"
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
				<div className="flex gap-2">
					<DraggableField field={row.original}>
						<Button
							size="sm"
							variant="outline"
							className="text-[#292D32] border-accent shadow-none hover:bg-gray-50 p-2 cursor-grab active:cursor-grabbing"
							title={__('Move field', 'doublescale')}
						>
							<MoveIcon width={16} height={16} />
						</Button>
					</DraggableField>
					<Button
						size="sm"
						variant="outline"
						onClick={() => onEdit(row.original)}
						className="text-[#292D32] border-accent shadow-none hover:bg-gray-50 p-2"
						title={__('Edit field', 'doublescale')}
					>
						<EditHeaderIcon width={16} height={16} />
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => onDelete(row.original)}
						className="text-[#EF4444] hover:bg-red-50 p-2 border-accent shadow-none"
						title={__('Delete field', 'doublescale')}
					>
						<DeleteIcon width={16} height={16} />
					</Button>
				</div>
			),
			enableSorting: false,
		},
	];

	return (
		<DataTable
			columns={columns}
			data={fields}
			config={{
				selection: {
					enabled: true,
					selectedKeys: selectedRowKeys,
					onSelectionChange,
				},
			}}
			showMainActions={false}
			showPagination={false}
			initialPageSize={fields.length || 1000} // Show all fields
			setPage={() => { }} // No-op since pagination is disabled
		/>
	);
};
