/**
 * Public proposal view with accept / decline actions.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Check, Download, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProposalDocumentPreview } from '@/components/sales/document-preview';
import type { Proposal } from '@/types/sales';

import {
	acceptPublicProposal,
	declinePublicProposal,
	getPublicProposalPdfUrl,
	usePublicProposal,
} from './public-api';
import { SignaturePad } from './signature-pad';

interface Props {
	hash: string;
	/** When true (portal embed), hide the local Download PDF toolbar. */
	embedded?: boolean;
}

const PublicProposalApp = ({ hash, embedded = false }: Props) => {
	const { data, loading, error, refetch } = usePublicProposal(hash);

	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [showDecline, setShowDecline] = useState(false);
	const [showAccept, setShowAccept] = useState(false);
	const [declineReason, setDeclineReason] = useState('');
	const [signedName, setSignedName] = useState('');
	const [signature, setSignature] = useState('');
	const [agreedTerms, setAgreedTerms] = useState(false);

	const hasTerms = Boolean(
		data?.terms && data.terms.replace(/<[^>]*>/g, '').trim()
	);

	const handleAccept = async () => {
		if (hasTerms && !agreedTerms) {
			setActionError(
				__(
					'Please agree to the Terms & Conditions before accepting.',
					'doublescale'
				)
			);
			return;
		}

		if (data?.require_signature && (!signedName.trim() || !signature)) {
			setActionError(
				__('Please enter your name and sign to accept this proposal.', 'doublescale')
			);
			return;
		}

		setBusy(true);
		setActionError(null);
		try {
			await acceptPublicProposal(hash, {
				signed_name: signedName.trim(),
				signature,
				agreed_terms: hasTerms ? agreedTerms : undefined,
			});
			setShowAccept(false);
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
	const signatureLocked = hasTerms && !agreedTerms;
	const canConfirmAccept =
		!busy && (!hasTerms || agreedTerms) &&
		(!data.require_signature || (signedName.trim() && signature));

	return (
		<div
			className={`doublescale-proposal-renderer${
				embedded ? ' doublescale-proposal-renderer--embedded' : ''
			}`}
		>
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
					{data.signed_name ? (
						<p className="mt-2 text-muted-foreground">
							{__('Signed by', 'doublescale')}: {data.signed_name}
						</p>
					) : null}
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

			{!embedded ? (
				<div className="doublescale-proposal-renderer__toolbar">
					<a
						className="doublescale-proposal-renderer__download"
						href={getPublicProposalPdfUrl(hash)}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Download className="h-4 w-4" />
						{__('Download PDF', 'doublescale')}
					</a>
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
							variant="secondaryDeepBlue"
							onClick={() => {
								setShowDecline((v) => !v);
								setShowAccept(false);
							}}
							disabled={busy}
						>
							<X className="h-4 w-4 mr-1" />
							{__('Decline', 'doublescale')}
						</Button>
					) : null}
					{data.can_accept ? (
						<Button
							onClick={() => {
								setShowAccept((v) => !v);
								setShowDecline(false);
								setSignedName(data.to_name || '');
								setAgreedTerms(false);
							}}
							disabled={busy}
						>
							<Check className="h-4 w-4 mr-1" />
							{busy ? __('Processing…', 'doublescale') : __('Accept', 'doublescale')}
						</Button>
					) : null}
				</div>
			) : null}

			{showAccept ? (
				<div className="doublescale-proposal-renderer__accept">
					{hasTerms ? (
						<label className="flex items-start gap-3 mb-4 cursor-pointer">
							<input
								type="checkbox"
								className="mt-1"
								checked={agreedTerms}
								onChange={(e) => setAgreedTerms(e.target.checked)}
								disabled={busy}
							/>
							<span className="text-sm">
								{__(
									'I have read and agree to the Terms & Conditions.',
									'doublescale'
								)}
							</span>
						</label>
					) : null}
					{data.require_signature ? (
						<>
							<label className="text-sm font-medium block mb-2" htmlFor="signed-name">
								{__('Your name', 'doublescale')}
							</label>
							<Input
								id="signed-name"
								value={signedName}
								onChange={(e) => setSignedName(e.target.value)}
								className="mb-4"
								disabled={busy || signatureLocked}
							/>
							<label className="text-sm font-medium block mb-2">
								{__('Signature', 'doublescale')}
							</label>
							<SignaturePad
								onChange={setSignature}
								disabled={busy || signatureLocked}
							/>
						</>
					) : (
						<p className="text-sm text-muted-foreground mb-4">
							{__('Confirm that you accept this proposal.', 'doublescale')}
						</p>
					)}
					<div className="flex justify-end gap-2 mt-4">
						<Button variant="secondaryDeepBlue" onClick={() => setShowAccept(false)} disabled={busy}>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button onClick={() => void handleAccept()} disabled={!canConfirmAccept}>
							{__('Confirm Accept', 'doublescale')}
						</Button>
					</div>
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
						<Button variant="secondaryDeepBlue" onClick={() => setShowDecline(false)} disabled={busy}>
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
