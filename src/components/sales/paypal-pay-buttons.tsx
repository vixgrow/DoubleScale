/**
 * PayPal Buttons checkout for invoice online payment.
 */

import React, { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import { loadPayPalScript } from '@doublescale/utils/paypal-payment';

interface PayPalPayButtonsProps {
	clientId: string;
	currency: string;
	createOrder: () => Promise<string>;
	busy?: boolean;
	onApprove: () => Promise<void>;
}

export const PayPalPayButtons: React.FC<PayPalPayButtonsProps> = ({
	clientId,
	currency,
	createOrder,
	busy = false,
	onApprove,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [sdkReady, setSdkReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setError(null);
		setSdkReady(false);

		void loadPayPalScript(clientId, currency)
			.then(() => {
				if (!cancelled) {
					setSdkReady(true);
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : __('Could not load PayPal.', 'doublescale'));
				}
			});

		return () => {
			cancelled = true;
		};
	}, [clientId, currency]);

	useEffect(() => {
		if (!sdkReady || !containerRef.current || !window.paypal) {
			return;
		}

		const container = containerRef.current;
		container.innerHTML = '';

		const buttons = window.paypal.Buttons({
			createOrder: () =>
				createOrder().catch((err: unknown) => {
					const message =
						err instanceof Error ? err.message : __('Could not start PayPal checkout.', 'doublescale');
					setError(message);
					throw err;
				}),
			onApprove: () => onApprove(),
			onError: (err: { message?: string }) => {
				setError(err?.message || __('PayPal payment failed.', 'doublescale'));
			},
		});

		void buttons.render(container);

		return () => {
			try {
				buttons.close();
			} catch {
				// PayPal SDK may already be torn down.
			}
			container.innerHTML = '';
		};
	}, [sdkReady, createOrder, onApprove]);

	if (error) {
		return <div className="text-sm text-red-600">{error}</div>;
	}

	if (!sdkReady) {
		return (
			<div className="text-sm text-muted-foreground">
				{__('Loading PayPal…', 'doublescale')}
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div ref={containerRef} />
			{busy ? (
				<Button disabled>{__('Processing…', 'doublescale')}</Button>
			) : null}
		</div>
	);
};
