/**
 * Contracts list page with summary cards and charts.
 */

import React, { useEffect, useMemo, useState } from '@wordpress/element';
import type { ComponentType } from 'react';
import { __ } from '@wordpress/i18n';
import { RefreshCw, Tags, CheckCheck } from 'lucide-react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import type { DataTableConfig } from '@doublescale/client';
import type { IconProps } from '@doublescale/config';
import { useNavigate, getToLink } from '@doublescale/navigation';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { formatDateForAPI } from '@doublescale/utils';
import {
	ColoredDeleteIcon,
	ContractAboutToExpireIcon,
	ContractDraftIcon,
	ContractExpiredIcon,
	ContractSignedIcon,
	DashboardContentCard,
	GradientContractsIcon,
	MessageStatsCard,
	NoData,
	PageHeader,
	PlusIcon,
	SalesIcon,
	SendTestEmailIcon,
} from '@doublescale/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { ConfirmDialog } from '@/components/sales';
import {
	canEditSalesDocument,
	isApprovalWorkflowEnabled,
} from '@/components/sales/sales-approval-utils';
import {
	CONTRACT_STATUSES,
	CONTRACT_STATUS_LABELS,
	type ContractStatus,
} from '@/constants/sales';
import {
	deleteContract,
	useContracts,
	useContractSummary,
	useContractTypes,
	useSalesSettings,
} from '@/hooks/sales';
import type { Contract } from '@/types/sales';
import { getContractColumns } from './columns';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const ActiveContractIcon: React.FC<IconProps> = ({
	width = 29,
	height = 29,
}) => <CheckCheck width={width} height={height} />;

const statusSummaryConfig: Record<
	ContractStatus,
	{
		Icon: ComponentType<IconProps>;
		iconBgClass: string;
		iconColor?: string;
		percentageBadgeClass: string;
	}
> = {
	draft: {
		Icon: ContractDraftIcon,
		iconBgClass: 'bg-[#6B6C76]',
		iconColor: 'text-white',
		percentageBadgeClass: 'bg-[#ECECEC] text-[#6B6C76]',
	},
	sent: {
		Icon: SendTestEmailIcon,
		iconBgClass: 'bg-[#16A34A]',
		iconColor: 'text-white',
		percentageBadgeClass: 'bg-[#E4FAEC] text-[#16A34A]',
	},
	signed: {
		Icon: ContractSignedIcon,
		iconBgClass: 'bg-[#FFD242]',
		iconColor: 'text-[#29292E]',
		percentageBadgeClass: 'bg-[#F7F4C3] text-[#896900]',
	},
	active: {
		Icon: ActiveContractIcon,
		iconBgClass: 'bg-[#16A34A]',
		iconColor: 'text-white',
		percentageBadgeClass: 'bg-[#E4FAEC] text-[#16A34A]',
	},
	expired: {
		Icon: ContractExpiredIcon,
		iconBgClass: 'bg-[#CB5301]',
		iconColor: 'text-white',
		percentageBadgeClass: 'bg-[#FAEADF] text-[#CB5301]',
	},
};

const ContractsList: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('all');
	const [contractTypeId, setContractTypeId] = useState('all');
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({ from: null, to: null });
	const [hasRecords, setHasRecords] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);

	const { data, loading, error, refetch } = useContracts({
		page,
		per_page: perPage,
		search: search || undefined,
		status: status !== 'all' ? status : undefined,
		contract_type_id:
			contractTypeId !== 'all' ? Number(contractTypeId) : undefined,
		start_date_from: formatDateForAPI(dateRange.from),
		start_date_to: formatDateForAPI(dateRange.to),
		sort_by: 'created_at',
		sort_order: 'desc',
	});
	const { data: salesSettings } = useSalesSettings();
	const { data: summary, refetch: refetchSummary } = useContractSummary();
	const { data: contractTypes } = useContractTypes();

	const contracts = data?.data ?? [];
	const total = data?.meta?.total ?? 0;

	useEffect(() => {
		if (!loading) {
			setHasRecords((data?.total_count ?? summary?.total_count ?? 0) > 0);
		}
	}, [loading, data?.total_count, summary?.total_count]);

	const table = useServerSideTable({
		page,
		perPage,
		totalRecords: total,
		setPage,
		setPerPage,
	});

	const goToCreate = () => navigate(getToLink('sales/contracts/new'));

	const refreshAll = () => {
		void refetch();
		void refetchSummary();
	};

	const canEdit = (contract: Contract) =>
		canEditSalesDocument(
			isApprovalWorkflowEnabled(salesSettings, contract),
			contract.approval,
			contract
		);

	const columns = useMemo(
		() =>
			getContractColumns({
				navigate,
				onDelete: setDeleteId,
				canEdit,
			}),
		[navigate, salesSettings]
	);

	const tableConfig: DataTableConfig<Contract> = useMemo(
		() => ({
			manageColumns: { enabled: false },
			toolbarClassName:
				'max-[1099px]:items-stretch max-[1099px]:[&>.data-table-search]:max-w-none max-[1099px]:[&>div:last-child]:!w-full min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:gap-1 min-[1100px]:[&>.data-table-search]:max-w-xs min-[1100px]:[&>.data-table-search]:flex-1 min-[1100px]:[&>div:last-child]:w-auto',
			search: {
				placeholder: __('Search Contracts...', 'doublescale'),
				onChange: setSearch,
				value: search,
			},
			dateRange: {
				enabled: true,
				value: dateRange,
				onDateChange: (range) => {
					setDateRange(range);
					setPage(1);
				},
				placeholder: __('Start Date - End Date', 'doublescale'),
			},
			selectFilters: [
				{
					id: 'contract_type',
					placeholder: __('Type', 'doublescale'),
					value: contractTypeId,
					onChange: (value) => {
						setContractTypeId(value);
						setPage(1);
					},
					options: [
						{ value: 'all', label: __('All types', 'doublescale') },
						...(contractTypes ?? []).map((type) => ({
							value: String(type.id),
							label: type.name,
						})),
					],
				},
				{
					id: 'status',
					placeholder: __('Status', 'doublescale'),
					value: status,
					onChange: (value) => {
						setStatus(value);
						setPage(1);
					},
					options: [
						{ value: 'all', label: __('All statuses', 'doublescale') },
						...CONTRACT_STATUSES.map((contractStatus) => ({
							value: contractStatus,
							label: CONTRACT_STATUS_LABELS[contractStatus],
						})),
					],
				},
			],
		}),
		[contractTypeId, contractTypes, dateRange, search, status]
	);

	const confirmDelete = async () => {
		if (!deleteId) {
			return;
		}
		setDeleting(true);
		try {
			await deleteContract(deleteId);
			setDeleteId(null);
			refreshAll();
		} finally {
			setDeleting(false);
		}
	};

	const typeCountData =
		summary?.by_type?.map((row) => ({
			name: row.name,
			count: row.count,
		})) ?? [];

	const typeValueData =
		summary?.by_type?.map((row) => ({
			name: row.name,
			value: row.value_total,
		})) ?? [];

	return (
		<div className="space-y-6">
			<PageHeader
				title={__('Contracts', 'doublescale')}
				subtitle={__('Sales', 'doublescale')}
				rowClassName="flex-col gap-3 sm:gap-0 sm:flex-row items-start sm:items-center justify-between w-full [&_h1]:min-w-0"
				className="flex-row shrink-0 flex-wrap items-center justify-start sm:justify-end gap-3 sm:gap-4"
				actions={[
					{
						label: '',
						onClick: refreshAll,
						variant: 'outline' as const,
						size: 'icon' as const,
						icon: <RefreshCw className="h-4 w-4" />,
						'aria-label': __('Refresh', 'doublescale'),
					},
					{
						label: __('Create New Contract', 'doublescale'),
						onClick: goToCreate,
						variant: 'default' as const,
						icon: <PlusIcon />,
					},
				]}
			/>

			{error ? <div className="text-sm text-red-600">{error}</div> : null}

			{summary ? (
				<>
					<DashboardContentCard
						title={__('Analytics Overview', 'doublescale')}
						cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
						contentClassName="flex min-h-0 flex-1 flex-col"
					>
						<div className="mb-6 grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-5">
							<MessageStatsCard
								label={__('Active', 'doublescale')}
								layout="centered"
								value={formatMoney(
									summary.by_status?.active?.amount ?? 0
								)}
								icon={
									<ActiveContractIcon
										width={29}
										height={29}
									/>
								}
								iconBgClass="bg-[#16A34A]"
								className="bg-[#F7F8FA]"
								iconColor="text-white"
							/>
							<MessageStatsCard
								label={__('Expired', 'doublescale')}
								layout="centered"
								value={formatMoney(
									summary.by_status?.expired?.amount ?? 0
								)}
								icon={
									<ContractExpiredIcon
										width={29}
										height={29}
									/>
								}
								iconBgClass="bg-[#CB5301]"
								className="bg-[#F7F8FA]"
								iconColor="text-white"
							/>
							<MessageStatsCard
								label={__('About to Expire', 'doublescale')}
								layout="centered"
								value={summary.about_to_expire_count}
								icon={
									<ContractAboutToExpireIcon
										width={29}
										height={29}
									/>
								}
								iconBgClass="bg-[#FFD242]"
								className="bg-[#F7F8FA]"
								iconColor="text-[#29292E]"
							/>
							<MessageStatsCard
								label={__('Recently Added', 'doublescale')}
								layout="centered"
								value={summary.recently_added_count}
								icon={<PlusIcon width={29} height={29} />}
								iconBgClass="bg-[#0D9DFC]"
								className="bg-[#F7F8FA]"
								iconColor="text-white"
							/>
							<MessageStatsCard
								label={__('Trash', 'doublescale')}
								layout="centered"
								value={summary.trash_count}
								icon={
									<ColoredDeleteIcon width={29} height={29} />
								}
								iconBgClass="bg-[#C30A0A]"
								className="bg-[#F7F8FA]"
								iconColor="text-white"
							/>
						</div>

						<div className="grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-5 mb-6">
							{CONTRACT_STATUSES.map((contractStatus) => {
								const row = summary.by_status?.[contractStatus];
								const {
									Icon,
									iconBgClass,
									iconColor,
									percentageBadgeClass,
								} = statusSummaryConfig[contractStatus];
								return (
									<MessageStatsCard
										key={contractStatus}
										label={
											CONTRACT_STATUS_LABELS[
												contractStatus
											]
										}
										layout="centered-badge"
										value={`${row?.count ?? 0} / ${summary.total_count}`}
										percentage={row?.percent ?? 0}
										icon={
											contractStatus === 'sent' ? (
												<SendTestEmailIcon
													width={29}
													height={29}
												/>
											) : (
												<Icon width={29} height={29} />
											)
										}
										iconBgClass={iconBgClass}
										iconColor={iconColor ?? 'text-white'}
										percentageBadgeClass={
											percentageBadgeClass
										}
										className="bg-[#F7F8FA]"
									/>
								);
							})}
						</div>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<DashboardContentCard
								title={__('Contracts by Type', 'doublescale')}
								cardClassName="border border-[#D0D0D0] bg-[#F7F8FA] rounded-xl shadow-none"
							>
								<div className="h-64">
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<BarChart
											data={typeCountData}
											margin={{
												top: 8,
												right: 8,
												left: 0,
												bottom: 0,
											}}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												vertical={false}
											/>
											<XAxis
												dataKey="name"
												tick={{ fontSize: 12 }}
												tickLine={false}
												axisLine={false}
											/>
											<YAxis
												allowDecimals={false}
												tick={{ fontSize: 12 }}
												width={28}
												tickLine={false}
												axisLine={false}
												tickMargin={4}
											/>
											<Tooltip />
											<Bar
												dataKey="count"
												fill="#0D9DFC"
												radius={[4, 4, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</DashboardContentCard>

							<DashboardContentCard
								title={__(
									'Contracts Value by Type',
									'doublescale'
								)}
								cardClassName="border border-[#D0D0D0] bg-[#F7F8FA] rounded-xl shadow-none"
							>
								<div className="h-64">
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<BarChart
											data={typeValueData}
											layout="vertical"
											margin={{
												top: 8,
												right: 8,
												left: 0,
												bottom: 0,
											}}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												horizontal={false}
											/>
											<XAxis
												type="number"
												tickFormatter={(v) =>
													formatMoney(Number(v))
												}
												tick={{ fontSize: 12 }}
												tickLine={false}
												axisLine={false}
											/>
											<YAxis
												type="category"
												dataKey="name"
												width={48}
												tick={{ fontSize: 12 }}
												tickLine={false}
												axisLine={false}
												tickMargin={4}
											/>
											<Tooltip
												formatter={(v: number) =>
													formatMoney(v)
												}
											/>
											<Bar
												dataKey="value"
												fill="#CB5301"
												radius={[0, 4, 4, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</DashboardContentCard>
						</div>
					</DashboardContentCard>
				</>
			) : null}

			<div className="rounded-[20px] bg-white p-6 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)]">
				{loading && !hasRecords ? (
					<div className="py-20 text-center text-sm text-muted-foreground">
						{__('Loading…', 'doublescale')}
					</div>
				) : loading || hasRecords ? (
					<>
						<DataTable
							columns={columns}
							data={contracts}
							config={tableConfig}
							showPagination={false}
							initialPageSize={perPage}
							setPage={setPage}
							loading={loading}
						/>
						<DataTablePagination table={table} />
					</>
				) : (
					<NoData
						icon={<GradientContractsIcon />}
						title={__('No contracts yet', 'doublescale')}
						subtitle={__(
							'Create a new contract to get started',
							'doublescale'
						)}
						buttonLabel={__('Create New Contract', 'doublescale')}
						onClick={goToCreate}
					/>
				)}
			</div>

			<ConfirmDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteId(null);
					}
				}}
				title={__('Delete Contract', 'doublescale')}
				description={__(
					'Do you really want to delete this contract?',
					'doublescale'
				)}
				confirmLabel={__('Confirm', 'doublescale')}
				destructive
				busy={deleting}
				onConfirm={confirmDelete}
			/>
		</div>
	);
};

export default ContractsList;
