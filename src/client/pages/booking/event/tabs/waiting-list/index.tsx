import { forwardRef } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { ProFeatureNotice } from '@doublescale/components';

interface WaitingListSettingsProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

interface WaitingListSettingsHandle {
	saveSettings: () => Promise<void>;
}

const WaitingListSettings = forwardRef<
	WaitingListSettingsHandle,
	WaitingListSettingsProps
>(({ disabled, setDisabled }, ref) => {
	return applyFilters(
		'doublescale_booking_event_waiting_list_tab',
		<ProFeatureNotice
			featureName={__('Waiting List', 'doublescale')}
			description={__(
				'Keep accepting bookings even when an event is full. Attendees join a waiting list and get promoted automatically when a slot opens up.',
				'doublescale'
			)}
		/>,
		{ disabled, setDisabled, ref }
	) as React.ReactNode;
});

export default WaitingListSettings;
