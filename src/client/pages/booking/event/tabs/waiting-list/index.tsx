import { OutlinedClockIcon, ProTab } from '@/components/booking';
import { forwardRef } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

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
		<ProTab
			title={__('Waiting List', 'doublescale')}
			description={__(
				'Configure waiting list settings for this event',
				'doublescale'
			)}
			icon={<OutlinedClockIcon />}
		/>,
		{ disabled, setDisabled, ref }
	) as React.ReactNode;
});

export default WaitingListSettings;
