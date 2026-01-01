/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { useState, useMemo } from 'react';
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
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import MessageDetailsDialog from '@/components/message-details-dialog';

interface MessageDetailsProps {
	campaignEmail: CampaignEmail | null;
	campaignType: string | null;
	onClose: () => void;
	onResend: (email: CampaignEmail) => void;
}

const MessageDetails: React.FC<MessageDetailsProps> = ({
	campaignEmail,
	campaignType,
	onClose,
	onResend,
}) => {
	const [isResending, setIsResending] = useState(false);

	const handleResend = async () => {
		if (!campaignEmail) return;

		setIsResending(true);
		try {
			await onResend(campaignEmail);
		} finally {
			setIsResending(false);
		}
	};

	const getDialogTitle = () => {
		if (campaignType === CAMPAIGN_CHANNEL.EMAIL) {
			return __('Email Details', 'quillcrm');
		} else if (campaignType === CAMPAIGN_CHANNEL.SMS) {
			return __('SMS Details', 'quillcrm');
		} else if (campaignType === CAMPAIGN_CHANNEL.WHATSAPP) {
			return __('WhatsApp Details', 'quillcrm');
		}
		return __('Message Details', 'quillcrm');
	};

	const getDialogSubtitle = () => {
		if (campaignType === CAMPAIGN_CHANNEL.EMAIL) {
			return __('View the details of the email', 'quillcrm');
		} else if (campaignType === CAMPAIGN_CHANNEL.SMS) {
			return __('View the details of the SMS', 'quillcrm');
		} else if (campaignType === CAMPAIGN_CHANNEL.WHATSAPP) {
			return __('View the details of the WhatsApp message', 'quillcrm');
		}
		return __('View the details of the message', 'quillcrm');
	};

	const getResendButtonText = () => {
		if (isResending) {
			return __('Resending...', 'quillcrm');
		}
		if (campaignType === CAMPAIGN_CHANNEL.EMAIL) {
			return __('Resend Email again', 'quillcrm');
		} else if (campaignType === CAMPAIGN_CHANNEL.SMS) {
			return __('Resend SMS again', 'quillcrm');
		} else if (campaignType === CAMPAIGN_CHANNEL.WHATSAPP) {
			return __('Resend WhatsApp again', 'quillcrm');
		}
		return __('Resend Message again', 'quillcrm');
	};

	const detailFields = useMemo(() => {
		if (!campaignEmail) return [];

		const fields: Array<{
			label: string;
			value: React.ReactNode;
			icon?: React.ReactNode;
			hidden?: boolean;
		}> = [];

		// Subject (Email only)
		if (
			campaignType === CAMPAIGN_CHANNEL.EMAIL &&
			(campaignEmail.template?.subject || campaignEmail.activity?.data?.subject)
		) {
			fields.push({
				label: __('Subject', 'quillcrm'),
				value:
					campaignEmail.template?.subject ||
					campaignEmail.activity?.data?.subject ||
					__('No Subject', 'quillcrm'),
			});
		}

		// Sent On
		fields.push({
			label: __('Sent On', 'quillcrm'),
			value: <TimeAgoCell value={campaignEmail.sent_at} />,
		});

		// Email specific metrics
		if (campaignType === CAMPAIGN_CHANNEL.EMAIL) {
			fields.push({
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
			});

			fields.push({
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
			});
		}

		// WhatsApp specific metrics
		if (campaignType === CAMPAIGN_CHANNEL.WHATSAPP) {
			fields.push({
				label: __('Read', 'quillcrm'),
				icon: (
					<div className="bg-[#D1F6DF] p-1.5 rounded-full text-[#16A34A]">
						<OpenRateIcon width={22} height={22} />
					</div>
				),
				value: (
					<div className="flex items-center gap-2">
						{campaignEmail.status_slug === 'read' ? (
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
			});

			fields.push({
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
			});
		}

		// SMS - Show clicked
		if (campaignType === CAMPAIGN_CHANNEL.SMS) {
			fields.push({
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
			});
		}

		// Status
		fields.push({
			label: __('Status', 'quillcrm'),
			value: (
				<span
					className={`border rounded-md px-2 py-1 ${
						campaignEmail.status_slug === 'sent' ||
						campaignEmail.status_slug === 'delivered' ||
						campaignEmail.status_slug === 'read'
							? 'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]'
							: campaignEmail.status_slug === 'failed'
								? 'text-destructive bg-[#EF444429] border-destructive'
								: 'text-yellow-600 bg-yellow-50 border-yellow-600'
					}`}
				>
					{campaignEmail.status_slug}
				</span>
			),
		});

		// Failure Reason (only show when status is failed and error_info exists)
		if (
			campaignEmail.status_slug === 'failed' &&
			campaignEmail.error_info
		) {
			fields.push({
				label: __('Failure Reason', 'quillcrm'),
				value: (
					<div className="flex flex-col gap-1 text-right">
						{campaignEmail.error_info.code && (
							<span className="text-sm text-gray-500">
								{__('Code:', 'quillcrm')}{' '}
								{campaignEmail.error_info.code}
							</span>
						)}
						<span className="text-sm text-destructive max-w-[400px]">
							{campaignEmail.error_info.message ||
								__('Unknown error', 'quillcrm')}
						</span>
					</div>
				),
			});
		}

		return fields;
	}, [campaignEmail, campaignType]);

	const messageLabel =
		campaignType === CAMPAIGN_CHANNEL.EMAIL
			? __('Email Message', 'quillcrm')
			: __('Message', 'quillcrm');

	const messageContent =
		campaignEmail?.template?.body ||
		campaignEmail?.activity?.data?.body ||
		__('No content available', 'quillcrm');

	return (
		<MessageDetailsDialog
			campaignEmail={campaignEmail}
			open={!!campaignEmail}
			onClose={onClose}
			title={getDialogTitle()}
			subtitle={getDialogSubtitle()}
			detailFields={detailFields}
			messageLabel={messageLabel}
			messageContent={messageContent}
			footerButton={{
				text: getResendButtonText(),
				onClick: handleResend,
				disabled: isResending,
			}}
			zIndex={1800100}
		/>
	);
};

export default MessageDetails;
