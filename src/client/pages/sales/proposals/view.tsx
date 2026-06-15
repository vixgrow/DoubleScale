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
} from '@/components/sales';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	addProposalComment,
	convertProposalToInvoice,
	deleteProposal,
	duplicateProposal,
	downloadProposalPdf,
	fetchProposalSignature,
	sendProposal,
	useProposal,
	useProposalComments,
} from '@/hooks/sales';
import type { ProposalSignature } from '@/types/sales';

const ProposalView: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const proposalId = params?.id ? Number(params.id) : null;

	const { data: proposal, loading, error, refetch } = useProposal(proposalId);
	const commentsEnabled = Boolean(proposal?.allow_comments);
	const {
		data: comments,
		loading: commentsLoading,
		refetch: refetchComments,
	} = useProposalComments(proposalId, commentsEnabled);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [convertOpen, setConvertOpen] = useState(false);
	const [sendOpen, setSendOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [signature, setSignature] = useState<ProposalSignature | null>(null);
	const [signatureLoading, setSignatureLoading] = useState(false);
	const [signatureError, setSignatureError] = useState<string | null>(null);
	const [replyContent, setReplyContent] = useState('');

	const handleReply = async () => {
		if (!proposalId || !replyContent.trim()) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await addProposalComment(proposalId, replyContent.trim());
			setReplyContent('');
			await refetchComments();
			setNotice(__('Reply posted.', 'doublescale'));
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('Reply failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

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
			if (commentsEnabled) {
				await refetchComments();
			}
			setNotice(__('Proposal sent to the customer.', 'doublescale'));
			setSendOpen(false);
		} catch (err: unknown) {
			setNotice(err instanceof Error ? err.message : __('Send failed.', 'doublescale'));
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
				err instanceof Error ? err.message : __('Convert to invoice failed.', 'doublescale')
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
	const showSend = proposal.status !== 'declined';
	const convertWarning =
		proposal.status !== 'accepted'
			? __('This will mark the proposal as Accepted.', 'doublescale')
			: __('Create a draft invoice from this proposal?', 'doublescale');

	return (
		<div className="p-6 space-y-6 max-w-5xl">
			{notice ? (
				<div className="text-sm rounded border px-3 py-2 bg-slate-50 text-slate-700">{notice}</div>
			) : null}
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
					{showSend ? (
						<Button variant="outline" onClick={() => setSendOpen(true)}>
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
					<Button
						variant="outline"
						onClick={() => navigate(getToLink(`sales/proposals/${proposal.id}/edit`))}
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

			{commentsEnabled ? (
				<div className="border rounded-lg bg-white p-6 space-y-4">
					<h2 className="font-medium">{__('Comments', 'doublescale')}</h2>
					{commentsLoading ? (
						<p className="text-sm text-muted-foreground">{__('Loading comments…', 'doublescale')}</p>
					) : comments.length > 0 ? (
						<ul className="space-y-3">
							{comments.map((comment) => (
								<li
									key={comment.id}
									className={`text-sm border rounded-lg p-3 ${
										comment.is_customer ? 'bg-slate-50' : 'bg-blue-50 border-blue-100'
									}`}
								>
									<div className="flex items-center gap-2">
										<span className="font-medium">{comment.author_name}</span>
										{comment.is_customer ? (
											<span className="text-xs text-muted-foreground">
												{__('Customer', 'doublescale')}
											</span>
										) : (
											<span className="text-xs text-blue-700">{__('Staff', 'doublescale')}</span>
										)}
									</div>
									<p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
									{comment.created_at ? (
										<div className="text-xs text-muted-foreground mt-2">{comment.created_at}</div>
									) : null}
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">
							{__('No comments yet.', 'doublescale')}
						</p>
					)}
					<div className="space-y-2 pt-2 border-t">
						<Label htmlFor="proposal-reply">{__('Reply to customer', 'doublescale')}</Label>
						<Textarea
							id="proposal-reply"
							value={replyContent}
							onChange={(e) => setReplyContent(e.target.value)}
							rows={3}
							placeholder={__('Write a reply visible on the public proposal…', 'doublescale')}
							disabled={busy}
						/>
						<div className="flex justify-end">
							<Button
								size="sm"
								disabled={busy || !replyContent.trim()}
								onClick={() => void handleReply()}
							>
								{__('Post Reply', 'doublescale')}
							</Button>
						</div>
					</div>
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
