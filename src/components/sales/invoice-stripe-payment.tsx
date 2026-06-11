/**
 * Stripe card payment for an invoice balance (admin invoice view).
 */

import React, { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';

import { Button } from '@/components/ui/button';
import {
	confirmInvoiceStripePayment,
	initInvoiceStripePayment,
} from '@/hooks/sales';
import type { Invoice } from '@/types/sales';

interface InvoiceStripePaymentProps {
	invoice: Invoice;
	onPaid: (invoice: Invoice) => void;
}

const formatMoney = (value: number, currency: string) =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const StripePayForm: React.FC<{
	invoiceId: number;
	onPaid: (invoice: Invoice) => void;
}> = ({ invoiceId, onPaid }) => {
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
			const result = await confirmInvoiceStripePayment(invoiceId);
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
				{busy ? __('Processing…', 'doublescale') : __('Pay with Stripe', 'doublescale')}
			</Button>
		</div>
	);
};

export const InvoiceStripePayment: React.FC<InvoiceStripePaymentProps> = ({
	invoice,
	onPaid,
}) => {
	const balanceDue = Math.max(0, invoice.total - invoice.amount_paid);
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
		void initInvoiceStripePayment(invoice.id)
			.then((response) => {
				if (cancelled) {
					return;
				}
				if (response.already_paid && response.invoice) {
					onPaid(response.invoice);
					return;
				}
				setPublishableKey(response.publishable_key);
				setClientSecret(response.client_secret || null);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(
						err instanceof Error ? err.message : __('Could not start Stripe payment.', 'doublescale')
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
	}, [invoice.id, onPaid]);

	if (loading) {
		return (
			<div className="text-sm text-muted-foreground">{__('Loading Stripe…', 'doublescale')}</div>
		);
	}

	if (error) {
		return <div className="text-sm text-red-600">{error}</div>;
	}

	if (!clientSecret || !stripePromise) {
		return null;
	}

	return (
		<div className="space-y-3 rounded-lg border bg-slate-50 p-4">
			<div>
				<h4 className="font-medium">{__('Pay with Stripe', 'doublescale')}</h4>
				<p className="text-sm text-muted-foreground">
					{__('Balance due:', 'doublescale')}{' '}
					{formatMoney(balanceDue, invoice.currency)}
				</p>
			</div>
			<Elements stripe={stripePromise as Promise<Stripe | null>} options={{ clientSecret }}>
				<StripePayForm invoiceId={invoice.id} onPaid={onPaid} />
			</Elements>
		</div>
	);
};
