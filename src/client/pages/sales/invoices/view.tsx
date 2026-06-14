/**
 * Invoice read-only detail view with payments.
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Copy, CreditCard, Download, Pencil, Send, Trash2 } from 'lucide-react';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import {
	ConfirmDialog,
	InvoiceDocumentPreview,
	InvoiceStripePayment,
	PaymentsList,
	RecordPaymentDialog,
} from '@/components/sales';
import {
	deleteInvoice,
	deleteInvoicePayment,
	downloadInvoicePdf,
	recordInvoicePayment,
	sendInvoice,
	useInvoice,
	useInvoicePayments,
	useSalesStripeStatus,
} from '@/hooks/sales';
import type { Invoice } from '@/types/sales';

const InvoiceView: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const invoiceId = params?.id ? Number(params.id) : null;

	const { data: fetched, loading, error, refetch } = useInvoice(invoiceId);
	const [invoice, setInvoice] = useState<Invoice | null>(null);
	const { data: payments, loading: paymentsLoading, refetch: refetchPayments } =
		useInvoicePayments(invoiceId);
	const { data: stripeStatus } = useSalesStripeStatus();

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

	const handleSend = async () => {
		if (!invoiceId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			const result = await sendInvoice(invoiceId);
			setInvoice(result.invoice);
			await refetch();
			setNotice(__('Invoice sent to the customer.', 'doublescale'));
			setSendOpen(false);
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('Send failed.', 'doublescale'));
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

	if (loading && !invoice) {
		return (
			<div className="p-6 text-muted-foreground">{__('Loading…', 'doublescale')}</div>
		);
	}

	if (error || !invoice) {
		return (
			<div className="p-6 space-y-4">
				<Button variant="ghost" onClick={() => navigate(getToLink('sales/invoices'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Back', 'doublescale')}
				</Button>
				<div className="text-red-600">{error || __('Invoice not found.', 'doublescale')}</div>
			</div>
		);
	}

	const isDraft = invoice.status === 'draft';
	const showSend = invoice.status !== 'paid';
	const balanceDue = Math.max(0, invoice.total - invoice.amount_paid);
	const allowedModes = invoice.allowed_payment_modes?.filter(Boolean) ?? [];
	const stripeAllowed =
		allowedModes.length === 0 || allowedModes.includes('stripe');
	const showStripePay =
		!isDraft &&
		balanceDue > 0 &&
		invoice.status !== 'paid' &&
		stripeAllowed &&
		stripeStatus?.available &&
		stripeStatus?.configured;

	const handleStripePaid = async (updated: Invoice) => {
		setInvoice(updated);
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

	return (
		<div className="p-6 space-y-6 max-w-5xl">
			{notice ? (
				<div className="text-sm rounded border px-3 py-2 bg-slate-50 text-slate-700">{notice}</div>
			) : null}
			<div className="flex items-center justify-between gap-4">
				<Button variant="ghost" onClick={() => navigate(getToLink('sales/invoices'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Invoices', 'doublescale')}
				</Button>
				<div className="flex flex-wrap gap-2 items-center">
					<Button variant="outline" onClick={() => void handleDownloadPdf()} disabled={busy}>
						<Download className="h-4 w-4 mr-1" />
						{__('Download PDF', 'doublescale')}
					</Button>
					{invoice.public_url ? (
						<Button variant="outline" onClick={() => void handleCopyLink()}>
							<Copy className="h-4 w-4 mr-1" />
							{__('Copy Link', 'doublescale')}
						</Button>
					) : null}
					{showSend ? (
						<Button variant="outline" onClick={() => setSendOpen(true)}>
							<Send className="h-4 w-4 mr-1" />
							{__('Send to Customer', 'doublescale')}
						</Button>
					) : null}
					{isDraft ? (
						<span className="text-xs text-muted-foreground mr-2">
							{__('Sending marks the invoice as Unpaid.', 'doublescale')}
						</span>
					) : null}
					<Button
						variant="outline"
						disabled={isDraft}
						onClick={() => setPaymentOpen(true)}
					>
						<CreditCard className="h-4 w-4 mr-1" />
						{__('Record Payment', 'doublescale')}
					</Button>
					<Button
						variant="outline"
						onClick={() => navigate(getToLink(`sales/invoices/${invoice.id}/edit`))}
					>
						<Pencil className="h-4 w-4 mr-1" />
						{__('Edit', 'doublescale')}
					</Button>
					<Button variant="destructive" onClick={() => setDeleteOpen(true)}>
						<Trash2 className="h-4 w-4 mr-1" />
						{__('Delete', 'doublescale')}
					</Button>
				</div>
			</div>

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

			<div className="border rounded-lg bg-white p-6">
				<InvoiceDocumentPreview invoice={invoice} />
			</div>

			{showStripePay ? (
				<div className="border rounded-lg bg-white p-6">
					<InvoiceStripePayment invoice={invoice} onPaid={handleStripePaid} />
				</div>
			) : null}

			<div className="border rounded-lg bg-white p-6">
				<PaymentsList
					invoice={invoice}
					payments={payments}
					loading={paymentsLoading}
					onDelete={handleDeletePayment}
				/>
			</div>

			<ConfirmDialog
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
