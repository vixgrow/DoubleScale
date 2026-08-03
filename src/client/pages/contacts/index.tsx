/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
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
import AllContacts, { AllContactsRef } from './all-contacts';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';

export type { LeadScoringRef } from './lead-scoring';

const ContactsList: React.FC = () => {
	const isCrmManager = useCapabilities().isCrmManager();
	const allContactsRef = useRef<AllContactsRef>(null);
	const isProActive = applyFilters('doublescale_is_pro_active', false) as boolean;

	const headerActions = [
		...(isCrmManager
			? [
				...(isProActive
					? [
						{
							label: __('Export Contact', 'doublescale'),
							onClick: () =>
								allContactsRef.current?.openExportModal(),
							variant: 'secondaryDeepBlue' as const,
							icon: <ArrowUpIcon />,
						},
					]
					: []),
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
		</div>
	);
};

export default ContactsList;
