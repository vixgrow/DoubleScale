/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { MessageCircle } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { TrackedMessage } from '@quillcrm/client';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import { CustomDialogHeader, TimeAgoCell } from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';

interface WhatsAppDetailsProps {
	whatsappMessage: TrackedMessage | null;
	onClose: () => void;
}

const WhatsAppDetails: React.FC<WhatsAppDetailsProps> = ({
	whatsappMessage,
	onClose,
}) => {
	const [isResending, setIsResending] = useState(false);

	const resendWhatsApp = () => {
		setIsResending(true);
		console.log(whatsappMessage);
	};

	return (
		<Dialog
			open={!!whatsappMessage}
			onOpenChange={(open) => !open && onClose()}
		>
			<DialogOverlay className="z-[1700000]" />
			<DialogContent className="max-w-[500px] z-[1700000]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('WhatsApp Details', 'quillcrm')}
							subtitle={__(
								'View the details of the WhatsApp message',
								'quillcrm'
							)}
							icon={
								<MessageCircle className="w-6 h-6 text-green-600" />
							}
						/>
					</DialogTitle>
				</DialogHeader>
				{whatsappMessage && (
					<div className="flex flex-col gap-5 w-full">
						<div className="flex flex-col gap-4 w-full">
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500">
									{__('Recipient', 'quillcrm')}
								</span>
								<span className="text-xl font-semibold">
									{whatsappMessage.recipient}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500">
									{__('Sent On', 'quillcrm')}
								</span>
								<span className="text-xl font-semibold">
									<TimeAgoCell
										value={whatsappMessage.sent_at}
									/>
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500 flex items-center gap-2">
									{__('Clicked', 'quillcrm')}
								</span>
								<div>
									{whatsappMessage.clicked != '0' ? (
										<span className="text-xl font-semibold text-green-600">
											{__('Yes', 'quillcrm')}
										</span>
									) : (
										<span className="text-xl font-semibold text-gray-500">
											{__('No', 'quillcrm')}
										</span>
									)}
								</div>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500">
									{__('Status', 'quillcrm')}
								</span>
								<div className="flex items-center gap-2">
									<span
										className={`border rounded-md px-2 py-1 ${
											whatsappMessage.status_slug ===
												'sent' ||
											whatsappMessage.status_slug ===
												'delivered' ||
											whatsappMessage.status_slug ===
												'read'
												? 'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]'
												: 'text-destructive bg-[#EF444429] border-destructive'
										}`}
									>
										{whatsappMessage.status_name ||
											whatsappMessage.status_slug}
									</span>
								</div>
							</div>
							{whatsappMessage.campaign && (
								<div className="flex justify-between items-center">
									<span className="text-base font-medium text-gray-500">
										{__('Campaign', 'quillcrm')}
									</span>
									<span className="text-xl font-semibold">
										{whatsappMessage.campaign.name}
									</span>
								</div>
							)}
						</div>
						<div className="flex flex-col gap-2 w-full">
							<div className="text-base font-medium text-gray-500">
								{__('WhatsApp Message', 'quillcrm')}
							</div>
							<div className="p-4 bg-green-50 rounded-md text-sm whitespace-pre-wrap">
								{whatsappMessage.template?.body ||
									whatsappMessage.message?.body ||
									''}
							</div>
						</div>
					</div>
				)}
				<DialogFooter className="mt-6">
					<Button
						onClick={resendWhatsApp}
						disabled={isResending}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isResending
							? __('Resending...', 'quillcrm')
							: __('Resend WhatsApp again', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default WhatsAppDetails;
