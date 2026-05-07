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
import type { CampaignEmail } from '@doublescale/client';
import {
	ClickRateIcon,
	NoEmailsIcon,
	NotOpenedIcon,
	OpenedIcon,
	OpenRateIcon,
	TimeAgoCell,
} from '@doublescale/components';
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
				label: __('Subject', 'doublescale'),
				value: (() => {
					// Try template subject first (for campaign emails)
					const templateSubject = campaignEmail.template?.subject;
					// Then try activity subject (for individual emails)
					const activitySubject = campaignEmail.activity?.data?.subject;
					
					// Return the first non-empty value
					return (
						(templateSubject && templateSubject.trim()) ||
						(activitySubject && activitySubject.trim()) ||
						__('No Subject', 'doublescale')
					);
				})(),
			},
			{
				label: __('Sent On', 'doublescale'),
				value: <TimeAgoCell value={campaignEmail.sent_at} />,
			},
			{
				label: __('Opened', 'doublescale'),
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
								{__('Yes', 'doublescale')}
							</>
						) : (
							<>
								<div className="text-destructive">
									<NotOpenedIcon />
								</div>
								{__('No', 'doublescale')}
							</>
						)}
					</div>
				),
			},
			{
				label: __('Clicked', 'doublescale'),
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
								{__('Yes', 'doublescale')}
							</>
						) : (
							<>
								<div className="text-destructive">
									<NotOpenedIcon />
								</div>
								{__('No', 'doublescale')}
							</>
						)}
					</div>
				),
			},
			{
				label: __('Status', 'doublescale'),
				value: (
					<span
						className={`border rounded-md px-2 py-1 ${
							campaignEmail.status_slug === 'sent'
								? 'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]'
								: 'text-destructive bg-[#EF444429] border-destructive'
						}`}
					>
						{campaignEmail.status_slug === 'sent'
							? __('Sent', 'doublescale')
							: __('Failed', 'doublescale')}
					</span>
				),
			},
			{
				label: __('Campaign', 'doublescale'),
				value: campaignEmail.campaign?.name,
				hidden: !campaignEmail.campaign,
			},
		];
	}, [campaignEmail]);

	const messageContent =
		campaignEmail?.template?.body ||
		campaignEmail?.activity?.data?.body ||
		__('No content available', 'doublescale');

	return (
		<MessageDetailsDialog
			campaignEmail={campaignEmail}
			open={!!campaignEmail}
			onClose={onClose}
			title={__('Email Details', 'doublescale')}
			subtitle={__('View the details of the email', 'doublescale')}
			detailFields={detailFields}
			messageLabel={__('Email Message', 'doublescale')}
			messageContent={messageContent}
			footerButton={{
				text: isResending
					? __('Resending...', 'doublescale')
					: __('Resend Email again', 'doublescale'),
				onClick: handleResendClick,
				disabled: isResending,
			}}
			zIndex={150200}
		/>
	);
};

export default EmailDetails;
