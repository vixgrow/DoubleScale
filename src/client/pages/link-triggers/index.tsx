/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useRef } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	LinkTrigger,
	LinkTriggersResponse,
	NoticeMessage,
} from '@doublescale/client';
import {
	CreateFormsIcon,
	NoData,
	NoticeBanner,
	PageHeader,
	PlusIcon,
} from '@doublescale/components';
import { formatDateForAPI } from '@doublescale/utils';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { getColumns } from './columns';
import LinkTriggerComponent from '../link-trigger'; // Adjust path as needed

const LinkTriggerList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [data, setData] = useState<LinkTrigger[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingLinkTriggerId, setEditingLinkTriggerId] = useState<number | null>(null);
	const [keyword, setKeyword] = useState('');
	const { createNotice } = useDispatch('doublescale/core');
	const [bulkAction, setBulkAction] = useState('');
	const [isApplying, setIsApplying] = useState(false);
	const [hasRecords, setHasRecords] = useState(false);

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});

	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	// Helper function to show notice
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	// Helper function to close notice
	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	// Handle link trigger creation success
	const handleLinkTriggerCreated = (message: string) => {
		setShowCreateForm(false);
		fetchLinks();
		showNotice('success', message);
	};

	// Handle link trigger edit
	const handleEditLinkTrigger = (id: number) => {
		setEditingLinkTriggerId(id);
	};

	// Handle link trigger update success
	const handleLinkTriggerUpdated = (message: string) => {
		setEditingLinkTriggerId(null);
		fetchLinks();
		showNotice('success', message);
	};

	const fetchLinks = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/link-triggers', {
					page,
					per_page: perPage,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
				}),
				method: 'GET',
			})) as LinkTriggersResponse;
			setData(response.data);
			setTotalRecords(response.total || 0);
			setHasRecords((response.total_count || 0) > 0);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLinks();
	}, [page, perPage, dateRange, keyword]);

	const deleteSelected = async () => {
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/link-triggers',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			showNotice('success', __('Link Triggers deleted', 'doublescale'));
			setSelectedRowKeys([]);
			setBulkAction('');
			fetchLinks();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const tableConfig = {
		search: {
			placeholder: __('Search Link Triggers', 'doublescale'),
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
			onExecuteAction: () => deleteSelected(),
		},
		dateRange: {
			enabled: true,
			value: dateRange,
			onDateChange: setDateRange,
			placeholder: __('Date Range', 'doublescale'),
		},
	};

	// If showing create form, render the LinkTrigger component in create mode
	if (showCreateForm) {
		return (
			<LinkTriggerComponent
				isNewLinkTrigger={true}
				onClose={() => {
					setShowCreateForm(false);
					fetchLinks();
				}}
				onSuccess={handleLinkTriggerCreated}
			/>
		);
	}

	// If editing, render the LinkTrigger component in edit mode
	if (editingLinkTriggerId) {
		return (
			<LinkTriggerComponent
				id={editingLinkTriggerId}
				onClose={() => {
					setEditingLinkTriggerId(null);
					fetchLinks();
				}}
				onSuccess={handleLinkTriggerUpdated}
			/>
		);
	}

	return (
		<div className="doublescale-link-trigger-list">
			<PageHeader
				title={__('Link Triggers List', 'doublescale')}
				actions={[
					{
						label: __('Create Link', 'doublescale'),
						onClick: () => setShowCreateForm(true),
						type: 'primary',
						icon: <PlusIcon />,
					},
				]}
			/>
			{notice && (
				<NoticeBanner
					ref={noticeBannerRef}
					notice={notice}
					closeNotice={closeNotice}
				/>
			)}

			<div className="doublescale-link-triggers-list__actions">
				{hasRecords || loading ? (
					<>
						<DataTable
							columns={getColumns(handleEditLinkTrigger)}
							data={data}
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
						icon={<CreateFormsIcon width={120} height={120} />}
						title={__('No link triggers yet', 'doublescale')}
						subtitle={__(
							'Get started by creating your first link trigger to track your links',
							'doublescale'
						)}
						buttonLabel={__('Create Link Trigger', 'doublescale')}
						onClick={() => setShowCreateForm(true)}
					/>
				)}
			</div>
		</div>
	);
};

export default LinkTriggerList;
