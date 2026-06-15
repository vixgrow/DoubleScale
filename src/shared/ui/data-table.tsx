/**
 * wordpress depnedencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import { ColumnDef, flexRender } from '@tanstack/react-table';

/**
 * internal dependencies
 */
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import DataTablePagination from './data-table-pagination';
import { useDataTable } from '@doublescale/hooks/use-dataTable';
import { DataTableSearch } from './data-table-search';
import { DataTableActions } from './data-table-actions';
import { DataTableConfig } from '@doublescale/client';
import { TableSkeleton } from './table-skeleton';

interface DataTableProps<TData> {
	columns: ColumnDef<TData, any>[];
	data: TData[];
	config: DataTableConfig<TData>;
	activeTab?: string;
	showMainActions?: boolean;
	showPagination?: boolean;
	initialPageSize?: number | undefined;
	setPage: (page: number) => void;
	loading?: boolean;
}

export function DataTable<TData>({
	columns,
	data,
	config,
	activeTab,
	showMainActions = true,
	showPagination = true,
	initialPageSize,
	setPage,
	loading = false,
}: DataTableProps<TData>) {
	const { table, globalFilter, setGlobalFilter } = useDataTable(
		data,
		columns,
		config,
		initialPageSize
	);

	const handleSearchChange = (value: string) => {
		if (config.search?.onChange) {
			config.search.onChange(value);
		} else {
			setGlobalFilter(value);
		}
		setPage(1);
	};

	return (
		<div className="w-full ">
			{/* Main Actions Row - Optional */}
			{showMainActions && (
				<div className="flex border border-border rounded-lg p-4 flex-col gap-4 xl:gap-0 xl:flex-row items-center xl:justify-between  w-full mb-6">
					<DataTableSearch
						value={
							config.search?.onChange
								? config.search?.value || ''
								: globalFilter
						}
						onChange={handleSearchChange}
						placeholder={config.search?.placeholder}
					/>

					<DataTableActions
						table={table}
						config={config}
						activeTab={activeTab}
						setPage={setPage}
					/>
				</div>
			)}

			<div className="rounded-t-lg border border-[#DEE1E6] overflow-hidden bg-white w-full">
				<Table>
					<TableHeader className="bg-[#F8F8F8] ">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className="text-[#09090B]"
									>
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef
													.header,
												header.getContext()
											)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className="bg-white">
						{loading ? (
							<TableSkeleton columns={table.getVisibleLeafColumns().length} />
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && 'selected'
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="text-[#09090B]"
										>
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
									{__('No results found.', 'doublescale')}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination - Optional */}
			{showPagination && <DataTablePagination table={table} />}
		</div>
	);
}
