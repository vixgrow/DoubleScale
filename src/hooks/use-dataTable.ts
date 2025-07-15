/**
 * external dependencies
 */
import { useState, useMemo } from 'react';
/**
 * internal dependencies
 */
import {
	ColumnDef,
	SortingState,
	VisibilityState,
	ColumnFiltersState,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { DataTableConfig } from '@quillcrm/client';

export function useDataTable<TData>(
	data: TData[],
	columns: ColumnDef<TData, any>[],
	config: DataTableConfig<TData>
) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		{}
	);
	const [globalFilter, setGlobalFilter] = useState('');

	// Filter data based on date range
	const filteredData = useMemo(() => {
		if (
			!config.dateRange?.enabled ||
			(!config.dateRange.value.from && !config.dateRange.value.to)
		) {
			return data;
		}

		return data.filter((item: any) => {
			const createdAt = new Date(item.created_at);
			const { from, to } = config.dateRange!.value;

			if (from && to) {
				return createdAt >= from && createdAt <= to;
			} else if (from) {
				return createdAt >= from;
			} else if (to) {
				return createdAt <= to;
			}

			return true;
		});
	}, [data, config.dateRange?.value, config.dateRange?.enabled]);

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

	const table = useReactTable({
		data: filteredData,
		columns,
		enableRowSelection: config.selection?.enabled || false,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: handleRowSelectionChange,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: 'includesString',
		getRowId: (row: any) => row.id?.toString() || '',
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
