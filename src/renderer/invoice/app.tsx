/**
 * Public invoice view with payment history and Stripe Pay Now.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Download } from 'lucide-react';

import { InvoiceDocumentPreview } from '@/components/sales/document-preview';
import { Button } from '@/components/ui/button';
import type { Invoice } from '@/types/sales';

import {
	confirmPublicInvoiceStripe,
	getPublicInvoicePdfUrl,
	initPublicInvoiceStripe,
	usePublicInvoice,
} from './public-api';
import type { PublicInvoice } from './types';

interface Props {
	hash: string;
}

const formatMoney = (value: number, currency: string) =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const StripePayForm: React.FC<{
	hash: string;
	onPaid: () => void;
}> = ({ hash, onPaid }) => {
	const stripe = useStripe();
	const elements = useElements();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handlePay = async () => {
		if (!stripe || !elements) {
			return;
		}
		setBusy(true);
		setError(null);
		const { error: stripeError } = await stripe.confirmPayment({
			elements,
			redirect: 'if_required',
		});
		if (stripeError) {
			setError(stripeError.message || __('Payment failed.', 'doublescale'));
			setBusy(false);
			return;
		}
		try {
			await confirmPublicInvoiceStripe(hash);
			onPaid();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : __('Payment confirmation failed.', 'doublescale'));
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="space-y-4">
			<PaymentElement />
			{error ? <div className="text-sm text-red-600">{error}</div> : null}
			<Button onClick={() => void handlePay()} disabled={busy || !stripe || !elements}>
				{busy ? __('Processing…', 'doublescale') : __('Pay Now', 'doublescale')}
			</Button>
		</div>
	);
};

const PublicStripePayment: React.FC<{
	hash: string;
	invoice: PublicInvoice;
	onPaid: () => void;
}> = ({ hash, invoice, onPaid }) => {
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [publishableKey, setPublishableKey] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const stripePromise = useMemo(
		() => (publishableKey ? loadStripe(publishableKey) : null),
		[publishableKey]
	);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		void initPublicInvoiceStripe(hash)
			.then((response) => {
				if (cancelled) {
					return;
				}
				if (response.already_paid && response.invoice) {
					onPaid();
					return;
				}
				setPublishableKey(response.publishable_key);
				setClientSecret(response.client_secret || null);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					const message =
						err instanceof Error ? err.message : __('Could not start Stripe payment.', 'doublescale');
					setError(message);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [hash, onPaid]);

	if (loading) {
		return (
			<div className="text-sm text-muted-foreground">{__('Loading payment options…', 'doublescale')}</div>
		);
	}

	if (error) {
		const isUnavailable = /stripe|pro|503|unavailable/i.test(error);
		return (
			<div
				className={`text-sm ${isUnavailable ? 'text-muted-foreground' : 'text-red-600'}`}
			>
				{isUnavailable
					? __('Online card payment is not available on this site. Please use another payment method.', 'doublescale')
					: error}
			</div>
		);
	}

	if (!clientSecret || !stripePromise) {
		return null;
	}

	return (
		<div className="space-y-3 rounded-lg border bg-slate-50 p-4">
			<div>
				<h4 className="font-medium">{__('Pay with card', 'doublescale')}</h4>
				<p className="text-sm text-muted-foreground">
					{__('Balance due:', 'doublescale')}{' '}
					{formatMoney(invoice.balance, invoice.currency)}
				</p>
			</div>
			<Elements stripe={stripePromise as Promise<Stripe | null>} options={{ clientSecret }}>
				<StripePayForm hash={hash} onPaid={onPaid} />
			</Elements>
		</div>
	);
};

const PublicInvoiceApp = ({ hash }: Props) => {
	const { data, loading, error, refetch } = usePublicInvoice(hash);

	if (loading) {
		return (
			<div className="doublescale-invoice-renderer">
				<p className="text-sm text-muted-foreground">{__('Loading invoice…', 'doublescale')}</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="doublescale-invoice-renderer">
				<div className="doublescale-invoice-renderer__notice doublescale-invoice-renderer__notice--error">
					{error || __('Invoice not found.', 'doublescale')}
				</div>
			</div>
		);
	}

	const previewInvoice = data as unknown as Invoice;
	const payments = data.payments ?? [];

	return (
		<div className="doublescale-invoice-renderer">
			{data.is_overdue ? (
				<div className="doublescale-invoice-renderer__notice doublescale-invoice-renderer__notice--warning">
					{__('This invoice is overdue.', 'doublescale')}
				</div>
			) : null}

			{data.status === 'paid' ? (
				<div className="doublescale-invoice-renderer__notice doublescale-invoice-renderer__notice--success">
					{__('This invoice has been paid in full. Thank you!', 'doublescale')}
				</div>
			) : null}

			<div className="doublescale-invoice-renderer__toolbar">
				<a
					className="doublescale-invoice-renderer__download"
					href={getPublicInvoicePdfUrl(hash)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Download className="h-4 w-4" />
					{__('Download PDF', 'doublescale')}
				</a>
			</div>

			<InvoiceDocumentPreview invoice={previewInvoice} />

			{payments.length > 0 ? (
				<div className="doublescale-invoice-renderer__payments">
					<h4 className="font-medium mb-2">{__('Payment History', 'doublescale')}</h4>
					<ul className="space-y-2 text-sm">
						{payments.map((payment, index) => (
							<li key={`${payment.payment_date}-${index}`} className="flex justify-between gap-4">
								<span className="text-muted-foreground">
									{payment.payment_date || '—'}
									{payment.payment_mode ? ` · ${payment.payment_mode}` : ''}
								</span>
								<span className="font-medium">
									{formatMoney(payment.amount, data.currency)}
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}

			{data.can_pay ? (
				<div className="doublescale-invoice-renderer__pay mt-6">
					<PublicStripePayment hash={hash} invoice={data} onPaid={refetch} />
				</div>
			) : null}
		</div>
	);
};

export default PublicInvoiceApp;
