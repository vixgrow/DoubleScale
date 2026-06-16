/**
 * Public contract view with e-sign action.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Download, PenLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
	getPublicContractPdfUrl,
	signPublicContract,
	usePublicContract,
} from './public-api';
import { SignaturePad } from './signature-pad';

interface Props {
	hash: string;
}

const formatMoney = (value: number, currency: string) =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const PublicContractApp = ({ hash }: Props) => {
	const { data, loading, error, refetch } = usePublicContract(hash);

	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [showSign, setShowSign] = useState(false);
	const [signedName, setSignedName] = useState('');
	const [signature, setSignature] = useState('');

	const handleSign = async () => {
		if (data?.require_signature && (!signedName.trim() || !signature)) {
			setActionError(
				__('Please enter your name and sign to accept this contract.', 'doublescale')
			);
			return;
		}

		setBusy(true);
		setActionError(null);
		try {
			await signPublicContract(hash, {
				signed_name: signedName.trim(),
				signature,
			});
			setShowSign(false);
			refetch();
		} catch (err) {
			setActionError(err instanceof Error ? err.message : __('Sign failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	if (loading) {
		return (
			<div className="doublescale-contract-renderer">
				<p className="text-sm text-muted-foreground">{__('Loading contract…', 'doublescale')}</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="doublescale-contract-renderer">
				<div className="doublescale-contract-renderer__notice doublescale-contract-renderer__notice--error">
					{error || __('Contract not found.', 'doublescale')}
				</div>
			</div>
		);
	}

	return (
		<div className="doublescale-contract-renderer">
			{data.is_expired ? (
				<div className="doublescale-contract-renderer__notice doublescale-contract-renderer__notice--warning">
					{__('This contract has expired.', 'doublescale')}
				</div>
			) : null}

			{data.status === 'signed' ? (
				<div className="doublescale-contract-renderer__notice doublescale-contract-renderer__notice--success">
					{__('You signed this contract. Thank you!', 'doublescale')}
					{data.signed_name ? (
						<p className="mt-2 text-muted-foreground">
							{__('Signed by', 'doublescale')}: {data.signed_name}
						</p>
					) : null}
				</div>
			) : null}

			<div className="doublescale-contract-renderer__toolbar">
				<a
					className="doublescale-contract-renderer__download"
					href={getPublicContractPdfUrl(hash)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Download className="h-4 w-4" />
					{__('Download PDF', 'doublescale')}
				</a>
			</div>

			<div className="space-y-4">
				<div>
					<div className="text-sm text-muted-foreground">{data.contract_number}</div>
					<h1 className="text-2xl font-semibold mt-1">{data.subject}</h1>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
					<div>
						<div className="text-muted-foreground">{__('Value', 'doublescale')}</div>
						<div className="font-medium">
							{formatMoney(data.contract_value, data.currency)}
						</div>
					</div>
					{data.contract_type ? (
						<div>
							<div className="text-muted-foreground">{__('Type', 'doublescale')}</div>
							<div className="font-medium">{data.contract_type.name}</div>
						</div>
					) : null}
					{data.start_date ? (
						<div>
							<div className="text-muted-foreground">{__('Start', 'doublescale')}</div>
							<div className="font-medium">{data.start_date}</div>
						</div>
					) : null}
					{data.end_date ? (
						<div>
							<div className="text-muted-foreground">{__('End', 'doublescale')}</div>
							<div className="font-medium">{data.end_date}</div>
						</div>
					) : null}
				</div>

				{data.description ? (
					<div
						className="prose prose-sm max-w-none border-t pt-4"
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{ __html: data.description }}
					/>
				) : null}
			</div>

			{actionError ? (
				<div className="doublescale-contract-renderer__notice doublescale-contract-renderer__notice--error mt-4">
					{actionError}
				</div>
			) : null}

			{data.can_sign ? (
				<div className="doublescale-contract-renderer__actions">
					<Button
						onClick={() => {
							setShowSign((v) => !v);
							setSignedName('');
						}}
						disabled={busy}
					>
						<PenLine className="h-4 w-4 mr-1" />
						{busy ? __('Processing…', 'doublescale') : __('Sign Contract', 'doublescale')}
					</Button>
				</div>
			) : null}

			{showSign ? (
				<div className="doublescale-contract-renderer__sign">
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
							/>
							<label className="text-sm font-medium block mb-2">
								{__('Signature', 'doublescale')}
							</label>
							<SignaturePad onChange={setSignature} disabled={busy} />
						</>
					) : (
						<p className="text-sm text-muted-foreground mb-4">
							{__('Confirm that you sign this contract.', 'doublescale')}
						</p>
					)}
					<div className="flex justify-end gap-2 mt-4">
						<Button variant="ghost" onClick={() => setShowSign(false)} disabled={busy}>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button onClick={() => void handleSign()} disabled={busy}>
							{__('Confirm Sign', 'doublescale')}
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default PublicContractApp;
