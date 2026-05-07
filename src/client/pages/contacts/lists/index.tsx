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
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import type {
	List as ContactList,
	ListsResponse,
	DataTableConfig,
	NoticeMessage,
} from '@doublescale/client';
import { GradientListIcon, NoticeBanner, NoData } from '@doublescale/components';
import { isEmpty } from 'validator';
import { DataTable } from '@/components/ui/data-table';
import { getListColumns } from './columns';
import { ListDialog } from './lists-dialog';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { formatDateForAPI } from '@doublescale/utils';

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
	const [hasRecords, setHasRecords] = useState<boolean>(false);
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
	const noticeBannerRef = useRef<HTMLDivElement>(null);
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

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	const validate = (list: Partial<ContactList>) => {
		if (isEmpty(list.name || '', { ignore_whitespace: true })) {
			setVisible(false);
			showNotice('error', __('List name is required', 'doublescale'));
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
				path: addQueryArgs('/doublescale/v1/lists', {
					per_page: perPage,
					page,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
				}),
			})) as ListsResponse;

			setLists(response.data);
			setTotalRecords(response.total || 0);
			setHasRecords((response.total_count || 0) > 0);
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
			await apiFetch({
				path: '/doublescale/v1/lists',
				method: 'POST',
				data: list,
			});

			setVisible(false);
			setList({ name: '', description: '' });
			showNotice(
				'success',
				__(
					'Your List was successfully added — check it out!',
					'doublescale'
				)
			);
			fetchLists();
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
				path: `/doublescale/v1/lists/${selectedList?.id}`,
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
			showNotice('success', __('List updated successfully', 'doublescale'));
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
				path: '/doublescale/v1/lists',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			await fetchLists();
			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__('Selected lists deleted successfully', 'doublescale')
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
			placeholder: __('Search Lists', 'doublescale'),
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
			placeholder: __('Date Range', 'doublescale'),
		},
	};

	return (
		<div className="doublescale-contacts-lists-list">
			{/* Notice Banner */}
			{notice && (
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}

			{loading || hasRecords ? (
				<>
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
				</>
			) : (
				<NoData
					icon={<GradientListIcon width={120} height={120} />}
					title={__('No lists yet', 'doublescale')}
					subtitle={__(
						'Get started by creating your first list to organize your contacts',
						'doublescale'
					)}
					buttonLabel={__('Create List', 'doublescale')}
					onClick={handleOpenCreateModal}
				/>
			)}

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
