/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { useState } from 'react';		
/**
 * Internal dependencies
 */
import type { CampaignEmail } from '@quillcrm/client';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	ClickRateIcon,
	CustomDialogHeader,
	GradientEmailIcon,
	NotOpenedIcon,
	OpenedIcon,
	TimeAgoCell,
} from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';


interface EmailDetailsProps {
	campaignEmail: CampaignEmail | null;
	onClose: () => void;
}

const EmailDetails: React.FC<EmailDetailsProps> = ({
	campaignEmail,
	onClose,
}) => {
	const [isResending, setIsResending] = useState(false);

	const resendEmail = () => {
		setIsResending(true);
		console.log(campaignEmail);
	};
	return (
		<Dialog
			open={!!campaignEmail}
			onOpenChange={(open) => !open && onClose()}
		>
			<DialogOverlay className="z-[1700000]"/>
			<DialogContent className="max-w-[500px] z-[1700000]">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('Email Details', 'quillcrm')}
							subtitle={__(
								'View the details of the email',
								'quillcrm'
							)}
							icon={<GradientEmailIcon />}
						/>
					</DialogTitle>
				</DialogHeader>
				{campaignEmail && (
					<div className="flex flex-col gap-5 w-full">
						<div className="flex flex-col gap-4 w-full">
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500">
									{__('Subject', 'quillcrm')}
								</span>
								<span className="text-xl font-semibold">
									{campaignEmail.template.subject}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500">
									{__('Sent On', 'quillcrm')}
								</span>
								<span className="text-xl font-semibold">
									<TimeAgoCell
										value={campaignEmail.sent_at}
									/>
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500 flex items-center gap-2">
									<div className="bg-[#EEE4FF] p-1.5 rounded-full">
										<ClickRateIcon width={16} height={19} />
									</div>
									{__('Clicked', 'quillcrm')}
								</span>
								<div>
									{campaignEmail.clicked != '0' ? (
										<span className="text-xl font-semibold">
											<div className="text-green-600">
												<OpenedIcon />
											</div>
											{__('Yes', 'quillcrm')}
										</span>
									) : (
										<span className="text-xl font-semibold">
											<div className="text-destructive">
												<NotOpenedIcon />
											</div>
											{__('No', 'quillcrm')}
										</span>
									)}
								</div>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-base font-medium text-gray-500">
									{__('Opened', 'quillcrm')}
								</span>
								<div>
									{campaignEmail.opened != '0' ? (
										<span className="text-xl font-semibold">
											<div className="text-green-600">
												<OpenedIcon />
											</div>
											{__('Yes', 'quillcrm')}
										</span>
									) : (
										<span className="text-xl font-semibold">
											<div className="text-destructive">
												<NotOpenedIcon />
											</div>
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
											campaignEmail.status === 'sent'
												? 'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]'
												: 'text-destructive bg-[#EF444429] border-destructive'
										}`}
									>
										{campaignEmail.status === 'sent'
											? __('Sent', 'quillcrm')
											: __('Failed', 'quillcrm')}
									</span>
								</div>
							</div>
							{campaignEmail.campaign && (
								<div className="flex justify-between items-center">
									<span className="text-base font-medium text-gray-500">
										{__('Campaign', 'quillcrm')}
									</span>
									<span className="text-xl font-semibold">
										{campaignEmail.campaign.name}
									</span>
								</div>
							)}
						</div>
						<div className="flex flex-col gap-2 w-full">
							<div className="text-base font-medium text-gray-500">
								{__('Email Message', 'quillcrm')}
							</div>
							<div
								dangerouslySetInnerHTML={{
									__html: campaignEmail.template.body,
								}}
							/>
						</div>
					</div>
				)}
				<DialogFooter className="mt-6">
					<Button
						onClick={resendEmail}
						disabled={isResending}
						size="xl"
						variant="gradient"
						className="w-full"
					>
						{isResending
							? __('Resending...', 'quillcrm')
							: __('Resend Email again', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default EmailDetails;
