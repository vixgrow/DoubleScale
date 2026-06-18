/**
 * Public invoice view with payment history and online gateway checkout.
 */

import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Download } from 'lucide-react';

import { InvoiceDocumentPreview } from '@/components/sales/document-preview';
import { Button } from '@/components/ui/button';
import type { Invoice } from '@/types/sales';
import type { OnlinePaymentGatewayStatus } from '@/types/sales';

import {
	confirmPublicInvoicePayment,
	getPublicInvoicePdfUrl,
	initPublicInvoicePayment,
	usePublicInvoice,
} from './public-api';
import type { PublicInvoice } from './types';
import {
	clearStripeRedirectParams,
	getStripePaymentReturnUrl,
	getStripeRedirectStatus,
} from '@doublescale/utils/stripe-payment';

interface Props {
	hash: string;
}

const formatMoney = (value: number, currency: string) =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const StripePayForm: React.FC<{
	hash: string;
	gatewaySlug: string;
	onPaid: () => void;
}> = ({ hash, gatewaySlug, onPaid }) => {
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
			confirmParams: {
				return_url: getStripePaymentReturnUrl(),
			},
			redirect: 'if_required',
		});
		if (stripeError) {
			setError(stripeError.message || __('Payment failed.', 'doublescale'));
			setBusy(false);
			return;
		}
		try {
			await confirmPublicInvoicePayment(hash, gatewaySlug);
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

const PublicOnlinePayment: React.FC<{
	hash: string;
	invoice: PublicInvoice;
	gateway: OnlinePaymentGatewayStatus;
	onPaid: () => void;
}> = ({ hash, invoice, gateway, onPaid }) => {
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [publishableKey, setPublishableKey] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const onPaidRef = useRef(onPaid);

	useEffect(() => {
		onPaidRef.current = onPaid;
	}, [onPaid]);

	const stripePromise = useMemo(
		() => (gateway.slug === 'stripe' && publishableKey ? loadStripe(publishableKey) : null),
		[gateway.slug, publishableKey]
	);

	// After redirect-based methods (Cash App, etc.) Stripe sends the user back here.
	useEffect(() => {
		const redirectStatus = getStripeRedirectStatus();
		if (!redirectStatus) {
			return;
		}
		if (redirectStatus === 'failed') {
			setError(__('Payment was not completed. Please try again.', 'doublescale'));
			clearStripeRedirectParams();
			setLoading(false);
			return;
		}
		if (redirectStatus !== 'succeeded') {
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);
		void confirmPublicInvoicePayment(hash, gateway.slug)
			.then(() => {
				if (cancelled) {
					return;
				}
				clearStripeRedirectParams();
				onPaidRef.current();
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(
						err instanceof Error ? err.message : __('Payment confirmation failed.', 'doublescale')
					);
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
	}, [hash, gateway.slug]);

	useEffect(() => {
		if (getStripeRedirectStatus()) {
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError(null);
		void initPublicInvoicePayment(hash, gateway.slug)
			.then((response) => {
				if (cancelled) {
					return;
				}
				if (response.already_paid && response.invoice) {
					onPaidRef.current();
					return;
				}
				setPublishableKey(response.publishable_key);
				setClientSecret(response.client_secret || null);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					const message =
						err instanceof Error ? err.message : __('Could not start online payment.', 'doublescale');
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
	}, [hash, gateway.slug]);

	if (loading) {
		return (
			<div className="text-sm text-muted-foreground">{__('Loading payment options…', 'doublescale')}</div>
		);
	}

	if (error) {
		const isUnavailable = /unavailable|not configured|503/i.test(error);
		return (
			<div className={`text-sm ${isUnavailable ? 'text-muted-foreground' : 'text-red-600'}`}>
				{isUnavailable
					? __('Online payment is not available on this site. Please use another payment method.', 'doublescale')
					: error}
			</div>
		);
	}

	if (gateway.slug !== 'stripe' || !clientSecret || !stripePromise) {
		return null;
	}

	return (
		<div className="space-y-3 rounded-lg border bg-slate-50 p-4">
			<div>
				<h4 className="font-medium">{__('Pay with %s', 'doublescale').replace('%s', gateway.name)}</h4>
				<p className="text-sm text-muted-foreground">
					{__('Balance due:', 'doublescale')}{' '}
					{formatMoney(invoice.balance, invoice.currency)}
				</p>
			</div>
			<Elements stripe={stripePromise as Promise<Stripe | null>} options={{ clientSecret }}>
				<StripePayForm hash={hash} gatewaySlug={gateway.slug} onPaid={onPaid} />
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
	const payableGateways = (data.online_payment_gateways ?? []).filter((gateway) => gateway.can_pay);

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
					<div className="ds-sales-doc__section ds-sales-doc__payments">
						<h4 className="ds-sales-doc__section-title">
							{__('Payment History', 'doublescale')}
						</h4>
						<div className="ds-sales-doc__payments-table">
							<table>
								<thead>
									<tr>
										<th>{__('Date', 'doublescale')}</th>
										<th>{__('Method', 'doublescale')}</th>
										<th>{__('Amount', 'doublescale')}</th>
									</tr>
								</thead>
								<tbody>
									{payments.map((payment, index) => (
										<tr key={`${payment.payment_date}-${index}`}>
											<td>{payment.payment_date || '—'}</td>
											<td className="capitalize">
												{payment.payment_mode
													? payment.payment_mode.replace(/_/g, ' ')
													: '—'}
											</td>
											<td>{formatMoney(payment.amount, data.currency)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			) : null}

			{data.can_pay && payableGateways.length > 0 ? (
				<div className="doublescale-invoice-renderer__pay mt-6 space-y-4">
					{payableGateways.map((gateway) => (
						<PublicOnlinePayment
							key={gateway.slug}
							hash={hash}
							invoice={data}
							gateway={gateway}
							onPaid={refetch}
						/>
					))}
				</div>
			) : null}
		</div>
	);
};

export default PublicInvoiceApp;
