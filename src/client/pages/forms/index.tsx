/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
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
} from '@quillcrm/client';
import { useNavigate } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';
import { PageHeader, PlusIcon, NoticeBanner } from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { formatDateForAPI } from '@quillcrm/utils';
import DataTablePagination from '@quillcrm/components/ui/data-table-pagination';
import Form from '../form';

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
	const navigate = useNavigate();

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

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
				path: addQueryArgs('/qc/v1/forms', {
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
				path: '/qc/v1/forms',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			showNotice('success', __('Forms deleted', 'quillcrm'));
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
				path: `/qc/v1/forms/${id}`,
				method: 'DELETE',
			});

			fetchForms();
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
				path: `/qc/v1/forms/${id}`,
				method: 'POST',
				data: {
					status: currentStatus === 'active' ? 'inactive' : 'active',
				},
			});

			showNotice(
				'success',
				currentStatus === 'active'
					? __('Form deactivated', 'quillcrm')
					: __('Form activated', 'quillcrm')
			);

			fetchForms();
		} catch (error: any) {
			showNotice('error', error.message);
		}
	};

	const columns = getColumns({
		formTypes,
		navigate: navigate,
		onDelete: deleteForm,
		onToggleStatus: activateDeactivateForm,
	});

	const tableConfig: DataTableConfig<FormData> = {
		search: {
			placeholder: __('Search Forms', 'quillcrm'),
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

	return (
		<div className="qcrm-forms-list">
			<PageHeader
				title={__('Forms List', 'quillcrm')}
				subtitle={__('Forms', 'quillcrm')}
				actions={[
					{
						label: __('Create Forms', 'quillcrm'),
						onClick: () => setShowCreateForm(true),
						type: 'primary',
						icon: <PlusIcon />,
					},
				]}
			/>
			{notice && (
				<NoticeBanner notice={notice} closeNotice={closeNotice} />
			)}

			<div className="qcrm-contacts-forms-list__actions">
				<DataTable
					columns={columns}
					data={forms}
					config={tableConfig}
					showPagination={false}
					initialPageSize={perPage}
					setPage={setPage}
				/>
				<DataTablePagination table={serverSideTable} />
			</div>

			{showCreateForm && (
				<Form
					isNewForm={true}
					onClose={() => {
						setShowCreateForm(false);
						fetchForms();
					}}
					onSuccess={handleFormCreated}
				/>
			)}
		</div>
	);
};

export default FormsList;
