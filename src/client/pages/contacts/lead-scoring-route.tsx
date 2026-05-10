/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PageHeader, PlusIcon } from '@doublescale/components';
import LeadScoring, { type LeadScoringRef } from './lead-scoring';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import config from '@doublescale/config';
import ModuleDisabledNotice from '@/components/module-disabled-notice';

const ContactsLeadScoringRoute: React.FC = () => {
	const leadScoringRef = useRef<LeadScoringRef>(null);
	const isCrmManager = useCapabilities().isCrmManager();
	const moduleOn = config.isModuleEnabled('leadscoring');

	const headerActions =
		isCrmManager && moduleOn
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
				title={__('Lead Scoring', 'doublescale')}
				subtitle={__('Contacts', 'doublescale')}
				actions={headerActions}
			/>
			{!moduleOn ? (
				<ModuleDisabledNotice
					featureName={__('Lead Scoring', 'doublescale')}
				/>
			) : (
				<LeadScoring ref={leadScoringRef} activeTab="lead_scoring" />
			)}
		</div>
	);
};

export default ContactsLeadScoringRoute;
