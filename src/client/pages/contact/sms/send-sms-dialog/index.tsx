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
import { MessageSquare } from 'lucide-react';

interface SendSMSDialogProps {
	open: boolean;
	onClose: () => void;
	contact: Contact | null;
}

const SendSMSDialog: React.FC<SendSMSDialogProps> = ({
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

	const sendSMS = async () => {
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
					channel: 'sms',
					to: toPhone,
					body: message,
				},
			});

			createNotice({
				type: 'success',
				message: __('SMS sent successfully!', 'quillcrm'),
			});

			// Reset form
			setMessage('');

			onClose();
		} catch (error: any) {
			// Extract error message from various possible error formats
			let errorMessage = __('Failed to send SMS', 'quillcrm');

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

	// Character count for SMS (standard limit is 160 for single SMS, 1600 for concatenated)
	const charCount = message.length;
	const smsCount = Math.ceil(charCount / 160);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogOverlay className="z-[1700000]" />
			<DialogContent className="max-w-[500px] z-[1700000]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('Send SMS', 'quillcrm')}
							subtitle={__(
								'Send an SMS message to the contact',
								'quillcrm'
							)}
							icon={
								<MessageSquare className="w-6 h-6 text-primary" />
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
								'Enter your message...',
								'quillcrm'
							)}
							value={message}
							onChange={(value) => setMessage(value)}
							type="text"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>
								{charCount} {__('characters', 'quillcrm')}
							</span>
							<span>
								{smsCount} SMS{' '}
								{smsCount === 1
									? __('segment', 'quillcrm')
									: __('segments', 'quillcrm')}
							</span>
						</div>
					</div>
				</div>
				<DialogFooter className="mt-6">
					<Button
						onClick={sendSMS}
						disabled={isSending}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isSending
							? __('Sending...', 'quillcrm')
							: __('Send SMS', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SendSMSDialog;
