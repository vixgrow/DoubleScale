/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@doublescale/components';

interface WebsiteTrackingProps {
	contact_id: number;
	navigate?: (path: string) => void;
}

const WebsiteTracking: React.FC<WebsiteTrackingProps> = ({ contact_id }) => {
	return (
		<ProFeatureNotice
			featureName={__('Website Tracking', 'doublescale')}
			description={__(
				'Track and analyze page visits for this contact on your website. See which pages they visit, when they visit, and how often they engage with your content.',
				'doublescale'
			)}
			features={[
				__('View all page visits with timestamps', 'doublescale'),
				__('Track unique pages visited', 'doublescale'),
				__('See browser and device information', 'doublescale'),
				__('Monitor IP addresses for each visit', 'doublescale'),
				__('Analyze most visited pages', 'doublescale'),
				__('Track active days and engagement patterns', 'doublescale'),
			]}
		/>
	);
};

export default WebsiteTracking;
