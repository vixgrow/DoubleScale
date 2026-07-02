/**
 * Invoice read-only detail view with payments.
 */

import React, { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { User } from 'lucide-react';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink } from '@doublescale/navigation';
import {
	CalendarIcon,
	ContactTotalEmailsIcon,
	CurrencyIcon,
	DeleteIcon,
	DollerIcon,
	DownloadIcon,
	EditHeaderIcon,
	PanelLayout,
	PurchaseHistoryIcon,
	RecordIcon,
	SendTestEmailIcon,
	UserActivityIcon,
	UserIcon,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	ConfirmDialog,
	InvoiceOnlinePayment,
	InvoiceStatusPill,
	PaymentsList,
	RecordPaymentDialog,
	SendDocumentDialog,
	ApprovalStatusBanner,
} from '@/components/sales';
import {
	computeAmount,
	formatSalesAmount,
} from '@/components/sales/line-items-editor';
import {
	canEditSalesDocument,
	canSubmitForApproval,
	canWithdrawApproval,
	isApprovalWorkflowEnabled,
	showDirectSendAction,
	formatSalesRestError,
} from '@/components/sales/sales-approval-utils';
import {
	deleteInvoice,
	deleteInvoicePayment,
	downloadInvoicePdf,
	recordInvoicePayment,
	sendInvoice,
	submitInvoiceForApproval,
	withdrawInvoiceApproval,
	useInvoice,
	useInvoicePayments,
	useSalesOnlinePaymentGateways,
	useSalesSettings,
} from '@/hooks/sales';
import type { ContactSummary, Invoice, LineItem } from '@/types/sales';

const cardClass = 'rounded-2xl border border-border bg-[#F7F8FA] p-4';

const InfoItem: React.FC<{
	icon: React.ReactNode;
	children: React.ReactNode;
}> = ({ icon, children }) => (
	<div className="flex items-start gap-2.5 text-sm text-muted-foreground">
		<span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
		<span className="min-w-0 break-words">{children}</span>
	</div>
);

const contactDisplayName = (contact?: ContactSummary | null): string => {
	if (!contact) {
		return '';
	}
	const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim();
	return name || contact.email || '';
};

const computeItemTax = (item: LineItem): number => {
	const amount = computeAmount(item);
	return (item.tax || []).reduce(
		(sum, tax) => sum + amount * ((Number(tax.rate) || 0) / 100),
		0
	);
};

const TotalsSummaryCard: React.FC<{
	subtotal: number;
	total: number;
	amountPaid: number;
	balanceDue: number;
	currency: string;
}> = ({ subtotal, total, amountPaid, balanceDue, currency }) => (
	<div className="flex justify-end">
		<div className="relative w-full min-w-[240px] max-w-[280px] rounded-xl bg-[#D9E9F3] p-4">
			<svg
				className="pointer-events-none absolute inset-0 z-0 h-full w-full text-[#0D9DFC]"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<rect
					x="0.5"
					y="0.5"
					width="calc(100% - 1px)"
					height="calc(100% - 1px)"
					rx="12"
					ry="12"
					fill="none"
					stroke="currentColor"
					strokeWidth="1"
					strokeDasharray="20 14"
					vectorEffect="nonScalingStroke"
				/>
			</svg>
			<div className="relative z-10 space-y-3 text-sm">
				<div className="flex items-center justify-between gap-4">
					<span className="text-muted-foreground">{__('Subtotal', 'doublescale')}</span>
					<span className="font-semibold text-accent-foreground">
						{formatSalesAmount(subtotal, currency)}
					</span>
				</div>
				<div className="flex items-center justify-between gap-4">
					<span className="text-muted-foreground">{__('Total', 'doublescale')}</span>
					<span className="font-semibold text-accent-foreground">
						{formatSalesAmount(total, currency)}
					</span>
				</div>
				<div className="flex items-center justify-between gap-4">
					<span className="text-muted-foreground">
						{__('Amount Paid', 'doublescale')}
					</span>
					<span className="font-semibold text-accent-foreground">
						{formatSalesAmount(amountPaid, currency)}
					</span>
				</div>
				<div className="border-t border-[#0D9DFC] pt-3">
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">
							{__('Balance Due', 'doublescale')}
						</span>
						<span
							className={`text-base font-semibold ${
								balanceDue > 0 ? 'text-[#C30A0A]' : 'text-accent-foreground'
							}`}
						>
							{formatSalesAmount(balanceDue, currency)}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const InvoiceView: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const invoiceId = params?.id ? Number(params.id) : null;

	const { data: fetched, loading, error, refetch } = useInvoice(invoiceId);
	const { data: salesSettings } = useSalesSettings();
	const [invoice, setInvoice] = useState<Invoice | null>(null);
	const { data: payments, loading: paymentsLoading, refetch: refetchPayments } =
		useInvoicePayments(invoiceId);
	const { data: onlineGateways, loading: gatewaysLoading } = useSalesOnlinePaymentGateways();

	const handleOnlinePaid = useCallback(
		async (updated: Invoice) => {
			setInvoice(updated);
			await refetchPayments();
		},
		[refetchPayments]
	);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [sendOpen, setSendOpen] = useState(false);
	const [paymentOpen, setPaymentOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		if (fetched) {
			setInvoice(fetched);
		}
	}, [fetched]);

	const allowedModes = invoice?.allowed_payment_modes?.filter(Boolean) ?? [];
	const payableGateways = useMemo(
		() =>
			onlineGateways.filter(
				(gateway) =>
					gateway.available &&
					gateway.configured &&
					gateway.enabled_for_sales !== false &&
					(allowedModes.length === 0 || allowedModes.includes(gateway.slug))
			),
		[onlineGateways, allowedModes]
	);
	const balanceDue = invoice
		? Math.max(0, invoice.balance ?? invoice.total - invoice.amount_paid)
		: 0;
	const isDraft = invoice?.status === 'draft';
	const showOnlinePay =
		!!invoice &&
		!isDraft &&
		balanceDue > 0 &&
		invoice.status !== 'paid' &&
		payableGateways.length > 0;

	const handleClose = () => navigate(getToLink('sales/invoices'));

	const breadcrumbItems = [
		{ label: __('Sales (Invoices)', 'doublescale'), href: 'sales/invoices' },
		{ label: __('Invoice Details', 'doublescale') },
	];

	const panelShell = (children: JSX.Element) => (
		<PanelLayout
			items={breadcrumbItems}
			showPanelClose
			onClosePanel={handleClose}
			handleNavigate={(href) => navigate(getToLink(href))}
		>
			{children}
		</PanelLayout>
	);

	const handleDelete = async () => {
		if (!invoiceId) {
			return;
		}
		setBusy(true);
		try {
			await deleteInvoice(invoiceId);
			navigate(getToLink('sales/invoices'));
		} finally {
			setBusy(false);
		}
	};

	const handleSend = async (message: string) => {
		if (!invoiceId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			const result = await sendInvoice(invoiceId, message);
			setInvoice(result.invoice);
			await refetch();
			setNotice(__('Invoice sent to the customer.', 'doublescale'));
			setSendOpen(false);
		} catch (err: unknown) {
			setNotice(
				formatSalesRestError(err, __('Send failed.', 'doublescale'), {
					approval_required: __(
						'This invoice must be approved before it can be sent. Submit it for approval first.',
						'doublescale'
					),
				})
			);
		} finally {
			setBusy(false);
		}
	};

	const handleSubmitForApproval = async () => {
		if (!invoiceId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await submitInvoiceForApproval(invoiceId);
			await refetch();
			setNotice(__('Invoice submitted for approval.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(formatSalesRestError(err, __('Failed to submit for approval.', 'doublescale')));
		} finally {
			setBusy(false);
		}
	};

	const handleWithdrawApproval = async () => {
		if (!invoiceId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await withdrawInvoiceApproval(invoiceId);
			await refetch();
			setNotice(__('Approval request withdrawn. You can edit and re-submit.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(formatSalesRestError(err, __('Failed to withdraw approval request.', 'doublescale')));
		} finally {
			setBusy(false);
		}
	};

	const handleCopyLink = async () => {
		if (!invoice?.public_url) {
			setNotice(
				__(
					'Add a WordPress page with the [doublescale_invoice] shortcode first.',
					'doublescale'
				)
			);
			return;
		}
		try {
			await navigator.clipboard.writeText(invoice.public_url);
			setNotice(__('Public link copied.', 'doublescale'));
		} catch {
			setNotice(invoice.public_url);
		}
	};

	const handleRecordPayment = async (payload: Parameters<typeof recordInvoicePayment>[1]) => {
		if (!invoiceId) {
			return;
		}
		setBusy(true);
		try {
			const result = await recordInvoicePayment(invoiceId, payload);
			setInvoice(result.invoice);
			await refetchPayments();
			setPaymentOpen(false);
		} finally {
			setBusy(false);
		}
	};

	const handleDeletePayment = async (paymentId: number) => {
		if (!invoiceId) {
			return;
		}
		const result = await deleteInvoicePayment(invoiceId, paymentId);
		setInvoice(result.invoice);
		await refetchPayments();
	};

	const handleDownloadPdf = async () => {
		if (!invoiceId || !invoice) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await downloadInvoicePdf(invoiceId, invoice.invoice_number);
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('PDF download failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	if (loading && !invoice) {
		return panelShell(
			<div className="py-12 text-center text-muted-foreground">
				{__('Loading…', 'doublescale')}
			</div>
		);
	}

	if (error || !invoice) {
		return panelShell(
			<div className="py-12 text-center text-red-600">
				{error || __('Invoice not found.', 'doublescale')}
			</div>
		);
	}

	const workflowEnabled = isApprovalWorkflowEnabled(salesSettings, invoice);
	const showSend = showDirectSendAction(
		workflowEnabled,
		'invoice',
		invoice.status,
		invoice.approval,
		invoice.status === 'paid',
		invoice
	);
	const showSubmitApproval = canSubmitForApproval(
		workflowEnabled,
		'invoice',
		invoice.status,
		invoice.approval,
		invoice
	);
	const canEdit = canEditSalesDocument(workflowEnabled, invoice.approval, invoice);
	const showWithdraw = canWithdrawApproval(invoice);
	const lineItems = (invoice.line_items || []).filter((item) => !item.optional);
	const customerName = contactDisplayName(invoice.contact);

	return panelShell(
		<div className="space-y-6">
			{notice ? (
				<div className="rounded border bg-slate-50 px-3 py-2 text-sm text-slate-700">
					{notice}
				</div>
			) : null}

			<ApprovalStatusBanner approval={invoice.approval} />

			{invoice.proposal ? (
				<div className="rounded-lg border bg-slate-50 px-4 py-3 text-sm">
					{__('Converted from proposal', 'doublescale')}{' '}
					<button
						type="button"
						className="font-medium text-primary hover:underline"
						onClick={() =>
							navigate(getToLink(`sales/proposals/${invoice.proposal!.id}`))
						}
					>
						{invoice.proposal.proposal_number} — {invoice.proposal.subject}
					</button>
				</div>
			) : null}

			<div className="space-y-6">
				<div className="flex flex-col gap-4 border-b border-border pb-6 xl:flex-row xl:items-start xl:justify-between">
					<div className="min-w-0 space-y-3">
						<h1 className="text-2xl font-bold leading-9 tracking-tight text-foreground">
							{invoice.invoice_number}
						</h1>
						<div className="flex flex-wrap items-center gap-3">
							<InvoiceStatusPill status={invoice.status} />
							{customerName ? (
								<span className="inline-flex items-center gap-1.5 border-l border-border px-3 text-sm font-medium text-muted-foreground">
									<span className="rounded-full border border-border bg-background p-1">

										<UserIcon/>
									</span>
									{customerName}
								</span>
							) : null}
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
						<Button
							variant="outline"
							disabled={isDraft || busy}
							onClick={() => setPaymentOpen(true)}
							className="border-primary text-primary bg-white"
						>

							{__('Record Payment', 'doublescale')}
							<RecordIcon width={24} height={24} />
						</Button>
						{showSubmitApproval ? (
							<Button
								variant="outline"
								onClick={() => void handleSubmitForApproval()}
								disabled={busy}
								className="border-primary text-primary bg-white"
							>
								{__('Submit for Approval', 'doublescale')}
							</Button>
						) : null}
						{showWithdraw ? (
							<Button
								variant="outline"
								onClick={() => void handleWithdrawApproval()}
								disabled={busy}
								className="border-primary text-primary bg-white"
							>
								{__('Withdraw Request', 'doublescale')}
							</Button>
						) : null}
						{showSend ? (
							<Button
								variant="outline"
								onClick={() => setSendOpen(true)}
								disabled={busy}
								className="border-primary text-primary bg-white"
							>

								{__('Send to Customer', 'doublescale')}
								<SendTestEmailIcon width={24} height={24} />
							</Button>
						) : null}
						<Button
							variant="outline"
							size="icon"
							className="h-10 w-10 shrink-0 border-primary bg-white"
							onClick={() => void handleDownloadPdf()}
							disabled={busy}
							aria-label={__('Download PDF', 'doublescale')}
						>
							<DownloadIcon width={24} height={24} />
						</Button>
						{invoice.public_url ? (
							<Button
								variant="outline"
								size="icon"
								className="h-10 w-10 shrink-0 border-primary bg-white"
								onClick={() => void handleCopyLink()}
								disabled={busy}
								aria-label={__('Copy Link', 'doublescale')}
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 20 20"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										opacity="0.4"
										d="M13.5 11.15H11.33C9.55 11.15 8.1 9.71 8.1 7.92V5.75C8.1 5.34 7.77 5 7.35 5H4.18C1.87 5 0 6.5 0 9.18V15.82C0 18.5 1.87 20 4.18 20H10.07C12.38 20 14.25 18.5 14.25 15.82V11.9C14.25 11.48 13.91 11.15 13.5 11.15Z"
										fill="#3A3A99"
									/>
									<path
										d="M15.8198 0H13.8498H12.7598H9.92977C7.66977 0 5.83977 1.44 5.75977 4.01C5.81977 4.01 5.86977 4 5.92977 4H8.75977H9.84977H11.8198C14.1298 4 15.9998 5.5 15.9998 8.18V10.15V12.86V14.83C15.9998 14.89 15.9898 14.94 15.9898 14.99C18.2198 14.92 19.9998 13.44 19.9998 10.83V8.86V6.15V4.18C19.9998 1.5 18.1298 0 15.8198 0Z"
										fill="#3A3A99"
									/>
									<path
										d="M9.98062 5.14975C9.67062 4.83975 9.14062 5.04975 9.14062 5.47975V8.09975C9.14062 9.19975 10.0706 10.0998 11.2106 10.0998C11.9206 10.1098 12.9106 10.1098 13.7606 10.1098C14.1906 10.1098 14.4106 9.60975 14.1106 9.30975C13.0206 8.21975 11.0806 6.26975 9.98062 5.14975Z"
										fill="#3A3A99"
									/>
								</svg>
							</Button>
						) : null}
						{canEdit ? (
							<Button
								variant="outline"
								size="icon"
								className="h-10 w-10 shrink-0 border-[#0D9DFC] bg-white text-[#0D9DFC] hover:bg-[#DBEAFE]"
								onClick={() =>
									navigate(getToLink(`sales/invoices/${invoice.id}/edit`))
								}
								aria-label={__('Edit', 'doublescale')}
							>
								<EditHeaderIcon color="#0D9DFC" width={24} height={24} />
							</Button>
						) : null}
						<Button
							variant="outline"
							size="icon"
							className="h-10 w-10 shrink-0 border-destructive bg-white text-destructive hover:bg-[#FEE2E2]"
							onClick={() => setDeleteOpen(true)}
							disabled={busy}
							aria-label={__('Delete', 'doublescale')}
						>
							<DeleteIcon width={24} height={24} />
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					<div className={cardClass}>
						<h2 className="mb-6 text-base font-semibold text-accent-foreground">
							{__('Bill To', 'doublescale')}
						</h2>
						<div className="text-sm font-medium text-muted-foreground space-y-6">
							{customerName ? <p>{customerName}</p> : null}

							{invoice.contact?.email ? <p>{invoice.contact.email}</p> : null}

						</div>
					</div>

					<div className={cardClass}>
						<h2 className="mb-6 text-base font-semibold text-accent-foreground">
							{__('Ship To', 'doublescale')}
						</h2>
						<div className="text-sm font-medium text-muted-foreground space-y-6">
							{customerName ? (
								<p>
									{customerName}
								</p>
							) : null}
							{invoice.contact?.email ? (
								<p>

									{invoice.contact.email}
								</p>
							) : null}

						</div>
					</div>

					<div className={cardClass}>
						<h2 className="mb-6 text-base font-semibold text-accent-foreground">
							{__('Details', 'doublescale')}
						</h2>
						<div className="space-y-6 text-sm text-muted-foreground">
							<div className=' flex flex-col sm:flex-row gap-4 justify-between items-center'>
							<InfoItem icon={<CalendarIcon width={18} height={18} />}>
								{__('Invoice Date', 'doublescale')}:{' '}
								{invoice.invoice_date || '—'}
							</InfoItem>
							<InfoItem icon={<CalendarIcon width={18} height={18} />}>
								{__('Due Date', 'doublescale')}: {invoice.due_date || '—'}
							</InfoItem>
							</div>
							<InfoItem icon={<DollerIcon width={18} height={18} />}>
								{__('Currency', 'doublescale')}: {invoice.currency}
							</InfoItem>
						</div>
					</div>
				</div>

				<div className={`${cardClass} space-y-6`}>
					<h2 className="text-base font-semibold text-accent-foreground">
						{__('Items', 'doublescale')}
					</h2>

					<div className="overflow-hidden rounded-lg border border-border bg-white">
						<Table>
							<TableHeader className="bg-[#F8F8F8]">
								<TableRow>
									<TableHead>{__('Item', 'doublescale')}</TableHead>
									<TableHead className="text-right">
										{__('Rate', 'doublescale')}
									</TableHead>
									<TableHead className="text-right">
										{__('Qty', 'doublescale')}
									</TableHead>
									<TableHead className="text-right">
										{__('Tax', 'doublescale')}
									</TableHead>
									<TableHead className="text-right">
										{__('Amount', 'doublescale')}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{lineItems.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="py-8 text-center text-muted-foreground"
										>
											{__('No line items.', 'doublescale')}
										</TableCell>
									</TableRow>
								) : (
									lineItems.map((item, index) => (
										<TableRow key={index}>
											<TableCell>
												<div className="font-medium">
													{item.description || '—'}
												</div>
												{item.long_description ? (
													<div className="text-sm text-muted-foreground">
														{item.long_description}
													</div>
												) : null}
											</TableCell>
											<TableCell className="text-right">
												{formatSalesAmount(item.rate, invoice.currency)}
											</TableCell>
											<TableCell className="text-right">{item.qty}</TableCell>
											<TableCell className="text-right">
												{formatSalesAmount(
													computeItemTax(item),
													invoice.currency
												)}
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatSalesAmount(
													computeAmount(item),
													invoice.currency
												)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					<TotalsSummaryCard
						subtotal={invoice.subtotal}
						total={invoice.total}
						amountPaid={invoice.amount_paid}
						balanceDue={balanceDue}
						currency={invoice.currency}
					/>
				</div>

				<div className={cardClass}>
					<PaymentsList
						invoice={invoice}
						payments={payments}
						loading={paymentsLoading}
						onDelete={handleDeletePayment}
					/>
				</div>

				{showOnlinePay ? (
					<div className={`${cardClass} space-y-4`}>
						<h2 className="text-base font-semibold text-accent-foreground">
							{__('Online Payment', 'doublescale')}
						</h2>
						{gatewaysLoading ? (
							<p className="text-sm text-muted-foreground">
								{__('Loading gateways…', 'doublescale')}
							</p>
						) : (
							payableGateways.map((gateway) => (
								<InvoiceOnlinePayment
									key={gateway.slug}
									invoice={invoice}
									gateway={gateway}
									onPaid={handleOnlinePaid}
								/>
							))
						)}
					</div>
				) : null}
			</div>

			<SendDocumentDialog
				open={sendOpen}
				onOpenChange={setSendOpen}
				title={__('Send Invoice', 'doublescale')}
				description={__(
					'Send this invoice to the customer by email? They will receive a link to view and pay online.',
					'doublescale'
				)}
				confirmLabel={__('Send', 'doublescale')}
				busy={busy}
				onConfirm={handleSend}
			/>

			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={__('Delete Invoice', 'doublescale')}
				description={__(
					'Are you sure you want to delete this invoice? This action cannot be undone.',
					'doublescale'
				)}
				confirmLabel={__('Delete', 'doublescale')}
				destructive
				busy={busy}
				onConfirm={handleDelete}
			/>

			<RecordPaymentDialog
				open={paymentOpen}
				onOpenChange={setPaymentOpen}
				invoice={invoice}
				busy={busy}
				onSubmit={handleRecordPayment}
			/>
		</div>
	);
};

export default InvoiceView;
