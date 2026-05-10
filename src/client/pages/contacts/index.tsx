/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
	const allContactsRef = useRef< AllContactsRef >( null );

	const headerActions = [
		...( isCrmManager
			? [
					{
						label: __( 'Export Contact', 'doublescale' ),
						onClick: () =>
							allContactsRef.current?.openExportModal(),
						variant: 'outline' as const,
						icon: <ArrowUpIcon />,
					},
					{
						label: __( 'Import Contact', 'doublescale' ),
						onClick: () =>
							allContactsRef.current?.openImportModal(),
						variant: 'secondary' as const,
						icon: <ArrowDownIcon />,
					},
			  ]
			: [] ),
		{
			label: __( 'Add Contact', 'doublescale' ),
			onClick: () => allContactsRef.current?.openCreateContactModal(),
			icon: <PlusIcon />,
		},
	];

	return (
		<div className="doublescale-contacts-list w-full">
			<PageHeader
				title={ __( 'Contacts List', 'doublescale' ) }
				subtitle={ __( 'Contacts', 'doublescale' ) }
				actions={ headerActions }
			/>

			<AllContacts ref={ allContactsRef } activeTab="all" />
		</div>
	);
};

export default ContactsList;
