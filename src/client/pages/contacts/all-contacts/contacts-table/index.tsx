/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
/**
 * internal dependencies
 */
import type { DataTableConfig } from '@doublescale/client';
import { DataTable } from '@/components/ui/data-table';
import { useContactsContext } from '../contexts';
import { useContactsAPI } from '../useContactsAPI';
import { useContactsColumns } from '../columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@doublescale/components/ui/data-table-pagination';
import {
	getSavedContactsColumnVisibility,
	saveContactsColumnVisibility,
} from '../contacts-column-visibility';

interface ContactsTableProps {
	activeTab?: string;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({ activeTab }) => {
	const {
		data,
		loading,
		hasRecords,
		selectedRowKeys,
		setSelectedRowKeys,
		selectedLists,
		setSelectedLists,
		selectedTags,
		setSelectedTags,
		bulkAction,
		setBulkAction,
		showFilters,
		setShowFilters,
		filters,
		setFilters,
		isFiltering,
		setPage,
		dateRange,
		setDateRange,
		page,
		sort,
		setSort,
		perPage,
		totalRecords,
		setPerPage,
		keywords,
		setKeywords,
		showNotice,
	} = useContactsContext();

	const { fetchContacts, doBulkAction } = useContactsAPI();
	const { columns } = useContactsColumns();
	const [columnVisibility, setColumnVisibility] = useState(
		getSavedContactsColumnVisibility
	);

	const handleColumnVisibilitySubmit = useCallback(
		async (visibility: Record<string, boolean>) => {
			setColumnVisibility(visibility);
			try {
				await saveContactsColumnVisibility(visibility);
			} catch (error: unknown) {
				const message =
					error instanceof Error
						? error.message
						: __('Failed to save column preferences', 'doublescale');
				showNotice('error', message);
			}
		},
		[showNotice]
	);

	const handleApplyFilters = () => {
		setPage(1);
		fetchContacts();
	};

	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	const tableConfig: DataTableConfig<any> = useMemo(
		() => ({
		toolbarClassName:
			'min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between min-[1200px]:gap-1',
		manageColumns: {
			enabled: true,
			onSubmit: handleColumnVisibilitySubmit,
		},
		search: {
			placeholder: __('Search contacts...', 'doublescale'),
			onChange: (value) => {
				setKeywords(value);
				if (page > 1) {
					setPage(1);
				}
			},
			value: keywords,
		},
		selection: {
			enabled: true,
			selectedKeys: selectedRowKeys,
			onSelectionChange: setSelectedRowKeys,
		},
		bulkActions: {
			enabled: true,
			currentAction: bulkAction,
			onActionChange: setBulkAction,
			onExecuteAction: doBulkAction,
			lists: {
				selected: selectedLists,
				onSelectionChange: (lists: string[]) =>
					setSelectedLists(lists.map((id) => id.toString())),
			},
			tags: {
				selected: selectedTags,
				onSelectionChange: (tags: string[]) => setSelectedTags(tags),
			},
			activeTab: activeTab,
		},
		filters: {
			enabled: true,
			showFilters: showFilters,
			onToggleFilters: setShowFilters,
			currentFilters: filters,
			onFiltersChange: setFilters,
			onApplyFilters: handleApplyFilters,
			isApplying: isFiltering,
		},
		dateRange: {
			enabled: true,
			value: dateRange,
			onDateChange: (range) => {
				setDateRange(range);
				if (page > 1) {
					setPage(1);
				}
			},
			placeholder: __('Date Range', 'doublescale'),
		},
		sorting: {
			value: sort,
			onSortChange: setSort,
		},
		initialColumnVisibility: columnVisibility,
		}),
		[
			activeTab,
			bulkAction,
			columnVisibility,
			dateRange,
			doBulkAction,
			filters,
			handleColumnVisibilitySubmit,
			isFiltering,
			keywords,
			page,
			selectedLists,
			selectedRowKeys,
			selectedTags,
			setBulkAction,
			setDateRange,
			setFilters,
			setKeywords,
			setPage,
			setSort,
			sort,
			setSelectedLists,
			setSelectedRowKeys,
			setSelectedTags,
			setShowFilters,
			showFilters,
		]
	);

	useEffect(() => {
		fetchContacts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [perPage, page, keywords, dateRange, filters, sort]);

	return (
		<>
			<DataTable
				columns={columns}
				data={data}
				showPagination={false}
				config={tableConfig}
				activeTab={activeTab}
				initialPageSize={perPage}
				setPage={setPage}
				loading={loading}
			/>
			<DataTablePagination table={serverSideTable} />
		</>
	);
};
