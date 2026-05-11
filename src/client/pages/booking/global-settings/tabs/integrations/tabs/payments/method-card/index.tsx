/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
// @ts-ignore
import stripe from '@doublescale/assets/booking-icons/stripe/stripe.png';
import type { PaymentGateway } from '@/config/booking';
import { ProGlobalIntegrations } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface PaymentGatewayCardProps {
	slug: string | null;
	gateway: PaymentGateway;
	updateGatewayProperty: (property: string, value: any) => void;
	updateGatewaySettings: (gatewayId: string, settings: any) => void;
	isLoading?: boolean;
}

const PaymentGatewayCard: React.FC<PaymentGatewayCardProps> = (props) => {
	const { slug, isLoading = false } = props;

	if (!slug) return null;

	// Pro plugin can override this card with a richer settings UI.
	const proComponent = applyFilters(
		'doublescale_booking_payment_gateway_card',
		null,
		props
	);

	if (proComponent) {
		return proComponent as React.ReactNode;
	}

	// Stripe is the only bundled gateway. Credentials live in the global
	// Stripe integration (CRM Settings → Integrations → Stripe).
	const paymentList: Record<string, Record<string, string[]>> = {
		stripe: {
			[__('Save time and reduce no-shows:', 'doublescale')]: [
				__(
					'Automatically collect full or partial payments at the time an event is scheduled.',
					'doublescale'
				),
				__(
					'Allow your clients to pay with Stripe, debit, or credit card.',
					'doublescale'
				),
			],
			[__('Setup', 'doublescale')]: [
				__(
					'Add your Stripe keys in CRM Settings → Integrations → Stripe — they apply to every event with payments enabled.',
					'doublescale'
				),
			],
		},
	};

	return (
		<Card className="rounded-lg mb-6 w-full">
			<CardContent>
				{isLoading ? (
					<div className="flex flex-col gap-5">
						<Skeleton className="h-10 w-10 rounded-full" />
						<Skeleton className="h-4 w-full" />
					</div>
				) : (
					<>
						<div className="flex items-center gap-4 p-0 text-color-primary-text border-b pb-5 mb-4">
							<img
								src={stripe}
								alt={`${slug}.png`}
								className="w-16 h-8"
							/>
							<div>
								<p className="text-[#09090B] font-bold text-2xl">
									{__('Stripe', 'doublescale')}
								</p>
								<p className="text-[#71717A] font-medium text-sm">
									{__('Stripe Information', 'doublescale')}
								</p>
							</div>
						</div>
						<ProGlobalIntegrations list={paymentList[slug] ?? {}} />
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default PaymentGatewayCard;
