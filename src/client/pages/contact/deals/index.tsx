/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

interface DealsProps {
	contact_id: number;
	navigate?: (path: string) => void;
}

const Deals: React.FC<DealsProps> = ({ contact_id }) => {
	return (
		<ProFeatureNotice
			featureName={__('Deals', 'doublescale')}
			description={__(
				'Track and manage deals for this contact with our powerful CRM features. View deal stages, values, and close dates all in one place.',
				'doublescale'
			)}
		/>
	);
};

export default Deals;