/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ContactAddIcon from '@doublescale/components/icons/contact-add';
import CheckTrue from '@doublescale/components/icons/checkTrue';
import ImportContact from '@doublescale/components/icons/import-contact';
import { AddContactDialog } from './AddContactDialog';
import { Button } from '@/components/ui/button';
import ImportModal from '../../import-modal';
import {
	ContactsProvider,
	useContactsContext,
} from '../../contacts/all-contacts/contexts';
import { useContactsAPI } from '../../contacts/all-contacts/useContactsAPI';
import { ImportIcon } from '@doublescale/components';

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
function ContactsContent({ onSkip: _onSkip, onPrevious, onNext }: ContactsContentProps) {
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
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="shrink-0 pb-6">
			   <h3 className="mb-2.5 text-2xl font-bold leading-9 text-foreground">
					{__('Add Your Contacts—Start Building Meaningful CRM Connections', 'doublescale')}
				</h3>
				<p className="text-base font-medium leading-7 text-muted-foreground">
					{__(
						"Add or import your contacts to start building your CRM database—whether it’s leads, customers, or team members. Organizing contacts now helps you track interactions, personalize outreach, and automate smarter.",
						'doublescale'
					)}
				</p>
			</div>
			<div className="min-h-0 flex-1 ">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center items-center max-w-2xl mx-auto ">
				<button
					onClick={() => setDialogOpen(true)}
					className="group relative flex flex-col items-center justify-center gap-4 p-8 text-foreground border border-border bg-[#fff] 
					rounded-2xl transition-all hover:border-brandPrimary hover:text-brandPrimary"
				>
					<div className="pointer-events-none absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-md transition-all group-hover:-top-3 group-hover:-right-3 group-hover:opacity-100">
						<CheckTrue />
					</div>

					<ContactAddIcon color="currentColor" width={48} height={48} />

					<span className="text-base font-medium leading-7">
						{__('Add Contact Individual', 'doublescale')}
					</span>
				</button>

				<button
					className="group relative flex flex-col items-center justify-center gap-4 p-8 text-foreground border border-border bg-[#fff] 
					rounded-2xl transition-all hover:border-brandPrimary hover:text-brandPrimary"
					onClick={handleImportContact}
				>
					<div className="pointer-events-none absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-md transition-all group-hover:-top-3 group-hover:-right-3 group-hover:opacity-100">
						<CheckTrue />
					</div>
					<ImportIcon color="currentColor" width={48} height={48} />

					<span className="text-base font-medium leading-7">
						{__('Import Contacts', 'doublescale')}
					</span>
				</button>
			</div>
			</div>

			<div className="z-20 -mx-6 -mb-6 mt-6 shrink-0 bg-white px-6 py-4 shadow-[0_-8px_28px_rgba(15,23,42,0.07)] rounded-b-[20px]">
				<div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end sm:gap-6">
					<Button
						type="button"
						size="lg"
						variant="secondaryDeepBlue"
						onClick={onPrevious}
						disabled={isCreating}
					>
						{__('Back', 'doublescale')}
					</Button>
					<Button
						type="button"
						size="lg"
						variant="default"
						onClick={onNext}
						disabled={isCreating}
					>
						{__('Next Step', 'doublescale')}
					</Button>
				</div>
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
