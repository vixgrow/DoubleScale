/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { useContactContext } from '../../state/context';

const LeadScoreCard: React.FC = () => {
	const { contact } = useContactContext();

	// Allow Pro version to provide the lead score card content
	// The filter receives the default content (null) and the contact
	const leadScoreContent = applyFilters(
		'doublescale_contact_lead_score_card',
		null,
		contact
	) as React.ReactNode;

	// If no content is provided by the filter (free version), render nothing
	if (!leadScoreContent) {
		return null;
	}

	return <>{leadScoreContent}</>;
};

export default LeadScoreCard;
