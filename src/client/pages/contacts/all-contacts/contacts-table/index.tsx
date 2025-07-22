/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import type { DataTableConfig } from '@quillcrm/client';
import { DataTable } from '@/components/ui/data-table';
import { useContactsContext } from '../contexts';
import { useContactsAPI } from '../useContactsAPI';
import { useContactsColumns } from '../columns';

interface ContactsTableProps {
	activeTab?: string;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({ activeTab }) => {
	const {
		data,
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
	} = useContactsContext();

	const { fetchContacts, doBulkAction } = useContactsAPI();
	const { columns } = useContactsColumns();

	const handleApplyFilters = () => {
		setPage(1);
		fetchContacts();
	};

	const tableConfig: DataTableConfig<any> = {
		manageColumns: {
			enabled: true,
		},
		search: {
			placeholder: __('Search contacts...', 'quillcrm'),
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
			onDateChange: setDateRange,
			placeholder: __('Date Range', 'quillcrm'),
		},
	};

	return (
		<DataTable
			columns={columns}
			data={data}
			showPagination={true}
			config={tableConfig}
			activeTab={activeTab}
		/>
	);
};
