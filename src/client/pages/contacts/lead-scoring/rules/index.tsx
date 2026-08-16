/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, useRef } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import React, { forwardRef, useImperativeHandle } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import type { DataTableConfig, NoticeMessage } from '@doublescale/client';
import { NoticeBanner, NoData, ToolsIcon } from '@doublescale/components';
import { DataTable } from '@/components/ui/data-table';
import { RuleDialog } from './rule-dialog';
import { useRulesColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { formatDateForAPI } from '@doublescale/utils';

export interface RulesRef {
	openCreateRuleModal: () => void;
}

interface RulesProps {
	activeTab?: string;
}

export interface LeadScoringRule {
	id: number;
	title: string;
	status: 'active' | 'inactive';
	points: number;
	is_adding: boolean;
	settings?: Record<string, any>;
	created_at: string;
	updated_at: string;
}

interface RulesResponse {
	data: LeadScoringRule[];
	total: number;
	total_count?: number;
}

const Rules = forwardRef<RulesRef, RulesProps>(({ activeTab }, ref) => {
	const [rules, setRules] = useState<LeadScoringRule[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [keyword, setKeyword] = useState<string>('');
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [hasRecords, setHasRecords] = useState<boolean>(false);
	const [visible, setVisible] = useState<boolean>(false);
	const [selectedRule, setSelectedRule] = useState<LeadScoringRule | null>(
		null
	);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [rule, setRule] = useState({
		title: '',
		status: 'active' as 'active' | 'inactive',
		points: 0,
		is_adding: true,
		settings: {},
	});
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);

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

	useImperativeHandle(ref, () => ({
		openCreateRuleModal: () => {
			setSelectedRule(null);
			setRule({
				title: '',
				status: 'active',
				points: 0,
				is_adding: true,
				settings: {},
			});
			setVisible(true);
		},
	}));

	// Use the reusable hook
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	const fetchRules = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/lead-scoring-rules', {
					per_page: perPage,
					page,
					from: formatDateForAPI(dateRange.from),
					to: formatDateForAPI(dateRange.to),
					keyword,
				}),
			})) as RulesResponse;

			setRules(response.data);
			setTotalRecords(response.total);
			setHasRecords((response.total_count || 0) > 0);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRules();
	}, [page, perPage, keyword, dateRange]);

	const validate = (rule: Partial<LeadScoringRule>) => {
		if (!rule.title || rule.title.trim() === '') {
			setVisible(false);
			showNotice('error', __('Rule title is required', 'doublescale'));
			return false;
		}
		if (rule.points === undefined || rule.points < 0) {
			setVisible(false);
			showNotice(
				'error',
				__('Points must be a positive number', 'doublescale')
			);
			return false;
		}
		return true;
	};

	const createRule = async () => {
		if (!validate(rule)) {
			return;
		}

		setIsSaving(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/lead-scoring-rules',
				method: 'POST',
				data: rule,
			});

			setVisible(false);
			await fetchRules();
			showNotice('success', __('Rule created successfully', 'doublescale'));
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
			setIsSaving(false);
		}
	};

	const updateRule = async () => {
		if (!selectedRule || !validate(selectedRule)) {
			return;
		}
		setIsSaving(true);
		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/lead-scoring-rules/${selectedRule?.id}`,
				method: 'PUT',
				data: selectedRule,
			})) as LeadScoringRule;

			setRules([
				...rules.map((r) => (r.id === response.id ? response : r)),
			]);

			setVisible(false);
			setSelectedRule(null);
			showNotice('success', __('Rule updated successfully', 'doublescale'));
		} catch (error: any) {
			setVisible(false);
			showNotice('error', error.message);
		} finally {
			setVisible(false);
			setIsSaving(false);
		}
	};

	const deleteSelectedRules = async () => {
		if (selectedRowKeys.length === 0) {
			return;
		}

		setIsApplying(true);
		try {
			await apiFetch({
				path: '/doublescale/v1/lead-scoring-rules',
				method: 'DELETE',
				data: { ids: selectedRowKeys },
			});

			await fetchRules();
			setSelectedRowKeys([]);
			setBulkAction('');
			showNotice(
				'success',
				__('Selected rules deleted successfully', 'doublescale')
			);
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setIsApplying(false);
		}
	};

	const doBulkAction = async (action: string) => {
		switch (action) {
			case 'delete':
				deleteSelectedRules();
				break;
			default:
				break;
		}
	};

	const handleEditRule = (rule: LeadScoringRule) => {
		setSelectedRule(rule);
		setVisible(true);
	};

	const handleSubmit = () => {
		selectedRule ? updateRule() : createRule();
	};

	const handleCloseModal = () => {
		setVisible(false);
		setSelectedRule(null);
		setRule({
			title: '',
			status: 'active',
			points: 0,
			is_adding: true,
			settings: {},
		});
	};

	const columns = useRulesColumns({ onEditRule: handleEditRule });

	const tableConfig: DataTableConfig<LeadScoringRule> = {
		manageColumns: {
			enabled: false,
		},
		search: {
			placeholder: __('Search Rules', 'doublescale'),
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
			onExecuteAction: doBulkAction,
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
		<div className="doublescale-lead-scoring-rules-list min-w-0 w-full">
			{/* Notice Banner */}
			{notice && (
				<div className="mb-4">
					<NoticeBanner
						ref={noticeBannerRef}
						notice={notice}
						closeNotice={closeNotice}
					/>
				</div>
			)}

			{loading || hasRecords ? (
				<>
					{/* Data Table */}
					<DataTable
						columns={columns}
						data={rules}
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
					icon={<ToolsIcon width={40} height={40} />}
					title={__('No Rules Found', 'doublescale')}
					subtitle={__(
						'Create your first lead scoring rule to get started',
						'doublescale'
					)}
					buttonLabel={__('Add Rule', 'doublescale')}
					onClick={() => {
						setSelectedRule(null);
						setRule({
							title: '',
							status: 'active',
							points: 0,
							is_adding: true,
							settings: {},
						});
						setVisible(true);
					}}
				/>
			)}

			{/* Dialog */}
			<RuleDialog
				visible={visible}
				selectedRule={selectedRule}
				rule={rule}
				isSaving={isSaving}
				onClose={handleCloseModal}
				onSubmit={handleSubmit}
				onRuleChange={setRule}
				onSelectedRuleChange={setSelectedRule}
			/>
		</div>
	);
});

Rules.displayName = 'Rules';

export default Rules;
