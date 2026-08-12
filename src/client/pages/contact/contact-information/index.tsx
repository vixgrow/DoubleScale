/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { useCallback, useRef, useState } from 'react';
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
} from '@doublescale/components';
import ListsTagsCards from './lists-tags';
import InfoCard from './info-card';
import { UserRound, Mail, Camera, Loader2 } from 'lucide-react';
import PhoneIcon from '@doublescale/shared/icons/phone';
import { elevateWordPressMediaModal } from '@doublescale/shared/utils/wordpress-media-modal';

// Constants
const DROPDOWN_Z_INDEX = 'z-[150000]'; // High z-index to appear above modals

// Type definitions
type ChannelType = 'email' | 'sms' | 'whatsapp';
type EmailStatus =
	| 'subscribed'
	| 'unsubscribed'
	| 'bounced'
	| 'blocked'
	| 'unverified';
type SmsStatus = 'subscribed' | 'unsubscribed' | 'blocked';
type WhatsAppStatus = 'subscribed' | 'unsubscribed' | 'blocked';

// Status options for each channel
const EMAIL_STATUSES: EmailStatus[] = [
	'subscribed',
	'unsubscribed',
	'bounced',
	'blocked',
	'unverified',
];
const SMS_STATUSES: SmsStatus[] = ['subscribed', 'unsubscribed', 'blocked'];
const WHATSAPP_STATUSES: WhatsAppStatus[] = [
	'subscribed',
	'unsubscribed',
	'blocked',
];

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
			subscribed: __('Subscribed', 'doublescale'),
			unsubscribed: __('Unsubscribed', 'doublescale'),
			bounced: __('Bounced', 'doublescale'),
			blocked: __('Blocked', 'doublescale'),
			unverified: __('Unverified', 'doublescale'),
		},
		sms: {
			subscribed: __('Subscribed', 'doublescale'),
			unsubscribed: __('Unsubscribed', 'doublescale'),
			blocked: __('Blocked', 'doublescale'),
		},
		whatsapp: {
			subscribed: __('Subscribed', 'doublescale'),
			unsubscribed: __('Unsubscribed', 'doublescale'),
			blocked: __('Blocked', 'doublescale'),
		},
	};

	return labels[channel]?.[status] || `${channel}_${status}`;
};

// Helper function to get channel display label
const getChannelDisplayLabel = (channel: string): string => {
	const channels: Record<string, string> = {
		email: __('Email', 'doublescale'),
		sms: __('SMS', 'doublescale'),
		whatsapp: __('WhatsApp', 'doublescale'),
	};

	return channels[channel] || channel;
};

// Helper function to get status styling classes
const getStatusClasses = (status: string): string => {
	switch (status?.toLowerCase()) {
		case 'subscribed':
			return 'border-emerald-500/40 text-emerald-700 bg-emerald-50';
		case 'unsubscribed':
			return 'border-amber-500/40 text-amber-700 bg-amber-50';
		case 'bounced':
			return 'border-primary/30 text-primary bg-primary/5';
		case 'unverified':
			return 'border-red-400/40 text-red-600 bg-red-50';
		case 'blocked':
			return 'border-border text-muted-foreground bg-muted/50';
		default:
			return 'border-border text-muted-foreground bg-muted/50';
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
			<SelectTrigger className={`h-8 w-fit rounded-full px-3 text-xs font-medium shadow-sm ${getStatusClasses(value)}`}>
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
	const {
		contact,
		setContact,
		updateContact,
		emailAnalytics,
		showNotice,
		isUpdating,
	} = useContactContext();
	const [isSendingOptIn, setIsSendingOptIn] = useState(false);
	const [optInSent, setOptInSent] = useState(false);
	const [isAvatarUploading, setIsAvatarUploading] = useState(false);
	const avatarFileInputRef = useRef<HTMLInputElement>(null);

	const sendOptInEmail = async () => {
		if (!contact || isSendingOptIn || optInSent) {
			return;
		}

		setIsSendingOptIn(true);
		try {
			await apiFetch({
				path: `/doublescale/v1/contacts/${contact.id}/send-opt-in`,
				method: 'POST',
			});

			// Mark as sent FIRST - before showing notification
			setOptInSent(true);

			// Show success notification using the parent's notice system
			if (showNotice) {
				showNotice({
					type: 'success',
					message: __('Opt-in email sent successfully', 'doublescale'),
				});
			}
		} catch (error: any) {
			// Show error notification
			const errorMessage =
				error.message || __('Failed to send opt-in email', 'doublescale');
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

	const handleWhatsAppStatusChange = (value: string) => {
		if (!contact) return;
		setContact({
			...contact,
			whatsapp_status: value,
		});
		updateContact({ whatsapp_status: value });
	};

	if (!contact) {
		return (
			<Card className="flex-1 rounded-2xl border border-border/50 bg-card shadow-sm ring-1 ring-black/[0.03]">
				<CardContent className="py-10">
					<div className="doublescale-contact-information text-center text-sm text-muted-foreground">
						{__('No contact information available', 'doublescale')}
					</div>
				</CardContent>
			</Card>
		);
	}

	const fullName =
		`${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
		contact.email;

	const initials = getContactInitials(contact.first_name, contact.last_name);
	const avatarUrl = contact.avatar_url;
	const hasCustomAvatar = Boolean(contact.avatar_id);

	const handleAvatarSelect = async (selectedMedia: { id: number }) => {
		await updateContact({ avatar_id: selectedMedia.id });
	};

	const handleAvatarRemove = async () => {
		await updateContact({ avatar_id: 0 });
	};

	const uploadImageFile = async (file: File): Promise<number> => {
		const formData = new FormData();
		formData.append('file', file);

		const response = (await apiFetch({
			path: '/wp/v2/media',
			method: 'POST',
			body: formData,
		})) as { id?: number };

		if (!response?.id) {
			throw new Error(__('Failed to upload image', 'doublescale'));
		}

		return response.id;
	};

	const openAvatarPicker = useCallback(() => {
		if (isUpdating || isAvatarUploading) {
			return;
		}

		const wpMedia = (
			window as Window & {
				wp?: {
					media?: (args: Record<string, unknown>) => {
						on: (
							event: string,
							callback: () => void
						) => void;
						open: () => void;
						state: () => {
							get: (key: string) => {
								first: () => {
									toJSON: () => { id?: number };
								};
							};
						};
					};
				};
			}
		).wp?.media;

		if (wpMedia) {
			let restoreMediaModal: (() => void) | undefined;

			const frame = wpMedia({
				title: __('Select profile image', 'doublescale'),
				frame: 'select',
				button: {
					text: __('Use this image', 'doublescale'),
				},
				library: { type: 'image' },
				multiple: false,
			});

			frame.on('open', () => {
				const content = (
					frame as {
						content?: { mode?: (view: string) => void };
					}
				).content;
				content?.mode?.('browse');

				window.setTimeout(() => {
					restoreMediaModal?.();
					restoreMediaModal = elevateWordPressMediaModal();
				}, 10);
			});

			frame.on('close', () => {
				restoreMediaModal?.();
				restoreMediaModal = undefined;
			});

			frame.on('select', () => {
				const attachment = frame
					.state()
					.get('selection')
					.first()
					?.toJSON();

				if (attachment?.id) {
					void handleAvatarSelect({ id: attachment.id });
				}
			});

			frame.open();
			return;
		}

		avatarFileInputRef.current?.click();
	}, [isAvatarUploading, isUpdating]);

	const handleAvatarFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		event.target.value = '';

		if (!file || isUpdating || isAvatarUploading) {
			return;
		}

		setIsAvatarUploading(true);
		try {
			const attachmentId = await uploadImageFile(file);
			await handleAvatarSelect({ id: attachmentId });
		} catch (error) {
			showNotice?.({
				type: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Failed to upload image', 'doublescale'),
			});
		} finally {
			setIsAvatarUploading(false);
		}
	};

	const isAvatarBusy = isUpdating || isAvatarUploading;

	// Calculate email analytics
	const totalEmails = emailAnalytics?.total_sent || 0;
	const totalOpened = emailAnalytics?.total_opened || 0;
	const totalClicked = emailAnalytics?.total_clicked || 0;

	const openRate = emailAnalytics?.open_rate?.toFixed(1) || '0.0';
	const clickRate = emailAnalytics?.click_rate?.toFixed(1) || '0.0';

	return (
		<Card className="w-full shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm ring-1 ring-black/[0.03]">
			<CardHeader className="space-y-0 p-0">
				<div className="relative border-b border-border/40 bg-gradient-to-b from-primary/[0.07] via-primary/[0.02] to-transparent px-5 pb-6 pt-6">
					<div
						className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/[0.14] to-transparent"
						aria-hidden
					/>
					<div className="relative z-[1] flex flex-col items-center text-center">
						<input
							ref={avatarFileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={(event) => {
								void handleAvatarFileChange(event);
							}}
						/>
						<div className="group mb-4 flex flex-col items-center">
							<button
								type="button"
								onClick={openAvatarPicker}
								disabled={isAvatarBusy}
								className="relative cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed"
								aria-label={__(
									'Change profile image',
									'doublescale'
								)}
							>
								<Avatar className="h-[5.25rem] w-[5.25rem] border-[3px] border-background shadow-md ring-2 ring-border/30">
									{avatarUrl ? (
										<AvatarImage
											src={avatarUrl}
											alt={fullName}
											className="rounded-full object-cover"
										/>
									) : null}
									<AvatarFallback className="bg-primary/8 text-primary text-xl font-bold">
										{initials || (
											<UserRound className="h-10 w-10" />
										)}
									</AvatarFallback>
								</Avatar>
								<div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
									{isAvatarBusy ? (
										<Loader2 className="h-6 w-6 animate-spin text-white" />
									) : (
										<Camera className="h-6 w-6 text-white" />
									)}
								</div>
							</button>
							<p className="mt-1 text-xs text-muted-foreground">
								{__('Click to upload photo', 'doublescale')}
							</p>
							{hasCustomAvatar ? (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="mt-1 h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
									disabled={isAvatarBusy}
									onClick={() => {
										void handleAvatarRemove();
									}}
								>
									{__('Remove photo', 'doublescale')}
								</Button>
							) : null}
						</div>
						<CardTitle className="mb-2 max-w-full break-words text-xl font-semibold tracking-tight text-foreground">
							{fullName}
						</CardTitle>
						<div className="flex w-full max-w-full flex-col gap-2">
							{contact.email && (
								<div className="mx-auto flex max-w-full items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-left text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-sm">
									<span className="flex shrink-0 text-primary/70">
										<ContactTotalEmailsIcon />
									</span>
									<span
										className="min-w-0 text-sm leading-snug"
										style={{
											overflowWrap: 'anywhere',
											wordBreak: 'break-word',
										}}
									>
										{contact.email}
									</span>
								</div>
							)}
							{contact.phone && (
								<div className="mx-auto flex max-w-full items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-sm">
									<span className="flex shrink-0 text-primary/70 [&_svg]:h-3.5 [&_svg]:w-3.5">
										<PhoneIcon />
									</span>
									<span className="tabular-nums">
										{contact.phone}
									</span>
								</div>
							)}
						</div>
					</div>

					{contact.email && contact.email_status === 'unverified' && (
						<div className="relative mt-4 flex justify-center">
							<Button
								size="sm"
								variant="outline"
								className="h-8 gap-1.5 rounded-full border-primary/25 bg-background/90 text-xs font-medium shadow-sm backdrop-blur-sm"
								disabled={isSendingOptIn || optInSent}
								onClick={sendOptInEmail}
							>
								<ContactTotalEmailsIcon/>
								{isSendingOptIn
									? __('Sending...', 'doublescale')
									: optInSent
										? __('Email Sent', 'doublescale')
										: __(
												'Send Opt-in Email',
												'doublescale'
											)}
							</Button>
						</div>
					)}

					<div className="relative mt-5 grid grid-cols-3 gap-2">
						<div className="flex flex-col items-center gap-2 rounded-xl border border-border/45 bg-background/70 px-2 py-3 shadow-sm backdrop-blur-sm">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
								<ContactTotalEmailsIcon />
							</div>
							<div className="text-center">
								<p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
									{__('Emails', 'doublescale')}
								</p>
								<p className="text-base font-semibold tabular-nums text-foreground">
									{totalEmails}
								</p>
							</div>
						</div>
						<div className="flex flex-col items-center gap-2 rounded-xl border border-border/45 bg-background/70 px-2 py-3 shadow-sm backdrop-blur-sm">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-700">
								<OpenRateIcon />
							</div>
							<div className="text-center">
								<p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
									{__('Open', 'doublescale')}
								</p>
								<p className="text-base font-semibold tabular-nums text-foreground">
									{openRate}%
								</p>
							</div>
						</div>
						<div className="flex flex-col items-center gap-2 rounded-xl border border-border/45 bg-background/70 px-2 py-3 shadow-sm backdrop-blur-sm">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/12 text-violet-700">
								<ClickRateIcon />
							</div>
							<div className="text-center">
								<p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
									{__('Click', 'doublescale')}
								</p>
								<p className="text-base font-semibold tabular-nums text-foreground">
									{clickRate}%
								</p>
							</div>
						</div>
					</div>

					<div className="relative mt-4 flex flex-wrap items-center justify-center gap-2">
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
						<StatusSelect
							channel="whatsapp"
							value={contact.whatsapp_status}
							onChange={handleWhatsAppStatusChange}
							statuses={WHATSAPP_STATUSES}
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-0 px-4 pb-5 pt-1 sm:px-5">
				<ListsTagsCards />
				<div className="mt-3 space-y-3">
					<InfoCard />
				</div>
			</CardContent>
		</Card>
	);
};

export default ContactInformation;
