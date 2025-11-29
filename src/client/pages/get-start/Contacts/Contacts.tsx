

import { useState } from 'react';

import ContactAddIcon from '@quillcrm/components/icons/contact-add';
import CheckTrue from '@quillcrm/components/icons/checkTrue';
import ImportContact from '@quillcrm/components/icons/import-contact';
import { AddContactDialog } from './AddContactDialog';
import ButtonComponent from '../component/button';
import ImportModal from '../../import-modal';
import { ContactsProvider, useContactsContext } from '../../contacts/all-contacts/contexts';
import { useContactsAPI } from '../../contacts/all-contacts/useContactsAPI';

// Component داخلي يستخدم الـ Context
function ContactsContent({onSkip, onPrevious, onNext}) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { importModalVisible, setImportModalVisible } = useContactsContext();
	const { fetchContacts } = useContactsAPI();

	const handleContactSubmit = (data) => {
		console.log('Form Data:', data);
		// Add contact logic here
	};

	const handleClose = () => {
		setImportModalVisible(false);
	};

	const handleCompleted = async () => {
		// Refresh the contacts data immediately after import completion
		await fetchContacts();
	};

	const handleImportContact = () => {
		setImportModalVisible(true);
	};

	return (
		<div className="flex flex-col gap-10">
			<div>
				<h3 className="text-[#170F49] text-[32px] font-semibold">
					Add Your Contacts—Start Building Meaningful CRM Connections
				</h3>
				<p className="text-[#777] text-lg font-normal leading-7">
					Add or import your contacts to start building your CRM
					database—whether it's leads, customers, or team members.
					Organizing contacts now helps you track interactions,
					personalize outreach, and automate smarter.
				</p>
			</div>
			<div className="grid grid-cols-2 gap-4 justify-center items-center mx-auto max-w-7xl !pb-12">
				<button
					onClick={() => setDialogOpen(true)}
					className="group relative flex flex-col items-center justify-center gap-4 p-8 text-[#374151] border-2 border-[#DEE1E6] bg-[#F8F8F8] rounded-2xl transition-all hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
				>
					<div className="pointer-events-none absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-md transition-all group-hover:-top-3 group-hover:-left-3 group-hover:opacity-100">
						<CheckTrue/>
					</div>
					
					<ContactAddIcon/>
					
					<span className="text-xl font-semibold leading-[30px]">
						Add Contact Individual
					</span>
				</button>

				<button 
					className="group relative flex flex-col items-center justify-center gap-4 p-8 text-[#374151] border-2 border-[#DEE1E6] bg-[#F8F8F8] rounded-2xl transition-all hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
					onClick={handleImportContact}
				>
					<div className="pointer-events-none absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-md transition-all group-hover:-top-3 group-hover:-left-3 group-hover:opacity-100">
						<CheckTrue/>
					</div>
					<ImportContact/>
					
					<span className="text-xl font-semibold leading-[30px]">
						Import Contacts
					</span>
				</button>
			</div>

			<div className="flex justify-between pt-8">
				<div className="flex gap-2">
					<ButtonComponent onClick={onPrevious} type="">
						Previous
					</ButtonComponent>

					<ButtonComponent type="no" onClick={onSkip}>
						Skip →
					</ButtonComponent>
				</div>
				<ButtonComponent type="go" onClick={onNext}>
					Next Step
				</ButtonComponent>
			</div>

			<AddContactDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSubmit={handleContactSubmit}
			/>

			<ImportModal 
				open={importModalVisible}
				onClose={handleClose}
				onCompleted={handleCompleted}
			/>
		</div>
	);
}

export default function Contacts({onSkip, onPrevious, onNext}) {
	return (
		<ContactsProvider>
			<ContactsContent 
				onSkip={onSkip} 
				onPrevious={onPrevious} 
				onNext={onNext} 
			/>
		</ContactsProvider>
	);
}