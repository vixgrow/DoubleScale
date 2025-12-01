/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

/**
 * Internal dependencies
 */
import { useContactContext } from '../state/context';
import {
	ClickRateIcon,
	ContactTotalEmailsIcon,
	OpenRateIcon,
	ProcessingEmailsIcon,
} from '@quillcrm/components';
import ListsTagsCards from './lists-tags';
import InfoCard from './info-card';
import { UserRound, Mail, MessageSquare } from 'lucide-react';
import PhoneIcon from '@/components/icons/phone';

// Constants
const DROPDOWN_Z_INDEX = 'z-[150000]'; // High z-index to appear above modals

// Type definitions
type ChannelType = 'email' | 'sms';
type EmailStatus =
	| 'subscribed'
	| 'unsubscribed'
	| 'bounced'
	| 'blocked'
	| 'unverified';
type SmsStatus = 'subscribed' | 'unsubscribed' | 'blocked';

// Status options for each channel
const EMAIL_STATUSES: EmailStatus[] = [
	'subscribed',
	'unsubscribed',
	'bounced',
	'blocked',
	'unverified',
];
const SMS_STATUSES: SmsStatus[] = ['subscribed', 'unsubscribed', 'blocked'];

// Helper function to generate contact initials
const getContactInitials = (firstName?: string, lastName?: string): string => {
	const first = firstName?.trim().charAt(0).toUpperCase() || '';
	const last = lastName?.trim().charAt(0).toUpperCase() || '';
	return first + last || '?';
};

// Helper function to format channel status label
const getChannelStatusLabel = (channel: string, status: string): string => {
	const labels: Record<string, Record<string, string>> = {
		email: {
			subscribed: __('Subscribed', 'quillcrm'),
			unsubscribed: __('Unsubscribed', 'quillcrm'),
			bounced: __('Bounced', 'quillcrm'),
			blocked: __('Blocked', 'quillcrm'),
			unverified: __('Unverified', 'quillcrm'),
		},
		sms: {
			subscribed: __('Subscribed', 'quillcrm'),
			unsubscribed: __('Unsubscribed', 'quillcrm'),
			blocked: __('Blocked', 'quillcrm'),
		},
	};

	return labels[channel]?.[status] || `${channel}_${status}`;
};

// Helper function to get channel display label
const getChannelDisplayLabel = (channel: string): string => {
	const channels: Record<string, string> = {
		email: __('Email', 'quillcrm'),
		sms: __('SMS', 'quillcrm'),
	};

	return channels[channel] || channel;
};

// Helper function to get status styling classes
const getStatusClasses = (status: string): string => {
	switch (status?.toLowerCase()) {
		case 'subscribed':
			return 'border-[#16A34A] text-[#16A34A] bg-[#EFFFF5]';
		case 'unsubscribed':
			return 'border-[#1C1D22] text-[#1C1D22] bg-[#FFF2E2]';
		case 'bounced':
			return 'border-[#5570F1] text-[#5570F1] bg-[#5570F129]';
		case 'unverified':
			return 'border-[#CC5F5F] text-[#CC5F5F] bg-[#F57E7729]';
		case 'blocked':
			return 'border-gray-600 text-gray-600 bg-gray-100';
		default:
			return 'border-gray-600 text-gray-600 bg-gray-100';
	}
};

// Reusable StatusSelect component
interface StatusSelectProps {
	channel: ChannelType;
	value: string;
	onChange: (value: string) => void;
	statuses: readonly string[];
}

const StatusSelect: React.FC<StatusSelectProps> = ({
	channel,
	value,
	onChange,
	statuses,
}) => {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className={`w-fit h-10 ${getStatusClasses(value)}`}>
				<div className="flex items-center gap-1">
					{getChannelDisplayLabel(channel)}:{' '}
					{getChannelStatusLabel(channel, value)}
				</div>
			</SelectTrigger>
			<SelectContent
				position="popper"
				sideOffset={5}
				className={DROPDOWN_Z_INDEX}
			>
				{statuses.map((status) => (
					<SelectItem
						key={status}
						value={status}
						className="cursor-pointer"
					>
						{getChannelStatusLabel(channel, status)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

const ContactInformation: React.FC = () => {
	const { contact, setContact, updateContact, emailAnalytics, showNotice } =
		useContactContext();
	const [isSendingOptIn, setIsSendingOptIn] = useState(false);
	const [optInSent, setOptInSent] = useState(false);

	const sendOptInEmail = async () => {
		if (!contact || isSendingOptIn || optInSent) {
			return;
		}

		setIsSendingOptIn(true);
		try {
			await apiFetch({
				path: `/qc/v1/contacts/${contact.id}/send-opt-in`,
				method: 'POST',
			});

			// Mark as sent FIRST - before showing notification
			setOptInSent(true);

			// Show success notification using the parent's notice system
			if (showNotice) {
				showNotice({
					type: 'success',
					message: __('Opt-in email sent successfully', 'quillcrm'),
				});
			}
		} catch (error: any) {
			// Show error notification
			const errorMessage =
				error.message || __('Failed to send opt-in email', 'quillcrm');
			if (showNotice) {
				showNotice({
					type: 'error',
					message: errorMessage,
				});
			}
			console.error('Error sending opt-in email:', error);
		} finally {
			// Only set to false if not sent (to prevent re-enabling on success)
			if (!optInSent) {
				setIsSendingOptIn(false);
			}
		}
	};

	const handleEmailStatusChange = (value: string) => {
		if (!contact) return;
		setContact({
			...contact,
			email_status: value,
		});
		updateContact({ email_status: value });
	};

	const handleSmsStatusChange = (value: string) => {
		if (!contact) return;
		setContact({
			...contact,
			sms_status: value,
		});
		updateContact({ sms_status: value });
	};

	if (!contact) {
		return (
			<Card className="flex-1 bg-[#F8F8F8] shadow-none">
				<CardContent>
					<div className="qcrm-contact-information">
						{__('No contact information available', 'quillcrm')}
					</div>
				</CardContent>
			</Card>
		);
	}

	const fullName =
		`${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
		contact.email;

	const initials = getContactInitials(contact.first_name, contact.last_name);
	// TODO: Add avatar_url to Contact type definition
	const avatarUrl = (contact as any).avatar_url;

	// Calculate email analytics
	const totalEmails = emailAnalytics?.total_sent || 0;
	const totalOpened = emailAnalytics?.total_opened || 0;
	const totalClicked = emailAnalytics?.total_clicked || 0;

	const openRate = emailAnalytics?.open_rate?.toFixed(1) || '0.0';
	const clickRate = emailAnalytics?.click_rate?.toFixed(1) || '0.0';

	return (
		<Card className="w-1/3 bg-[#F8F8F8] shadow-none">
			<CardHeader>
				<div className="border-b pb-4">
					<div className="flex items-center gap-4">
						<Avatar className="w-28 h-28 border">
							{avatarUrl ? (
								<AvatarImage
									src={avatarUrl}
									alt={fullName}
									className="rounded-full"
								/>
							) : null}
							<AvatarFallback className="bg-[#E3EEFF99] text-secondary font-bold text-2xl">
								{initials || (
									<UserRound className="w-12 h-12" />
								)}
							</AvatarFallback>
						</Avatar>
						<div className="w-full min-w-0">
							<CardTitle className="text-xl font-semibold break-words mb-2">
								{fullName}
							</CardTitle>

							<div className="my-3">
								{contact.email && (
									<div className="flex gap-2 items-start min-w-0">
										<div className="flex-shrink-0">
											<ProcessingEmailsIcon
												width={24}
												height={24}
											/>
										</div>
										<span
											className="text-base font-medium break-words min-w-0"
											style={{
												overflowWrap: 'anywhere',
												wordBreak: 'break-word',
											}}
										>
											{contact.email}
										</span>
									</div>
								)}
							</div>
							{contact.phone && (
								<span className="text-base font-medium text-[#CB5301] flex gap-2 items-center">
									<PhoneIcon />
									{contact.phone}
								</span>
							)}
							{contact.email_status === 'unverified' && (
								<div className="mt-3">
									<Button
										size="sm"
										variant="outline"
										className="h-7 text-xs gap-1"
										disabled={isSendingOptIn || optInSent}
										onClick={sendOptInEmail}
									>
										<Mail className="w-3 h-3" />
										{isSendingOptIn
											? __('Sending...', 'quillcrm')
											: optInSent
												? __('Email Sent', 'quillcrm')
												: __(
														'Send Opt-in Email',
														'quillcrm'
													)}
									</Button>
								</div>
							)}
							<div className="mt-3 flex items-center gap-3">
								<div className="flex gap-1 items-center border-r pr-3">
									<div className="bg-[#E4EEFD] text-[#458DC7] p-1.5 rounded-full">
										<ContactTotalEmailsIcon />
									</div>
									<span className="text-primary text-base font-semibold">
										{totalEmails}
									</span>
								</div>
								<div className="flex gap-1 items-center border-r pr-3">
									<div className="bg-[#D1F6DF] text-[#16A34A] p-1.5 rounded-full">
										<OpenRateIcon />
									</div>
									<span className="text-primary text-base font-semibold">
										{openRate}%
									</span>
								</div>
								<div className="flex gap-1 items-center">
									<div className="bg-[#EEE4FF] text-[#660FF1] p-1.5 rounded-full">
										<ClickRateIcon />
									</div>
									<span className="text-primary text-base font-semibold">
										{clickRate}%
									</span>
								</div>
							</div>
						</div>
					</div>
					<div className="flex gap-5 items-center mt-4">
						<StatusSelect
							channel="email"
							value={contact.email_status}
							onChange={handleEmailStatusChange}
							statuses={EMAIL_STATUSES}
						/>
						<StatusSelect
							channel="sms"
							value={contact.sms_status}
							onChange={handleSmsStatusChange}
							statuses={SMS_STATUSES}
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				<ListsTagsCards />
				<InfoCard />
			</CardContent>
		</Card>
	);
};

export default ContactInformation;
