/**
 * Support → Custom fields (free upsell stub).
 *
 * Pro replaces this page via `doublescale_navigation_page_settings`.
 */

import type { FC } from 'react';
import { __ } from '@wordpress/i18n';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

const SupportCustomFieldsUpgradePage: FC = () => (
	<div className="space-y-6">
		<div className="text-foreground font-semibold text-2xl">
			{__('Custom fields', 'doublescale')}
		</div>
		<ProFeatureNotice
			featureName={__('Ticket custom fields', 'doublescale')}
			description={__(
				'Add text, select, date, and other fields to ticket forms with conditional visibility. Upgrade to DoubleScale Pro to unlock custom fields for support tickets.',
				'doublescale'
			)}
			features={[
				__('Custom field types (text, select, date, and more)', 'doublescale'),
				__('Conditional show/hide rules', 'doublescale'),
				__('Agent-only and portal-scoped fields', 'doublescale'),
				__('Custom fields on ticket create and edit', 'doublescale'),
			]}
		/>
	</div>
);

export default SupportCustomFieldsUpgradePage;
