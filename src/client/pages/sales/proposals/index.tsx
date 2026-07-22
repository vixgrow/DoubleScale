/**
 * Proposals list page.
 */

import React, { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { RefreshCw } from 'lucide-react';

import type { DataTableConfig } from '@doublescale/client';
import { useNavigate, getToLink } from '@doublescale/navigation';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { formatDateForAPI } from '@doublescale/utils';
import { GradientProposalsIcon, NoData, PageHeader, PlusIcon } from '@doublescale/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { ConfirmDialog, ProposalFormDialog } from '@/components/sales';
import {
	canEditSalesDocument,
	isApprovalWorkflowEnabled,
} from '@/components/sales/sales-approval-utils';
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_LABELS } from '@/constants/sales';
import { deleteProposal, useProposals, useSalesSettings } from '@/hooks/sales';
import type { Proposal } from '@/types/sales';
import { getProposalColumns } from './columns';

const ProposalsList: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('all');
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({ from: null, to: null });
	const [hasRecords, setHasRecords] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogProposalId, setEditDialogProposalId] = useState<number | null>(null);

	const { data, loading, error, refetch } = useProposals({
		page,
		per_page: perPage,
		search: search || undefined,
		status: status !== 'all' ? status : undefined,
		from: formatDateForAPI(dateRange.from),
		to: formatDateForAPI(dateRange.to),
		sort_by: 'created_at',
		sort_order: 'desc',
	});
	const { data: salesSettings } = useSalesSettings();

	const proposals = data?.data ?? [];
	const total = data?.meta?.total ?? 0;

	useEffect(() => {
		if (!loading) {
			setHasRecords((data?.total_count ?? 0) > 0);
		}
	}, [loading, data?.total_count]);

	const table = useServerSideTable({
		page,
		perPage,
		totalRecords: total,
		setPage,
		setPerPage,
	});

	const goToCreate = () => setCreateDialogOpen(true);

	const canEdit = (proposal: Proposal) =>
		canEditSalesDocument(
			isApprovalWorkflowEnabled(salesSettings, proposal),
			proposal.approval,
			proposal
		);

	const columns = useMemo(
		() =>
			getProposalColumns({
				navigate,
				onEdit: setEditDialogProposalId,
				onDelete: setDeleteId,
				canEdit,
			}),
		[navigate, salesSettings]
	);

	const tableConfig: DataTableConfig<Proposal> = useMemo(
		() => ({
			manageColumns: { enabled: false },
			search: {
				placeholder: __('Search Proposals...', 'doublescale'),
				onChange: setSearch,
				value: search,
			},
			dateRange: {
				enabled: true,
				value: dateRange,
				onDateChange: setDateRange,
				placeholder: __('Created at', 'doublescale'),
			},
			selectFilters: [
				{
					id: 'status',
					placeholder: __('Status', 'doublescale'),
					value: status,
					onChange: setStatus,
					options: [
						{ value: 'all', label: __('All statuses', 'doublescale') },
						...PROPOSAL_STATUSES.map((proposalStatus) => ({
							value: proposalStatus,
							label: PROPOSAL_STATUS_LABELS[proposalStatus],
						})),
					],
				},
			],
		}),
		[dateRange, search, status]
	);

	const confirmDelete = async () => {
		if (!deleteId) {
			return;
		}
		setDeleting(true);
		try {
			await deleteProposal(deleteId);
			setDeleteId(null);
			await refetch();
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={__('Proposals', 'doublescale')}
				subtitle={__('Sales', 'doublescale')}
				rowClassName="flex-col gap-3 sm:gap-0 sm:flex-row items-start sm:items-center justify-between w-full [&_h1]:min-w-0"
				className="flex-row shrink-0 flex-wrap items-center justify-end gap-3 sm:gap-4"
				actions={[
					{
						label: '',
						onClick: () => void refetch(),
						variant: 'outline' as const,
						size: 'icon' as const,
						icon: <RefreshCw className="h-4 w-4" />,
						'aria-label': __('Refresh', 'doublescale'),
					},
					{
						label: __('Create New Proposal', 'doublescale'),
						onClick: goToCreate,
						variant: 'default' as const,
						icon: <PlusIcon />,
					},
				]}
			/>

			{error ? (
				<div className="text-sm text-red-600">{error}</div>
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
							data={proposals}
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
						icon={<GradientProposalsIcon />}
						title={__('No proposals yet', 'doublescale')}
						subtitle={__(
							'Create a new proposal to get started',
							'doublescale'
						)}
						buttonLabel={__('Create New Proposal', 'doublescale')}
						onClick={goToCreate}
					/>
				)}
			</div>

			<ProposalFormDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
				onSaved={() => {
					void refetch();
				}}
			/>
			<ProposalFormDialog
				open={editDialogProposalId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setEditDialogProposalId(null);
					}
				}}
				proposalId={editDialogProposalId}
				onSaved={() => {
					void refetch();
				}}
			/>

			<ConfirmDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteId(null);
					}
				}}
				title={__('Delete Proposal', 'doublescale')}
				description={__(
					'Do you really want to delete this proposal?',
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

export default ProposalsList;
