import { PaymentSettingsIcon, ProTab } from '@/components/booking';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { forwardRef } from 'react';

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
			<ProTab
				title={__('Payment Settings', 'doublescale')}
				description={__(
					'Select Pricing Modal and your price.',
					'doublescale'
				)}
				icon={<PaymentSettingsIcon />}
			/>,
			props,
			ref
		) as React.ReactNode;
	}
);

export default Payments;
