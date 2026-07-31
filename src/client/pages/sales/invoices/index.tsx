/**
 * Invoices list page with summary cards.
 */

import React, { useEffect, useMemo, useState } from '@wordpress/element';
import type { DataTableConfig, NoticeMessage } from '@doublescale/client';
import type { ComponentType } from 'react';
import { __ } from '@wordpress/i18n';
import { Plus } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import {
	ConfirmDialog,
	InvoiceFormDialog,
	SendDocumentDialog,
} from '@/components/sales';
import {
	canEditSalesDocument,
	formatSalesRestError,
	isApprovalWorkflowEnabled,
	showDirectSendAction,
} from '@/components/sales/sales-approval-utils';
import {
	deleteInvoice,
	downloadInvoicePdf,
	duplicateInvoice,
	sendInvoice,
	useInvoices,
	useInvoiceSummary,
	useSalesSettings,
} from '@/hooks/sales';
import { INVOICE_STATUS_LABELS, INVOICE_STATUSES, type InvoiceStatus } from '@/constants/sales';
import type { Invoice } from '@/types/sales';
import {
	DashboardContentCard,
	DraftIcon,
	InvoicesIcon,
	MessageStatsCard,
	NoData,
	NoticeBanner,
	NovicesIcon,
	OutstandingInvoicesIcon,
	PageHeader,
	PainInvoicesIcon,
	PartiallyPaidIcon,
	PastInvoicesIcon,
	UnpaidIcon,
} from '@doublescale/components';
import config, { type IconProps } from '@doublescale/config';
import { getInvoiceColumns } from './columns';

const formatMoney = (value: number, currency = config.getCurrency() || 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

// Currency is a single global setting, but older documents may keep a different
// (frozen) currency. Show one figure when everything is one currency; otherwise
// break the total down per currency so mixed-currency reports stay consistent.
const formatSummaryTotal = (
	fallbackTotal: number,
	byCurrency?: Record<string, number>
): string => {
	const entries = Object.entries(byCurrency || {}).filter(
		([, amount]) => amount !== 0
	);
	if (entries.length === 0) {
		return formatMoney(fallbackTotal);
	}
	if (entries.length === 1) {
		return formatMoney(entries[0][1], entries[0][0]);
	}
	return entries
		.map(([currency, amount]) => formatMoney(amount, currency))
		.join(' · ');
};

const summaryCards: InvoiceStatus[] = [
	'unpaid',
	'paid',
	'partially_paid',
	'overdue',
	'draft',
];

const statusSummaryConfig: Record<
	InvoiceStatus,
	{
		Icon: ComponentType<IconProps>;
		iconBgClass: string;
		percentageBadgeClass: string;
	}
> = {
	unpaid: {
		Icon: UnpaidIcon,
		iconBgClass: 'bg-[#CB5301]',
		percentageBadgeClass: 'bg-[#FAEADF] text-[#CB5301]',
	},
	paid: {
		Icon: PainInvoicesIcon,
		iconBgClass: 'bg-[#16A34A]',
		percentageBadgeClass: 'bg-[#E4FAEC] text-[#16A34A]',
	},
	partially_paid: {
		Icon: PartiallyPaidIcon,
		iconBgClass: 'bg-[#FFD242]',
		percentageBadgeClass: 'bg-[#F7F4C3] text-[#896900]',
	},
	overdue: {
		Icon: PastInvoicesIcon,
		iconBgClass: 'bg-[#C30A0A]',
		percentageBadgeClass: 'bg-[#FBE8E8] text-[#C30A0A]',
	},
	draft: {
		Icon: DraftIcon,
		iconBgClass: 'bg-[#6B6C76]',
		percentageBadgeClass: 'bg-[#ECECEC] text-[#6B6C76]',
	},
};

const InvoicesList: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('all');
	const [hasRecords, setHasRecords] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogInvoiceId, setEditDialogInvoiceId] = useState<number | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [sendTarget, setSendTarget] = useState<Invoice | null>(null);
	const closeNotice = () => setNotice(null);

	const { data, loading, error, refetch } = useInvoices({
		page,
		per_page: perPage,
		search: search || undefined,
		status: status !== 'all' ? status : undefined,
		sort_by: 'created_at',
		sort_order: 'desc',
	});

	const { data: summary, refetch: refetchSummary } = useInvoiceSummary();
	const { data: salesSettings } = useSalesSettings();

	const invoices = data?.data ?? [];
	const total = data?.meta?.total ?? 0;

	useEffect(() => {
		if (!loading) {
			setHasRecords((summary?.total_count ?? 0) > 0);
		}
	}, [loading, summary?.total_count]);

	const table = useServerSideTable({
		page,
		perPage,
		totalRecords: total,
		setPage,
		setPerPage,
	});

	const refreshAll = () => {
		void refetch();
		void refetchSummary();
	};

	const canEdit = (invoice: Invoice) =>
		canEditSalesDocument(
			isApprovalWorkflowEnabled(salesSettings, invoice),
			invoice.approval,
			invoice
		);

	const canSend = (invoice: Invoice) =>
		showDirectSendAction(
			isApprovalWorkflowEnabled(salesSettings, invoice),
			'invoice',
			invoice.status,
			invoice.approval,
			false,
			invoice
		);

	/** Runs a row action with a per-row busy flag and shared error reporting. */
	const runRowAction = async (
		invoice: Invoice,
		action: () => Promise<void>,
		fallbackMessage: string,
		errorOverrides?: Record<string, string>
	) => {
		setBusyId(invoice.id);
		try {
			await action();
		} catch (err: unknown) {
			setNotice({
				type: 'error',
				message: formatSalesRestError(err, fallbackMessage, errorOverrides),
			});
		} finally {
			setBusyId(null);
		}
	};

	const handleDuplicate = (invoice: Invoice) =>
		void runRowAction(
			invoice,
			async () => {
				const copy = await duplicateInvoice(invoice.id);
				// Land on the copy so the user can adjust it straight away.
				navigate(getToLink(`sales/invoices/${copy.id}/edit`));
			},
			__('Duplicate failed.', 'doublescale')
		);

	const handleDownloadPdf = (invoice: Invoice) =>
		void runRowAction(
			invoice,
			() => downloadInvoicePdf(invoice.id, invoice.invoice_number),
			__('PDF download failed.', 'doublescale')
		);

	const confirmSend = (message: string) => {
		if (!sendTarget) {
			return;
		}
		const invoice = sendTarget;
		void runRowAction(
			invoice,
			async () => {
				await sendInvoice(invoice.id, message);
				refreshAll();
				setNotice({
					type: 'success',
					message: __('Invoice sent to the customer.', 'doublescale'),
				});
			},
			__('Send failed.', 'doublescale'),
			{
				approval_required: __(
					'This invoice must be approved before it can be sent. Submit it for approval first.',
					'doublescale'
				),
			}
		).then(() => setSendTarget(null));
	};

	const columns = useMemo(
		() =>
			getInvoiceColumns({
				navigate,
				onEdit: setEditDialogInvoiceId,
				onDelete: setDeleteId,
				canEdit,
				onDuplicate: handleDuplicate,
				onSend: setSendTarget,
				onDownloadPdf: handleDownloadPdf,
				busyId,
				canSend,
			}),
		[navigate, salesSettings, busyId]
	);

	const tableConfig: DataTableConfig<Invoice> = useMemo(
		() => ({
			manageColumns: { enabled: false },
			search: {
				placeholder: __('Search invoices…', 'doublescale'),
				onChange: (value) => {
					setSearch(value);
					setPage(1);
				},
				value: search,
			},
			selectFilters: [
				{
					id: 'status',
					placeholder: __('Status', 'doublescale'),
					value: status,
					onChange: (value) => {
						setStatus(value);
						setPage(1);
					},
					options: [
						{ value: 'all', label: __('All Statuses', 'doublescale') },
						...INVOICE_STATUSES.map((invoiceStatus) => ({
							value: invoiceStatus,
							label: INVOICE_STATUS_LABELS[invoiceStatus],
						})),
					],
				},
			],
		}),
		[search, status]
	);

	const confirmDelete = async () => {
		if (!deleteId) {
			return;
		}
		setDeleting(true);
		try {
			await deleteInvoice(deleteId);
			setDeleteId(null);
			refreshAll();
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="space-y-6">
			{notice ? (
				<NoticeBanner notice={notice} closeNotice={closeNotice} />
			) : null}

			<PageHeader
				title={__('Invoices', 'doublescale')}
				actions={[
					{
						label: __('Create New Invoice', 'doublescale'),
						onClick: () => setCreateDialogOpen(true),
						icon: <Plus className="mr-1 h-4 w-4" />,
					},
				]}
				rowClassName="flex-row items-center justify-between w-full [&_h1]:min-w-0"
				className="flex-row shrink-0 flex-wrap items-center justify-end gap-3 sm:gap-6"
			/>

			{summary ? (
				<DashboardContentCard
					title={__('Analytics Overview', 'doublescale')}
					cardClassName="flex h-full min-h-0 w-full flex-col border-0 bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]"
					contentClassName="flex min-h-0 flex-1 flex-col"
				>
					<div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-3">
						<MessageStatsCard
							label={__('Paid Invoices', 'doublescale')}
							layout="centered"
							value={formatSummaryTotal(
								summary.paid_total,
								summary.paid_by_currency
							)}
							icon={<PainInvoicesIcon width={29} height={29} />}
							iconBgClass="bg-[#16A34A]"
							className="bg-[#F7F8FA]"
							iconColor="text-white"
						/>
						<MessageStatsCard
							label={__('Past Invoices', 'doublescale')}
							layout="centered"
							value={formatSummaryTotal(
								summary.overdue_total,
								summary.overdue_by_currency
							)}
							icon={<PastInvoicesIcon width={29} height={29} />}
							iconBgClass="bg-[#C30A0A]"
							className="bg-[#F7F8FA]"
							iconColor="text-white"
						/>
						<MessageStatsCard
							label={__('Outstanding Invoices', 'doublescale')}
							layout="centered"
							value={formatSummaryTotal(
								summary.outstanding_total,
								summary.outstanding_by_currency
							)}
							icon={<OutstandingInvoicesIcon width={29} height={29} />}
							iconBgClass="bg-[#262666]"
							className="bg-[#F7F8FA]"
							iconColor="text-white"
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
						{summaryCards.map((invoiceStatus) => {
							const row = summary.by_status?.[invoiceStatus];
							const { Icon, iconBgClass, percentageBadgeClass } =
								statusSummaryConfig[invoiceStatus];
							return (
								<MessageStatsCard
									key={invoiceStatus}
									label={INVOICE_STATUS_LABELS[invoiceStatus]}
									layout="centered-badge"
									value={`${row?.count ?? 0} / ${summary.total_count}`}
									percentage={row?.percent ?? 0}
									icon={<Icon width={29} height={29} />}
									iconBgClass={iconBgClass}
									percentageBadgeClass={percentageBadgeClass}
									className="bg-[#F7F8FA]"
									iconColor="text-white"
								/>
							);
						})}
					</div>
				</DashboardContentCard>
			) : null}

			<div className="overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
				{error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}

				{loading && !hasRecords ? (
					<div className="py-20 text-center text-sm text-muted-foreground">
						{__('Loading…', 'doublescale')}
					</div>
				) : loading || hasRecords ? (
					<>
						<DataTable
							columns={columns}
							data={invoices}
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
						icon={<NovicesIcon />}
						title={__('No invoices yet', 'doublescale')}
						subtitle={__(
							'Create a new invoice to get started',
							'doublescale'
						)}
						buttonLabel={__('Create New Invoice', 'doublescale')}
						onClick={() => setCreateDialogOpen(true)}
					/>
				)}
			</div>

			<InvoiceFormDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
				onSaved={() => {
					setNotice({
						type: 'success',
						message: __('Invoice created successfully.', 'doublescale'),
					});
					refreshAll();
				}}
			/>
			<InvoiceFormDialog
				open={editDialogInvoiceId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setEditDialogInvoiceId(null);
					}
				}}
				invoiceId={editDialogInvoiceId}
				onSaved={() => {
					setNotice({
						type: 'success',
						message: __('Invoice updated successfully.', 'doublescale'),
					});
					refreshAll();
				}}
			/>

			<ConfirmDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteId(null);
					}
				}}
				title={__('Delete Invoice', 'doublescale')}
				description={__(
					'Do you really want to delete this invoice?',
					'doublescale'
				)}
				confirmLabel={__('Delete', 'doublescale')}
				destructive
				busy={deleting}
				onConfirm={confirmDelete}
			/>

			<SendDocumentDialog
				open={sendTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSendTarget(null);
					}
				}}
				icon={<InvoicesIcon width={32} height={32} />}
				title={__('Send Invoice', 'doublescale')}
				description={__(
					'Send this invoice to the customer by email? They will receive a link to view and pay it.',
					'doublescale'
				)}
				confirmLabel={__('Send', 'doublescale')}
				busy={busyId !== null}
				onConfirm={confirmSend}
			/>
		</div>
	);
};

export default InvoicesList;
