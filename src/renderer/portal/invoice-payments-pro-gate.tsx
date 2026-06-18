/**
 * Shown in the Client Portal when Invoices/Payments need Pro but it is inactive.
 *
 * Must not use admin-only components (e.g. ProFeatureNotice) — the portal bundle
 * does not register the doublescale/core data store.
 */

import { __ } from '@wordpress/i18n';
import { EmptyState } from './shared/ui';

const InvoicePaymentsPortalProGate = () => (
	<EmptyState
		title={__('Invoices and payments are unavailable', 'doublescale')}
		description={__(
			'Please contact us if you need help with an invoice or payment on your account.',
			'doublescale'
		)}
	/>
);

export default InvoicePaymentsPortalProGate;
