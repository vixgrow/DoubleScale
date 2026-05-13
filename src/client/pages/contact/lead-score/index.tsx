/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

interface LeadScoreProps {
	contact_id: number;
}

const LeadScore: React.FC<LeadScoreProps> = () => {
	return (
		<ProFeatureNotice
			featureName={__('Lead Score', 'doublescale')}
			description={__(
				'Track engagement with points and levels, use lead score in automations and segments, and prioritize your hottest contacts. Upgrade to DoubleScale Pro to unlock lead scoring.',
				'doublescale'
			)}
		/>
	);
};

export default LeadScore;
