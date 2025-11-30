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
	DialogTitle,
} from '@/components/ui/dialog';
import { CustomDialogHeader, Field, GradientSendSMSIcon } from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';
import { useSendMessage } from '@quillcrm/hooks/use-send-message';

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
	const [toPhone, setToPhone] = useState(contact?.phone || '');
	const [message, setMessage] = useState('');

	// Use the send message hook
	const { isSending, sendMessage } = useSendMessage({
		contact,
		channel: 'sms',
		onSuccess: () => {
			// Reset form and close dialog on success
			setMessage('');
			onClose();
		},
	});

	// Update toPhone when contact changes
	useEffect(() => {
		if (contact?.phone) {
			setToPhone(contact.phone);
		}
	}, [contact]);

	const handleSendSMS = async () => {
		await sendMessage({
			to: toPhone,
			body: message,
		});
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
								<GradientSendSMSIcon />
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
						disabled={true}
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
						onClick={handleSendSMS}
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
