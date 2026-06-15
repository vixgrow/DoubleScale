/**
 * Contract read-only detail view.
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Copy, Download, Pencil, Send, Trash2 } from 'lucide-react';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import {
	ConfirmDialog,
	ContractStatusPill,
	SendDocumentDialog,
} from '@/components/sales';
import {
	deleteContract,
	downloadContractPdf,
	fetchContractSignature,
	sendContract,
	useContract,
	formatRestError,
} from '@/hooks/sales';
import type { ContractSignature } from '@/types/sales';
import { CONTRACT_STATUS_LABELS } from '@/constants/sales';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const contactName = (contract: NonNullable<ReturnType<typeof useContract>['data']>): string => {
	const c = contract.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

const ContractView: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const contractId = params?.id ? Number(params.id) : null;

	const { data: contract, loading, error, refetch } = useContract(contractId);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [sendOpen, setSendOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [signature, setSignature] = useState<ContractSignature | null>(null);
	const [signatureLoading, setSignatureLoading] = useState(false);
	const [signatureError, setSignatureError] = useState<string | null>(null);

	useEffect(() => {
		if (!contractId || !contract?.has_signature) {
			setSignature(null);
			setSignatureError(null);
			return;
		}

		let cancelled = false;
		setSignatureLoading(true);
		setSignatureError(null);
		void fetchContractSignature(contractId)
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
	}, [contractId, contract?.has_signature]);

	const handleDelete = async () => {
		if (!contractId) {
			return;
		}
		setBusy(true);
		try {
			await deleteContract(contractId);
			navigate(getToLink('sales/contracts'));
		} finally {
			setBusy(false);
		}
	};

	const handleSend = async (message: string) => {
		if (!contractId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await sendContract(contractId, message);
			await refetch();
			setNotice(__('Contract sent to the customer.', 'doublescale'));
			setSendOpen(false);
		} catch (err: unknown) {
			setNotice(formatRestError(err));
		} finally {
			setBusy(false);
		}
	};

	const handleCopyLink = async () => {
		if (!contract?.public_url) {
			setNotice(
				__(
					'Add a WordPress page with the [doublescale_contract] shortcode first.',
					'doublescale'
				)
			);
			return;
		}
		try {
			await navigator.clipboard.writeText(contract.public_url);
			setNotice(__('Public link copied.', 'doublescale'));
		} catch {
			setNotice(contract.public_url);
		}
	};

	const handleDownloadPdf = async () => {
		if (!contractId || !contract) {
			return;
		}
		setBusy(true);
		setNotice(null);
		try {
			await downloadContractPdf(contractId, contract.contract_number);
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

	if (error || !contract) {
		return (
			<div className="p-6 space-y-4">
				<Button variant="ghost" onClick={() => navigate(getToLink('sales/contracts'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Back', 'doublescale')}
				</Button>
				<div className="text-red-600">{error || __('Contract not found.', 'doublescale')}</div>
			</div>
		);
	}

	const showSend = contract.status !== 'expired';

	return (
		<div className="p-6 space-y-6 max-w-5xl">
			{notice ? (
				<div className="text-sm rounded border px-3 py-2 bg-slate-50 text-slate-700">{notice}</div>
			) : null}
			<div className="flex items-center justify-between gap-4">
				<Button variant="ghost" onClick={() => navigate(getToLink('sales/contracts'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Contracts', 'doublescale')}
				</Button>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" onClick={() => void handleDownloadPdf()} disabled={busy}>
						<Download className="h-4 w-4 mr-1" />
						{__('Download PDF', 'doublescale')}
					</Button>
					{contract.public_url ? (
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
					<Button
						variant="outline"
						onClick={() => navigate(getToLink(`sales/contracts/${contract.id}/edit`))}
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

			<div className="border rounded-lg bg-white p-6 space-y-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<div className="text-sm text-muted-foreground">{contract.contract_number}</div>
						<h1 className="text-2xl font-semibold mt-1">{contract.subject}</h1>
					</div>
					<ContractStatusPill
						status={contract.status}
						expired={contract.is_expired}
						aboutToExpire={contract.is_about_to_expire}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<div className="text-muted-foreground">{__('Customer', 'doublescale')}</div>
						<div className="font-medium">{contactName(contract)}</div>
					</div>
					<div>
						<div className="text-muted-foreground">{__('Contract Type', 'doublescale')}</div>
						<div className="font-medium">{contract.contract_type?.name || '—'}</div>
					</div>
					<div>
						<div className="text-muted-foreground">{__('Value', 'doublescale')}</div>
						<div className="font-medium">
							{formatMoney(contract.contract_value, contract.currency)}
						</div>
					</div>
					<div>
						<div className="text-muted-foreground">{__('Status', 'doublescale')}</div>
						<div className="font-medium">
							{CONTRACT_STATUS_LABELS[contract.status] || contract.status}
						</div>
					</div>
					<div>
						<div className="text-muted-foreground">{__('Start Date', 'doublescale')}</div>
						<div className="font-medium">{contract.start_date || '—'}</div>
					</div>
					<div>
						<div className="text-muted-foreground">{__('End Date', 'doublescale')}</div>
						<div className="font-medium">{contract.end_date || '—'}</div>
					</div>
					{contract.sent_at ? (
						<div>
							<div className="text-muted-foreground">{__('Sent', 'doublescale')}</div>
							<div className="font-medium">{contract.sent_at}</div>
						</div>
					) : null}
					{contract.viewed_at ? (
						<div>
							<div className="text-muted-foreground">{__('Viewed', 'doublescale')}</div>
							<div className="font-medium">{contract.viewed_at}</div>
						</div>
					) : null}
				</div>

				{contract.description ? (
					<div className="border-t pt-6">
						<h2 className="font-medium mb-3">{__('Contract Body', 'doublescale')}</h2>
						<div
							className="prose prose-sm max-w-none"
							// eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={{ __html: contract.description }}
						/>
					</div>
				) : null}
			</div>

			{contract.has_signature || contract.signed_name ? (
				<div className="border rounded-lg bg-white p-6 space-y-3">
					<h2 className="font-medium">{__('Signature', 'doublescale')}</h2>
					{contract.signed_name ? (
						<p className="text-sm">
							<span className="text-muted-foreground">{__('Signed by', 'doublescale')}: </span>
							<span className="font-medium">{contract.signed_name}</span>
						</p>
					) : null}
					{contract.signed_at ? (
						<p className="text-sm text-muted-foreground">
							{__('Signed at', 'doublescale')}: {contract.signed_at}
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
					) : contract.has_signature ? (
						<p className="text-sm text-muted-foreground">
							{__('Signature on file.', 'doublescale')}
						</p>
					) : null}
				</div>
			) : null}

			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={__('Delete Contract', 'doublescale')}
				description={__(
					'Are you sure you want to delete this contract? This action cannot be undone.',
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
				title={__('Send Contract', 'doublescale')}
				description={__(
					'Send this contract to the customer by email? They will receive a link to view and sign.',
					'doublescale'
				)}
				confirmLabel={__('Send', 'doublescale')}
				busy={busy}
				onConfirm={handleSend}
			/>
		</div>
	);
};

export default ContractView;
