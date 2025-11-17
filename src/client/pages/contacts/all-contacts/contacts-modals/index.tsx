/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useEffect, useState } from 'react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import {
	Field,
	CustomDialogHeader,
	GradientAddContactIcon,
} from '@quillcrm/components';
import { useContactsContext } from '../contexts';
import { useContactsAPI } from '../useContactsAPI';
import ImportModal from '../../../import-modal';
import ExportModal from '../../../export-modal';

export const CreateContactModal: React.FC = () => {
	const {
		createContactVisible,
		setCreateContactVisible,
		isSaving,
	} = useContactsContext();

	const { createContact } = useContactsAPI();

	const emptyContact = {
		email: '',
		first_name: '',
		last_name: '',
	};

	const [contactForm, setContactForm] = useState(emptyContact);

	useEffect(() => {
		if (!createContactVisible) {
			setContactForm(emptyContact);
		}
	}, [createContactVisible]);

	const handleClose = (open: boolean) => {
		setCreateContactVisible(open);
		if (!open) {
			setContactForm(emptyContact);
		}
	};

	return (
		<Dialog open={createContactVisible} onOpenChange={handleClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('Create Contact', 'quillcrm')}
							subtitle={__(
								'Add basic information below to add new Contact',
								'quillcrm'
							)}
							icon={<GradientAddContactIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="qcrm-fields space-y-4">
					<Field
						label={__('First Name', 'quillcrm')}
						placeholder={__('Enter First Name', 'quillcrm')}
						value={contactForm.first_name}
						onChange={(value) =>
							setContactForm((prev) => ({
								...prev,
								first_name: value,
							}))
						}
						type="text"
					/>
					<Field
						label={__('Last Name', 'quillcrm')}
						value={contactForm.last_name}
						onChange={(value) =>
							setContactForm((prev) => ({
								...prev,
								last_name: value,
							}))
						}
						type="text"
						placeholder={__('Enter Last Name', 'quillcrm')}
					/>
					<Field
						label={__('Email', 'quillcrm')}
						value={contactForm.email}
						onChange={(value) =>
							setContactForm((prev) => ({
								...prev,
								email: value,
							}))
						}
						type="email"
						placeholder={__('Enter Email', 'quillcrm')}
					/>
				</div>

				<DialogFooter className="mt-6">
					<Button
						onClick={() => createContact(contactForm)}
						disabled={isSaving}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isSaving
							? __('Submitting...', 'quillcrm')
							: __('Submit', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export const ContactsImportModal: React.FC = () => {
	const { importModalVisible, setImportModalVisible } = useContactsContext();
	const { fetchContacts } = useContactsAPI();

	const handleCompleted = async () => {
		// Refresh the contacts data immediately after import completion
		await fetchContacts();
	};

	const handleClose = () => {
		setImportModalVisible(false);
	};

	return (
		<ImportModal
			open={importModalVisible}
			onClose={handleClose}
			onCompleted={handleCompleted}
		/>
	);
};

export const ContactsExportModal: React.FC = () => {
	const { exportModalVisible, setExportModalVisible } = useContactsContext();

	return (
		<ExportModal
			open={exportModalVisible}
			onClose={() => setExportModalVisible(false)}
		/>
	);
};
