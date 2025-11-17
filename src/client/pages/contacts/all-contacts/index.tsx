/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { forwardRef, useImperativeHandle } from 'react';
/**
 * internal dependencies
 */
import { ContactsProvider, useContactsContext } from './contexts';
import { ContactsTable } from './contacts-table';
import { NoticeSection } from './notice';
import {
	CreateContactModal,
	ContactsImportModal,
	ContactsExportModal,
} from './contacts-modals';
import { NoData, GradientContactsIcon } from '@quillcrm/components';

export interface AllContactsRef {
	openCreateContactModal: () => void;
	openImportModal: () => void;
	openExportModal: () => void;
}

interface AllContactsProps {
	activeTab?: string;
}

// Inner component that uses the context
const AllContactsContent = forwardRef<AllContactsRef, AllContactsProps>(
	({ activeTab }, ref) => {
		const {
			setCreateContactVisible,
			setImportModalVisible,
			setExportModalVisible,
			loading,
			hasRecords,
		} = useContactsContext();

		// Handler functions
		const handleOpenCreateContactModal = () => {
			setCreateContactVisible(true);
		};

		const handleOpenImportModal = () => {
			setImportModalVisible(true);
		};

		const handleOpenExportModal = () => {
			setExportModalVisible(true);
		};

		// Expose methods to parent component
		useImperativeHandle(ref, () => ({
			openCreateContactModal: handleOpenCreateContactModal,
			openImportModal: handleOpenImportModal,
			openExportModal: handleOpenExportModal,
		}));

		return (
			<div className="qcrm-all-contacts w-full">
				<NoticeSection />
				{loading || hasRecords ? (
					<ContactsTable activeTab={activeTab} />
				) : (
					<NoData
						icon={<GradientContactsIcon width={120} height={120} />}
						title={__('No contacts yet', 'quillcrm')}
						subtitle={__(
							'Get started by creating your first contact or import contacts from a CSV file',
							'quillcrm'
						)}
						buttonLabel={__('Create Contact', 'quillcrm')}
						onClick={handleOpenCreateContactModal}
					/>
				)}
				<CreateContactModal />
				<ContactsImportModal />
				<ContactsExportModal />
			</div>
		);
	}
);

// Main component with context provider
const AllContacts = forwardRef<AllContactsRef, AllContactsProps>(
	(props, ref) => {
		return (
			<ContactsProvider>
				<AllContactsContent {...props} ref={ref} />
			</ContactsProvider>
		);
	}
);

export default AllContacts;
