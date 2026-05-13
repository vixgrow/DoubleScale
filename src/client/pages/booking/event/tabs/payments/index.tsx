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
					'Charge for appointments with built-in payment gateways. Configure pricing models, accept deposits, and require payment before a booking is confirmed.',
					'doublescale'
				)}
				features={[
					__('Stripe and PayPal integration', 'doublescale'),
					__('Per-event pricing and deposits', 'doublescale'),
					__('WooCommerce checkout support', 'doublescale'),
				]}
			/>,
			props,
			ref
		) as React.ReactNode;
	}
);

export default Payments;
