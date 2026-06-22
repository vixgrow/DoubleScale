/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useEffect } from 'react';
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
		perPage,
		totalRecords,
		setPerPage,
		keywords,
		setKeywords,
	} = useContactsContext();

	const { fetchContacts, doBulkAction } = useContactsAPI();
	const { columns } = useContactsColumns();

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

	const tableConfig: DataTableConfig<any> = {
		toolbarClassName:
			'min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between min-[1200px]:gap-1',
		manageColumns: {
			enabled: true,
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
		initialColumnVisibility: {
			contact: true,
			created_at: true,
			lists: true,
			tags: true,
			status: true,
			phone: false,
			country: false,
			city: false,
			address_1: false,
			address_2: false,
			state: false,
			zip: false,
			total_orders: true,
			total_revenue: true,
			last_order_date: true,
			whatsapp_phone: false,
		},
	};

	useEffect(() => {
		fetchContacts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [perPage, page, keywords, dateRange, filters]);

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
