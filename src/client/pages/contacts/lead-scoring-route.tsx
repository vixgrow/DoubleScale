/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { PageHeader, PlusIcon } from '@doublescale/components';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';
import LeadScoring, { type LeadScoringRef } from './lead-scoring';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import config from '@doublescale/config';
import ModuleDisabledNotice from '@/components/module-disabled-notice';

const ContactsLeadScoringRoute: React.FC = () => {
	const leadScoringRef = useRef<LeadScoringRef>(null);
	const isCrmManager = useCapabilities().isCrmManager();
	const moduleOn = config.isModuleEnabled('leadscoring');
	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	const headerActions =
		isCrmManager && moduleOn && isProActive
			? [
					{
						label: __('Add', 'doublescale'),
						onClick: () => {
							leadScoringRef.current?.openCreateModal();
						},
						icon: <PlusIcon />,
					},
				]
			: [];

	return (
		<div className="doublescale-contacts-list w-full">
			<PageHeader
				title={__('Lead Score', 'doublescale')}
				subtitle={__('Contacts', 'doublescale')}
				actions={headerActions}
			/>
			{!isProActive ? (
				<div className="bg-white rounded-3xl p-8 shadow-sm">
					<ProFeatureNotice
						featureName={__('Lead Score', 'doublescale')}
						description={__(
							'Define score levels, award points from automations and engagement, and prioritize follow-ups. Upgrade to DoubleScale Pro to unlock lead scoring.',
							'doublescale'
						)}
					/>
				</div>
			) : !moduleOn ? (
				<ModuleDisabledNotice
					featureName={__('Lead Score', 'doublescale')}
				/>
			) : (
				<LeadScoring ref={leadScoringRef} activeTab="lead_scoring" />
			)}
		</div>
	);
};

export default ContactsLeadScoringRoute;
