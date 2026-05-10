/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
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
import type { SMSTemplate, NoticeMessage } from '@doublescale/client';
import type { ExtendedCampaignSettings } from '@/stores/campaign/types';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { saveTemplate } from '@/builder/api/templates';
import SMSDevice from './sms-device';

const SMSTemplateStep: React.FC = () => {
	const { campaign, saving, goToStep, updateCampaign, isNewCampaign } = useCampaignStep();
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
		if (existingTemplate) {
			const t = existingTemplate as any;
			setTemplate({
				template_id: t.id || t.template_id,
				name: t.name || defaultTemplate.name,
				type: CAMPAIGN_CHANNEL.SMS,
				body: t.body || '',
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

			const templateData: Record<string, any> = {
				name: template.name,
				type: CAMPAIGN_CHANNEL.SMS,
				body: template.body,
				settings: {},
				hidden: 1,
				campaign_id: campaign.id,
			};

			if (template.template_id) {
				templateData.id = template.template_id;
			}

			const savedTemplate = await saveTemplate(templateData as any);

			if (savedTemplate.id && campaign.settings) {
				updateCampaign({
					id: campaign.id,
					settings: {
						...campaign.settings,
						template_ids: [savedTemplate.id],
					} as ExtendedCampaignSettings,
				});
			}

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
			onStepClick={goToStep}
			disableNavigation={isNewCampaign}
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
