/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

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
import { CustomDialogHeader, TimeAgoCell, GradientSendSMSIcon } from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';

interface SMSDetailsProps {
	smsMessage: TrackedMessage | null;
	onClose: () => void;
}

const SMSDetails: React.FC<SMSDetailsProps> = ({ smsMessage, onClose }) => {
	const [isResending, setIsResending] = useState(false);

	const resendSMS = () => {
		setIsResending(true);
		console.log(smsMessage);
	};

	return (
		<Dialog open={!!smsMessage} onOpenChange={(open) => !open && onClose()}>
			<DialogOverlay className="z-[1700000]" />
			<DialogContent className="max-w-[500px] z-[1700000]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('SMS Details', 'quillcrm')}
							subtitle={__(
								'View the details of the SMS',
								'quillcrm'
							)}
							icon={
								<GradientSendSMSIcon />
							}
						/>
					</DialogTitle>
				</DialogHeader>
				{smsMessage && (
					<div className="flex flex-col gap-5 w-full">
						<div className="flex flex-col gap-4 w-full">
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500">
									{__('Recipient', 'quillcrm')}
								</span>
								<span className="text-xl font-semibold">
									{smsMessage.recipient}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500">
									{__('Sent On', 'quillcrm')}
								</span>
								<span className="text-xl font-semibold">
									<TimeAgoCell value={smsMessage.sent_at} />
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500 flex items-center gap-2">
									{__('Clicked', 'quillcrm')}
								</span>
								<div>
									{smsMessage.clicked != '0' ? (
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
											smsMessage.status_slug === 'sent' ||
											smsMessage.status_slug ===
												'delivered'
												? 'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]'
												: 'text-destructive bg-[#EF444429] border-destructive'
										}`}
									>
										{smsMessage.status_name ||
											smsMessage.status_slug}
									</span>
								</div>
							</div>
							{smsMessage.campaign && (
								<div className="flex justify-between items-center">
									<span className="text-base font-medium text-gray-500">
										{__('Campaign', 'quillcrm')}
									</span>
									<span className="text-xl font-semibold">
										{smsMessage.campaign.name}
									</span>
								</div>
							)}
						</div>
						<div className="flex flex-col gap-2 w-full">
							<div className="text-base font-medium text-gray-500">
								{__('SMS Message', 'quillcrm')}
							</div>
							<div className="p-4 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
								{smsMessage.template?.body ||
									smsMessage.message?.body ||
									''}
							</div>
						</div>
					</div>
				)}
				<DialogFooter className="mt-6">
					<Button
						onClick={resendSMS}
						disabled={isResending}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isResending
							? __('Resending...', 'quillcrm')
							: __('Resend SMS again', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SMSDetails;
