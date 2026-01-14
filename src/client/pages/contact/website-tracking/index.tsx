/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@quillcrm/components';

interface WebsiteTrackingProps {
	contact_id: number;
	navigate?: (path: string) => void;
}

const WebsiteTracking: React.FC<WebsiteTrackingProps> = ({ contact_id }) => {
	return (
		<ProFeatureNotice
			featureName={__('Website Tracking', 'quillcrm')}
			description={__(
				'Track and analyze page visits for this contact on your website. See which pages they visit, when they visit, and how often they engage with your content.',
				'quillcrm'
			)}
			features={[
				__('View all page visits with timestamps', 'quillcrm'),
				__('Track unique pages visited', 'quillcrm'),
				__('See browser and device information', 'quillcrm'),
				__('Monitor IP addresses for each visit', 'quillcrm'),
				__('Analyze most visited pages', 'quillcrm'),
				__('Track active days and engagement patterns', 'quillcrm'),
			]}
		/>
	);
};

export default WebsiteTracking;
