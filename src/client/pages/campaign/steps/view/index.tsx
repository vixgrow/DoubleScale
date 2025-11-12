/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { X } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

/**
 * Internal dependencies
 */
import {
	CustomDialogHeader,
	GradientLinkIcon,
	OtherInfoIcon,
	PanelLayout,
	PanelSettings,
	ReviewIcon,
} from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { convertToWordPressTimezone } from '@/utils/index';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { getToLink, useNavigate } from '@quillcrm/navigation';
import { useCampaignStep } from '../shared';
import {
	CardLayout,
	CampaignSettingsCard,
	SendTestEmailCard,
} from '../review/components';
import SMSDevice from '../templates/sms-device';
import type {
	EmailTemplate,
	SMSTemplate,
	WhatsAppTemplate,
} from '@quillcrm/client';

dayjs.extend(utc);

type CampaignTemplate = EmailTemplate | SMSTemplate | WhatsAppTemplate;

interface OtherInfoCardProps {
	estimatedContacts: string;
	scheduledOn?: string | null;
}

const OtherInfoCard: React.FC<OtherInfoCardProps> = ({
	estimatedContacts,
	scheduledOn,
}) => {
	return (
		<CardLayout
			icon={<OtherInfoIcon />}
			header={__('Other Info', 'quillcrm')}
			button={false}
		>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-base text-gray-500 mb-1">
						{__('Status', 'quillcrm')}
					</p>
					<p className="text-base font-semibold text-gray-900">
						{__('Scheduled', 'quillcrm')}
					</p>
				</div>
				<div>
					<p className="text-base text-gray-500 mb-1">
						{__('Estimated Contacts', 'quillcrm')}
					</p>
					<p className="text-base font-semibold text-gray-900">
						{estimatedContacts}
					</p>
				</div>
				<div>
					<p className="text-base text-gray-500 mb-1">
						{__('Scheduled On', 'quillcrm')}
					</p>
					<p className="text-base font-semibold text-gray-900">
						{scheduledOn ?? '-'}
					</p>
				</div>
			</div>
		</CardLayout>
	);
};

const getScheduledOnLabel = (date?: string | null) => {
	if (!date) {
		return null;
	}

	const parsedUtcDate = dayjs.utc(date);
	const parsedDate = parsedUtcDate.isValid() ? parsedUtcDate : dayjs(date);

	if (!parsedDate.isValid()) {
		return null;
	}

	const localizedDate = convertToWordPressTimezone(parsedDate);
	return `${localizedDate.format('MMM D, YYYY')} - ${localizedDate.format('h:mm A')}`;
};

const renderTemplateBody = async (
	template: CampaignTemplate
): Promise<string> => {
	if (!template) {
		return '';
	}

	if (template.id) {
		try {
			const response: any = await apiFetch({
				path: `/qc/v1/templates/${template.id}/render`,
				method: 'POST',
				data: {},
			});

			if (response?.html) {
				return response.html;
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to render template:', error);
		}
	}

	const body = (template as EmailTemplate)?.body ?? '';

	if (typeof body === 'string') {
		return body;
	}

	try {
		return JSON.stringify(body);
	} catch {
		return '';
	}
};

const View: React.FC = () => {
	const { campaign } = useCampaignStep();
	const navigate = useNavigate();
	const [isSendTestDialogOpen, setIsSendTestDialogOpen] = useState(false);
	const [renderedTemplate, setRenderedTemplate] = useState<string>('');
	const [isRenderingTemplate, setIsRenderingTemplate] = useState(false);

	const template: CampaignTemplate | null =
		(campaign?.settings?.templates?.[0] as CampaignTemplate) ?? null;

	const isEmailTemplate = template?.type === CAMPAIGN_CHANNEL.EMAIL;
	const isSmsTemplate = template?.type === CAMPAIGN_CHANNEL.SMS;

	useEffect(() => {
		let isMounted = true;

		const run = async () => {
			if (!template || template.type !== CAMPAIGN_CHANNEL.EMAIL) {
				if (isMounted) {
					setRenderedTemplate('');
				}
				return;
			}

			setIsRenderingTemplate(true);
			const html = await renderTemplateBody(template);
			if (isMounted) {
				setRenderedTemplate(html);
				setIsRenderingTemplate(false);
			}
		};

		run();

		return () => {
			isMounted = false;
		};
	}, [template, campaign?.id]);

	const handleClose = useCallback(() => {
		navigate(getToLink('campaigns'));
	}, [navigate]);

	const breadcrumbItems = useMemo(
		() => [
			{
				label: __('Campaign List', 'quillcrm'),
				href: 'campaigns',
			},
			{
				label: campaign?.name
					? sprintf(__('%s Details', 'quillcrm'), campaign.name)
					: __('Campaign Details', 'quillcrm'),
			},
		],
		[campaign?.name]
	);

	const panelButtons = [
		<Button
			key="close"
			variant="ghost"
			size="icon"
			onClick={handleClose}
			aria-label={__('Close view', 'quillcrm')}
		>
			<X className="h-12 w-12" />
		</Button>,
	];

	const templateSettings: Record<string, any> =
		(template as any)?.settings ?? {};

	const emailSubject = isEmailTemplate
		? ((template as EmailTemplate)?.settings?.subject ?? '-')
		: '-';
	const fromName =
		templateSettings?.from_name ??
		(template as EmailTemplate)?.settings?.from_name ??
		(campaign?.settings as Record<string, any>)?.from_name ??
		campaign?.name ??
		'-';
	const fromEmail = isEmailTemplate
		? (templateSettings?.from_email ?? '-')
		: '-';
	const replyTo = isEmailTemplate ? (templateSettings?.reply_to ?? '-') : '-';
	const previewText = isEmailTemplate
		? ((template as EmailTemplate)?.settings?.preview_text ?? '-')
		: '-';
	const fromPhone =
		campaign?.type === CAMPAIGN_CHANNEL.SMS
			? (templateSettings?.from_phone ??
				(campaign?.settings as Record<string, any>)?.from_phone ??
				'-')
			: '-';

	const smsBody =
		isSmsTemplate && template
			? typeof template.body === 'string'
				? template.body
				: JSON.stringify(template.body)
			: undefined;

	const estimatedContactsLabel = useMemo(() => {
		if (typeof campaign?.contacts_count === 'number') {
			return campaign.contacts_count.toLocaleString();
		}
		return '0';
	}, [campaign?.contacts_count]);

	const scheduledOnLabel = useMemo(
		() => getScheduledOnLabel(campaign?.execute_at),
		[campaign?.execute_at]
	);

	return (
		<>
			<PanelLayout
				items={breadcrumbItems}
				panelbtns={panelButtons}
				type="campaign"
			>
				{campaign ? (
					<div className="flex gap-6 items-start">
						<div className="w-3/5">
							<PanelSettings
								title={__('Review', 'quillcrm')}
								description={__(
									'Review your campaign configuration and scheduled delivery details.',
									'quillcrm'
								)}
								icon={<ReviewIcon />}
								showButtons={true}
								onBack={handleClose}
								backLabel={__('Cancel Schedule', 'quillcrm')}
								onNext={() => setIsSendTestDialogOpen(true)}
								nextLabel={__('Send Test Email', 'quillcrm')}
							>
								<div className="space-y-6">
									<CampaignSettingsCard
										campaignType={campaign?.type}
										fromName={fromName ?? '-'}
										fromEmail={fromEmail}
										fromPhone={fromPhone}
										replyTo={replyTo}
										emailSubject={emailSubject}
										previewText={previewText}
										button={false}
									/>

									<OtherInfoCard
										estimatedContacts={
											estimatedContactsLabel
										}
										scheduledOn={scheduledOnLabel}
									/>
								</div>
							</PanelSettings>
						</div>

						<div className="w-2/5 border rounded-lg bg-[#f8f8f8]">
							<div className="p-4 flex items-center justify-center">
								{campaign.type === CAMPAIGN_CHANNEL.EMAIL ? (
									isRenderingTemplate ? (
										<div className="flex flex-col items-center gap-2 text-gray-500">
											<Spinner className="h-6 w-6" />
											<span>
												{__(
													'Loading template...',
													'quillcrm'
												)}
											</span>
										</div>
									) : renderedTemplate ? (
										<div
											className="w-full h-full overflow-auto p-4 template-body-preview"
											dangerouslySetInnerHTML={{
												__html: renderedTemplate,
											}}
										/>
									) : (
										<div className="text-center text-gray-500 text-base">
											{__(
												'No template content available.',
												'quillcrm'
											)}
										</div>
									)
								) : (
									<SMSDevice
										fromName={fromName}
										body={smsBody}
									/>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center h-full py-20 text-gray-500">
						{__('Loading campaign details...', 'quillcrm')}
					</div>
				)}
			</PanelLayout>

			<Dialog
				open={isSendTestDialogOpen}
				onOpenChange={setIsSendTestDialogOpen}
			>
				<DialogOverlay className="z-[1700000]" />
				<DialogContent className="sm:max-w-xl z-[1700000]">
					<DialogHeader>
						<DialogTitle>
							<CustomDialogHeader
								title={__('Send Test Email', 'quillcrm')}
								subtitle={__(
									'Who do you want to test your email with?',
									'quillcrm'
								)}
								icon={<GradientLinkIcon />}
							/>
						</DialogTitle>
					</DialogHeader>
					<SendTestEmailCard
						campaignId={campaign?.id}
						header={false}
						description={false}
						cardClassName="bg-white border-none shadow-none p-0"
						buttonClassName="w-full"
						buttonVariant="gradient"
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default View;
