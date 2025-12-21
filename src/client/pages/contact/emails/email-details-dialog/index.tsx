/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { useMemo, useCallback } from 'react';
/**
 * Internal dependencies
 */
import type { CampaignEmail } from '@quillcrm/client';
import {
	ClickRateIcon,
	NoEmailsIcon,
	NotOpenedIcon,
	OpenedIcon,
	OpenRateIcon,
	TimeAgoCell,
} from '@quillcrm/components';
import MessageDetailsDialog from '@/components/message-details-dialog';
import { useResendEmail } from '@/hooks/use-resend-email';
import { useContactContext } from '../../state/context';

interface EmailDetailsProps {
	campaignEmail: CampaignEmail | null;
	onClose: () => void;
	onResendSuccess?: () => void;
}

const EmailDetails: React.FC<EmailDetailsProps> = ({
	campaignEmail,
	onClose,
	onResendSuccess,
}) => {
	const { contact } = useContactContext();

	// Use the resend email hook
	const { isResending, resendEmail } = useResendEmail({
		contact,
		onSuccess: onResendSuccess,
	});

	// Handle resend button click
	const handleResendClick = useCallback(() => {
		if (campaignEmail) {
			resendEmail(campaignEmail);
		}
	}, [campaignEmail, resendEmail]);

	const detailFields = useMemo(() => {
		if (!campaignEmail) return [];

		return [
			{
				label: __('Subject', 'quillcrm'),
				value: (() => {
					// Try template subject first (for campaign emails)
					const templateSubject = campaignEmail.template?.subject;
					// Then try activity subject (for individual emails)
					const activitySubject = campaignEmail.activity?.data?.subject;
					
					// Return the first non-empty value
					return (
						(templateSubject && templateSubject.trim()) ||
						(activitySubject && activitySubject.trim()) ||
						__('No Subject', 'quillcrm')
					);
				})(),
			},
			{
				label: __('Sent On', 'quillcrm'),
				value: <TimeAgoCell value={campaignEmail.sent_at} />,
			},
			{
				label: __('Opened', 'quillcrm'),
				icon: (
					<div className="bg-[#D1F6DF] p-1.5 rounded-full text-[#16A34A]">
						<OpenRateIcon width={22} height={22} />
					</div>
				),
				value: (
					<div className="flex items-center gap-2">
						{campaignEmail.opened != '0' ? (
							<>
								<div className="text-green-600">
									<OpenedIcon />
								</div>
								{__('Yes', 'quillcrm')}
							</>
						) : (
							<>
								<div className="text-destructive">
									<NotOpenedIcon />
								</div>
								{__('No', 'quillcrm')}
							</>
						)}
					</div>
				),
			},
			{
				label: __('Clicked', 'quillcrm'),
				icon: (
					<div className="bg-[#EEE4FF] p-1.5 rounded-full text-[#660FF1]">
						<ClickRateIcon width={22} height={22} />
					</div>
				),
				value: (
					<div className="flex items-center gap-2">
						{campaignEmail.clicked != '0' ? (
							<>
								<div className="text-green-600">
									<OpenedIcon />
								</div>
								{__('Yes', 'quillcrm')}
							</>
						) : (
							<>
								<div className="text-destructive">
									<NotOpenedIcon />
								</div>
								{__('No', 'quillcrm')}
							</>
						)}
					</div>
				),
			},
			{
				label: __('Status', 'quillcrm'),
				value: (
					<span
						className={`border rounded-md px-2 py-1 ${
							campaignEmail.status_slug === 'sent'
								? 'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]'
								: 'text-destructive bg-[#EF444429] border-destructive'
						}`}
					>
						{campaignEmail.status_slug === 'sent'
							? __('Sent', 'quillcrm')
							: __('Failed', 'quillcrm')}
					</span>
				),
			},
			{
				label: __('Campaign', 'quillcrm'),
				value: campaignEmail.campaign?.name,
				hidden: !campaignEmail.campaign,
			},
		];
	}, [campaignEmail]);

	const messageContent =
		campaignEmail?.template?.body ||
		campaignEmail?.activity?.data?.body ||
		__('No content available', 'quillcrm');

	return (
		<MessageDetailsDialog
			campaignEmail={campaignEmail}
			open={!!campaignEmail}
			onClose={onClose}
			title={__('Email Details', 'quillcrm')}
			subtitle={__('View the details of the email', 'quillcrm')}
			detailFields={detailFields}
			messageLabel={__('Email Message', 'quillcrm')}
			messageContent={messageContent}
			footerButton={{
				text: isResending
					? __('Resending...', 'quillcrm')
					: __('Resend Email again', 'quillcrm'),
				onClick: handleResendClick,
				disabled: isResending,
			}}
			zIndex={150200}
		/>
	);
};

export default EmailDetails;
