/**
 * Online payment UI for an invoice (Stripe + PayPal).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';

import { Button } from '@/components/ui/button';
import { PayPalPayButtons } from '@/components/sales/paypal-pay-buttons';
import {
	confirmInvoiceOnlinePayment,
	initInvoiceOnlinePayment,
} from '@/hooks/sales';
import type { Invoice, OnlinePaymentGatewayStatus } from '@/types/sales';
import {
	clearStripeRedirectParams,
	getStripePaymentReturnUrl,
	getStripeRedirectStatus,
} from '@doublescale/utils/stripe-payment';

interface InvoiceOnlinePaymentProps {
	invoice: Invoice;
	gateway: OnlinePaymentGatewayStatus;
	onPaid: (invoice: Invoice) => void;
}

const formatMoney = (value: number, currency: string) =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const StripePayForm: React.FC<{
	invoiceId: number;
	gatewaySlug: string;
	onPaid: (invoice: Invoice) => void;
}> = ({ invoiceId, gatewaySlug, onPaid }) => {
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
			const result = await confirmInvoiceOnlinePayment(invoiceId, gatewaySlug);
			onPaid(result.invoice);
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

export const InvoiceOnlinePayment: React.FC<InvoiceOnlinePaymentProps> = ({
	invoice,
	gateway,
	onPaid,
}) => {
	const balanceDue = Math.max(0, invoice.total - invoice.amount_paid);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [publishableKey, setPublishableKey] = useState<string | null>(null);
	const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
	const [paypalBusy, setPaypalBusy] = useState(false);
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
		void confirmInvoiceOnlinePayment(invoice.id, gateway.slug)
			.then((result) => {
				if (cancelled) {
					return;
				}
				clearStripeRedirectParams();
				if (result.invoice) {
					onPaidRef.current(result.invoice);
				}
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
	}, [invoice.id, gateway.slug]);

	useEffect(() => {
		if (getStripeRedirectStatus()) {
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError(null);
		void initInvoiceOnlinePayment(invoice.id, gateway.slug)
			.then((response) => {
				if (cancelled) {
					return;
				}
				if (response.already_paid && response.invoice) {
					onPaidRef.current(response.invoice);
					return;
				}
				if (gateway.slug === 'paypal') {
					setPaypalClientId(response.client_id || null);
					return;
				}
				setPublishableKey(response.publishable_key);
				setClientSecret(response.client_secret || null);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(
						err instanceof Error ? err.message : __('Could not start online payment.', 'doublescale')
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
	}, [invoice.id, gateway.slug]);

	const handlePayPalApprove = useCallback(async () => {
		setPaypalBusy(true);
		setError(null);
		try {
			const result = await confirmInvoiceOnlinePayment(invoice.id, gateway.slug);
			if (result.invoice) {
				onPaidRef.current(result.invoice);
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : __('Payment confirmation failed.', 'doublescale'));
			throw err;
		} finally {
			setPaypalBusy(false);
		}
	}, [invoice.id, gateway.slug]);

	const createPayPalOrder = useCallback(async () => {
		const response = await initInvoiceOnlinePayment(invoice.id, gateway.slug);
		if (response.already_paid && response.invoice) {
			onPaidRef.current(response.invoice);
			throw new Error(__('Invoice is already paid.', 'doublescale'));
		}
		if (!response.order_id) {
			throw new Error(__('Could not start PayPal checkout.', 'doublescale'));
		}
		return response.order_id;
	}, [invoice.id, gateway.slug]);

	if (loading) {
		return (
			<div className="text-sm text-muted-foreground">{__('Loading payment options…', 'doublescale')}</div>
		);
	}

	if (error) {
		return <div className="text-sm text-red-600">{error}</div>;
	}

	if (gateway.slug === 'paypal') {
		if (!paypalClientId) {
			return (
				<div className="text-sm text-muted-foreground">
					{__('Could not start PayPal checkout.', 'doublescale')}
				</div>
			);
		}

		return (
			<div className="space-y-3 rounded-lg border bg-slate-50 p-4">
				<div>
					<h4 className="font-medium">
						{__('Pay with %s', 'doublescale').replace('%s', gateway.name)}
					</h4>
					<p className="text-sm text-muted-foreground">
						{__('Balance due:', 'doublescale')}{' '}
						{formatMoney(balanceDue, invoice.currency)}
					</p>
				</div>
				<PayPalPayButtons
					clientId={paypalClientId}
					currency={invoice.currency}
					createOrder={createPayPalOrder}
					busy={paypalBusy}
					onApprove={handlePayPalApprove}
				/>
			</div>
		);
	}

	if (gateway.slug !== 'stripe' || !clientSecret || !stripePromise) {
		return (
			<div className="text-sm text-muted-foreground">
				{__('This payment gateway is not supported in the admin view yet.', 'doublescale')}
			</div>
		);
	}

	return (
		<div className="space-y-3 rounded-lg border bg-slate-50 p-4">
			<div>
				<h4 className="font-medium">
					{__('Pay with %s', 'doublescale').replace('%s', gateway.name)}
				</h4>
				<p className="text-sm text-muted-foreground">
					{__('Balance due:', 'doublescale')}{' '}
					{formatMoney(balanceDue, invoice.currency)}
				</p>
			</div>
			<Elements stripe={stripePromise as Promise<Stripe | null>} options={{ clientSecret }}>
				<StripePayForm invoiceId={invoice.id} gatewaySlug={gateway.slug} onPaid={onPaid} />
			</Elements>
		</div>
	);
};

/** @deprecated Use InvoiceOnlinePayment */
export const InvoiceStripePayment = InvoiceOnlinePayment;
