/**
 * Proposals list page.
 */

import React, { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { RefreshCw } from 'lucide-react';

import type { DataTableConfig } from '@doublescale/client';
import { useNavigate, getToLink } from '@doublescale/navigation';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { formatDateForAPI } from '@doublescale/utils';
import { GradientProposalsIcon, NoData, PageHeader, PlusIcon } from '@doublescale/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import {
	ConfirmDialog,
	ConvertToInvoiceDialog,
	ProposalFormDialog,
	SendDocumentDialog,
	SendWhatsappDialog,
} from '@/components/sales';
import {
	canEditSalesDocument,
	formatSalesRestError,
	isApprovalWorkflowEnabled,
	isWhatsappAutoSendAvailable,
	showDirectSendAction,
} from '@/components/sales/sales-approval-utils';
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_LABELS } from '@/constants/sales';
import {
	changeProposalStatus,
	confirmWhatsappSent,
	convertProposalToInvoice,
	deleteProposal,
	downloadProposalPdf,
	duplicateProposal,
	sendProposal,
	sendProposalWhatsapp,
	useProposals,
	useSalesSettings,
	type WhatsappShareOptions,
} from '@/hooks/sales';
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
	const [busyId, setBusyId] = useState<number | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [convertTarget, setConvertTarget] = useState<Proposal | null>(null);
	const [acceptTarget, setAcceptTarget] = useState<Proposal | null>(null);
	const [sendTarget, setSendTarget] = useState<Proposal | null>(null);
	const [whatsappTarget, setWhatsappTarget] = useState<Proposal | null>(null);

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

	const canSend = (proposal: Proposal) =>
		showDirectSendAction(
			isApprovalWorkflowEnabled(salesSettings, proposal),
			'proposal',
			proposal.status,
			proposal.approval,
			proposal.status === 'declined',
			proposal
		);

	/** Runs a row action with a per-row busy flag and shared error reporting. */
	const runRowAction = async (
		proposal: Proposal,
		action: () => Promise<void>,
		fallbackMessage: string,
		errorOverrides?: Record<string, string>
	) => {
		setBusyId(proposal.id);
		setNotice(null);
		try {
			await action();
		} catch (err: unknown) {
			setNotice(formatSalesRestError(err, fallbackMessage, errorOverrides));
		} finally {
			setBusyId(null);
		}
	};

	const handleDuplicate = (proposal: Proposal) =>
		void runRowAction(
			proposal,
			async () => {
				const copy = await duplicateProposal(proposal.id);
				// Land on the copy so the user can adjust it straight away.
				navigate(getToLink(`sales/proposals/${copy.id}/edit`));
			},
			__('Duplicate failed.', 'doublescale')
		);

	const handleDownloadPdf = (proposal: Proposal) =>
		void runRowAction(
			proposal,
			() => downloadProposalPdf(proposal.id, proposal.proposal_number),
			__('PDF download failed.', 'doublescale')
		);

	const confirmConvert = () => {
		if (!convertTarget) {
			return;
		}
		const proposal = convertTarget;
		void runRowAction(
			proposal,
			async () => {
				const result = await convertProposalToInvoice(proposal.id);
				navigate(getToLink(`sales/invoices/${result.invoice.id}`));
			},
			__('Convert to invoice failed.', 'doublescale'),
			{
				approval_required: __(
					'This proposal must be approved before it can be converted to an invoice.',
					'doublescale'
				),
			}
		).then(() => setConvertTarget(null));
	};

	const confirmMarkAccepted = () => {
		if (!acceptTarget) {
			return;
		}
		const proposal = acceptTarget;
		void runRowAction(
			proposal,
			async () => {
				await changeProposalStatus(proposal.id, 'accepted');
				await refetch();
				setNotice(__('Proposal marked as accepted.', 'doublescale'));
			},
			__('Failed to update the proposal status.', 'doublescale')
		).then(() => setAcceptTarget(null));
	};

	const confirmSend = (message: string) => {
		if (!sendTarget) {
			return;
		}
		const proposal = sendTarget;
		void runRowAction(
			proposal,
			async () => {
				await sendProposal(proposal.id, message);
				await refetch();
				setNotice(__('Proposal sent to the customer.', 'doublescale'));
			},
			__('Send failed.', 'doublescale'),
			{
				approval_required: __(
					'This proposal must be approved before it can be sent. Submit it for approval first.',
					'doublescale'
				),
			}
		).then(() => setSendTarget(null));
	};

	const whatsappAutoAvailable = isWhatsappAutoSendAvailable();
	const whatsappProposalId = whatsappTarget?.id ?? 0;
	const prepareWhatsapp = useCallback(
		(options: WhatsappShareOptions) => sendProposalWhatsapp(whatsappProposalId, options),
		[whatsappProposalId]
	);
	const confirmWhatsapp = useCallback(
		(message: string) => confirmWhatsappSent('proposals', whatsappProposalId, message),
		[whatsappProposalId]
	);

	const columns = useMemo(
		() =>
			getProposalColumns({
				navigate,
				onEdit: setEditDialogProposalId,
				onDelete: setDeleteId,
				canEdit,
				onDuplicate: handleDuplicate,
				onConvert: setConvertTarget,
				onMarkAccepted: setAcceptTarget,
				onSend: setSendTarget,
				onSendWhatsApp: setWhatsappTarget,
				onDownloadPdf: handleDownloadPdf,
				busyId,
				canSend,
			}),
		[navigate, salesSettings, busyId]
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

			{notice ? (
				<div className="rounded border bg-slate-50 px-3 py-2 text-sm text-slate-700">
					{notice}
				</div>
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

			<ConvertToInvoiceDialog
				open={convertTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setConvertTarget(null);
					}
				}}
				description={
					convertTarget && convertTarget.status !== 'accepted'
						? __(
								'This will mark the proposal as Accepted.',
								'doublescale'
							)
						: __(
								'Create a draft invoice from this proposal?',
								'doublescale'
							)
				}
				busy={busyId !== null}
				onConfirm={confirmConvert}
			/>

			<ConfirmDialog
				open={acceptTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setAcceptTarget(null);
					}
				}}
				title={__('Mark as Accepted', 'doublescale')}
				description={__(
					'Mark this proposal as accepted on the customer’s behalf? This may create a draft invoice automatically.',
					'doublescale'
				)}
				confirmLabel={__('Mark as Accepted', 'doublescale')}
				busy={busyId !== null}
				onConfirm={confirmMarkAccepted}
			/>

			<SendDocumentDialog
				open={sendTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSendTarget(null);
					}
				}}
				icon={<GradientProposalsIcon width={32} height={32} />}
				title={__('Send Proposal', 'doublescale')}
				description={__(
					'Send this proposal to the customer by email? They will receive a link to view, accept, or decline.',
					'doublescale'
				)}
				confirmLabel={__('Send', 'doublescale')}
				busy={busyId !== null}
				onConfirm={confirmSend}
			/>

			<SendWhatsappDialog
				open={whatsappTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setWhatsappTarget(null);
					}
				}}
				title={__('Send Proposal via WhatsApp', 'doublescale')}
				description={__(
					'Share a link to this proposal with the customer on WhatsApp.',
					'doublescale'
				)}
				onPrepare={prepareWhatsapp}
				onConfirmSent={confirmWhatsapp}
				onSent={() => {
					void refetch();
				}}
				autoSendAvailable={whatsappAutoAvailable}
			/>
		</div>
	);
};

export default ProposalsList;
