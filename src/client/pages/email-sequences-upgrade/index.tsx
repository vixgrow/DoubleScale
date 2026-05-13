/**
 * Shown when Email Sequences is opened without QuillCRM Pro active.
 */
import type { FC } from 'react';
import { __ } from '@wordpress/i18n';
import { ProFeatureNotice } from '@doublescale/components';

const EmailSequencesUpgradeNag: FC = () => {
	return (
		<div className="doublescale-email-sequences-upgrade p-6">
			<ProFeatureNotice
				featureName={__('Email Sequences', 'doublescale')}
				description={__(
					'Automate multi-step email journeys with delays, scheduling windows, and per-contact enrollment. Unlock this and more with DoubleScale Pro.',
					'doublescale'
				)}
				features={[
					__(
						'Visual sequence builder with step delays (minutes, hours, days)',
						'doublescale'
					),
					__(
						'Per-contact enrollment, exit rules, and sequence completion tracking',
						'doublescale'
					),
					__(
						'Sending time windows and day-of-week controls',
						'doublescale'
					),
					__(
						'REST API and automation actions to enroll contacts from workflows',
						'doublescale'
					),
				]}
			/>
		</div>
	);
};

export default EmailSequencesUpgradeNag;
