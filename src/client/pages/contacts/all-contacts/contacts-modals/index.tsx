/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
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
} from '@doublescale/components';
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
		phone: '',
		whatsapp_phone: '',
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
			<DialogContent className="max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('Create Contact', 'doublescale')}
							subtitle={__(
								'Add basic information below to add new Contact',
								'doublescale'
							)}
							icon={<GradientAddContactIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="doublescale-fields space-y-5 h-[calc(90vh-13rem)] overflow-y-auto">
					<Field
						label={__('First Name', 'doublescale')}
						placeholder={__('Enter First Name', 'doublescale')}
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
						label={__('Last Name', 'doublescale')}
						value={contactForm.last_name}
						onChange={(value) =>
							setContactForm((prev) => ({
								...prev,
								last_name: value,
							}))
						}
						type="text"
						placeholder={__('Enter Last Name', 'doublescale')}
					/>

					<Field
						label={__('Email', 'doublescale')}
						value={contactForm.email}
						onChange={(value) =>
							setContactForm((prev) => ({
								...prev,
								email: value,
							}))
						}
						type="email"
						placeholder={__('Enter Email', 'doublescale')}
					/>
					<Field
						label={__('Phone', 'doublescale')}
						value={contactForm.phone}
						onChange={(value) => {
							// Allow only numbers and common phone characters (+, -, spaces, parentheses)
							const phoneRegex = /^[0-9+\-\s()]*$/;
							if (phoneRegex.test(value) || value === '') {
								setContactForm((prev) => ({
									...prev,
									phone: value,
								}));
							}
						}}
						type="tel"
						placeholder={__('Enter Phone Number', 'doublescale')}
					/>
					<Field
						label={__('WhatsApp Phone', 'doublescale')}
						value={contactForm.whatsapp_phone}
						onChange={(value) => {
							// Allow only numbers and common phone characters (+, -, spaces, parentheses)
							const phoneRegex = /^[0-9+\-\s()]*$/;
							if (phoneRegex.test(value) || value === '') {
								setContactForm((prev) => ({
									...prev,
									whatsapp_phone: value,
								}));
							}
						}}
						type="tel"
						placeholder={__('Enter WhatsApp Phone Number', 'doublescale')}
						helperText={__('Phone number for WhatsApp messaging (e.g., +1234567890)', 'doublescale')}
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
							? __('Submitting...', 'doublescale')
							: __('Submit', 'doublescale')}
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

	// Apply filter to allow Pro plugin to override
	const ExportModalComponent = applyFilters(
		'doublescale_export_modal_component',
		ExportModal,
		'contacts'
	) as React.FC<{ open: boolean; onClose: () => void }>;

	return (
		<ExportModalComponent
			open={exportModalVisible}
			onClose={() => setExportModalVisible(false)}
		/>
	);
};
