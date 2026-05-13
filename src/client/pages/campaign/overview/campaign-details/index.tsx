/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { Campaign as CampaignType } from '@doublescale/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { Button } from '@/components/ui/button';
import { getToLink, useNavigate } from '@doublescale/navigation';
import {
	NoData,
	ContactTotalEmailsIcon,
	EditIcon,
	FormattedDateCell,
	ContactSMSIcon,
	ProFeatureNotice,
} from '@doublescale/components';
import { getProSmsCampaignBridge } from '@doublescale/shared/sms-pro-bridge';

const previewUnavailableHtml = () =>
	`<div class="p-4 text-center text-muted-foreground text-sm" style="font-family:system-ui,sans-serif">${__(
		'Preview could not be loaded. Edit the template in the campaign builder and save again.',
		'doublescale'
	)}</div>`;

const resolveTemplateRenderId = (
	template: { id?: number | string },
	index: number,
	templateIds?: number[]
): number => {
	const a = Number(template?.id);
	if (!Number.isNaN(a) && a > 0) {
		return a;
	}
	const b = Number(templateIds?.[index]);
	if (!Number.isNaN(b) && b > 0) {
		return b;
	}
	const c = Number(templateIds?.[0]);
	if (!Number.isNaN(c) && c > 0) {
		return c;
	}
	return 0;
};

const CampaignDetails: React.FC = () => {
	const campaign = useSelect(
		(select: any) => select('doublescale/campaign').getCampaign(),
		[]
	) as CampaignType | null;

	const navigate = useNavigate();
	const SMSDevice = getProSmsCampaignBridge()?.SMSDevice;
	const [renderedTemplates, setRenderedTemplates] = useState<
		Record<number, string>
	>({});

	// Render template bodies from JSON to HTML
	useEffect(() => {
		if (!campaign?.settings?.templates) {
			return;
		}

		const renderTemplates = async () => {
			const rendered: Record<number, string> = {};
			const templateIds = campaign.settings.template_ids;

			for (let i = 0; i < campaign.settings.templates.length; i++) {
				const template = campaign.settings.templates[i];
				const renderId = resolveTemplateRenderId(template, i, templateIds);
				if (!renderId) {
					continue;
				}

				try {
					const response = (await apiFetch({
						path: `/doublescale/v1/templates/${renderId}/render`,
						method: 'POST',
						data: { merge_tags: {} },
					})) as { html?: string };

					if (response?.html?.trim()) {
						rendered[renderId] = response.html;
					} else {
						const body =
							typeof template.body === 'string' && template.body.trim()
								? template.body
								: previewUnavailableHtml();
						rendered[renderId] = body;
					}
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error('Failed to render template:', error);
					const body =
						typeof template.body === 'string' && template.body.trim()
							? template.body
							: previewUnavailableHtml();
					rendered[renderId] = body;
				}
			}

			setRenderedTemplates(rendered);
		};

		renderTemplates();
	}, [campaign?.settings?.templates, campaign?.settings?.template_ids]);

	if (!campaign) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-gray-500">
					{__('No campaign data available', 'doublescale')}
				</p>
			</div>
		);
	}

	// Check if there are no templates
	const hasTemplates =
		campaign.settings?.templates && campaign.settings.templates.length > 0;

	return (
		<div className="space-y-6">
			{/* Campaign Info */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1">
					<span className="text-base text-gray-500">
						{__('Title', 'doublescale')}
					</span>
					<p className="text-base font-semibold text-[#09090B]">
						{campaign.name}
					</p>
				</div>

				{campaign.type === CAMPAIGN_CHANNEL.EMAIL &&
					campaign.settings?.templates?.[0] &&
					'settings' in campaign.settings.templates[0] &&
					campaign.settings.templates[0].settings &&
					'subject' in campaign.settings.templates[0].settings &&
					campaign.settings.templates[0].settings.subject && (
						<div className="space-y-1">
							<span className="text-base text-gray-500">
								{__('Subject', 'doublescale')}
							</span>
							<p className="text-base font-semibold text-[#09090B]">
								{
									(
										campaign.settings.templates[0]
											.settings as { subject: string }
									).subject
								}
							</p>
						</div>
					)}

				{campaign.execute_at && (
					<div className="space-y-1">
						<span className="text-base text-gray-500">
							{__('Scheduled On', 'doublescale')}
						</span>
						<p className="text-base font-semibold text-[#09090B]">
							<FormattedDateCell value={campaign.execute_at} />
						</p>
					</div>
				)}

				<div className="space-y-1">
					<span className="text-base text-gray-500">
						{__('Total Recipients', 'doublescale')}
					</span>
					<p className="text-base font-semibold text-[#09090B]">
						{campaign.contacts_count}
					</p>
				</div>
			</div>

			{/* Email Template */}
			<div className="space-y-3 border-t pt-4">
				<div className="flex items-center justify-between">
					<h3 className="text-2xl font-medium">
						{campaign.type === CAMPAIGN_CHANNEL.EMAIL
							? __('Email Template', 'doublescale')
							: __('SMS Template', 'doublescale')}
					</h3>
					{campaign.status === 'draft' && hasTemplates && (
						<Button
							variant="default"
							onClick={() => {
								navigate(
									getToLink(
										`campaigns/${campaign.id}/template`
									)
								);
							}}
						>
							<EditIcon />
							{campaign.type === CAMPAIGN_CHANNEL.EMAIL
								? __('Edit Email Template', 'doublescale')
								: __('Edit SMS Template', 'doublescale')}
						</Button>
					)}
				</div>

				{hasTemplates ? (
					campaign.settings.templates.map((template, index) => {
						const renderKey = resolveTemplateRenderId(
							template,
							index,
							campaign.settings.template_ids
						);
						const renderedHtml = renderKey
							? renderedTemplates[renderKey]
							: typeof template.body === 'string'
								? template.body
								: previewUnavailableHtml();

						return (
							<div
								key={index}
								className="space-y-4 bg-[#E3EEFF99] p-4 rounded-lg border"
							>
								{/* Template Body */}
								{template.type === CAMPAIGN_CHANNEL.SMS ? (
									SMSDevice ? (
										<div className="flex items-center justify-center">
											<SMSDevice
												body={
													typeof template.body ===
													'string'
														? template.body
														: JSON.stringify(
																template.body
															)
												}
												className="bg-transparent border-none py-0 sm:p-0"
											/>
										</div>
									) : (
										<ProFeatureNotice
											featureName={__(
												'SMS preview',
												'doublescale'
											)}
											description={__(
												'Activate DoubleScale Pro to preview SMS campaign templates.',
												'doublescale'
											)}
										/>
									)
								) : renderedHtml ? (
									<div
										className="template-body-preview"
										dangerouslySetInnerHTML={{
											__html: renderedHtml || '',
										}}
									/>
								) : (
									<div className="flex items-center justify-center py-8 text-gray-500">
										{__('Loading template...', 'doublescale')}
									</div>
								)}
							</div>
						);
					})
				) : (
					<NoData
						icon={
							campaign.type === CAMPAIGN_CHANNEL.EMAIL ? (
								<ContactTotalEmailsIcon
									width={120}
									height={120}
								/>
							) : (
								<ContactSMSIcon width={120} height={120} />
							)
						}
						title={
							campaign.type === CAMPAIGN_CHANNEL.EMAIL
								? __('No Email Template', 'doublescale')
								: __('No SMS Template', 'doublescale')
						}
						subtitle={
							campaign.type === CAMPAIGN_CHANNEL.EMAIL
								? __(
										'Create an email template to get started with your campaign.',
										'doublescale'
									)
								: __(
										'Create a template to get started with your campaign.',
										'doublescale'
									)
						}
						onClick={() => {
							navigate(
								getToLink(`campaigns/${campaign.id}/template`)
							);
						}}
						buttonLabel={
							campaign.type === CAMPAIGN_CHANNEL.EMAIL
								? __('Edit Email Template', 'doublescale')
								: __('Edit SMS Template', 'doublescale')
						}
						buttonIcon={<EditIcon />}
					/>
				)}
			</div>
		</div>
	);
};

export default CampaignDetails;
