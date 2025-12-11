/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import React, { forwardRef, useImperativeHandle, useRef } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	List as ContactList,
	Tag as ContactTag,
	ListsResponse,
	TagsResponse,
	DataTableConfig,
	NoticeMessage,
} from '@quillcrm/client';
import { NoticeBanner, NoData, GradientListIcon, GradientTagIcon } from '@quillcrm/components';
import { isEmpty } from 'validator';
import { DataTable } from '@/components/ui/data-table';
import { TaxonomyDialog } from './taxonomy-dialog';
import { getTaxonomyColumns } from './columns';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { formatDateForAPI } from '@quillcrm/utils';

export type TaxonomyType = 'list' | 'tag';
export type TaxonomyItem = ContactList | ContactTag;

export interface TaxonomyRef {
	openCreateModal: () => void;
}

interface TaxonomyProps {
	type: TaxonomyType;
	activeTab?: string;
}

const TaxonomyManager = forwardRef<TaxonomyRef, TaxonomyProps>(({ type, activeTab }, ref) => {
	const [items, setItems] = useState<TaxonomyItem[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [hasRecords, setHasRecords] = useState<boolean>(false);
	const [keyword, setKeyword] = useState<string>('');
	const [visible, setVisible] = useState<boolean>(false);
	const [selectedItem, setSelectedItem] = useState<TaxonomyItem | null>(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [item, setItem] = useState({
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

	// Configuration based on type
	const config = {
		list: {
			apiPath: '/qc/v1/lists',
			itemName: __('List', 'quillcrm'),
			itemNamePlural: __('Lists', 'quillcrm'),
			icon: <GradientListIcon width={120} height={120} />,
			noDataTitle: __('No lists yet', 'quillcrm'),
			noDataSubtitle: __(
				'Get started by creating your first list to organize your contacts',
				'quillcrm'
			),
			buttonLabel: __('Create List', 'quillcrm'),
			searchPlaceholder: __('Search Lists', 'quillcrm'),
			createSuccessMessage: __(
				'Your List was successfully added — check it out!',
				'quillcrm'
			),
			updateSuccessMessage: __('List updated successfully', 'quillcrm'),
			deleteSuccessMessage: __('Selected lists deleted successfully', 'quillcrm'),
			nameRequiredMessage: __('List name is required', 'quillcrm'),
		},
		tag: {
			apiPath: '/qc/v1/tags',
			itemName: __('Tag', 'quillcrm'),
			itemNamePlural: __('Tags', 'quillcrm'),
			icon: <GradientTagIcon width={120} height={120} />,
			noDataTitle: __('No tags yet', 'quillcrm'),
			noDataSubtitle: __(
				'Get started by creating your first tag to organize your contacts',
				'quillcrm'
			),
			buttonLabel: __('Create Tag', 'quillcrm'),
			searchPlaceholder: __('Search Tags', 'quillcrm'),
			createSuccessMessage: __(
				'Your Tag was successfully added  — check it out!',
				'quillcrm'
			),
			updateSuccessMessage: __('Tag updated successfully', 'quillcrm'),
			deleteSuccessMessage: __('Selected tags deleted successfully', 'quillcrm'),
			nameRequiredMessage: __('Tag name is required', 'quillcrm'),
		},
	};

	const currentConfig = config[type];

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

	const validate = (item: Partial<TaxonomyItem>) => {
		if (isEmpty(item.name || '', { ignore_whitespace: true })) {
			setVisible(false);
			showNotice('error', currentConfig.nameRequiredMessage);
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
	const fetchItems = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(currentConfig.apiPath, {
					per_page: perPage,
					page,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
				}),
			})) as ListsResponse | TagsResponse;

			setItems(response.data);
			setTotalRecords(response.total || 0);
			setHasRecords((response.total_count || 0) > 0);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	const createItem = async () => {
		if (!validate(item)) {
			return;
		}

		setIsSaving(true);
		try {
			await apiFetch({
				path: currentConfig.apiPath,
				method: 'POST',
				data: item,
			});

			setVisible(false);
			setItem({ name: '', description: '' });
			showNotice('success', currentConfig.createSuccessMessage);
			fetchItems();
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
			setIsSaving(false);
		}
	};

	const updateItem = async () => {
		if (!selectedItem || !validate(selectedItem)) {
			return;
		}
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: `${currentConfig.apiPath}/${selectedItem?.id}`,
				method: 'PUT',
				data: selectedItem,
			})) as TaxonomyItem;

			setItems([...items.map((item) => (item.id === response.id ? response : item))]);

			setVisible(false);
			setSelectedItem(null);
			showNotice('success', currentConfig.updateSuccessMessage);
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
			setIsSaving(false);
		}
	};

	const deleteSelectedItems = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		setIsApplying(true);
		try {
			await apiFetch({
				path: currentConfig.apiPath,
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			await fetchItems();
			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice('success', currentConfig.deleteSuccessMessage);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	// Event handlers
	const handleOpenCreateModal = () => {
		setSelectedItem(null);
		setItem({ name: '', description: '' });
		setVisible(true);
	};

	const handleCloseModal = () => {
		setVisible(false);
		setSelectedItem(null);
		setItem({ name: '', description: '' });
	};

	const handleEditItem = (itemToEdit: TaxonomyItem) => {
		setSelectedItem(itemToEdit);
		setVisible(true);
	};

	const handleSubmit = () => {
		selectedItem ? updateItem() : createItem();
	};

	const handleBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelectedItems();
				break;
			default:
				break;
		}
	};

	useEffect(() => {
		fetchItems();
	}, [page, perPage, keyword, dateRange, type]);

	// Imperative handle
	useImperativeHandle(ref, () => ({
		openCreateModal: handleOpenCreateModal,
	}));

	// Table configuration
	const columns = getTaxonomyColumns({
		type,
		onEditItem: handleEditItem,
	});

	const tableConfig: DataTableConfig<TaxonomyItem> = {
		manageColumns: { enabled: false },
		search: {
			placeholder: currentConfig.searchPlaceholder,
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
		<div className={`qcrm-contacts-${type}s-list`}>
			{/* Notice Banner */}
			{notice && (
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}

			{loading || hasRecords ? (
				<>
					{/* Data Table */}
					<DataTable
						columns={columns}
						data={items}
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
					icon={currentConfig.icon}
					title={currentConfig.noDataTitle}
					subtitle={currentConfig.noDataSubtitle}
					buttonLabel={currentConfig.buttonLabel}
					onClick={handleOpenCreateModal}
				/>
			)}

			{/* Dialog */}
			<TaxonomyDialog
				type={type}
				visible={visible}
				selectedItem={selectedItem}
				item={item}
				isSaving={isSaving}
				onClose={handleCloseModal}
				onSubmit={handleSubmit}
				onItemChange={setItem}
				onSelectedItemChange={setSelectedItem}
			/>
		</div>
	);
});

TaxonomyManager.displayName = 'TaxonomyManager';

export default TaxonomyManager;

