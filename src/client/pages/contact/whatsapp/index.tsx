/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

interface WhatsAppProps {
	contact_id: number;
}

const WhatsApp: React.FC<WhatsAppProps> = ({ contact_id }) => {
	return (
		<ProFeatureNotice
			featureName={__('WhatsApp Messaging', 'doublescale')}
			description={__(
				'Send personalized WhatsApp messages to your contacts, create bulk WhatsApp campaigns, and automate WhatsApp communication through workflows.',
				'doublescale'
			)}
		/>
	);
};

export default WhatsApp;
