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
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	Automations,
	Automation,
	AutomationsResponse,
	DataTableConfig,
} from '@quillcrm/client';
import { getToLink, useNavigate } from '@quillcrm/navigation';
import { PageHeader, PlusIcon, NoticeBanner } from '@quillcrm/components';
import { isEmpty } from 'validator';
import { NoticeMessage } from '@quillcrm/client';
import { formatDateForAPI } from '@quillcrm/utils';
import CreateAutomationModal from './create-automation-modal';
import { DataTable } from '@/components/ui/data-table';
import { getAutomationColumns } from './columns';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';

const AutomationsList: React.FC = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [page, setPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [data, setData] = useState<Automations>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [keyword, setKeyword] = useState<string>('');
	const [visible, setVisible] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [automation, setAutomation] = useState({
		name: '',
		trigger: '',
	});
	const [bulkAction, setBulkAction] = useState<string>('');
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({
		from: null,
		to: null,
	});
	const [updatingAutomationId, setUpdatingAutomationId] = useState<
		number | null
	>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const navigate = useNavigate();

	// Use the reusable hook
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	const fetchAutomations = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/automations', {
					per_page: perPage,
					page,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
				}),
				method: 'GET',
			})) as AutomationsResponse;

			setData(response.data);
			setTotalRecords(response.total);
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAutomations();
	}, [page, perPage, keyword, dateRange]);

	console.log(data);

	const createAutomation = async () => {
		if (!validate(automation)) {
			return;
		}
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: '/qc/v1/automations',
				method: 'POST',
				data: automation,
			})) as Automation;

			navigate(getToLink(`automations/${response.id}`));
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const deleteSelected = async () => {
		try {
			await apiFetch({
				path: '/qc/v1/automations',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			setSelectedRowKeys([]);
			setBulkAction('');
			fetchAutomations();
			setNotice({
				type: 'success',
				message: __(
					'Selected automations deleted successfully',
					'quillcrm'
				),
			});
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const validate = (automation: Partial<Automation>) => {
		if (isEmpty(automation.name || '', { ignore_whitespace: true })) {
			setNotice({
				type: 'error',
				message: __('Automation name is required', 'quillcrm'),
			});
			return false;
		}

		if (isEmpty(automation.trigger || '')) {
			setNotice({
				type: 'error',
				message: __('Automation trigger is required', 'quillcrm'),
			});
			return false;
		}

		return true;
	};

	const handleViewReports = (automation: Automation) => {
		navigate(getToLink(`automations/${automation.id}/reports`));
	};

	const handleStatusChange = async (
		automation: Automation,
		newStatus: string
	) => {
		setUpdatingAutomationId(automation.id);
		try {
			await apiFetch({
				path: `/qc/v1/automations/${automation.id}`,
				method: 'PUT',
				data: {
					status: newStatus,
				},
			});

			// Update the local state
			setData((prevData) =>
				prevData.map((item) =>
					item.id === automation.id
						? { ...item, status: newStatus }
						: item
				)
			);

			setNotice({
				type: 'success',
				message: __(
					'Automation status updated successfully',
					'quillcrm'
				),
			});
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setUpdatingAutomationId(null);
		}
	};

	const closeNotice = () => {
		setNotice(null);
	};

	const handleBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelected();
				break;
			default:
				break;
		}
	};

	// Table configuration
	const columns = getAutomationColumns({
		onViewReports: handleViewReports,
		onStatusChange: handleStatusChange,
		updatingAutomationId,
		navigate,
	});

	const tableConfig: DataTableConfig<Automation> = {
		manageColumns: { enabled: false },
		search: {
			placeholder: __('Search Automations', 'quillcrm'),
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
		},
		dateRange: {
			enabled: true,
			value: dateRange,
			onDateChange: setDateRange,
			placeholder: __('Date Range', 'quillcrm'),
		},
	};

	return (
		<div className="qcrm-automations-list">
			<PageHeader
				title={__('Automations List', 'quillcrm')}
				subtitle={__('Automations', 'quillcrm')}
				actions={[
					{
						label: __('Create Automation', 'quillcrm'),
						onClick: () => setVisible(true),
						icon: <PlusIcon />,
					},
				]}
			/>
			{/* Notice Banner */}
			{notice && (
				<NoticeBanner notice={notice} closeNotice={closeNotice} />
			)}

			{/* Data Table */}
			<DataTable
				columns={columns}
				data={data}
				config={tableConfig}
				showPagination={false}
				initialPageSize={perPage}
				setPage={setPage}
				loading={loading}
			/>
			<DataTablePagination table={serverSideTable} />

			<CreateAutomationModal
				visible={visible}
				isSaving={isSaving}
				automation={automation}
				onOk={createAutomation}
				onCancel={() => setVisible(false)}
				onAutomationChange={setAutomation}
			/>
		</div>
	);
};

export default AutomationsList;
