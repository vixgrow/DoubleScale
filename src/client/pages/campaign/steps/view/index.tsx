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
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogOverlay,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { convertToWordPressTimezone } from '@/utils/index';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { getToLink, useNavigate } from '@doublescale/navigation';
import { useCampaignStep } from '../shared';
import {
	CardLayout,
	CampaignSettingsCard,
	SendTestEmailCard,
	SendTestSMSCard,
} from '../review/components';
import SMSDevice from '../templates/sms-device';
import type {
	EmailTemplate,
	SMSTemplate,
	WhatsAppTemplate,
} from '@doublescale/client';

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
			header={__('Other Info', 'doublescale')}
			button={false}
		>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-base text-gray-500 mb-1">
						{__('Status', 'doublescale')}
					</p>
					<p className="text-base font-semibold text-gray-900">
						{__('Scheduled', 'doublescale')}
					</p>
				</div>
				<div>
					<p className="text-base text-gray-500 mb-1">
						{__('Estimated Contacts', 'doublescale')}
					</p>
					<p className="text-base font-semibold text-gray-900">
						{estimatedContacts}
					</p>
				</div>
				<div>
					<p className="text-base text-gray-500 mb-1">
						{__('Scheduled On', 'doublescale')}
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

const fetchRenderedTemplateHtml = async (
	template: CampaignTemplate,
	fallbackTemplateId?: number
): Promise<string> => {
	if (!template || template.type !== CAMPAIGN_CHANNEL.EMAIL) {
		return '';
	}

	const emailTemplate = template as EmailTemplate;
	const fromTemplateId =
		emailTemplate.id != null &&
		!Number.isNaN(Number(emailTemplate.id)) &&
		Number(emailTemplate.id) > 0
			? Number(emailTemplate.id)
			: undefined;
	const fromCampaignId =
		fallbackTemplateId != null &&
		!Number.isNaN(Number(fallbackTemplateId)) &&
		Number(fallbackTemplateId) > 0
			? Number(fallbackTemplateId)
			: undefined;
	const resolvedId = fromTemplateId ?? fromCampaignId;

	if (resolvedId) {
		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/templates/${resolvedId}/render`,
				method: 'POST',
				data: { merge_tags: {} },
			})) as { html?: string };

			if (response?.html?.trim()) {
				return response.html;
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to render template:', error);
		}
	}

	const body = emailTemplate.body;
	if (typeof body === 'string' && body.trim()) {
		return body;
	}

	return `<div class="p-6 text-center text-muted-foreground text-sm" style="font-family:system-ui,sans-serif">${__(
		'Preview could not be loaded. Use Edit template to open the builder, then save again.',
		'doublescale'
	)}</div>`;
};

const View: React.FC = () => {
	const { campaign } = useCampaignStep();
	const navigate = useNavigate();
	const [dialogChannel, setDialogChannel] = useState<
		typeof CAMPAIGN_CHANNEL.EMAIL | typeof CAMPAIGN_CHANNEL.SMS | null
	>(null);
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
			const fallbackId = campaign?.settings?.template_ids?.[0];
			const html = await fetchRenderedTemplateHtml(template, fallbackId);
			if (isMounted) {
				setRenderedTemplate(html);
				setIsRenderingTemplate(false);
			}
		};

		run();

		return () => {
			isMounted = false;
		};
	}, [template, campaign?.id, campaign?.settings?.template_ids]);

	const handleClose = useCallback(() => {
		navigate(getToLink('campaigns'));
	}, [navigate]);

	const breadcrumbItems = useMemo(
		() => [
			{
				label: __('Campaign List', 'doublescale'),
				href: 'campaigns',
			},
			{
				label: campaign?.name
					? sprintf(__('%s Details', 'doublescale'), campaign.name)
					: __('Campaign Details', 'doublescale'),
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
			aria-label={__('Close view', 'doublescale')}
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
								title={__('Review', 'doublescale')}
								description={__(
									'Review your campaign configuration and scheduled delivery details.',
									'doublescale'
								)}
								icon={<ReviewIcon />}
								showButtons={true}
								onBack={handleClose}
								backLabel={__('Cancel Schedule', 'doublescale')}
								onNext={() =>
									setDialogChannel(
										campaign?.type === CAMPAIGN_CHANNEL.SMS
											? CAMPAIGN_CHANNEL.SMS
											: CAMPAIGN_CHANNEL.EMAIL
									)
								}
								nextLabel={
									campaign?.type === CAMPAIGN_CHANNEL.EMAIL
										? __('Send Test Email', 'doublescale')
										: __('Send Test SMS', 'doublescale')
								}
							>
								<div className="space-y-6">
									<CampaignSettingsCard
										campaignType={campaign?.type}
										fromName={fromName ?? '-'}
										fromEmail={fromEmail}
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

						<div className="w-2/5 border rounded-lg bg-[#f8f8f8] p-4">
							<div className="text-[#333333] font-medium text-2xl">
								{campaign.type === CAMPAIGN_CHANNEL.EMAIL
									? __('Email Preview', 'doublescale')
									: __('SMS Preview', 'doublescale')}
							</div>
							<div className="flex items-center justify-center">
								{campaign.type === CAMPAIGN_CHANNEL.EMAIL ? (
									isRenderingTemplate ? (
										<div className="flex flex-col items-center gap-2 text-gray-500">
											<Spinner className="h-6 w-6" />
											<span>
												{__(
													'Loading template...',
													'doublescale'
												)}
											</span>
										</div>
									) : renderedTemplate ? (
										<div
											className="w-full h-full overflow-auto template-body-preview"
											dangerouslySetInnerHTML={{
												__html: renderedTemplate,
											}}
										/>
									) : (
										<div className="text-center text-gray-500 text-base">
											{__(
												'No template content available.',
												'doublescale'
											)}
										</div>
									)
								) : (
									<SMSDevice
										body={smsBody}
										className="bg-transparent border-none py-0 sm:p-0 lg:w-full mt-4"
									/>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center h-full py-20 text-gray-500">
						{__('Loading campaign details...', 'doublescale')}
					</div>
				)}
			</PanelLayout>

			<Dialog
				open={dialogChannel !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDialogChannel(null);
					}
				}}
			>
				<DialogOverlay className="z-[1700000]" />
				<DialogContent className="sm:max-w-xl z-[1700000]">
					<DialogHeader>
						<CustomDialogHeader
							title={
								dialogChannel === CAMPAIGN_CHANNEL.SMS
									? __('Send Test SMS', 'doublescale')
									: __('Send Test Email', 'doublescale')
							}
							subtitle={
								dialogChannel === CAMPAIGN_CHANNEL.SMS
									? __(
											'Who do you want to test your SMS with?',
											'doublescale'
										)
									: __(
											'Who do you want to test your email with?',
											'doublescale'
										)
							}
							icon={<GradientLinkIcon />}
						/>
					</DialogHeader>
					{dialogChannel === CAMPAIGN_CHANNEL.SMS ? (
						<SendTestSMSCard
							campaignId={campaign?.id}
							header={false}
							description={false}
							cardClassName="bg-white border-none shadow-none p-0"
							buttonClassName="w-full"
							buttonVariant="gradient"
						/>
					) : (
						<SendTestEmailCard
							campaignId={campaign?.id}
							header={false}
							description={false}
							cardClassName="bg-white border-none shadow-none p-0"
							buttonClassName="w-full"
							buttonVariant="gradient"
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default View;
