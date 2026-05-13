import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { forwardRef } from 'react';
import { ProFeatureNotice } from '@doublescale/components';

export interface SmsNotificationsTabHandle {
	saveSettings: () => Promise<void>;
}

interface SmsNotificationsTabProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
	handleNavigation?: (tab: string) => void;
}

const SmsNotificationTab = forwardRef<
	SmsNotificationsTabHandle,
	SmsNotificationsTabProps
>(({ disabled, setDisabled, handleNavigation }, ref) => {
	return applyFilters(
		'doublescale_booking_event_sms_notification_tab',
		<ProFeatureNotice
			featureName={__('SMS Notifications', 'doublescale')}
			description={__(
				'Send SMS reminders and confirmations to attendees and organizers. Reduce no-shows with timely text-message updates tied to each booking.',
				'doublescale'
			)}
		/>,
		{
			disabled,
			setDisabled,
			ref,
			handleNavigation,
		}
	) as React.ReactNode;
});

SmsNotificationTab.displayName = 'SmsNotificationTab';

export default SmsNotificationTab;
