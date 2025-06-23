import {
	ColumnDef,
	flexRender,
} from '@tanstack/react-table';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

import  DataTablePagination  from './data-table-pagination';
import { Filters } from '@quillcrm/components';
import { __ } from '@wordpress/i18n';
import { useDataTable } from '../../hooks/use-dataTable';
import { DataTableSearch } from './data-table-search';
import { DataTableActions } from './data-table-actions';
import { DataTableConfig } from '@quillcrm/client';

interface DataTableProps<TData> {
	columns: ColumnDef<TData, any>[];
	data: TData[];
	config: DataTableConfig<TData>;
}

export function DataTable<TData>({
	columns,
	data,
	config,
}: DataTableProps<TData>) {
	const {
		table,
		globalFilter,
		setGlobalFilter,
	} = useDataTable(data, columns, config);

	return (
		<div className='w-full'>
			{/* Main Actions Row */}
			<div className="flex items-center justify-between p-5 border rounded-lg my-4 w-full">
				<DataTableSearch
					value={globalFilter}
					onChange={setGlobalFilter}
					placeholder={config.search?.placeholder}
				/>

				<DataTableActions
					table={table}
					config={config}
				/>
			</div>

			{/* Advanced Filters Panel */}
			{config.filters?.enabled && config.filters.showFilters && (
				<div className="mb-4 p-4 border rounded-lg bg-muted/50">
					<Filters
						filters={config.filters.currentFilters}
						onChange={config.filters.onFiltersChange}
						onApply={config.filters.onApplyFilters}
						isApplying={config.filters.isApplying}
					/>
				</div>
			)}

			<div className="rounded-t-md border w-full">
				<Table>
					<TableHeader className='bg-[#FAFAFA]'>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className='text-[#09090B]'>
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className='text-[#09090B]'>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{__('No results found.', 'quillcrm')}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<DataTablePagination table={table} />
		</div>
	);
}