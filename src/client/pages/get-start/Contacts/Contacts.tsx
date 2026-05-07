/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { useState } from 'react';

/**
 * Internal dependencies
 */
import ContactAddIcon from '@doublescale/components/icons/contact-add';
import CheckTrue from '@doublescale/components/icons/checkTrue';
import ImportContact from '@doublescale/components/icons/import-contact';
import { AddContactDialog } from './AddContactDialog';
import ButtonComponent from '../component/button';
import ImportModal from '../../import-modal';
import {
	ContactsProvider,
	useContactsContext,
} from '../../contacts/all-contacts/contexts';
import { useContactsAPI } from '../../contacts/all-contacts/useContactsAPI';

interface ContactsContentProps {
	readonly onSkip: () => void;
	readonly onPrevious: () => void;
	readonly onNext: () => void;
}

interface ContactFormData {
	firstName: string;
	lastName: string;
	email: string;
}

// Component داخلي يستخدم الـ Context
function ContactsContent({ onSkip, onPrevious, onNext }: ContactsContentProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const { importModalVisible, setImportModalVisible } = useContactsContext();
	const { fetchContacts, createContact } = useContactsAPI({
		openDialogOnCreate: false,
	});
	const { createNotice } = useDispatch('doublescale/core');

	const handleContactSubmit = async (data: ContactFormData) => {
		setIsCreating(true);
		try {
			// Map form data to API payload format (camelCase to snake_case)
			const contactPayload = {
				first_name: data.firstName,
				last_name: data.lastName,
				email: data.email,
			};

			// Use existing createContact method which handles success/error notifications
			await createContact(contactPayload);

			// Refresh contacts list
			await fetchContacts();

			// Show a success notice in the onboarding flow
			createNotice({
				type: 'success',
				message: __('Contact created successfully', 'doublescale'),
			});

			// Close dialog after successful creation
			setDialogOpen(false);
		} catch (error: any) {
			// Surface an error notice in the onboarding flow as well
			createNotice({
				type: 'error',
				message:
					error?.message ||
					__('Failed to create contact', 'doublescale'),
			});
		} finally {
			setIsCreating(false);
		}
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

	const handleDialogClose = () => {
		setDialogOpen(false);
	};

	return (
		<div className="flex flex-col gap-10">
			<div>
				<h3 className="text-[#170F49] text-[32px] font-semibold">
					{__(
						'Add Your Contacts—Start Building Meaningful CRM Connections',
						'doublescale'
					)}
				</h3>
				<p className="text-[#777] text-lg font-normal leading-7">
					{__(
						"Add or import your contacts to start building your CRM database—whether it's leads, customers, or team members. Organizing contacts now helps you track interactions, personalize outreach, and automate smarter.",
						'doublescale'
					)}
				</p>
			</div>
			<div className="grid grid-cols-2 gap-4 justify-center items-center mx-auto max-w-7xl !pb-12">
				<button
					onClick={() => setDialogOpen(true)}
					className="group relative flex flex-col items-center justify-center gap-4 p-8 text-[#374151] border-2 border-[#DEE1E6] bg-[#F8F8F8] rounded-2xl transition-all hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
				>
					<div className="pointer-events-none absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-md transition-all group-hover:-top-3 group-hover:-left-3 group-hover:opacity-100">
						<CheckTrue />
					</div>

					<ContactAddIcon />

					<span className="text-xl font-semibold leading-[30px]">
						{__('Add Contact Individual', 'doublescale')}
					</span>
				</button>

				<button
					className="group relative flex flex-col items-center justify-center gap-4 p-8 text-[#374151] border-2 border-[#DEE1E6] bg-[#F8F8F8] rounded-2xl transition-all hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
					onClick={handleImportContact}
				>
					<div className="pointer-events-none absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-md transition-all group-hover:-top-3 group-hover:-left-3 group-hover:opacity-100">
						<CheckTrue />
					</div>
					<ImportContact />

					<span className="text-xl font-semibold leading-[30px]">
						{__('Import Contacts', 'doublescale')}
					</span>
				</button>
			</div>

			<div className="flex justify-between pt-8">
				<div className="flex gap-2">
					<ButtonComponent onClick={onPrevious} type="">
						{__('Previous', 'doublescale')}
					</ButtonComponent>

					<ButtonComponent type="no" onClick={onSkip}>
						{__('Skip →', 'doublescale')}
					</ButtonComponent>
				</div>
				<ButtonComponent type="go" onClick={onNext}>
					{__('Next Step', 'doublescale')}
				</ButtonComponent>
			</div>

			<AddContactDialog
				open={dialogOpen}
				onClose={handleDialogClose}
				onSubmit={handleContactSubmit}
				isLoading={isCreating}
			/>

			<ImportModal
				open={importModalVisible}
				onClose={handleClose}
				onCompleted={handleCompleted}
			/>
		</div>
	);
}

interface ContactsProps {
	readonly onSkip: () => void;
	readonly onPrevious: () => void;
	readonly onNext: () => void;
}

export default function Contacts({
	onSkip,
	onPrevious,
	onNext,
}: ContactsProps) {
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
