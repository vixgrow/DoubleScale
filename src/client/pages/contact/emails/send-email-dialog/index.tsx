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
import type { Contact } from '@doublescale/client';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	CustomDialogHeader,
	Field,
	GradientEmailIcon,
	Editor,
} from '@doublescale/components';
import { Button } from '@doublescale/components/ui/button';
import { Label } from '@doublescale/components/ui/label';
import { useSendMessage } from '@doublescale/hooks/use-send-message';
import { isWordPressMediaElement } from '@doublescale/shared/utils/wordpress-media-modal';
import type { EmailRow } from '@doublescale/utils';

interface SendEmailDialogProps {
	open: boolean;
	onClose: () => void;
	contact: Contact | null;
	/** Passed from parent when replying to a thread (optional UI hook-up). */
	replyTo?: EmailRow | null;
}

const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
	open,
	onClose,
	contact,
	replyTo: _replyTo,
}) => {
	const [toEmail, setToEmail] = useState(contact?.email || '');
	const [subject, setSubject] = useState('');
	const [body, setBody] = useState('');

	const { isSending, sendMessage, validationError } = useSendMessage({
		contact,
		channel: 'email',
		onSuccess: () => {
			setSubject('');
			setBody('');
			onClose();
		},
	});

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

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent
				className="z-[150200] flex min-w-0 w-[min(calc(100vw-2rem),600px)] max-w-[min(calc(100vw-2rem),600px)] max-h-[90vh] flex-col overflow-x-hidden overflow-y-auto"
				onEscapeKeyDown={(e) => {
					if (document.querySelector('.media-modal')) {
						e.preventDefault();
					}
				}}
				onPointerDownOutside={(e) => {
					if (isWordPressMediaElement(e.target as HTMLElement)) {
						e.preventDefault();
					}
				}}
				onInteractOutside={(e) => {
					if (isWordPressMediaElement(e.target as HTMLElement)) {
						e.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('Send Email', 'doublescale')}
							subtitle={__(
								'Send an email to the contact',
								'doublescale'
							)}
							icon={<GradientEmailIcon />}
						/>
					</DialogTitle>
				</DialogHeader>
				<div className="flex min-w-0 flex-col gap-4 overflow-x-hidden">
					{validationError && (
						<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
							{validationError}
						</div>
					)}
					<Field
						label={__('To', 'doublescale')}
						placeholder={__('Enter To Email', 'doublescale')}
						value={toEmail || contact?.email || ''}
						onChange={(value) => setToEmail(value)}
						type="text"
						disabled={true}
					/>
					<Field
						label={__('Subject', 'doublescale')}
						placeholder={__('Enter Subject', 'doublescale')}
						value={subject}
						onChange={(value) => setSubject(value)}
						type="text"
					/>
					<div className="min-w-0 max-w-full">
						<Label className="text-base font-normal text-[#09090B]">
							{__('Body', 'doublescale')}
						</Label>
						<div className="send-email-dialog-editor !border-0 mt-2 min-w-0 max-w-full overflow-hidden max-sm:[&_.email-body-editor]:max-w-full max-sm:[&_.email-body-editor_.editor-container]:max-w-full max-sm:[&_.toolbar]:flex-col max-sm:[&_.toolbar]:gap-2 max-sm:[&_.toolbar]:p-3 max-sm:[&_.toolbar>div]:w-full max-sm:[&_.toolbar>div]:flex-wrap max-sm:[&_.toolbar>div]:justify-center max-sm:[&_.editor-inner]:min-w-0 max-sm:[&_.editor-inner]:overflow-x-hidden max-sm:[&_.editor-input]:break-words max-sm:[&_.editor-input_img]:h-auto max-sm:[&_.editor-input_img]:max-w-full">
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
							? __('Sending...', 'doublescale')
							: __('Send Email', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SendEmailDialog;
