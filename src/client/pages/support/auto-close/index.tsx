/**
 * Support → Auto Close (free upsell stub).
 *
 * Pro replaces this page via `doublescale_navigation_page_settings`.
 */

import type { FC } from 'react';
import { __ } from '@wordpress/i18n';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

const SupportAutoCloseUpgradePage: FC = () => (
	<div className="space-y-6">
		<div className="text-foreground font-semibold text-2xl">
			{__('Auto close', 'doublescale')}
		</div>
		<ProFeatureNotice
			featureName={__('Auto close inactive tickets', 'doublescale')}
			description={__(
				'Automatically close tickets that have gone quiet for a set number of days. Upgrade to DoubleScale Pro to keep your inbox tidy without manual cleanup.',
				'doublescale'
			)}
			features={[
				__('Close tickets after N days of inactivity', 'doublescale'),
				__('Only close tickets waiting on the customer', 'doublescale'),
				__('Include or exclude specific tags', 'doublescale'),
				__('Add an automatic closing note or reply', 'doublescale'),
				__('Close silently without notifying the customer', 'doublescale'),
			]}
		/>
	</div>
);

export default SupportAutoCloseUpgradePage;
