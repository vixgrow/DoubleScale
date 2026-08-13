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
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { CustomDialogHeader, GradientAddContactIcon } from '@doublescale/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
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
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<'email' | 'phone' | 'whatsapp_phone', string>>
	>({});

	useEffect(() => {
		if (!createContactVisible) {
			setContactForm(emptyContact);
			setFieldErrors({});
		}
	}, [createContactVisible]);

	const handleClose = (open: boolean) => {
		setCreateContactVisible(open);
		if (!open) {
			setContactForm(emptyContact);
		}
	};

	const closeModal = () => {
		setCreateContactVisible(false);
		setContactForm(emptyContact);
		setFieldErrors({});
	};

	const handleCreateContact = async () => {
		setFieldErrors({});
		const result = await createContact(contactForm);
		if (!result.success && result.field) {
			setFieldErrors({ [result.field]: result.message });
		}
	};

	const inputClass =
		'h-11 !rounded-xl !border-border !bg-white pr-11 text-base shadow-inner shadow-black/[0.02]';

	return (
		<Dialog open={createContactVisible} onOpenChange={handleClose}>
			<DialogContent
				className={cn(
					'max-h-[min(90vh,760px)] !bg-white max-w-[520px] gap-0 overflow-hidden rounded-2xl border-border/70 shadow-2xl',
					'sm:max-w-[520px]'
				)}
			>
				<DialogHeader>
					<CustomDialogHeader title="Create contact" subtitle="Add the essentials now. You can enrich the profile with lists, tags, and custom fields on the next screen." icon={<GradientAddContactIcon />} />
				</DialogHeader>
				<div className="max-h-[min(52vh,420px)] py-4 space-y-6 overflow-y-auto">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
							{__('Identity', 'doublescale')}
						</p>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label
									htmlFor="ds-create-contact-first"
									className="text-sm font-medium"
								>
									{__('First name', 'doublescale')}
								</Label>
								<Input
									id="ds-create-contact-first"
									className={inputClass}
									autoComplete="given-name"
									placeholder={__('Jane', 'doublescale')}
									value={contactForm.first_name}
									onChange={(e) =>
										setContactForm((prev) => ({
											...prev,
											first_name: e.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="ds-create-contact-last"
									className="text-sm font-medium"
								>
									{__('Last name', 'doublescale')}
								</Label>
								<Input
									id="ds-create-contact-last"
									className={inputClass}
									autoComplete="family-name"
									placeholder={__('Doe', 'doublescale')}
									value={contactForm.last_name}
									onChange={(e) =>
										setContactForm((prev) => ({
											...prev,
											last_name: e.target.value,
										}))
									}
								/>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label
							htmlFor="ds-create-contact-email"
							className="text-sm font-medium"
						>
							{__('Email (optional)', 'doublescale')}
						</Label>
						<Input
							id="ds-create-contact-email"
							type="email"
							className={inputClass}
							autoComplete="email"
							inputMode="email"
							placeholder={__('name@company.com', 'doublescale')}
							value={contactForm.email}
							onChange={(e) => {
								setFieldErrors((prev) => {
									const next = { ...prev };
									delete next.email;
									return next;
								});
								setContactForm((prev) => ({
									...prev,
									email: e.target.value,
								}));
							}}
						/>
						{fieldErrors.email && (
							<p className="text-xs text-destructive">
								{fieldErrors.email}
							</p>
						)}
					</div>

					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
							{__('Phone', 'doublescale')}
						</p>
						<div className="mt-4 space-y-4">
							<div className="space-y-2">
								<Label
									htmlFor="ds-create-contact-phone"
									className="text-sm font-medium"
								>
									{__('Phone', 'doublescale')}
								</Label>
								<Input
									id="ds-create-contact-phone"
									type="tel"
									className={inputClass}
									autoComplete="tel"
									placeholder={__(
										'+1 555 010 2030',
										'doublescale'
									)}
									value={contactForm.phone}
									onChange={(e) => {
										const v = e.target.value;
										const phoneRegex = /^[0-9+\-\s()]*$/;
										if (phoneRegex.test(v) || v === '') {
											setFieldErrors((prev) => {
												const next = { ...prev };
												delete next.phone;
												return next;
											});
											setContactForm((prev) => ({
												...prev,
												phone: v,
											}));
										}
									}}
								/>
								{fieldErrors.phone && (
									<p className="text-xs text-destructive">
										{fieldErrors.phone}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="ds-create-contact-whatsapp"
									className="text-sm font-medium"
								>
									{__('WhatsApp', 'doublescale')}
								</Label>
								<Input
									id="ds-create-contact-whatsapp"
									type="tel"
									className={inputClass}
									autoComplete="tel"
									placeholder={__(
										'Same or different as phone',
										'doublescale'
									)}
									value={contactForm.whatsapp_phone}
									onChange={(e) => {
										const v = e.target.value;
										const phoneRegex = /^[0-9+\-\s()]*$/;
										if (phoneRegex.test(v) || v === '') {
											setFieldErrors((prev) => {
												const next = { ...prev };
												delete next.whatsapp_phone;
												return next;
											});
											setContactForm((prev) => ({
												...prev,
												whatsapp_phone: v,
											}));
										}
									}}
								/>
								{fieldErrors.whatsapp_phone && (
									<p className="text-xs text-destructive">
										{fieldErrors.whatsapp_phone}
									</p>
								)}
								<p className="text-xs text-muted-foreground">
									{__(
										'Provide an email and/or phone number. Used for WhatsApp messaging when set; include country code (e.g. +15550102030).',
										'doublescale'
									)}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-col-reverse gap-3 border-t border-border sm:pt-5 pt-4 sm:flex-row sm:items-center sm:justify-end">
					<Button
						type="button"
						variant="secondaryDeepBlue"
						className="h-11 rounded-xl sm:min-w-[100px]"
						onClick={closeModal}
						disabled={isSaving}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						type="button"
						variant="default"
						size="lg"
						className="h-11 rounded-xl px-8 font-semibold shadow-sm sm:min-w-[160px]"
						onClick={handleCreateContact}
						disabled={isSaving}
					>
						{isSaving
							? __('Saving…', 'doublescale')
							: __('Create contact', 'doublescale')}
					</Button>
				</div>
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
