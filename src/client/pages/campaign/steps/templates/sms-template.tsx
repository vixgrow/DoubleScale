/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
/**
 * External dependencies
 */
import { X } from 'lucide-react';
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
	AlertIcon,
	MergeTagsIcon,
	Field,
	NoticeBanner,
} from '@quillcrm/components';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SMSTemplate, NoticeMessage } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { ImageUploadControl } from '@/builder/blocks/basic/shared/ImageUploadControl';
import { getCampaignEndpoint } from '@quillcrm/utils';
//@ts-ignore
import device from '../../../../../../assets/images/message-device.png';


const SMSTemplateStep: React.FC = () => {
	const { campaign, saving, goToStep } = useCampaignStep();
	const { setMergeTagsVisible, setMergeTagCallback } =
		useDispatch('quillcrm/core');
	const [showWarning, setShowWarning] = useState(true);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

	// Scroll to notice banner when it appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	// Initialize default SMS template
	const defaultTemplate: SMSTemplate = {
		name: __('SMS Message', 'quillcrm'),
		type: CAMPAIGN_CHANNEL.SMS,
		body: '',
		settings: {
			add_unsubscribe: true,
		},
	};

	const [template, setTemplate] = useState<SMSTemplate>(() => {
		// Safely extract template or use default
		const existingTemplate = campaign?.settings?.templates?.[0];
		if (
			existingTemplate &&
			'type' in existingTemplate &&
			existingTemplate.type === CAMPAIGN_CHANNEL.SMS
		) {
			// Convert backend format to frontend format
			const backendTemplate = existingTemplate as any;
			return {
				name: backendTemplate.name || defaultTemplate.name,
				type: CAMPAIGN_CHANNEL.SMS,
				body: backendTemplate.body || '',
				settings: {
					add_unsubscribe:
						backendTemplate.settings?.add_unsubscribe ?? true,
				},
			};
		}
		return defaultTemplate;
	});

	// Additional states for the new fields
	const [fromName, setFromName] = useState('');
	const [imageUrl, setImageUrl] = useState('');
	const [imageAlt, setImageAlt] = useState('');
	const [specialCharacters, setSpecialCharacters] = useState(false);

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
				message: __('Message content is required', 'quillcrm'),
			});
			return false;
		}

		if (template.body.length > 1600) {
			setNotice({
				type: 'error',
				message: __('Message is too long. Maximum 1600 characters.', 'quillcrm'),
			});
			return false;
		}

		setNotice(null);
		return true;
	};

	const save = async () => {
		if (!campaign || !validate()) {
			return;
		}

		try {
			// Use consistent structure across all campaign types
			const backendTemplate = {
				name: template.name,
				type: template.type,
				body: template.body,
				settings: {
					add_unsubscribe: template.settings?.add_unsubscribe ?? true,
				},
			};

			const endpoint = getCampaignEndpoint(campaign.type);
			if (!endpoint) {
				throw new Error(__('Invalid campaign type', 'quillcrm'));
			}

			await apiFetch({
				path: `${endpoint}/${campaign.id}`,
				method: 'PUT',
				data: {
					...campaign,
					settings: {
						...campaign.settings,
						templates: [backendTemplate],
					},
				},
			});

			setNotice(null);
			goToStep('contacts');
		} catch (error: any) {
			setNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to save template. Please try again.', 'quillcrm'),
			});
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
					label: __('Create Campaign', 'quillcrm'),
					href: 'campaigns',
				},
				{
					label: campaign?.settings.ab_test
						? __('A/B Test Campaign', 'quillcrm')
						: __('Standard Campaign', 'quillcrm'),
				},
			]}
			panelbtns={[
				<Button variant="secondaryDeepBlue">
					<PlayIcon />
					{__('Watch Tutorial', 'quillcrm')}
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
						title={__('Set-up Info', 'quillcrm')}
						description={__(
							'Define your sender identity, subject line, and optional UTM tracking before building your campaign.',
							'quillcrm'
						)}
						icon={<SetUpInfoIcon />}
						onNext={save}
						nextLabel={saving ? __('Saving...', 'quillcrm') : __('Next', 'quillcrm')}
						showButtons={true}
						isLoading={saving}
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

							{/* From Name Field */}
							<div>
								<Field
									label={__('From Name', 'quillcrm')}
									type="text"
									value={fromName}
									onChange={setFromName}
									placeholder={__('From Name', 'quillcrm')}
									required={true}
								/>
								<p className="text-base font-medium text-[#3B82F6] mt-2">
									{__(
										'In some countries, display names are not allowed and only a phone number or a short code is displayed to recipients.',
										'quillcrm'
									)}
								</p>
							</div>

							{/* Warning Alert */}
							{showWarning && (
								<Alert className="bg-white relative flex items-start justify-between">
									<div className="flex-1">
										<AlertDescription>
											<p className="font-semibold flex items-center gap-2 text-[#CB5301] text-base mb-1">
												<AlertIcon
													width={20}
													height={20}
												/>
												{__(
													'Sending to the US requires a toll-free number.',
													'quillcrm'
												)}
											</p>
											<p className="text-[#333333] text-base">
												{__(
													'To send an SMS campaign to recipients in the United States or Canada, you must complete',
													'quillcrm'
												)}{' '}
												<a
													href="#"
													className="text-[#3B82F6] font-semibold"
												>
													{__(
														'this form',
														'quillcrm'
													)}
												</a>{' '}
												{__(
													'to be registered with a toll-free number and comply with the regulations.',
													'quillcrm'
												)}
											</p>
										</AlertDescription>
									</div>
									<Button
										variant="ghost"
										onClick={() =>
											setShowWarning(false)
										}
										className="flex-shrink-0 text-[#333333] shadow-none border-none p-0 hover:text-black"
									>
										<X className="w-4 h-4" />
									</Button>
								</Alert>
							)}

							{/* Two Column Layout: Message and Upload Image */}
							<div className="flex items-start gap-4 w-full">
								{/* Message Column */}
								<div className="space-y-2 w-1/2">
									<div className="flex items-center justify-between">
										<label className="text-base font-medium text-[#333333]">
											{__('Message', 'quillcrm')}
											<span className="text-red-500">*</span>
										</label>
										<Button
											variant="ghost"
											onClick={handleMergeTagClick}
											className="text-[#333333] shadow-none border-none p-0 hover:text-black"
										>
											<MergeTagsIcon width={24} height={24} />
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
											'quillcrm'
										)}
										rows={5}
										className="bg-white resize-none"
									/>
								</div>

								{/* Upload Image Column */}
								<div className="w-1/2 mt-2">
									<ImageUploadControl
										label={__('Upload image', 'quillcrm')}
										value={imageUrl}
										alt={imageAlt}
										onChange={({ src, alt }) => {
											setImageUrl(src);
											setImageAlt(alt);
										}}
										uploadId="sms-template-image"
										simpleMode={true}
									/>
								</div>
							</div>

							<Separator />

							{/* Special Characters Section */}
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<p className="text-base font-semibold text-[#333333] mb-1">
										{__('Special characters', 'quillcrm')}
									</p>
									<div className="text-sm text-[#71717A] font-medium">
										<p>
											{__(
												"Special characters (accents, non-latin alphabets and emojis) may be replaced by other characters in SMS if they're not actively supported.",
												'quillcrm'
											)}
										</p>
										<p>
											{__(
												'The character limit will go from 160 to 70, possibly increasing the SMS count.',
												'quillcrm'
											)}
										</p>
										<p>
											{__(
												'Activate special characters to make sure your SMS can be read easily',
												'quillcrm'
											)}
										</p>
									</div>
								</div>
								<Switch
									checked={specialCharacters}
									onCheckedChange={setSpecialCharacters}
								/>
							</div>
						</div>
					</PanelSettings>
				</div>
				<div className="flex flex-col items-center justify-center border border-gray-200 rounded-2xl bg-[#F8F8F8] w-1/3">
					<img src={device} alt="device" className="w-[350px]" />
				</div>
			</div>
		</PanelLayout>
	);
};

export default SMSTemplateStep;
