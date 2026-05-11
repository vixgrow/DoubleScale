import { AdvancedSettingsIcon, ProTab } from '@/components/booking';
import { forwardRef } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

interface EventAdvancedSettingsProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

interface EventAdvancedSettingsHandle {
	saveSettings: () => Promise<void>;
}

const AdvancedSettings = forwardRef<
	EventAdvancedSettingsHandle,
	EventAdvancedSettingsProps
>(({ disabled, setDisabled }, ref) => {
	return applyFilters(
		'doublescale_booking_event_advanced_settings_tab',
		<ProTab
			title={__('Advanced Settings', 'doublescale')}
			description={__(
				'Customize the question asked on the booking page',
				'doublescale'
			)}
			icon={<AdvancedSettingsIcon />}
		/>,
		{ disabled, setDisabled, ref }
	) as React.ReactNode;
});

export default AdvancedSettings;
