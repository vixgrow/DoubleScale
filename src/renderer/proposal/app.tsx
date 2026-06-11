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
			<div className="doublescale-proposal-renderer">
				<p className="text-sm text-muted-foreground">{__('Loading proposal…', 'doublescale')}</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="doublescale-proposal-renderer">
				<div className="doublescale-proposal-renderer__notice doublescale-proposal-renderer__notice--error">
					{error || __('Proposal not found.', 'doublescale')}
				</div>
			</div>
		);
	}

	const previewProposal = data as unknown as Proposal;
	const showActions = data.can_accept || data.can_decline;

	return (
		<div className="doublescale-proposal-renderer">
			{data.is_expired ? (
				<div className="doublescale-proposal-renderer__notice doublescale-proposal-renderer__notice--warning">
					{__('This proposal has expired.', 'doublescale')}
				</div>
			) : null}

			{data.status === 'accepted' ? (
				<div className="doublescale-proposal-renderer__notice doublescale-proposal-renderer__notice--success">
					{data.invoice_id
						? __(
								'You accepted this proposal. A draft invoice has been created. Thank you!',
								'doublescale'
							)
						: __('You accepted this proposal. Thank you!', 'doublescale')}
				</div>
			) : null}

			{data.status === 'declined' ? (
				<div className="doublescale-proposal-renderer__notice doublescale-proposal-renderer__notice--info">
					{__('You declined this proposal.', 'doublescale')}
					{data.decline_reason ? (
						<p className="mt-2 text-muted-foreground">{data.decline_reason}</p>
					) : null}
				</div>
			) : null}

			<ProposalDocumentPreview proposal={previewProposal} />

			{actionError ? (
				<div className="doublescale-proposal-renderer__notice doublescale-proposal-renderer__notice--error mt-4">
					{actionError}
				</div>
			) : null}

			{showActions ? (
				<div className="doublescale-proposal-renderer__actions">
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
				<div className="doublescale-proposal-renderer__decline">
					<label className="text-sm font-medium block mb-2" htmlFor="decline-reason">
						{__('Reason for declining (optional)', 'doublescale')}
					</label>
					<Textarea
						id="decline-reason"
						value={declineReason}
						onChange={(e) => setDeclineReason(e.target.value)}
						rows={3}
					/>
					<div className="flex justify-end gap-2 mt-3">
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
