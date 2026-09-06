/**
 * external dependencies
 */
import { useMemo, useState } from 'react';
/**
 * internal dependencies
 */
import { DataTableConfig } from '@doublescale/client';
import {
	ColumnDef,
	ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table';

export function useDataTable<TData>(
	data: TData[],
	columns: ColumnDef<TData, any>[],
	config: DataTableConfig<TData>,
	initialPageSize?: number | undefined,
	manualPagination = false
) {
	const [localSorting, setLocalSorting] = useState<SortingState>([]);

	// When the page drives sorting we mirror its state into the table instead of
	// keeping our own, so the header arrows reflect the order the server applied.
	const serverSorting = config.sorting;
	const sorting: SortingState = useMemo(() => {
		if (!serverSorting) {
			return localSorting;
		}

		return serverSorting.value
			? [
					{
						id: serverSorting.value.orderby,
						desc: serverSorting.value.order === 'desc',
					},
				]
			: [];
	}, [serverSorting, localSorting]);

	const handleSortingChange = (updater: any) => {
		const next: SortingState =
			typeof updater === 'function' ? updater(sorting) : updater;

		if (!serverSorting) {
			setLocalSorting(next);
			return;
		}

		const [first] = next;
		serverSorting.onSortChange(
			first
				? { orderby: first.id, order: first.desc ? 'desc' : 'asc' }
				: null
		);
	};
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		config.initialColumnVisibility || {}
	);
	const [globalFilter, setGlobalFilter] = useState('');

	// Convert selectedKeys to rowSelection format
	const rowSelection = useMemo(() => {
		if (!config.selection?.enabled) return {};

		const selection: Record<string, boolean> = {};
		config.selection.selectedKeys.forEach((key) => {
			selection[key.toString()] = true;
		});
		return selection;
	}, [config.selection?.selectedKeys, config.selection?.enabled]);

	// Handle row selection changes
	const handleRowSelectionChange = (updater: any) => {
		if (!config.selection?.enabled) return;

		const newSelection =
			typeof updater === 'function' ? updater(rowSelection) : updater;
		const newKeys = Object.keys(newSelection).filter(
			(key) => newSelection[key]
		);
		config.selection.onSelectionChange(newKeys);
	};

	// Do not slice or date-filter here: server lists already paginate with
	// page/per_page and from/to. A second pass hid rows 11–50 and dropped
	// older rows on page 3+ when a date range was set.
	const table = useReactTable({
		data,
		columns,
		enableRowSelection: config.selection?.enabled || false,
		getCoreRowModel: getCoreRowModel(),
		manualPagination,
		...(manualPagination
			? {}
			: { getPaginationRowModel: getPaginationRowModel() }),
		onSortingChange: handleSortingChange,
		// With server-side sorting the rows already arrive in order; re-sorting
		// them locally would only reorder the current page.
		...(config.sorting
			? { manualSorting: true }
			: { getSortedRowModel: getSortedRowModel() }),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: handleRowSelectionChange,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: 'includesString',
		getRowId: (row: any) => row.id?.toString() || '',
		// Uncontrolled pagination so client-side tables can change page.
		// Putting pageIndex in `state` without onPaginationChange froze it at 0.
		initialState: {
			pagination: {
				pageSize: initialPageSize || 10,
				pageIndex: 0,
			},
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			globalFilter,
		},
	});

	return {
		table,
		globalFilter,
		setGlobalFilter,
	};
}
