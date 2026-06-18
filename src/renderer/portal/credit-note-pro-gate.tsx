/**
 * Shown in the Client Portal when Credit Notes is enabled but Pro is inactive.
 *
 * Must not use admin-only components (e.g. ProFeatureNotice) — the portal bundle
 * does not register the doublescale/core data store.
 */

import { __ } from '@wordpress/i18n';
import { EmptyState } from './shared/ui';

const CreditNotesPortalProGate = () => (
	<EmptyState
		title={__('Credit notes are unavailable', 'doublescale')}
		description={__(
			'Please contact us if you need help with a credit on your account.',
			'doublescale'
		)}
	/>
);

export default CreditNotesPortalProGate;
