/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

interface SMSProps {
	contact_id: number;
}

const SMS: React.FC<SMSProps> = ({ contact_id }) => {
	return (
		<ProFeatureNotice
			featureName={__('SMS Messaging', 'doublescale')}
			description={__(
				'Send personalized SMS messages to your contacts, create bulk SMS campaigns, and automate SMS communication through workflows.',
				'doublescale'
			)}
		/>
	);
};

export default SMS;
