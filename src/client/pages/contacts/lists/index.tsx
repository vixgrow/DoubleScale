/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
/**
 * external dependencies
 */
import React, { forwardRef, useImperativeHandle } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import type {
	List as ContactList,
	ListsResponse,
	DataTableConfig,
	NoticeMessage,
} from '@quillcrm/client';
import { NoticeBanner } from '@quillcrm/components';
import { isEmpty } from 'validator';
import { DataTable } from '@/components/ui/data-table';
import { getListColumns } from './columns';
import { ListDialog } from './lists-dialog';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { formatDateForAPI } from '@quillcrm/utils';

export interface ListsRef {
	openCreateListModal: () => void;
}

interface ListsProps {
	activeTab?: string;
}

const Lists = forwardRef<ListsRef, ListsProps>(({ activeTab }, ref) => {
	const [lists, setLists] = useState<ContactList[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [keyword, setKeyword] = useState<string>('');
	const [visible, setVisible] = useState<boolean>(false);
	const [selectedList, setSelectedList] = useState<ContactList | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [list, setList] = useState({
		name: '',
		description: '',
	});
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});

	// Helper functions
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	const closeNotice = () => {
		setNotice(null);
	};

	const validate = (list: Partial<ContactList>) => {
		if (isEmpty(list.name || '', { ignore_whitespace: true })) {
			showNotice('error', __('List name is required', 'quillcrm'));
			return false;
		}
		return true;
	};

	// Use the reusable hook
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	// API functions
	const fetchLists = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					per_page: perPage,
					page,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
				}),
			})) as ListsResponse;

			setLists(response.data);
			setTotalRecords(response.total || 0);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	const createList = async () => {
		if (!validate(list)) {
			return;
		}

		setIsSaving(true);
		try {
			const response = await apiFetch({
				path: '/qc/v1/lists',
				method: 'POST',
				data: list,
			});

			setLists([...lists, response as ContactList]);
			setVisible(false);
			setList({ name: '', description: '' });
			showNotice(
				'success',
				__(
					'Your List was successfully added — check it out!',
					'quillcrm'
				)
			);
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
			setIsSaving(false);
		}
	};

	const updateList = async () => {
		if (!selectedList || !validate(selectedList)) {
			return;
		}
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: `/qc/v1/lists/${selectedList?.id}`,
				method: 'PUT',
				data: selectedList,
			})) as ContactList;

			setLists([
				...lists.map((list) =>
					list.id === response.id ? response : list
				),
			]);

			setVisible(false);
			setSelectedList(null);
			showNotice('success', __('List updated successfully', 'quillcrm'));
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
			setIsSaving(false);
		}
	};

	const deleteSelectedLists = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/lists',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			await fetchLists();
			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__('Selected lists deleted successfully', 'quillcrm')
			);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	// Event handlers
	const handleOpenCreateModal = () => {
		setSelectedList(null);
		setList({ name: '', description: '' });
		setVisible(true);
	};

	const handleCloseModal = () => {
		setVisible(false);
		setSelectedList(null);
		setList({ name: '', description: '' });
	};

	const handleEditList = (listToEdit: ContactList) => {
		setSelectedList(listToEdit);
		setVisible(true);
	};

	const handleSubmit = () => {
		selectedList ? updateList() : createList();
	};

	const handleBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelectedLists();
				break;
			default:
				break;
		}
	};

	useEffect(() => {
		fetchLists();
	}, [page, perPage, keyword, dateRange]);

	// Imperative handle
	useImperativeHandle(ref, () => ({
		openCreateListModal: handleOpenCreateModal,
	}));

	// Table configuration
	const columns = getListColumns({ onEditList: handleEditList });

	const tableConfig: DataTableConfig<ContactList> = {
		manageColumns: { enabled: false },
		search: {
			placeholder: __('Search Lists', 'quillcrm'),
			onChange: (value) => setKeyword(value),
			value: keyword,
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
			onExecuteAction: handleBulkAction,
			activeTab: activeTab,
		},
		dateRange: {
			enabled: true,
			value: dateRange,
			onDateChange: setDateRange,
			placeholder: __('Date Range', 'quillcrm'),
		},
	};

	return (
		<div className="qcrm-contacts-lists-list">
			{/* Notice Banner */}
			{notice && (
				<NoticeBanner notice={notice} closeNotice={closeNotice} />
			)}

			{/* Data Table */}
			<DataTable
				columns={columns}
				data={lists}
				activeTab={activeTab}
				config={tableConfig}
				showPagination={false}
				initialPageSize={perPage}
				setPage={setPage}
				loading={loading}
			/>
			<DataTablePagination table={serverSideTable} />

			{/* Dialog */}
			<ListDialog
				visible={visible}
				selectedList={selectedList}
				list={list}
				isSaving={isSaving}
				onClose={handleCloseModal}
				onSubmit={handleSubmit}
				onListChange={setList}
				onSelectedListChange={setSelectedList}
			/>
		</div>
	);
});

export default Lists;
