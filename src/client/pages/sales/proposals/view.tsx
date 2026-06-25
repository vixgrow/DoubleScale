/**
 * Proposal read-only detail view.
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Copy, Download, FileOutput, Files, Pencil, Send, Trash2 } from 'lucide-react';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import {
	ConfirmDialog,
	ProposalDocumentPreview,
	SendDocumentDialog,
	ApprovalStatusBanner,
} from '@/components/sales';
import {
	canEditSalesDocument,
	canSubmitForApproval,
	canWithdrawApproval,
	isApprovalWorkflowEnabled,
	showDirectSendAction,
	formatSalesRestError,
} from '@/components/sales/sales-approval-utils';
import {
	convertProposalToInvoice,
	deleteProposal,
	duplicateProposal,
	downloadProposalPdf,
	fetchProposalSignature,
	sendProposal,
	submitProposalForApproval,
	withdrawProposalApproval,
	useProposal,
	useSalesSettings,
} from '@/hooks/sales';
import type { ProposalSignature } from '@/types/sales';

const ProposalView: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const proposalId = params?.id ? Number(params.id) : null;

	const { data: proposal, loading, error, refetch } = useProposal(proposalId);
	const { data: salesSettings } = useSalesSettings();

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [convertOpen, setConvertOpen] = useState(false);
	const [sendOpen, setSendOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [signature, setSignature] = useState<ProposalSignature | null>(null);
	const [signatureLoading, setSignatureLoading] = useState(false);
	const [signatureError, setSignatureError] = useState<string | null>(null);

	useEffect(() => {
		if (!proposalId || !proposal?.has_signature) {
			setSignature(null);
			setSignatureError(null);
			return;
		}

		let cancelled = false;
		setSignatureLoading(true);
		setSignatureError(null);
		void fetchProposalSignature(proposalId)
			.then((data) => {
				if (!cancelled) {
					setSignature(data);
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setSignature(null);
					setSignatureError(
						err instanceof Error ? err.message : __('Failed to load signature.', 'doublescale')
					);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setSignatureLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [proposalId, proposal?.has_signature]);

	const handleDelete = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		try {
			await deleteProposal(proposalId);
			navigate(getToLink('sales/proposals'));
		} finally {
			setBusy(false);
		}
	};

	const handleSend = async (message: string) => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await sendProposal(proposalId, message);
			await refetch();
			setNotice(__('Proposal sent to the customer.', 'doublescale'));
			setSendOpen(false);
		} catch (err: unknown) {
			setNotice(
				formatSalesRestError(err, __('Send failed.', 'doublescale'), {
					approval_required: __(
						'This proposal must be approved before it can be sent. Submit it for approval first.',
						'doublescale'
					),
				})
			);
		} finally {
			setBusy(false);
		}
	};

	const handleSubmitForApproval = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await submitProposalForApproval(proposalId);
			await refetch();
			setNotice(__('Proposal submitted for approval.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(formatSalesRestError(err, __('Failed to submit for approval.', 'doublescale')));
		} finally {
			setBusy(false);
		}
	};

	const handleWithdrawApproval = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await withdrawProposalApproval(proposalId);
			await refetch();
			setNotice(__('Approval request withdrawn. You can edit and re-submit.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(formatSalesRestError(err, __('Failed to withdraw approval request.', 'doublescale')));
		} finally {
			setBusy(false);
		}
	};

	const handleCopyLink = async () => {
		if (!proposal?.public_url) {
			setNotice(
				__(
					'Add a WordPress page with the [doublescale_proposal] shortcode first.',
					'doublescale'
				)
			);
			return;
		}
		try {
			await navigator.clipboard.writeText(proposal.public_url);
			setNotice(__('Public link copied.', 'doublescale'));
		} catch {
			setNotice(proposal.public_url);
		}
	};

	const handleConvert = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			const result = await convertProposalToInvoice(proposalId);
			navigate(getToLink(`sales/invoices/${result.invoice.id}`));
		} catch (err: unknown) {
			setNotice(
				formatSalesRestError(err, __('Convert to invoice failed.', 'doublescale'), {
					approval_required: __(
						'This proposal must be approved before it can be converted to an invoice.',
						'doublescale'
					),
				})
			);
		} finally {
			setBusy(false);
			setConvertOpen(false);
		}
	};

	const handleDuplicate = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			const copy = await duplicateProposal(proposalId);
			navigate(getToLink(`sales/proposals/${copy.id}/edit`));
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('Duplicate failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	const handleDownloadPdf = async () => {
		if (!proposalId || !proposal) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await downloadProposalPdf(proposalId, proposal.proposal_number);
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('PDF download failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	if (loading) {
		return (
			<div className="p-6 text-muted-foreground">{__('Loading…', 'doublescale')}</div>
		);
	}

	if (error || !proposal) {
		return (
			<div className="p-6 space-y-4">
				<Button variant="ghost" onClick={() => navigate(getToLink('sales/proposals'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Back', 'doublescale')}
				</Button>
				<div className="text-red-600">{error || __('Proposal not found.', 'doublescale')}</div>
			</div>
		);
	}

	const showConvert = proposal.status !== 'declined' && !proposal.invoice_id;
	const workflowEnabled = isApprovalWorkflowEnabled(salesSettings, proposal);
	const showSend = showDirectSendAction(
		workflowEnabled,
		'proposal',
		proposal.status,
		proposal.approval,
		proposal.status === 'declined',
		proposal
	);
	const showSubmitApproval = canSubmitForApproval(
		workflowEnabled,
		'proposal',
		proposal.status,
		proposal.approval,
		proposal
	);
	const canEdit = canEditSalesDocument(workflowEnabled, proposal.approval, proposal);
	const showWithdraw = canWithdrawApproval(proposal);
	const convertWarning =
		proposal.status !== 'accepted'
			? __('This will mark the proposal as Accepted.', 'doublescale')
			: __('Create a draft invoice from this proposal?', 'doublescale');

	return (
		<div className="p-6 space-y-6 max-w-5xl">
			{notice ? (
				<div className="text-sm rounded border px-3 py-2 bg-slate-50 text-slate-700">{notice}</div>
			) : null}

			<ApprovalStatusBanner approval={proposal.approval} />

			<div className="flex items-center justify-between gap-4">
				<Button variant="ghost" onClick={() => navigate(getToLink('sales/proposals'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Proposals', 'doublescale')}
				</Button>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" onClick={() => void handleDownloadPdf()} disabled={busy}>
						<Download className="h-4 w-4 mr-1" />
						{__('Download PDF', 'doublescale')}
					</Button>
					<Button variant="outline" onClick={() => void handleDuplicate()} disabled={busy}>
						<Files className="h-4 w-4 mr-1" />
						{__('Duplicate', 'doublescale')}
					</Button>
					{proposal.public_url ? (
						<Button variant="outline" onClick={() => void handleCopyLink()}>
							<Copy className="h-4 w-4 mr-1" />
							{__('Copy Link', 'doublescale')}
						</Button>
					) : null}
					{showSubmitApproval ? (
						<Button onClick={() => void handleSubmitForApproval()} disabled={busy}>
							{__('Submit for Approval', 'doublescale')}
						</Button>
					) : null}
					{showWithdraw ? (
						<Button variant="outline" onClick={() => void handleWithdrawApproval()} disabled={busy}>
							{__('Withdraw Request', 'doublescale')}
						</Button>
					) : null}
					{showSend ? (
						<Button onClick={() => setSendOpen(true)}>
							<Send className="h-4 w-4 mr-1" />
							{__('Send to Customer', 'doublescale')}
						</Button>
					) : null}
					{proposal.invoice_id ? (
						<Button
							variant="outline"
							onClick={() =>
								navigate(getToLink(`sales/invoices/${proposal.invoice_id}`))
							}
						>
							<FileOutput className="h-4 w-4 mr-1" />
							{__('View Invoice', 'doublescale')}
						</Button>
					) : showConvert ? (
						<Button variant="outline" onClick={() => setConvertOpen(true)}>
							<FileOutput className="h-4 w-4 mr-1" />
							{__('Convert to Invoice', 'doublescale')}
						</Button>
					) : null}
					{canEdit ? (
						<Button
							variant="outline"
							onClick={() => navigate(getToLink(`sales/proposals/${proposal.id}/edit`))}
						>
							<Pencil className="h-4 w-4 mr-1" />
							{__('Edit', 'doublescale')}
						</Button>
					) : null}
					<Button variant="destructive" onClick={() => setDeleteOpen(true)}>
						<Trash2 className="h-4 w-4 mr-1" />
						{__('Delete', 'doublescale')}
					</Button>
				</div>
			</div>

			<div className="border rounded-lg bg-white p-6">
				<ProposalDocumentPreview proposal={proposal} />
			</div>

			{proposal.has_signature || proposal.signed_name ? (
				<div className="border rounded-lg bg-white p-6 space-y-3">
					<h2 className="font-medium">{__('Signature', 'doublescale')}</h2>
					{proposal.signed_name ? (
						<p className="text-sm">
							<span className="text-muted-foreground">{__('Signed by', 'doublescale')}: </span>
							<span className="font-medium">{proposal.signed_name}</span>
						</p>
					) : null}
					{proposal.accepted_at ? (
						<p className="text-sm text-muted-foreground">
							{__('Accepted at', 'doublescale')}: {proposal.accepted_at}
						</p>
					) : null}
					{signatureLoading ? (
						<p className="text-sm text-muted-foreground">{__('Loading signature…', 'doublescale')}</p>
					) : signatureError ? (
						<p className="text-sm text-red-600">{signatureError}</p>
					) : signature?.signature ? (
						<div className="rounded border bg-slate-50 p-4 inline-block max-w-full">
							<img
								src={signature.signature}
								alt={__('Customer signature', 'doublescale')}
								className="max-h-40 max-w-full"
							/>
						</div>
					) : proposal.has_signature ? (
						<p className="text-sm text-muted-foreground">
							{__('Signature on file.', 'doublescale')}
						</p>
					) : null}
				</div>
			) : null}

			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={__('Delete Proposal', 'doublescale')}
				description={__(
					'Are you sure you want to delete this proposal? This action cannot be undone.',
					'doublescale'
				)}
				confirmLabel={__('Delete', 'doublescale')}
				destructive
				busy={busy}
				onConfirm={handleDelete}
			/>

			<SendDocumentDialog
				open={sendOpen}
				onOpenChange={setSendOpen}
				title={__('Send Proposal', 'doublescale')}
				description={__(
					'Send this proposal to the customer by email? They will receive a link to view, accept, or decline.',
					'doublescale'
				)}
				confirmLabel={__('Send', 'doublescale')}
				busy={busy}
				onConfirm={handleSend}
			/>

			<ConfirmDialog
				open={convertOpen}
				onOpenChange={setConvertOpen}
				title={__('Convert to Invoice', 'doublescale')}
				description={convertWarning}
				confirmLabel={__('Convert', 'doublescale')}
				busy={busy}
				onConfirm={handleConvert}
			/>
		</div>
	);
};

export default ProposalView;
