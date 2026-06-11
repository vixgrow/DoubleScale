/**
 * Proposal read-only detail view.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Copy, FileOutput, Pencil, Send, Trash2 } from 'lucide-react';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import {
	ConfirmDialog,
	ProposalDocumentPreview,
} from '@/components/sales';
import {
	convertProposalToInvoice,
	deleteProposal,
	sendProposal,
	useProposal,
} from '@/hooks/sales';

const ProposalView: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const proposalId = params?.id ? Number(params.id) : null;

	const { data: proposal, loading, error, refetch } = useProposal(proposalId);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [convertOpen, setConvertOpen] = useState(false);
	const [sendOpen, setSendOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

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

	const handleSend = async () => {
		if (!proposalId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await sendProposal(proposalId);
			await refetch();
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

			<ConfirmDialog
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
