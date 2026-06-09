/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	PlusIcon,
	PageHeader,
	ArrowUpIcon,
	ArrowDownIcon,
} from '@doublescale/components';
import { ProFeatureNotice } from '@doublescale/components';
import AllContacts, { AllContactsRef } from './all-contacts';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import {
	Dialog,
	DialogContent,
} from '@/components/ui/dialog';

export type { LeadScoringRef } from './lead-scoring';

const ContactsList: React.FC = () => {
	const isCrmManager = useCapabilities().isCrmManager();
	const allContactsRef = useRef<AllContactsRef>(null);
	const [showProModal, setShowProModal] = useState(false);
	const isProActive = applyFilters('doublescale_is_pro_active', false) as boolean;

	const headerActions = [
		...(isCrmManager
			? [
				{
					label: __('Export Contact', 'doublescale'),
					onClick: () => {
						if (!isProActive) {
							setShowProModal(true);
							return;
						}
						allContactsRef.current?.openExportModal();
					},
					variant: 'secondaryDeepBlue' as const,
					icon: <ArrowUpIcon />,
				},
				{
					label: __('Import Contact', 'doublescale'),
					onClick: () =>
						allContactsRef.current?.openImportModal(),
					variant: 'secondaryDeepBlue' as const,
					icon: <ArrowDownIcon />,
				},
			]
			: []),
		{
			label: __('Add Contact', 'doublescale'),
			onClick: () => allContactsRef.current?.openCreateContactModal(),
			icon: <PlusIcon />,
		},
	];

	return (
		<div className="doublescale-contacts-list w-full">
			<PageHeader
				title={__('Contacts List', 'doublescale')}
				subtitle={__('Contacts', 'doublescale')}
				actions={headerActions}
			/>

			<AllContacts ref={allContactsRef} activeTab="all" />

			<Dialog open={showProModal} onOpenChange={setShowProModal}>
				<DialogContent className="sm:max-w-lg">
					<ProFeatureNotice
						featureName={__('Export Contacts', 'doublescale')}
						description={__(
							'Export your contacts to CSV with advanced filtering and field selection using DoubleScale Pro.',
							'doublescale'
						)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ContactsList;
