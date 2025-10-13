/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
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
	DialogTitle,
} from '@/components/ui/dialog';
import { CustomDialogHeader, Field } from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface SendWhatsAppDialogProps {
	open: boolean;
	onClose: () => void;
	contact: Contact | null;
}

const SendWhatsAppDialog: React.FC<SendWhatsAppDialogProps> = ({
	open,
	onClose,
	contact,
}) => {
	const { createNotice } = useDispatch('quillcrm/core');
	const [toPhone, setToPhone] = useState(contact?.phone || '');
	const [message, setMessage] = useState('');
	const [isSending, setIsSending] = useState(false);

	// Update toPhone when contact changes
	useEffect(() => {
		if (contact?.phone) {
			setToPhone(contact.phone);
		}
	}, [contact]);

	const sendWhatsApp = async () => {
		if (!contact?.id) {
			createNotice({
				type: 'error',
				message: __('Contact not found', 'quillcrm'),
			});
			return;
		}

		if (!toPhone || !message) {
			createNotice({
				type: 'error',
				message: __('Please fill in all fields', 'quillcrm'),
			});
			return;
		}

		// Basic phone validation
		if (toPhone.length < 10) {
			createNotice({
				type: 'error',
				message: __(
					'Please enter a valid phone number (E.164 format: +1234567890)',
					'quillcrm'
				),
			});
			return;
		}

		setIsSending(true);
		try {
			await apiFetch({
				path: `/qc/v1/contacts/${contact.id}/send-message`,
				method: 'POST',
				data: {
					channel: 'whatsapp',
					to: toPhone,
					body: message,
				},
			});

			createNotice({
				type: 'success',
				message: __('WhatsApp message sent successfully!', 'quillcrm'),
			});

			// Reset form
			setMessage('');

			onClose();
		} catch (error: any) {
			// Extract error message from various possible error formats
			let errorMessage = __(
				'Failed to send WhatsApp message',
				'quillcrm'
			);

			if (error.message) {
				errorMessage = error.message;
			} else if (error.data?.message) {
				errorMessage = error.data.message;
			} else if (typeof error === 'string') {
				errorMessage = error;
			}

			createNotice({
				type: 'error',
				message: errorMessage,
			});
		} finally {
			setIsSending(false);
		}
	};

	// Character count
	const charCount = message.length;

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogOverlay className="z-[1700000]" />
			<DialogContent className="max-w-[500px] z-[1700000]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('Send WhatsApp', 'quillcrm')}
							subtitle={__(
								'Send a WhatsApp message to the contact',
								'quillcrm'
							)}
							icon={
								<MessageCircle className="w-6 h-6 text-green-600" />
							}
						/>
					</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<Field
						label={__('To', 'quillcrm')}
						placeholder={__(
							'Enter phone number (+1234567890)',
							'quillcrm'
						)}
						value={toPhone || contact?.phone || ''}
						onChange={(value) => setToPhone(value)}
						type="text"
					/>
					<div>
						<Field
							label={__('Message', 'quillcrm')}
							placeholder={__(
								'Enter your WhatsApp message...',
								'quillcrm'
							)}
							value={message}
							onChange={(value) => setMessage(value)}
							type="text"
						/>
						<div className="text-xs text-gray-500 mt-1">
							{charCount} {__('characters', 'quillcrm')}
						</div>
					</div>
				</div>
				<DialogFooter className="mt-6">
					<Button
						onClick={sendWhatsApp}
						disabled={isSending}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isSending
							? __('Sending...', 'quillcrm')
							: __('Send WhatsApp', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SendWhatsAppDialog;
