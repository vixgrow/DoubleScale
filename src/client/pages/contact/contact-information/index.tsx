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
	SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

/**
 * Internal dependencies
 */
import { useContactContext } from '../state/context';
import {
	ClickRateIcon,
	ContactTotalEmailsIcon,
	OpenRateIcon,
} from '@quillcrm/components';
import ListsTagsCards from './lists-tags';
import InfoCard from './info-card';
import { UserRound, Mail } from 'lucide-react';

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
			const errorMessage = error.message || __('Failed to send opt-in email', 'quillcrm');
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

	// Calculate email analytics
	const totalEmails = emailAnalytics?.total_sent || 0;
	const totalOpened = emailAnalytics?.total_opened || 0;
	const totalClicked = emailAnalytics?.total_clicked || 0;

	const calculatePercentage = (total: number, value: number) => {
		if (total === 0) {
			return '0';
		}
		return ((value / total) * 100).toFixed(1);
	};

	const openRate = calculatePercentage(totalEmails, totalOpened);
	const clickRate = calculatePercentage(totalEmails, totalClicked);

	// Get status colors
	const getStatusClasses = (status: string) => {
		switch (status?.toLowerCase()) {
			case 'subscribed':
				return 'border-[#16A34A] text-[#16A34A] bg-[#EFFFF5]';
			case 'unsubscribed':
				return 'border-[#1C1D22] text-[#1C1D22] bg-[#FFF2E2]';
			case 'bounced':
				return 'border-[#5570F1] text-[#5570F1] bg-[#5570F129]';
			case 'unverified':
				return 'border-[#CC5F5F] text-[#CC5F5F] bg-[#F57E7729]';
			default:
				return 'border-gray-600 text-gray-600 bg-gray-100';
		}
	};

	return (
		<Card className="w-1/3 bg-[#F8F8F8] shadow-none">
			<CardHeader>
				<div className="flex items-center gap-4 border-b pb-4">
					<Avatar className="w-28 h-28 border">
						<AvatarFallback className="bg-transparent">
							<UserRound className="w-12 h-12" />
						</AvatarFallback>
					</Avatar>
					<div className="w-full">
						<div className="flex justify-between items-center gap-2">
							<CardTitle className="text-xl font-semibold truncate max-w-[168px]">
								{fullName}
							</CardTitle>
							<Select
								value={contact.status}
								onValueChange={(value) => {
									setContact({
										...contact,
										status: value,
									});
									updateContact({ status: value });
								}}
							>
								<SelectTrigger
									className={`w-[120px] h-8 ${getStatusClasses(contact.status)}`}
								>
									<SelectValue
										placeholder={__(
											'Select status',
											'quillcrm'
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="unverified">
										{__('Unverified', 'quillcrm')}
									</SelectItem>
									<SelectItem value="subscribed">
										{__('Subscribed', 'quillcrm')}
									</SelectItem>
									<SelectItem value="unsubscribed">
										{__('Unsubscribed', 'quillcrm')}
									</SelectItem>
									<SelectItem value="bounced">
										{__('Bounced', 'quillcrm')}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="mt-2">
							{contact.email && (
								<span className="text-base font-medium">
									{contact.email}
								</span>
							)}
						</div>
						{contact.status === 'unverified' && (
							<div className="mt-2">
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
										: __('Send Opt-in Email', 'quillcrm')}
								</Button>
							</div>
						)}
						<div className="mt-2 flex items-center gap-3">
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
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				<ListsTagsCards />
				<InfoCard />
			</CardContent>
		</Card>
	);
};

export default ContactInformation;
