/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useMemo } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	Automations,
	Automation,
	AutomationsResponse,
	DataTableConfig,
	ServerSortState,
	WorkflowBulkExportResponse,
} from '@doublescale/client';
import { getToLink, useNavigate } from '@doublescale/navigation';
import {
	PageHeader,
	PlusIcon,
	GradientAutomationsIcon,
	NoticeBanner,
	NoData,
} from '@doublescale/components';
import { Upload } from 'lucide-react';
import { isEmpty } from 'validator';
import { NoticeMessage } from '@doublescale/client';
import { formatDateForAPI } from '@doublescale/utils';
import CreateAutomationModal from './create-automation-modal';
import ImportWorkflowsModal from './import-workflows-modal';
import { DataTable } from '@/components/ui/data-table';
import { getAutomationColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
import {
	getListPreferences,
	parseSavedDateRange,
	parseSavedSort,
	serializeDateRange,
} from '@doublescale/services/list-preferences-service';
import { useListPreferencesPersistence } from '@doublescale/hooks/use-list-preferences';

/**
 * Columns the automations list can be sorted by.
 *
 * Mirrors RestAutomationController::SORTABLE_COLUMNS — the server rejects
 * anything else, so keep the two in step.
 */
const AUTOMATION_SORTABLE_COLUMNS = [
	'name',
	'trigger',
	'status',
	'created_at',
	'updated_at',
] as const;

const downloadJsonFile = (data: unknown, filename: string) => {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: 'application/json',
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

const AutomationsList: React.FC = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [page, setPage] = useState<number>(
		() => getListPreferences('automations').page ?? 1
	);
	const [perPage, setPerPage] = useState<number>(
		() => getListPreferences('automations').per_page ?? 10
	);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [hasRecords, setHasRecords] = useState<boolean>(false);
	const [data, setData] = useState<Automations>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [keyword, setKeyword] = useState<string>(
		() => getListPreferences('automations').keyword ?? ''
	);
	const [visible, setVisible] = useState<boolean>(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [automation, setAutomation] = useState({
		name: '',
		trigger: 'user_login',
	});
	const [bulkAction, setBulkAction] = useState<string>('');
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>(() =>
		parseSavedDateRange(getListPreferences('automations').date_range)
	);
	const [sort, setSort] = useState<ServerSortState | null>(() =>
		parseSavedSort(
			getListPreferences('automations').sort,
			AUTOMATION_SORTABLE_COLUMNS
		)
	);

	useListPreferencesPersistence(
		'automations',
		useMemo(
			() => ({
				page,
				per_page: perPage,
				keyword,
				date_range: serializeDateRange(dateRange),
				sort,
			}),
			[dateRange, keyword, page, perPage, sort]
		)
	);
	const [updatingAutomationId, setUpdatingAutomationId] = useState<
		number | null
	>(null);
	const [renamingAutomationId, setRenamingAutomationId] = useState<
		number | null
	>(null);
	const [duplicatingAutomationId, setDuplicatingAutomationId] = useState<
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
					...(sort
						? { orderby: sort.orderby, order: sort.order }
						: {}),
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

	// Narrowing the result set invalidates the current page number: staying on
	// page 3 of a different result set shows a confusingly empty table. Skipped
	// on mount so a restored page survives the initial render.
	const isInitialFilterRun = useRef(true);
	useEffect(() => {
		if (isInitialFilterRun.current) {
			isInitialFilterRun.current = false;
			return;
		}

		setPage(1);
	}, [keyword, dateRange, sort]);

	useEffect(() => {
		fetchAutomations();
	}, [page, perPage, keyword, dateRange, sort]);

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
				message: __('Automation updated successfully', 'doublescale'),
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

	const duplicateAutomation = async (id: number) => {
		setDuplicatingAutomationId(id);
		setListError({
			type: 'success',
			message: __('Duplicating workflow...', 'doublescale'),
		});

		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/automations/${id}/duplicate`,
				method: 'POST',
			})) as Automation;

			setListError({
				type: 'success',
				message: __(
					'Workflow duplicated successfully',
					'doublescale'
				),
			});
			navigate(getToLink(`automations/${response.id}`));
		} catch (error: any) {
			setListError({
				type: 'error',
				message: error.message,
			});
		} finally {
			setDuplicatingAutomationId(null);
		}
	};

	// Workflow import/export is a Pro-only feature — hidden entirely from the
	// UI on Free (see the PageHeader actions and bulk-actions list below), so
	// these handlers are only ever reachable when Pro is active.
	const isPro = isProActive();

	// Export a single workflow: fetch its portable envelope and download as JSON.
	const exportAutomation = async (automationToExport: Automation) => {
		try {
			const envelope = await apiFetch({
				path: `/doublescale/v1/automations/${automationToExport.id}/export`,
				method: 'GET',
			});

			const slug =
				(automationToExport.name || 'workflow')
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-+|-+$/g, '') || 'workflow';
			downloadJsonFile(envelope, `workflow-${slug}.json`);
		} catch (error: any) {
			setListError({
				type: 'error',
				message: error.message,
			});
		}
	};

	const exportSelected = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		try {
			const envelope = (await apiFetch({
				path: '/doublescale/v1/automations/export-bulk',
				method: 'POST',
				data: {
					ids: selectedRowKeys.map((id) => Number(id)),
				},
			})) as WorkflowBulkExportResponse;

			downloadJsonFile(envelope, 'workflows-export.json');
			setSelectedRowKeys([]);
			setBulkAction('');

			const exportedCount = envelope.workflows.length;
			const errorCount = envelope.errors?.length ?? 0;

			if (errorCount > 0) {
				setListError({
					type: 'warning',
					message: __(
						`${exportedCount} workflow(s) exported. ${errorCount} could not be exported.`,
						'doublescale'
					),
				});
				return;
			}

			setListError({
				type: 'success',
				message: __(
					`${exportedCount} workflow(s) exported successfully.`,
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

	const handleImportClick = () => {
		setImportModalOpen(true);
	};

	const handleImportModalClose = async () => {
		setImportModalOpen(false);
	};

	const handleImportFinished = async (result: {
		imported: number;
		failed: number;
		singleId?: number;
	}) => {
		setSelectedRowKeys([]);

		if (result.imported > 0) {
			if (page !== 1) {
				setPage(1);
			} else {
				await fetchAutomations();
			}
		}
	};

	const handleBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelected();
				break;
			case 'export':
				exportSelected();
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
		onDuplicate: duplicateAutomation,
		duplicatingAutomationId,
		onExport: exportAutomation,
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
		sorting: {
			value: sort,
			onSortChange: setSort,
		},
	};

	return (
		<div className="doublescale-automations-list flex min-h-0 flex-1 flex-col">
			<div className="shrink-0">
				<PageHeader
					title={__('Automations', 'doublescale')}
					rowClassName="flex-row items-center justify-between w-full [&_h1]:min-w-0"
					className="flex-row shrink-0 flex-wrap items-center justify-end gap-3 sm:gap-6"
					actions={[
						// Workflow import is Pro-only — omit it entirely on
						// Free rather than showing it and nagging on click.
						...(isPro
							? [
									{
										label: __('Import', 'doublescale'),
										onClick: handleImportClick,
										variant: 'outline' as const,
										icon: <Upload size={16} />,
									},
								]
							: []),
						{
							label: __('Create Automation', 'doublescale'),
							onClick: () => {
								setVisible(true);
								setCreateError(null);
							},
							variant: 'default' as const,
							icon: <PlusIcon />,
						},
					]}
				/>
			</div>

			{listError && (
				<div className="shrink-0">
					<NoticeBanner
						notice={listError}
						closeNotice={() => setListError(null)}
					/>
				</div>
			)}
			<div className="flex min-h-0 flex-1 flex-col rounded-[20px] bg-[#fff] p-6 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)] ">
				{loading || hasRecords ? (
					<div className="flex min-h-0 flex-1 flex-col">
						<DataTable
							columns={columns}
							data={data}
							config={tableConfig}
							activeTab="automations"
							showPagination={false}
							initialPageSize={perPage}
							setPage={setPage}
							loading={loading}
						/>
						<div className="mt-auto shrink-0">
							<DataTablePagination table={serverSideTable} />
						</div>
					</div>
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
			</div>

			<ImportWorkflowsModal
				open={importModalOpen}
				onClose={handleImportModalClose}
				onImported={handleImportFinished}
			/>

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
