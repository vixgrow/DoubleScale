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
import Contact from '../../contact';
import type { Contact as ContactType } from '@quillcrm/client';

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
			setContact,
			contactDialogVisible,
			selectedContactId,
			setContactDialogVisible,
			data,
			setData,
		} = useContactsContext();

		// Expose methods to parent component
		useImperativeHandle(ref, () => ({
			openCreateContactModal: () => {
				setContact({
					email: '',
					first_name: '',
					last_name: '',
				});
				setCreateContactVisible(true);
			},
			openImportModal: () => {
				setImportModalVisible(true);
			},
			openExportModal: () => {
				setExportModalVisible(true);
			},
		}));

		// Handle contact update callback
		const handleContactUpdate = (updatedContact: ContactType) => {
			// Update the contact in the list
			setData(
				data.map((contact) =>
					contact.id === updatedContact.id ? updatedContact : contact
				)
			);
		};

		return (
			<div className="qcrm-all-contacts w-full">
				<NoticeSection />
				<ContactsTable activeTab={activeTab} />
				<CreateContactModal />
				<ContactsImportModal />
				<ContactsExportModal />
				<Contact
					contactId={selectedContactId || undefined}
					isDialog={true}
					isOpen={contactDialogVisible}
					onClose={() => setContactDialogVisible(false)}
					onContactUpdate={handleContactUpdate}
				/>
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
