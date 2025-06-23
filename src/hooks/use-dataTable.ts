import { useState, useMemo } from 'react';
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
		data,
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
