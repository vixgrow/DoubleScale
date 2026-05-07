/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { useCampaignStep, campaignSteps } from '../shared';
import {
	PanelSettings,
	SetUpInfoIcon,
	PanelLayout,
	PlayIcon,
	Stepper,
	MergeTagsIcon,
	NoticeBanner,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SMSTemplate, NoticeMessage, Campaign } from '@doublescale/client';
import type { ExtendedCampaign } from '@/stores/campaign/types';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { getCampaignEndpoint } from '@doublescale/utils';
import SMSDevice from './sms-device';

const SMSTemplateStep: React.FC = () => {
	const { campaign, saving, goToStep, updateCampaign } = useCampaignStep();
	const { setMergeTagsVisible, setMergeTagCallback } =
		useDispatch('doublescale/core');
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

	// Scroll to notice banner when it appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	// Initialize default SMS template
	const defaultTemplate: SMSTemplate = {
		name: __('SMS Message', 'doublescale'),
		type: CAMPAIGN_CHANNEL.SMS,
		body: '',
		settings: {},
	};

	const [template, setTemplate] = useState<SMSTemplate>(defaultTemplate);

	// Sync template state with campaign data when it changes
	useEffect(() => {
		const existingTemplate = campaign?.settings?.templates?.[0];
		if (
			existingTemplate &&
			'type' in existingTemplate &&
			existingTemplate.type === CAMPAIGN_CHANNEL.SMS
		) {
			// Convert backend format to frontend format
			const backendTemplate = existingTemplate as any;
			setTemplate({
				name: backendTemplate.name || defaultTemplate.name,
				type: CAMPAIGN_CHANNEL.SMS,
				body: backendTemplate.body || '',
				settings: {},
			});
		}
	}, [campaign?.settings?.templates]);

	const updateTemplate = (updates: Partial<SMSTemplate>) => {
		setTemplate((prev) => ({
			...prev,
			...updates,
			settings: {
				...prev.settings,
				...(updates.settings || {}),
			},
		}));
	};

	const validate = (): boolean => {
		if (!template.body || template.body.trim().length === 0) {
			setNotice({
				type: 'error',
				message: __('Message content is required', 'doublescale'),
			});
			return false;
		}

		if (template.body.length > 1600) {
			setNotice({
				type: 'error',
				message: __(
					'Message is too long. Maximum 1600 characters.',
					'doublescale'
				),
			});
			return false;
		}

		setNotice(null);
		return true;
	};

	const [isSavingTemplate, setIsSavingTemplate] = useState(false);

	const save = async () => {
		if (isSavingTemplate) {
			return;
		}

		if (!campaign || !validate()) {
			return;
		}

		try {
			setIsSavingTemplate(true);
			// Use consistent structure across all campaign types
			const backendTemplate = {
				name: template.name,
				type: template.type,
				body: template.body,
				settings: {},
			};

			const endpoint = getCampaignEndpoint(campaign.type);
			if (!endpoint) {
				throw new Error(__('Invalid campaign type', 'doublescale'));
			}

			const response = await apiFetch({
				path: `${endpoint}/${campaign.id}`,
				method: 'PUT',
				data: {
					...campaign,
					settings: {
						...campaign.settings,
						templates: [backendTemplate],
					},
				},
			}) as Campaign;

			// Update campaign store with response data
			updateCampaign(response as Partial<ExtendedCampaign>);

			setNotice(null);
			goToStep('contacts');
		} catch (error: any) {
			setNotice({
				type: 'error',
				message:
					error.message ||
					__(
						'Failed to save template. Please try again.',
						'doublescale'
					),
			});
		} finally {
			setIsSavingTemplate(false);
		}
	};

	const handleMergeTagClick = () => {
		setMergeTagCallback((tagValue: string) => {
			if (messageTextareaRef.current) {
				const textarea = messageTextareaRef.current;
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				const currentText = template.body || '';
				const newText =
					currentText.substring(0, start) +
					tagValue +
					currentText.substring(end);

				updateTemplate({ body: newText });

				// Set cursor position after the inserted tag
				setTimeout(() => {
					if (textarea) {
						textarea.focus();
						const newPosition = start + tagValue.length;
						textarea.setSelectionRange(newPosition, newPosition);
					}
				}, 0);
			}
		});
		setMergeTagsVisible(true);
	};

	return (
		<PanelLayout
			items={[
				{
					label: __('Create Campaign', 'doublescale'),
					href: 'campaigns',
				},
				{
					label: campaign?.settings.ab_test
						? __('A/B Test Campaign', 'doublescale')
						: __('Standard Campaign', 'doublescale'),
				},
			]}
			panelbtns={[
				<Button variant="secondaryDeepBlue">
					<PlayIcon />
					{__('Watch Tutorial', 'doublescale')}
				</Button>,
			]}
			type="campaign"
		>
			<Stepper
				steps={campaignSteps.filter((step) => step.slug !== 'builder')}
				canProceed="true"
				currentStep={1}
			/>

			<div className="w-full flex gap-6">
				<div className="w-2/3">
					<PanelSettings
						title={__('Set-up Info', 'doublescale')}
						description={__(
							'Define your sender identity, subject line, and optional UTM tracking before building your campaign.',
							'doublescale'
						)}
						icon={<SetUpInfoIcon />}
						onNext={save}
						nextLabel={
							saving || isSavingTemplate
								? __('Saving...', 'doublescale')
								: __('Next', 'doublescale')
						}
						showButtons={true}
						isLoading={saving || isSavingTemplate}
					>
						<div className="space-y-6">
							{/* Notice Banner */}
							{notice && (
								<NoticeBanner
									ref={noticeBannerRef}
									notice={notice}
									closeNotice={() => setNotice(null)}
								/>
							)}

							{/* Message Field */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<label className="text-base font-medium text-[#333333]">
										{__('Message', 'doublescale')}
										<span className="text-red-500">
											*
										</span>
									</label>
									<Button
										variant="ghost"
										onClick={handleMergeTagClick}
										className="text-[#333333] shadow-none border-none p-0 hover:text-black"
									>
										<MergeTagsIcon
											width={24}
											height={24}
										/>
									</Button>
								</div>
								<Textarea
									ref={messageTextareaRef}
									value={template.body}
									onChange={(e) =>
										updateTemplate({
											body: e.target.value,
										})
									}
									placeholder={__(
										'Type your message here...',
										'doublescale'
									)}
									rows={8}
									className="bg-white resize-none"
								/>
								<p className="text-sm text-[#71717A]">
									{__('Maximum 1600 characters', 'doublescale')}
								</p>
							</div>

							{/* Unsubscribe Info */}
							<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
								<p className="text-sm text-gray-700">
									<strong>
										{__('Unsubscribe:', 'doublescale')}
									</strong>{' '}
									{__(
										'A "Reply STOP to unsubscribe" footer will be automatically added to your message. Recipients can reply STOP to unsubscribe.',
										'doublescale'
									)}
								</p>
							</div>
						</div>
					</PanelSettings>
				</div>
				<SMSDevice body={template.body} />
			</div>
		</PanelLayout>
	);
};

export default SMSTemplateStep;
