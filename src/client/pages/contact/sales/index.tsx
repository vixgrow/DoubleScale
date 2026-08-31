/**
 * Contact tab: proposals, invoices, and payments.
 */

import React, { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { ColumnDef } from '@tanstack/react-table';

import { getToLink } from '@doublescale/navigation';
import config from '@doublescale/config';
import { summarizeProposals } from '@doublescale/shared/utils/proposal-summary';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
	InvoiceFormDialog,
	InvoiceStatusPill,
	ProposalFormDialog,
	ProposalStatusPill,
} from '@/components/sales';
import {
	EmptyPaymentsIcon,
	GradientProposalsIcon,
	MessageStatsCard,
	NoData,
	NovicesIcon,
	OutstandingInvoicesIcon,
	PainInvoicesIcon,
	PlusIcon,
	ProposalsIcon,
	ViewIcon,
} from '@doublescale/components';
import {
	useContactSalesPayments,
	useInvoices,
	useProposals,
} from '@/hooks/sales';
import { PAYMENT_MODE_LABELS } from '@/constants/sales';
import type {
	ContactInvoicePayment,
	Invoice,
	Proposal,
} from '@/types/sales';
import { formatMoney } from '@/constants/currencies';

interface ContactSalesProps {
	contact_id: number;
	navigate?: (path: string) => void;
	/** Which document sections to render. Defaults to all. */
	sections?: Array<'proposals' | 'invoices' | 'payments'>;
}

const modeLabel = (mode: string | null): string => {
	if (!mode) {
		return '—';
	}
	return PAYMENT_MODE_LABELS[mode as keyof typeof PAYMENT_MODE_LABELS] ?? mode;
};

const ContactSales: React.FC<ContactSalesProps> = ({
	contact_id,
	navigate,
	sections = ['proposals', 'invoices', 'payments'],
}) => {
	const showProposals = sections.includes('proposals');
	const showInvoices = sections.includes('invoices');
	const showPayments = sections.includes('payments');

	const go = useCallback(
		(path: string, queryParams?: Record<string, string | number | undefined>) => {
			if (navigate) {
				navigate(getToLink(path, queryParams));
			}
		},
		[navigate]
	);

	const { data: proposalsData, loading: proposalsLoading, refetch: refetchProposals } = useProposals({
		contact_id,
		per_page: 100,
		sort_by: 'created_at',
		sort_order: 'desc',
	});
	const { data: invoicesData, loading: invoicesLoading, refetch: refetchInvoices } = useInvoices({
		contact_id,
		per_page: 10,
		sort_by: 'created_at',
		sort_order: 'desc',
	});
	const [paymentsPage] = useState(1);
	const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
	const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
	const { data: paymentsData, loading: paymentsLoading } = useContactSalesPayments(
		contact_id,
		paymentsPage,
		10
	);

	const proposals = proposalsData?.data ?? [];
	const invoices = invoicesData?.data ?? [];
	const payments = paymentsData?.data ?? [];
	const showDocuments = config.isModuleToggleEnabled('documents');
	const proposalSummary = summarizeProposals(proposals);
	const proposalCurrency = proposals[0]?.currency || 'USD';

	const handleViewProposal = useCallback(
		(proposalId: number) => {
			go(`sales/proposals/${proposalId}`, {
				from: `contacts/${contact_id}/proposals`,
			});
		},
		[go, contact_id]
	);

	const handleViewInvoice = useCallback(
		(invoiceId: number) => {
			go(`sales/invoices/${invoiceId}`, {
				from: `contacts/${contact_id}/invoices`,
			});
		},
		[go, contact_id]
	);

	const proposalColumns: ColumnDef<Proposal>[] = useMemo(
		() => [
			{
				accessorKey: 'proposal_number',
				header: __('Number', 'doublescale'),
				cell: ({ row }) => (
					<span className="font-medium">{row.original.proposal_number}</span>
				),
			},
			{
				accessorKey: 'subject',
				header: __('Subject', 'doublescale'),
				cell: ({ row }) => row.original.subject || '—',
			},
			{
				accessorKey: 'total',
				header: () => (
					<div className="text-right">{__('Total', 'doublescale')}</div>
				),
				cell: ({ row }) => (
					<div className="text-right">
						{formatMoney(row.original.total, row.original.currency)}
					</div>
				),
			},
			{
				accessorKey: 'status',
				header: __('Status', 'doublescale'),
				cell: ({ row }) => (
					<ProposalStatusPill
						status={row.original.status}
						expired={row.original.is_expired}
					/>
				),
			},
			{
				id: 'actions',
				header: __('Actions', 'doublescale'),
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							className="border-none bg-transparent p-0 text-primary shadow-none hover:bg-transparent hover:text-primary/80"
							onClick={() => handleViewProposal(row.original.id)}
						>
							<ViewIcon />
							{__('View', 'doublescale')}
						</Button>
					</div>
				),
			},
		],
		[handleViewProposal]
	);

	const invoiceColumns: ColumnDef<Invoice>[] = useMemo(
		() => [
			{
				accessorKey: 'invoice_number',
				header: __('Number', 'doublescale'),
				cell: ({ row }) => (
					<span className="font-medium">{row.original.invoice_number}</span>
				),
			},
			{
				accessorKey: 'total',
				header: () => (
					<div className="text-right">{__('Total', 'doublescale')}</div>
				),
				cell: ({ row }) => (
					<div className="text-right">
						{formatMoney(row.original.total, row.original.currency)}
					</div>
				),
			},
			{
				accessorKey: 'amount_paid',
				header: () => (
					<div className="text-right">{__('Paid', 'doublescale')}</div>
				),
				cell: ({ row }) => (
					<div className="text-right">
						{formatMoney(row.original.amount_paid, row.original.currency)}
					</div>
				),
			},
			{
				accessorKey: 'status',
				header: __('Status', 'doublescale'),
				cell: ({ row }) => (
					<InvoiceStatusPill status={row.original.status} />
				),
			},
			{
				id: 'actions',
				header: __('Actions', 'doublescale'),
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							className="border-none bg-transparent p-0 text-primary shadow-none hover:bg-transparent hover:text-primary/80"
							onClick={() => handleViewInvoice(row.original.id)}
						>
							<ViewIcon />
							{__('View', 'doublescale')}
						</Button>
					</div>
				),
			},
		],
		[handleViewInvoice]
	);

	const paymentColumns: ColumnDef<ContactInvoicePayment>[] = useMemo(
		() => [
			{
				accessorKey: 'payment_date',
				header: __('Date', 'doublescale'),
				cell: ({ row }) => row.original.payment_date || '—',
			},
			{
				id: 'invoice',
				header: __('Invoice', 'doublescale'),
				cell: ({ row }) =>
					row.original.invoice?.invoice_number ||
					`#${row.original.invoice_id}`,
			},
			{
				accessorKey: 'payment_mode',
				header: __('Mode', 'doublescale'),
				cell: ({ row }) => modeLabel(row.original.payment_mode),
			},
			{
				accessorKey: 'amount',
				header: () => (
					<div className="text-right">{__('Amount', 'doublescale')}</div>
				),
				cell: ({ row }) => (
					<div className="text-right">
						{formatMoney(
							row.original.amount,
							row.original.invoice?.currency || 'USD'
						)}
					</div>
				),
			},
			{
				id: 'actions',
				header: __('Actions', 'doublescale'),
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							className="border-none bg-transparent p-0 text-primary shadow-none hover:bg-transparent hover:text-primary/80"
							onClick={() => handleViewInvoice(row.original.invoice_id)}
						>
							<ViewIcon />
							{__('View', 'doublescale')}
						</Button>
					</div>
				),
			},
		],
		[handleViewInvoice]
	);

	return (
		<div className="space-y-8">
			{showDocuments && showProposals ? (
				<section className="flex flex-col gap-5">
					<div className="flex items-center justify-between gap-3">
						<h2 className="text-2xl font-semibold">
							{__('Proposals', 'doublescale')}
						</h2>
						<Button
							size="sm"
							variant="secondaryDeepBlue"
							onClick={() => setProposalDialogOpen(true)}
						>
							<PlusIcon />
							{__('New Proposal', 'doublescale')}
						</Button>
					</div>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<MessageStatsCard
							label={__('Total', 'doublescale')}
							value={formatMoney(
								proposalSummary.total,
								proposalCurrency
							)}
							icon={
								<ProposalsIcon
									width={36}
									height={36}
									color="#fff"
								/>
							}
							iconBgClass="bg-[#0D9DFC]"
							iconColor="text-white"
							className="border border-border bg-white"
						/>
						<MessageStatsCard
							label={__('Accepted', 'doublescale')}
							value={formatMoney(
								proposalSummary.accepted,
								proposalCurrency
							)}
							icon={<PainInvoicesIcon width={36} height={36} />}
							iconBgClass="bg-[#16A34A]"
							iconColor="text-white"
							className="border border-border bg-white"
						/>
						<MessageStatsCard
							label={__('Open', 'doublescale')}
							value={formatMoney(
								proposalSummary.open,
								proposalCurrency
							)}
							icon={
								<OutstandingInvoicesIcon
									width={36}
									height={36}
								/>
							}
							iconBgClass="bg-[#F59E0B]"
							iconColor="text-white"
							className="border border-border bg-white"
						/>
					</div>
					<div>
						{!proposalsLoading && proposals.length === 0 ? (
							<NoData
								icon={<GradientProposalsIcon />}
								title={__(
									'No proposals for this contact.',
									'doublescale'
								)}
								subtitle={__(
									'Create a proposal to send pricing and terms to this contact.',
									'doublescale'
								)}
								buttonLabel={__('New Proposal', 'doublescale')}
								onClick={() => setProposalDialogOpen(true)}
							/>
						) : (
							<DataTable
								columns={proposalColumns}
								data={proposals}
								loading={proposalsLoading}
								showPagination={false}
								initialPageSize={
									proposals.length > 10 ? proposals.length : 10
								}
								showMainActions={false}
								setPage={() => {}}
								config={{}}
							/>
						)}
					</div>
				</section>
			) : null}

			{showDocuments && showInvoices ? (
				<section className="flex flex-col gap-5">
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-2xl font-semibold">
								{__('Invoices', 'doublescale')}
							</h2>
							<Button
								size="sm"
								variant="secondaryDeepBlue"
								onClick={() => setInvoiceDialogOpen(true)}
							>
								<PlusIcon />
								{__('New Invoice', 'doublescale')}
							</Button>
						</div>
						<div>
							{!invoicesLoading && invoices.length === 0 ? (
								<NoData
									icon={<NovicesIcon />}
									title={__(
										'No invoices for this contact.',
										'doublescale'
									)}
									subtitle={__(
										'Create an invoice to bill this contact.',
										'doublescale'
									)}
									buttonLabel={__('New Invoice', 'doublescale')}
									onClick={() => setInvoiceDialogOpen(true)}
								/>
							) : (
								<DataTable
									columns={invoiceColumns}
									data={invoices}
									loading={invoicesLoading}
									showPagination={false}
									initialPageSize={
										invoices.length > 10 ? invoices.length : 10
									}
									showMainActions={false}
									setPage={() => {}}
									config={{}}
								/>
							)}
						</div>
					</section>
			) : null}

			{showDocuments && showPayments ? (
				<section className="flex flex-col gap-5">
						<h3 className="text-base font-semibold">
							{__('Payments', 'doublescale')}
						</h3>
						<div>
							{!paymentsLoading && payments.length === 0 ? (
								<NoData
									icon={<EmptyPaymentsIcon />}
									title={__(
										'No payments recorded for this contact.',
										'doublescale'
									)}
									subtitle={__(
										'Payments appear here when invoices for this contact are paid.',
										'doublescale'
									)}
								/>
							) : (
								<DataTable
									columns={paymentColumns}
									data={payments}
									loading={paymentsLoading}
									showPagination={false}
									initialPageSize={
										payments.length > 10 ? payments.length : 10
									}
									showMainActions={false}
									setPage={() => {}}
									config={{}}
								/>
							)}
						</div>
					</section>
			) : null}

			<ProposalFormDialog
				open={proposalDialogOpen}
				onOpenChange={setProposalDialogOpen}
				initialContactId={contact_id}
				onSaved={() => void refetchProposals()}
			/>
			<InvoiceFormDialog
				open={invoiceDialogOpen}
				onOpenChange={setInvoiceDialogOpen}
				initialContactId={contact_id}
				onSaved={() => void refetchInvoices()}
			/>
		</div>
	);
};

export default ContactSales;
