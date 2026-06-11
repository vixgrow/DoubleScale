/**
 * Public proposal view with accept / decline actions.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ProposalDocumentPreview } from '@/components/sales/document-preview';
import type { Proposal } from '@/types/sales';

import {
	acceptPublicProposal,
	declinePublicProposal,
	usePublicProposal,
} from './public-api';

interface Props {
	hash: string;
}

const PublicProposalApp = ({ hash }: Props) => {
	const { data, loading, error, refetch } = usePublicProposal(hash);
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [showDecline, setShowDecline] = useState(false);
	const [declineReason, setDeclineReason] = useState('');

	const handleAccept = async () => {
		setBusy(true);
		setActionError(null);
		try {
			await acceptPublicProposal(hash);
			refetch();
		} catch (err) {
			setActionError(err instanceof Error ? err.message : __('Accept failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	const handleDecline = async () => {
		setBusy(true);
		setActionError(null);
		try {
			await declinePublicProposal(hash, declineReason.trim());
			setShowDecline(false);
			refetch();
		} catch (err) {
			setActionError(err instanceof Error ? err.message : __('Decline failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	if (loading) {
		return (
			<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<p className="text-sm text-muted-foreground">{__('Loading proposal…', 'doublescale')}</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					{error || __('Proposal not found.', 'doublescale')}
				</div>
			</div>
		);
	}

	const previewProposal = data as unknown as Proposal;
	const showActions = data.can_accept || data.can_decline;

	return (
		<div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
			{data.is_expired ? (
				<div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
					{__('This proposal has expired.', 'doublescale')}
				</div>
			) : null}

			{data.status === 'accepted' ? (
				<div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
					{__('You accepted this proposal. Thank you!', 'doublescale')}
				</div>
			) : null}

			{data.status === 'declined' ? (
				<div className="rounded border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800">
					{__('You declined this proposal.', 'doublescale')}
					{data.decline_reason ? (
						<p className="mt-2 text-muted-foreground">{data.decline_reason}</p>
					) : null}
				</div>
			) : null}

			<ProposalDocumentPreview proposal={previewProposal} />

			{actionError ? (
				<div className="text-sm text-destructive">{actionError}</div>
			) : null}

			{showActions ? (
				<div className="flex flex-wrap gap-2 justify-end border-t pt-4">
					{data.can_decline ? (
						<Button
							variant="outline"
							onClick={() => setShowDecline((v) => !v)}
							disabled={busy}
						>
							<X className="h-4 w-4 mr-1" />
							{__('Decline', 'doublescale')}
						</Button>
					) : null}
					{data.can_accept ? (
						<Button onClick={() => void handleAccept()} disabled={busy}>
							<Check className="h-4 w-4 mr-1" />
							{busy ? __('Processing…', 'doublescale') : __('Accept', 'doublescale')}
						</Button>
					) : null}
				</div>
			) : null}

			{showDecline ? (
				<div className="space-y-3 border rounded-lg p-4 bg-slate-50">
					<label className="text-sm font-medium" htmlFor="decline-reason">
						{__('Reason for declining (optional)', 'doublescale')}
					</label>
					<Textarea
						id="decline-reason"
						value={declineReason}
						onChange={(e) => setDeclineReason(e.target.value)}
						rows={3}
					/>
					<div className="flex justify-end gap-2">
						<Button variant="ghost" onClick={() => setShowDecline(false)} disabled={busy}>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button variant="destructive" onClick={() => void handleDecline()} disabled={busy}>
							{__('Confirm Decline', 'doublescale')}
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default PublicProposalApp;
