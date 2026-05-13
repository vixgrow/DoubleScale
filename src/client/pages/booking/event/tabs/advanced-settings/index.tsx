import { forwardRef } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { ProFeatureNotice } from '@doublescale/components';

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
		<ProFeatureNotice
			featureName={__('Advanced Event Settings', 'doublescale')}
			description={__(
				'Fine-tune your event with custom questions, redirect URLs, attendee limits, and conditional logic to match every booking workflow.',
				'doublescale'
			)}
		/>,
		{ disabled, setDisabled, ref }
	) as React.ReactNode;
});

export default AdvancedSettings;
