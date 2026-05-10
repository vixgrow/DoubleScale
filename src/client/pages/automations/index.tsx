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
} from '@doublescale/client';
import { getToLink, useNavigate } from '@doublescale/navigation';
import { PageHeader, PlusIcon, GradientAutomationsIcon, NoticeBanner, NoData } from '@doublescale/components';
import { isEmpty } from 'validator';
import { NoticeMessage } from '@doublescale/client';
import { formatDateForAPI } from '@doublescale/utils';
import CreateAutomationModal from './create-automation-modal';
import { DataTable } from '@/components/ui/data-table';
import { getAutomationColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';

const AutomationsList: React.FC = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [page, setPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [hasRecords, setHasRecords] = useState<boolean>(false);
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
	const [renamingAutomationId, setRenamingAutomationId] = useState<
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
				path: addQueryArgs('/doublescale/v1/automations', {
					per_page: perPage,
					page,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
				}),
				method: 'GET',
			})) as AutomationsResponse;

			setData(response.data ?? []);
			setTotalRecords(response.total ?? 0);
			setHasRecords((response.total_count || 0) > 0);
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
				path: '/doublescale/v1/automations',
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
				path: '/doublescale/v1/automations',
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
					'doublescale'
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
				message: __('Automation name is required', 'doublescale'),
			});
			return false;
		}

		if (isEmpty(automation.trigger || '')) {
			setCreateError({
				type: 'error',
				message: __('Automation trigger is required', 'doublescale'),
			});
			return false;
		}

		return true;
	};

	const handleRenameAutomation = async (
		automation: Automation,
		name: string
	) => {
		const trimmed = name.trim();
		if (!trimmed) {
			setListError({
				type: 'error',
				message: __('Automation name is required', 'doublescale'),
			});
			return;
		}
		if (trimmed === automation.name) {
			return;
		}
		setRenamingAutomationId(automation.id);
		try {
			await apiFetch({
				path: `/doublescale/v1/automations/${automation.id}`,
				method: 'PUT',
				data: {
					name: trimmed,
					status: automation.status,
				},
			});

			setData((prev) =>
				prev.map((item) =>
					item.id === automation.id
						? { ...item, name: trimmed }
						: item
				)
			);

			setListError({
				type: 'success',
				message: __(
					'Automation updated successfully',
					'doublescale'
				),
			});
		} catch (error: any) {
			setListError({
				type: 'error',
				message: error.message,
			});
			throw error;
		} finally {
			setRenamingAutomationId(null);
		}
	};

	const handleStatusChange = async (
		automation: Automation,
		newStatus: string
	) => {
		setUpdatingAutomationId(automation.id);
		try {
			await apiFetch({
				path: `/doublescale/v1/automations/${automation.id}`,
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
					'doublescale'
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

	const deleteAutomation = async (id: number) => {
		try {
			await apiFetch({
				path: `/doublescale/v1/automations/${id}`,
				method: 'DELETE',
			});

			fetchAutomations();
			setListError({
				type: 'success',
				message: __('Automation deleted successfully', 'doublescale'),
			});
		} catch (error: any) {
			setListError({
				type: 'error',
				message: error.message,
			});
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
		onStatusChange: handleStatusChange,
		updatingAutomationId,
		renamingAutomationId,
		onRenameAutomation: handleRenameAutomation,
		navigate,
		onDelete: deleteAutomation,
	});

	const tableConfig: DataTableConfig<Automation> = {
		manageColumns: { enabled: false },
		search: {
			placeholder: __('Search Automations', 'doublescale'),
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
			placeholder: __('Date Range', 'doublescale'),
		},
	};

	return (
		<div className="doublescale-automations-list">
			<PageHeader
				title={__('Automations List', 'doublescale')}
				subtitle={__('Automations', 'doublescale')}
				actions={[
					{
						label: __('Create Automation', 'doublescale'),
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

		{loading || hasRecords ? (
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
		) : (
			<NoData
				icon={<GradientAutomationsIcon />}
				title={__('No automations yet', 'doublescale')}
				subtitle={__(
					'Create Automation to build your first workflow and start streamlining your process',
					'doublescale'
				)}
				buttonLabel={__('Create Automation', 'doublescale')}
				onClick={() => {
					setVisible(true);
					setCreateError(null);
				}}
			/>
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
