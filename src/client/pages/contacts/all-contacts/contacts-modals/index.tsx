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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { GradientAddContactIcon } from '@doublescale/components';
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

	const closeModal = () => {
		setCreateContactVisible(false);
		setContactForm(emptyContact);
	};

	const inputClass =
		'h-11 rounded-xl border-border/80 bg-background pr-11 text-base shadow-inner shadow-black/[0.02]';

	return (
		<Dialog open={createContactVisible} onOpenChange={handleClose}>
			<DialogContent
				className={cn(
					'max-h-[min(90vh,760px)] max-w-[520px] gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl',
					'sm:max-w-[520px]'
				)}
			>
				<div className="border-b border-border/70 bg-gradient-to-br from-muted/30 via-background to-background sm:px-8 sm:pb-6 sm:pt-8 p-4">
					<div className="flex gap-4 pr-8">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
							<span className="text-primary [&>svg]:h-6 [&>svg]:w-6">
								<GradientAddContactIcon />
							</span>
						</div>
						<div className="min-w-0 flex-1 space-y-1.5">
							<h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
								{__('Create contact', 'doublescale')}
							</h2>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{__(
									'Add the essentials now. You can enrich the profile with lists, tags, and custom fields on the next screen.',
									'doublescale'
								)}
							</p>
						</div>
					</div>
				</div>

				<div className="max-h-[min(52vh,420px)] space-y-6 overflow-y-auto sm:px-8 sm:py-7 p-4">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
							{__('Identity', 'doublescale')}
						</p>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="ds-create-contact-first" className="text-sm font-medium">
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
								<Label htmlFor="ds-create-contact-last" className="text-sm font-medium">
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
						<Label htmlFor="ds-create-contact-email" className="text-sm font-medium">
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
							onChange={(e) =>
								setContactForm((prev) => ({
									...prev,
									email: e.target.value,
								}))
							}
						/>
					</div>

					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
							{__('Phone', 'doublescale')}
						</p>
						<div className="mt-4 space-y-4">
							<div className="space-y-2">
								<Label htmlFor="ds-create-contact-phone" className="text-sm font-medium">
									{__('Phone', 'doublescale')}
								</Label>
								<Input
									id="ds-create-contact-phone"
									type="tel"
									className={inputClass}
									autoComplete="tel"
									placeholder={__('+1 555 010 2030', 'doublescale')}
									value={contactForm.phone}
									onChange={(e) => {
										const v = e.target.value;
										const phoneRegex = /^[0-9+\-\s()]*$/;
										if (phoneRegex.test(v) || v === '') {
											setContactForm((prev) => ({
												...prev,
												phone: v,
											}));
										}
									}}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ds-create-contact-whatsapp" className="text-sm font-medium">
									{__('WhatsApp', 'doublescale')}
								</Label>
								<Input
									id="ds-create-contact-whatsapp"
									type="tel"
									className={inputClass}
									autoComplete="tel"
									placeholder={__('Same or different as phone', 'doublescale')}
									value={contactForm.whatsapp_phone}
									onChange={(e) => {
										const v = e.target.value;
										const phoneRegex = /^[0-9+\-\s()]*$/;
										if (phoneRegex.test(v) || v === '') {
											setContactForm((prev) => ({
												...prev,
												whatsapp_phone: v,
											}));
										}
									}}
								/>
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

				<div className="flex flex-col-reverse gap-3 border-t border-border/70 bg-muted/25 sm:px-8 sm:py-5 p-4 sm:flex-row sm:items-center sm:justify-end">
					<Button
						type="button"
						variant="outline"
						className="h-11 rounded-xl border-border/80 sm:min-w-[100px]"
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
						onClick={() => createContact(contactForm)}
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
