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
import { PageHeader, PlusIcon, GradientAutomationsIcon, NoticeBanner } from '@quillcrm/components';
import { isEmpty } from 'validator';
import { NoticeMessage } from '@quillcrm/client';
import { formatDateForAPI } from '@quillcrm/utils';
import CreateAutomationModal from './create-automation-modal';
import { DataTable } from '@/components/ui/data-table';
import { getAutomationColumns } from './columns';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { Button } from '@/components/ui/button';

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
	const [createError, setCreateError] = useState<NoticeMessage | null>(null);
	const [listError, setListError] = useState<NoticeMessage | null>(null);
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
			setListError({
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
			setCreateError({
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
			setListError({
				type: 'success',
				message: __(
					'Selected automations deleted successfully',
					'quillcrm'
				),
			});
		} catch (error: any) {
			setListError({
				type: 'error',
				message: error.message,
			});
		}
	};

	const validate = (automation: Partial<Automation>) => {
		if (isEmpty(automation.name || '', { ignore_whitespace: true })) {
			setCreateError({
				type: 'error',
				message: __('Automation name is required', 'quillcrm'),
			});
			return false;
		}

		if (isEmpty(automation.trigger || '')) {
			setCreateError({
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

			setListError({
				type: 'success',
				message: __(
					'Automation status updated successfully',
					'quillcrm'
				),
			});
		} catch (error: any) {
			setListError({
				type: 'error',
				message: error.message,
			});
		} finally {
			setUpdatingAutomationId(null);
		}
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
						onClick: () => {
							setVisible(true);
							setCreateError(null);
						},
						icon: <PlusIcon />,
					},
				]}
			/>

			{listError && (
				<div className="mb-4">
					<NoticeBanner
						notice={listError}
						closeNotice={() => setListError(null)}
					/>
				</div>
			)}

			{loading && (
				<>
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
				</>
			)}

			{!loading && (!data || data.length === 0) && (
				<div className="flex flex-col items-center justify-center py-16 px-4 border rounded-xl">
					<div className="flex flex-col items-center space-y-4">
						<div className="text-primary">
							<GradientAutomationsIcon />
						</div>
						<div className="text-center space-y-2">
							<h3 className="text-2xl font-semibold text-gray-900">
								{__('No automations yet', 'quillcrm')}
							</h3>
							<p className="text-base text-gray-500 font-medium">
								{__(
									'Create Automation to build your first workflow and start streamlining your process',
									'quillcrm'
								)}
							</p>
						</div>
						<Button
							onClick={() => {
								setVisible(true);
								setCreateError(null);
							}}
							className="mt-4"
						>
							<PlusIcon />
							{__('Create Automation', 'quillcrm')}
						</Button>
					</div>
				</div>
			)}

			{!loading && data && data.length > 0 && (
				<>
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
				</>
			)}

			<CreateAutomationModal
				visible={visible}
				isSaving={isSaving}
				automation={automation}
				onOk={createAutomation}
				onCancel={() => {
					setVisible(false);
					setCreateError(null);
				}}
				onAutomationChange={setAutomation}
				onClearError={() => setCreateError(null)}
				error={createError}
			/>
		</div>
	);
};

export default AutomationsList;
