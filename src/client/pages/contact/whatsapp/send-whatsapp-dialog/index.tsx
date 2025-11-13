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
import { CustomDialogHeader, Field } from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useSendMessage } from '@quillcrm/hooks/use-send-message';

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
	const [toPhone, setToPhone] = useState(contact?.phone || '');
	const [message, setMessage] = useState('');

	// Use the send message hook
	const { isSending, sendMessage } = useSendMessage({
		contact,
		channel: 'whatsapp',
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

	const handleSendWhatsApp = async () => {
		await sendMessage({
			to: toPhone,
			body: message,
		});
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
						onClick={handleSendWhatsApp}
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
