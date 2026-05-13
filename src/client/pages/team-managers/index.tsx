/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * External dependencies
 */
import type { FC, ComponentType } from 'react';

/**
 * DoubleScale dependencies
 */
import { PageHeader } from '@doublescale/components';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

const TeamManagersPage: FC = () => {
	const Body = applyFilters(
		'doublescale_settings_team_settings',
		() => (
			<ProFeatureNotice
				featureName={__('Team / Managers', 'doublescale')}
				description={__(
					'Invite team members, assign CRM roles (Sales Rep, Sales Manager, CRM Manager), and control who can access contacts, deals, and settings with DoubleScale Pro.',
					'doublescale'
				)}
				features={[
					__(
						'Add Sales Reps, Sales Managers, and CRM Managers',
						'doublescale'
					),
					__(
						'Per-role capability control for contacts, deals, and settings',
						'doublescale'
					),
					__(
						'Automatic provisioning for booking hosts and notifications',
						'doublescale'
					),
				]}
			/>
		)
	) as ComponentType;

	return (
		<div className="doublescale-team-managers space-y-4">
			<PageHeader
				title={__('Team / Managers', 'doublescale')}
				subtitle={__(
					'Invite CRM users and manage access roles.',
					'doublescale'
				)}
				actions={[]}
			/>
			<div className="px-1">
				<Body />
			</div>
		</div>
	);
};

export default TeamManagersPage;
