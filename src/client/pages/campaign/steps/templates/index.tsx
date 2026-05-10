/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getToLink, useNavigate } from '@doublescale/navigation';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { useCampaignStep } from '../shared';
import type { ExtendedCampaignSettings } from '@/stores/campaign/types';
import {
	FeedBuilder,
	FormField,
	PanelLayout,
	PanelSettings,
	PlayIcon,
	Stepper,
	SetUpInfoIcon,
	NoticeBanner,
} from '@doublescale/components';
import type { EmailTemplate, NoticeMessage } from '@doublescale/client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { saveTemplate } from '@/builder/api/templates';
import { campaignSteps, automatedCampaignSteps } from '../shared/stepsConfig';
import { FromEmailSelector } from '@doublescale/components/from-email-selector';

const templateSchema = z
	.object({
		settings: z.object({
			subject: z.string().min(1, __('Subject is required', 'doublescale')),
			preview_text: z
				.string()
				.min(1, __('Preview text is required', 'doublescale')),
			from_name: z
				.string()
				.min(1, __('From name is required', 'doublescale')),
			from_email: z.email(
				__(
					'Please enter a valid email address for From Email',
					'doublescale'
				)
			),
			reply_to: z.email(
				__(
					'Please enter a valid email address for Reply To',
					'doublescale'
				)
			),
			enable_utm: z.boolean().optional(),
			utm_source: z.string().optional(),
			utm_medium: z.string().optional(),
			utm_name: z.string().optional(),
			utm_term: z.string().optional(),
			utm_content: z.string().optional(),
		}),
		body: z.any().optional(),
	})
	.refine(
		(data) => {
			// If UTM is enabled, require UTM fields
			if (data.settings.enable_utm) {
				return !!(
					data.settings.utm_source &&
					data.settings.utm_medium &&
					data.settings.utm_name
				);
			}
			return true;
		},
		{
			message: __(
				'All UTM fields are required when UTM is enabled',
				'doublescale'
			),
			path: ['settings', 'utm_source'],
		}
	);

const Templates: React.FC = () => {
	const [validationErrors, setValidationErrors] = useState<{
		[key: string]: string;
	}>({});
	const [isSaving, setIsSaving] = useState(false);
	const { campaign, goToStep, isNewCampaign } = useCampaignStep();
	const { updateCampaign } = useDispatch('doublescale/campaign');
	const navigate = useNavigate();

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const showNotice = (noticeData: NoticeMessage) => {
		setNotice(noticeData);
	};

	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	// Single template object - matches backend structure
	const [template, setTemplate] = useState<Partial<EmailTemplate>>({
		name: campaign?.name || __('Email Template', 'doublescale'),
		type: CAMPAIGN_CHANNEL.EMAIL,
		body: '',
		settings: {
			subject: '',
			preview_text: '',
			from_name: '',
			from_email: '',
			reply_to: '',
			enable_utm: false,
			utm_source: '',
			utm_medium: '',
			utm_name: '',
			utm_term: '',
			utm_content: '',
		},
	});

	// Load template from campaign.settings.templates (attached by backend)
	useEffect(() => {
		if (campaign?.settings?.templates?.[0]) {
			setTemplate(campaign.settings.templates[0] as EmailTemplate);
		}
	}, [campaign?.settings?.templates]);

	const updateTemplate = (data: Partial<EmailTemplate>) => {
		setTemplate((prev) => ({ ...prev, ...data }));
	};

	// Helper to update settings fields
	const updateSettings = (
		settingsData: Partial<EmailTemplate['settings']>
	) => {
		setTemplate((prev) => ({
			...prev,
			settings: {
				...prev.settings,
				...settingsData,
			} as EmailTemplate['settings'],
		}));
	};

	const clearError = (fieldName: string) => {
		setValidationErrors((prev) => {
			const newErrors = { ...prev };
			delete newErrors[fieldName];
			return newErrors;
		});
	};

	const validate = (templateToValidate: Partial<EmailTemplate>) => {
		const result = templateSchema.safeParse(templateToValidate);

		if (!result.success) {
			const errors: { [key: string]: string } = {};

			result.error.issues.forEach((issue) => {
				const fieldName = String(issue.path[issue.path.length - 1]);
				errors[fieldName] = issue.message;
			});

			setValidationErrors(errors);
			return false;
		}

		setValidationErrors({});
		return true;
	};


	const hasBuilderBody = (() => {
		const body = template.body;
		if (!body) return false;
		try {
			const parsed = typeof body === 'string' ? JSON.parse(body) : body;
			return (
				parsed?.type === 'builder' &&
				parsed?.value?.sections?.length > 0
			);
		} catch {
			return false;
		}
	})();

	const saveTemplateStepAndNavigate = async () => {
		if (!template || !campaign) {
			showNotice({
				type: 'error',
				message: __(
					'No template data found. Please refresh the page and try again.',
					'doublescale'
				),
			});
			return;
		}

		if (!validate(template)) {
			showNotice({
				type: 'error',
				message: __(
					'Please fix the validation errors before proceeding',
					'doublescale'
				),
			});
			return;
		}

		setIsSaving(true);

		try {
			const rawBody = template.body;
			const bodyStr =
				typeof rawBody === 'string'
					? rawBody
					: rawBody
						? JSON.stringify(rawBody)
						: '{"type":"rich-text","value":""}';

			const templateData: Partial<EmailTemplate> & {
				campaign_id?: number;
			} = {
				...template,
				body: bodyStr,
				campaign_id: campaign?.id,
			};

			const savedTemplate = await saveTemplate(templateData);

			if (savedTemplate.id && campaign?.settings) {
				updateCampaign({
					id: campaign.id,
					settings: {
						...campaign.settings,
						template_ids: [savedTemplate.id],
					} as ExtendedCampaignSettings,
				});
			}

			const navState = isNewCampaign ? { state: { isNew: true } } : undefined;
			if (hasBuilderBody) {
				navigate(getToLink(`campaigns/${campaign.id}/builder`), navState);
			} else {
				navigate(getToLink(`campaigns/${campaign.id}/email-templates`), navState);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			showNotice({
				type: 'error',
				message:
					errorMessage ||
					__(
						'An error occurred while saving. Please try again.',
						'doublescale'
					),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div>
			<PanelLayout
				items={[
					{
						label: __('Create Campaign', 'doublescale'),
						href: 'campaigns',
					},
					{
						label: campaign?.settings?.automated
							? __('Automated Campaign', 'doublescale')
							: campaign?.settings.ab_test
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
				steps={campaign?.settings?.automated ? automatedCampaignSteps : campaignSteps}
				canProceed="true"
				currentStep={campaign?.settings?.automated ? 2 : 1}
				onStepClick={goToStep}
				disableNavigation={isNewCampaign}
			/>

				<div className="flex gap-6">
					<PanelSettings
						title={__('Set-up info', 'doublescale')}
						description={__(
							'Define your sender identity, subject line, and optional UTM tracking before building your campaign.',
							'doublescale'
						)}
						icon={<SetUpInfoIcon />}
						className="w-2/3 h-full"
						showButtons={true}
						onNext={saveTemplateStepAndNavigate}
						nextLabel={
							isSaving
								? __('Saving...', 'doublescale')
								: __('Next', 'doublescale')
						}
						isLoading={isSaving}
					>
						{/* Notice Banner */}
						{notice && (
							<NoticeBanner
								ref={noticeBannerRef}
								notice={notice}
								closeNotice={closeNotice}
							/>
						)}

						<div className="flex gap-4">
							<FormField
								label={__('From Name', 'doublescale')}
								required={true}
								className="flex-1"
							>
								<Input
									placeholder={__('Name here', 'doublescale')}
									value={template.settings?.from_name || ''}
									onChange={(e) => {
										clearError('from_name');
										updateSettings({
											from_name: e.target.value,
										});
									}}
								className={cn(
									validationErrors.from_name &&
									'!border-destructive focus-visible:!ring-destructive/20'
								)}
								/>
								{validationErrors.from_name && (
							<p className="text-destructive text-sm mt-1">
									{validationErrors.from_name}
								</p>
								)}
							</FormField>

							<FormField
								label={__('From Email', 'doublescale')}
								required={true}
								className="flex-1"
							>
								<FromEmailSelector
									value={template.settings?.from_email || ''}
									onChange={(email, name) => {
										clearError('from_email');
										updateSettings({
											from_email: email,
											// Auto-fill from name if provided and current from_name is empty
											...(name &&
												!template.settings?.from_name
												? { from_name: name }
												: {}),
										});
									}}
									error={validationErrors.from_email}
								/>
								{validationErrors.from_email && (
							<p className="text-destructive text-sm mt-1">
									{validationErrors.from_email}
								</p>
								)}
							</FormField>
						</div>

						<div className="flex gap-4">
							<FormField
								label={__('Reply To', 'doublescale')}
								required={true}
								className="flex-1"
							>
								<Input
									type="email"
									placeholder={__(
										'name@gmail.com',
										'doublescale'
									)}
									value={template.settings?.reply_to || ''}
									onChange={(e) => {
										clearError('reply_to');
										updateSettings({
											reply_to: e.target.value,
										});
									}}
								className={cn(
									validationErrors.reply_to &&
									'!border-destructive focus-visible:!ring-destructive/20'
								)}
								/>
								{validationErrors.reply_to && (
							<p className="text-destructive text-sm mt-1">
									{validationErrors.reply_to}
								</p>
								)}
							</FormField>

							<FormField
								label={__('Subject', 'doublescale')}
								required={true}
								className="flex-1"
							>
								<Input
									placeholder={__('Subject here', 'doublescale')}
									value={template.settings?.subject || ''}
									onChange={(e) => {
										clearError('subject');
										updateSettings({
											subject: e.target.value,
										});
									}}
								className={cn(
									validationErrors.subject &&
									'!border-destructive focus-visible:!ring-destructive/20'
								)}
								/>
								{validationErrors.subject && (
							<p className="text-destructive text-sm mt-1">
									{validationErrors.subject}
								</p>
								)}
							</FormField>
						</div>

						<FormField
							label={__('Preview Text', 'doublescale')}
							required={true}
						>
							<Textarea
								placeholder={__(
									'Preview text here',
									'doublescale'
								)}
								value={template.settings?.preview_text || ''}
								onChange={(e) => {
									clearError('preview_text');
									updateSettings({
										preview_text: e.target.value,
									});
								}}
							className={cn(
								validationErrors.preview_text &&
								'!border-destructive focus-visible:!ring-destructive/20'
							)}
							/>
							{validationErrors.preview_text && (
						<p className="text-destructive text-sm mt-1">
								{validationErrors.preview_text}
							</p>
							)}
						</FormField>

						<Separator />

						<div className="py-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<p className="text-lg font-semibold text-foreground">
										{__('Enable UTM', 'doublescale')}
									</p>
									<p>
										{__(
											'A UTM (Urchin Tracking Module) code is a snippet of text added to the end of a URL to track the metrics and performance of a specific digital marketing campaign',
											'doublescale'
										)}
									</p>
								</div>
								<Switch
									checked={
										template.settings?.enable_utm || false
									}
									onCheckedChange={(checked) =>
										updateSettings({
											enable_utm: checked,
										})
									}
								/>
							</div>

							{template.settings?.enable_utm && (
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<FormField
											label={__('UTM Source', 'doublescale')}
											required={true}
										>
											<Input
												placeholder={__(
													'Source',
													'doublescale'
												)}
												value={
													template.settings
														?.utm_source || ''
												}
												onChange={(e) => {
													clearError('utm_source');
													updateSettings({
														utm_source:
															e.target.value,
													});
												}}
											className={cn(
												validationErrors.utm_source &&
												'!border-destructive focus-visible:!ring-destructive/20'
											)}
											/>
											{validationErrors.utm_source && (
											<p className="text-destructive text-sm mt-1">
												{
													validationErrors.utm_source
												}
											</p>
											)}
										</FormField>

										<FormField
											label={__('UTM Medium', 'doublescale')}
											required={true}
										>
											<Input
												placeholder={__(
													'Medium',
													'doublescale'
												)}
												value={
													template.settings
														?.utm_medium || ''
												}
												onChange={(e) => {
													clearError('utm_medium');
													updateSettings({
														utm_medium:
															e.target.value,
													});
												}}
											className={cn(
												validationErrors.utm_medium &&
												'!border-destructive focus-visible:!ring-destructive/20'
											)}
											/>
											{validationErrors.utm_medium && (
											<p className="text-destructive text-sm mt-1">
												{
													validationErrors.utm_medium
												}
											</p>
											)}
										</FormField>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											label={__('UTM Name', 'doublescale')}
											required={true}
										>
											<Input
												placeholder={__(
													'Name',
													'doublescale'
												)}
												value={
													template.settings
														?.utm_name || ''
												}
												onChange={(e) => {
													clearError('utm_name');
													updateSettings({
														utm_name:
															e.target.value,
													});
												}}
											className={cn(
												validationErrors.utm_name &&
												'!border-destructive focus-visible:!ring-destructive/20'
											)}
											/>
											{validationErrors.utm_name && (
											<p className="text-destructive text-sm mt-1">
												{validationErrors.utm_name}
											</p>
											)}
										</FormField>

										<FormField
											label={__('UTM Term', 'doublescale')}
										>
											<Input
												placeholder={__(
													'Term',
													'doublescale'
												)}
												value={
													template.settings
														?.utm_term || ''
												}
											className={cn(
												validationErrors.utm_term &&
												'!border-destructive focus-visible:!ring-destructive/20'
											)}
												onChange={(e) =>
													updateSettings({
														utm_term:
															e.target.value,
													})
												}
											/>
										</FormField>
									</div>

									<FormField
										label={__('UTM Content', 'doublescale')}
									>
										<Input
											placeholder={__(
												'Content',
												'doublescale'
											)}
											value={
												template.settings
													?.utm_content || ''
											}
										className={cn(
											validationErrors.utm_content &&
											'!border-destructive focus-visible:!ring-destructive/20'
										)}
											onChange={(e) =>
												updateSettings({
													utm_content: e.target.value,
												})
											}
										/>
									</FormField>
								</div>
							)}
						</div>
					</PanelSettings>

					<FeedBuilder
						fromName={template.settings?.from_name}
						subject={template.settings?.subject}
						previewText={template.settings?.preview_text}
					/>
				</div>
			</PanelLayout>
		</div>
	);
};

export default Templates;
