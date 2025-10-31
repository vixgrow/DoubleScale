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
} from '@quillcrm/client';
import { NoticeBanner, PageHeader, PlusIcon } from '@quillcrm/components';
import { formatDateForAPI } from '@quillcrm/utils';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
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
	const [keyword, setKeyword] = useState('');
	const { createNotice } = useDispatch('quillcrm/core');
	const [bulkAction, setBulkAction] = useState('');
	const [isApplying, setIsApplying] = useState(false);

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
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	// Handle link trigger creation success
	const handleLinkTriggerCreated = (message: string) => {
		setShowCreateForm(false);
		fetchLinks();
		showNotice('success', message);
	};

	const fetchLinks = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/link-triggers', {
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
				path: '/qc/v1/link-triggers',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			showNotice('success', __('Link Triggers deleted', 'quillcrm'));
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
			placeholder: __('Search Link Triggers', 'quillcrm'),
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
			placeholder: __('Date Range', 'quillcrm'),
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

	return (
		<div className="qcrm-link-trigger-list">
			<PageHeader
				title={__('Link Triggers List', 'quillcrm')}
				subtitle={__('Link Triggers', 'quillcrm')}
				actions={[
					{
						label: __('Create Link', 'quillcrm'),
						onClick: () => setShowCreateForm(true),
						type: 'primary',
						icon: <PlusIcon />,
					},
				]}
			/>
			{notice && (
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}

			<div className="qcrm-link-triggers-list__actions">
				<DataTable
					columns={getColumns()}
					data={data}
					config={tableConfig}
					showPagination={false}
					initialPageSize={perPage}
					setPage={setPage}
					loading={loading}
				/>
				<DataTablePagination table={serverSideTable} />
			</div>
		</div>
	);
};

export default LinkTriggerList;