import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { forwardRef } from 'react';
import { ProFeatureNotice } from '@doublescale/components';

interface EventPaymentsProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

interface EventPaymentsHandle {
	saveSettings: () => Promise<void>;
}
const Payments = forwardRef<EventPaymentsHandle, EventPaymentsProps>(
	(props, ref) => {
		return applyFilters(
			'doublescale_booking_event_payments_tab',
			<ProFeatureNotice
				featureName={__('Paid Bookings', 'doublescale')}
				description={__(
					'Charge for appointments with Stripe. Configure pricing models and require payment before a booking is confirmed.',
					'doublescale'
				)}
				features={[
					__('Stripe payments', 'doublescale'),
					__('Per-event pricing', 'doublescale'),
					__('Multiple duration pricing', 'doublescale'),
				]}
			/>,
			props,
			ref
		) as React.ReactNode;
	}
);

export default Payments;
