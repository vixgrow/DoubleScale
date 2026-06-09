/**
 * Support → Incoming Webhook (free upsell stub).
 *
 * Pro replaces this page via `doublescale_navigation_page_settings`.
 */

import type { FC } from 'react';
import { __ } from '@wordpress/i18n';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

const SupportIncomingWebhookUpgradePage: FC = () => (
	<div className="space-y-6">
		<div className="text-foreground font-semibold text-2xl">
			{__('Incoming Webhook', 'doublescale')}
		</div>
		<ProFeatureNotice
			featureName={__('Incoming webhook', 'doublescale')}
			description={__(
				'Let external systems create support tickets or append replies over HTTP. Upgrade to DoubleScale Pro to unlock per-mailbox incoming webhook URLs.',
				'doublescale'
			)}
			features={[
				__('Per-mailbox secret webhook URLs', 'doublescale'),
				__('Create tickets from forms, CRMs, and other sites', 'doublescale'),
				__('Append replies when title and sender email match', 'doublescale'),
				__('Rotate webhook tokens anytime', 'doublescale'),
			]}
		/>
	</div>
);

export default SupportIncomingWebhookUpgradePage;
