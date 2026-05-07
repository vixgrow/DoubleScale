/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useRef } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	Forms,
	Form as FormData,
	FormsResponse,
	DataTableConfig,
	NoticeMessage,
} from '@doublescale/client';
import ConfigAPI from '@doublescale/config';
import {
	PageHeader,
	PlusIcon,
	NoticeBanner,
	NoData,
	CreateFormsIcon,
} from '@doublescale/components';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { formatDateForAPI } from '@doublescale/utils';
import DataTablePagination from '@doublescale/components/ui/data-table-pagination';
import Form from '../form';
import { useNavigate, getToLink } from '@doublescale/navigation';

const FormsList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [forms, setForms] = useState<Forms>([]);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [keyword, setKeyword] = useState('');
	const [showCreateForm, setShowCreateForm] = useState(false);
	const formTypes = ConfigAPI.getForms();
	const [bulkAction, setBulkAction] = useState('');
	const [isApplying, setIsApplying] = useState(false);
	// Check URL for success message on initial render
	const urlParams = new URLSearchParams(window.location.search);
	const successParam = urlParams.get('success');
	const initialNotice = successParam === 'created'
		? { type: 'success' as const, message: __('Form created successfully', 'doublescale') }
		: successParam === 'updated'
			? { type: 'success' as const, message: __('Form updated successfully', 'doublescale') }
			: null;

	// Remove success parameter from URL if present
	if (successParam) {
		urlParams.delete('success');
		const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash;
		window.history.replaceState({}, '', newUrl);
	}

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(initialNotice);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const [hasRecords, setHasRecords] = useState(false);
	const navigate = useNavigate();
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

	// Handle form creation success
	const handleFormCreated = (message: string) => {
		setShowCreateForm(false);
		fetchForms();
		showNotice('success', message);
	};

	const fetchForms = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/forms', {
					page,
					per_page: perPage,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
				}),
				method: 'GET',
			})) as FormsResponse;
			setForms(response.data);
			setTotalRecords(response.total || 0);
			setHasRecords((response.total_count || 0) > 0);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchForms();
	}, [page, perPage, dateRange, keyword]);

	const deleteSelected = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		setIsApplying(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/forms',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			showNotice('success', __('Forms deleted', 'doublescale'));
			setSelectedRowKeys([]);
			setBulkAction('');
			fetchForms();
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const deleteForm = async (id: number) => {
		try {
			await apiFetch({
				path: `/doublescale/v1/forms/${id}`,
				method: 'DELETE',
			});

			fetchForms();
			showNotice('success', __('Form deleted', 'doublescale'));
		} catch (error: any) {
			showNotice('error', error.message);
		}
	};

	const activateDeactivateForm = async (
		id: number,
		currentStatus: string
	) => {
		try {
			await apiFetch({
				path: `/doublescale/v1/forms/${id}`,
				method: 'POST',
				data: {
					status: currentStatus === 'active' ? 'inactive' : 'active',
				},
			});

			showNotice(
				'success',
				currentStatus === 'active'
					? __('Form deactivated', 'doublescale')
					: __('Form activated', 'doublescale')
			);

			fetchForms();
		} catch (error: any) {
			showNotice('error', error.message);
		}
	};

	const columns = getColumns({
		formTypes,
		onDelete: deleteForm,
		onToggleStatus: activateDeactivateForm,
	});

	const tableConfig: DataTableConfig<FormData> = {
		search: {
			placeholder: __('Search Forms', 'doublescale'),
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

	return (
		<div className="doublescale-forms-list">
			<PageHeader
				title={__('Forms List', 'doublescale')}
				subtitle={__('Forms', 'doublescale')}
				actions={[
					{
						label: __('Create Forms', 'doublescale'),
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

			{loading || hasRecords ? (
				<div className="doublescale-contacts-forms-list__actions">
					<DataTable
						columns={columns}
						data={forms}
						config={tableConfig}
						showPagination={false}
						initialPageSize={perPage}
						setPage={setPage}
						loading={loading}
					/>
					<DataTablePagination table={serverSideTable} />
				</div>
			) : (
				<NoData
					icon={<CreateFormsIcon width={120} height={120} />}
					title={__('No forms yet', 'doublescale')}
					subtitle={__(
						'Get started by creating your first form to capture leads and grow your contact list',
						'doublescale'
					)}
					buttonLabel={__('Create Form', 'doublescale')}
					onClick={() => setShowCreateForm(true)}
				/>
			)}

			{showCreateForm && (
				<Form
					isNewForm={true}
					onClose={() => {
						setShowCreateForm(false);
					}}
					onSuccess={(message: string) => {
						setShowCreateForm(false);
						fetchForms();
						showNotice('success', message);
					}}
				/>
			)}
		</div>
	);
};

export default FormsList;
