/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { useState, useEffect } from 'react';

/**
 * Internal dependencies
 */
import type { Contact } from '@quillcrm/client';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	CustomDialogHeader,
	Field,
	GradientEmailIcon,
	Editor,
} from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';
import { Label } from '@quillcrm/components/ui/label';
import { useSendMessage } from '@quillcrm/hooks/use-send-message';

interface SendEmailDialogProps {
	open: boolean;
	onClose: () => void;
	contact: Contact | null;
}

const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
	open,
	onClose,
	contact,
}) => {
	const [toEmail, setToEmail] = useState(contact?.email || '');
	const [subject, setSubject] = useState('');
	const [body, setBody] = useState('');

	// Use the send message hook
	const { isSending, sendMessage } = useSendMessage({
		contact,
		channel: 'email',
		onSuccess: () => {
			// Reset form and close dialog on success
			setSubject('');
			setBody('');
			onClose();
		},
	});

	// Update toEmail when contact changes
	useEffect(() => {
		if (contact?.email) {
			setToEmail(contact.email);
		}
	}, [contact]);

	const handleSendEmail = async () => {
		await sendMessage({
			to: toEmail,
			subject: subject,
			body: body,
		});
	};

	const isInteractableElement = (target: HTMLElement) => {
		if (!target) return false;

		// Check if target is inside WordPress media modal or shadcn dialogs
		// Only prevent close if clicking inside media modal content, not on backdrop
		return !!(
			target.closest('.media-modal') ||
			target.closest('[role="dialog"]') ||
			target.closest('[data-radix-dialog-content]') ||
			target.closest('[data-radix-select-content]')
		);
	};

	// Disable Radix focus trap when modals are open
	useEffect(() => {
		if (!open) return;

		const handleFocusTrap = (e: FocusEvent) => {
			const target = e.target as HTMLElement;
			if (isInteractableElement(target)) {
				e.stopPropagation();
			}
		};

		// Listen for focus events at capture phase to intercept before Radix
		document.addEventListener('focusin', handleFocusTrap, true);
		document.addEventListener('focusout', handleFocusTrap, true);

		return () => {
			document.removeEventListener('focusin', handleFocusTrap, true);
			document.removeEventListener('focusout', handleFocusTrap, true);
		};
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogPortal>
				<DialogOverlay className="z-[150200] pointer-events-none" />
				<DialogContent
					className="max-w-[600px] z-[150200] max-h-[90vh] overflow-y-auto pointer-events-auto"
					onEscapeKeyDown={(e) => {
						// Prevent dialog from closing when WordPress media modal is open
						const mediaModal =
							document.querySelector('.media-modal');
						if (mediaModal) {
							e.preventDefault();
							return;
						}

						// Prevent dialog from closing when other dialogs are open
						const nestedDialog = document.querySelector(
							'[data-radix-dialog-content]'
						);
						if (nestedDialog && nestedDialog !== e.currentTarget) {
							e.preventDefault();
						}
					}}
					onPointerDownOutside={(e) => {
						// Allow interaction with WordPress media modal and shadcn dialogs
						const target = e.target as HTMLElement;
						if (isInteractableElement(target)) {
							e.preventDefault();
						}
					}}
					onInteractOutside={(e) => {
						// Allow interaction with WordPress media modal and shadcn dialogs
						const target = e.target as HTMLElement;
						if (isInteractableElement(target)) {
							e.preventDefault();
						}
					}}
					onFocusOutside={(e) => {
						// Allow focus to move to shadcn dialogs
						const target = e.target as HTMLElement;
						if (isInteractableElement(target)) {
							e.preventDefault();
						}
					}}
				>
					<DialogHeader>
						<DialogTitle>
							<CustomDialogHeader
								title={__('Send Email', 'quillcrm')}
								subtitle={__(
									'Send an email to the contact',
									'quillcrm'
								)}
								icon={<GradientEmailIcon />}
							/>
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4">
						<Field
							label={__('To', 'quillcrm')}
							placeholder={__('Enter To Email', 'quillcrm')}
							value={toEmail || contact?.email || ''}
							onChange={(value) => setToEmail(value)}
							type="text"
						/>
						<Field
							label={__('Subject', 'quillcrm')}
							placeholder={__('Enter Subject', 'quillcrm')}
							value={subject}
							onChange={(value) => setSubject(value)}
							type="text"
						/>
						<div>
							<Label className="text-[#09090B] font-normal text-base">
								{__('Body', 'quillcrm')}
							</Label>
							<div className="mt-2 border rounded-lg">
								<Editor
									message={body}
									onChange={(content) => setBody(content)}
								/>
							</div>
						</div>
					</div>
				<DialogFooter className="mt-4">
					<Button
						onClick={handleSendEmail}
						disabled={isSending}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isSending
							? __('Sending...', 'quillcrm')
							: __('Send Email', 'quillcrm')}
					</Button>
				</DialogFooter>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default SendEmailDialog;
