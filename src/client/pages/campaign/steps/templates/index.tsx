/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
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
} from '@quillcrm/components';
import type { EmailTemplate, NoticeMessage } from '@quillcrm/client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import EmailBuilderSelection from './email-builder-selection';
import { saveTemplate } from '@/builder/api/templates';
import { campaignSteps } from '../shared/stepsConfig';
import { FromEmailSelector } from '@quillcrm/components/from-email-selector';

const templateSchema = z
	.object({
		subject: z.string().min(1, __('Subject is required', 'quillcrm')),
		body: z.string().optional(), // Body will be filled by builder
		preview_text: z
			.string()
			.min(1, __('Preview text is required', 'quillcrm')),
		settings: z.object({
			from_name: z
				.string()
				.min(1, __('From name is required', 'quillcrm')),
			from_email: z.email(
				__(
					'Please enter a valid email address for From Email',
					'quillcrm'
				)
			),
			reply_to: z.email(
				__(
					'Please enter a valid email address for Reply To',
					'quillcrm'
				)
			),
			enable_utm: z.boolean().optional(),
			utm_source: z.string().optional(),
			utm_medium: z.string().optional(),
			utm_name: z.string().optional(),
			utm_term: z.string().optional(),
			utm_content: z.string().optional(),
		}),
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
				'quillcrm'
			),
			path: ['settings', 'utm_source'],
		}
	);

const Templates: React.FC = () => {
	const [emailBuilderSelectionVisible, setEmailBuilderSelectionVisible] =
		useState(false);
	const [validationErrors, setValidationErrors] = useState<{
		[key: string]: string;
	}>({});
	const [isSaving, setIsSaving] = useState(false);
	const { campaign, goToStep } = useCampaignStep();
	const { updateCampaign } = useDispatch('quillcrm/campaign');

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
		name: campaign?.name || __('Email Template', 'quillcrm'),
		type: CAMPAIGN_CHANNEL.EMAIL,
		subject: '',
		body: '',
		preview_text: '',
		settings: {
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

	const handleOpenEmailBuilder = () => {
		if (!template) {
			return;
		}

		// Validate the current template before opening the modal
		if (!validate(template)) {
			return;
		}

		setEmailBuilderSelectionVisible(true);
	};

	const saveTemplateStepAndNavigate = async () => {
		if (!template || !campaign) {
			showNotice({
				type: 'error',
				message: __(
					'No template data found. Please refresh the page and try again.',
					'quillcrm'
				),
			});
			return;
		}

		// Validate current template
		if (!validate(template)) {
			showNotice({
				type: 'error',
				message: __(
					'Please fix the validation errors before proceeding',
					'quillcrm'
				),
			});
			return;
		}

		setIsSaving(true);

		try {
			// Prepare template with empty body shell (builder will fill it)
			const templateData: Partial<EmailTemplate> & {
				campaign_id?: number;
			} = {
				...template,
				body: template.body || '{"type":"rich-text","value":""}',
				campaign_id: campaign?.id, // Backend will update campaign's template_ids
			};

			// saveTemplate decides create vs update based on ID presence
			// Backend handles updating campaign.settings.template_ids
			const savedTemplate = await saveTemplate(templateData);

			// Update campaign state with new template ID
			if (savedTemplate.id && campaign?.settings) {
				updateCampaign({
					id: campaign.id,
					settings: {
						...campaign.settings,
						template_ids: [savedTemplate.id],
					} as ExtendedCampaignSettings,
				});
			}

			showNotice({
				type: 'success',
				message: __('Template saved successfully', 'quillcrm'),
			});

			goToStep('builder');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			showNotice({
				type: 'error',
				message:
					errorMessage ||
					__(
						'An error occurred while saving. Please try again.',
						'quillcrm'
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
					steps={campaignSteps}
					canProceed="true"
					currentStep={1}
				/>

				<div className="flex gap-6">
					<PanelSettings
						title={__('Set-up info', 'quillcrm')}
						description={__(
							'Define your sender identity, subject line, and optional UTM tracking before building your campaign.',
							'quillcrm'
						)}
						icon={<SetUpInfoIcon />}
						className="w-2/3 h-full"
						showButtons={true}
						onNext={saveTemplateStepAndNavigate}
						nextLabel={
							isSaving
								? __('Saving...', 'quillcrm')
								: __('Next', 'quillcrm')
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
								label={__('From Name', 'quillcrm')}
								required={true}
								className="flex-1"
							>
								<Input
									placeholder={__('Name here', 'quillcrm')}
									value={template.settings?.from_name || ''}
									onChange={(e) => {
										clearError('from_name');
										updateSettings({
											from_name: e.target.value,
										});
									}}
									style={{
										borderRadius: '8px',
									}}
									className={cn(
										'h-12 bg-white',
										validationErrors.from_name &&
										'!border-red-500 focus-visible:!ring-red-500'
									)}
								/>
								{validationErrors.from_name && (
									<p className="text-red-500 text-sm mt-1">
										{validationErrors.from_name}
									</p>
								)}
							</FormField>

							<FormField
								label={__('From Email', 'quillcrm')}
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
									<p className="text-red-500 text-sm mt-1">
										{validationErrors.from_email}
									</p>
								)}
							</FormField>
						</div>

						<div className="flex gap-4">
							<FormField
								label={__('Reply To', 'quillcrm')}
								required={true}
								className="flex-1"
							>
								<Input
									type="email"
									placeholder={__(
										'name@gmail.com',
										'quillcrm'
									)}
									value={template.settings?.reply_to || ''}
									onChange={(e) => {
										clearError('reply_to');
										updateSettings({
											reply_to: e.target.value,
										});
									}}
									style={{
										borderRadius: '8px',
									}}
									className={cn(
										'h-12 bg-white',
										validationErrors.reply_to &&
										'!border-red-500 focus-visible:!ring-red-500'
									)}
								/>
								{validationErrors.reply_to && (
									<p className="text-red-500 text-sm mt-1">
										{validationErrors.reply_to}
									</p>
								)}
							</FormField>

							<FormField
								label={__('Subject', 'quillcrm')}
								required={true}
								className="flex-1"
							>
								<Input
									placeholder={__('Subject here', 'quillcrm')}
									value={template.subject || ''}
									onChange={(e) => {
										clearError('subject');
										updateTemplate({
											subject: e.target.value,
										});
									}}
									style={{
										borderRadius: '8px',
									}}
									className={cn(
										'h-12 bg-white',
										validationErrors.subject &&
										'!border-red-500 focus-visible:!ring-red-500'
									)}
								/>
								{validationErrors.subject && (
									<p className="text-red-500 text-sm mt-1">
										{validationErrors.subject}
									</p>
								)}
							</FormField>
						</div>

						<FormField
							label={__('Preview Text', 'quillcrm')}
							required={true}
						>
							<Textarea
								placeholder={__(
									'Preview text here',
									'quillcrm'
								)}
								value={template.preview_text || ''}
								onChange={(e) => {
									clearError('preview_text');
									updateTemplate({
										preview_text: e.target.value,
									});
								}}
								style={{
									borderRadius: '8px',
								}}
								className={cn(
									'bg-white',
									validationErrors.preview_text &&
									'!border-red-500 focus-visible:!ring-red-500'
								)}
							/>
							{validationErrors.preview_text && (
								<p className="text-red-500 text-sm mt-1">
									{validationErrors.preview_text}
								</p>
							)}
						</FormField>

						<Separator />

						<div className="py-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<p className="text-lg font-semibold text-foreground">
										{__('Enable UTM', 'quillcrm')}
									</p>
									<p>
										{__(
											'A UTM (Urchin Tracking Module) code is a snippet of text added to the end of a URL to track the metrics and performance of a specific digital marketing campaign',
											'quillcrm'
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
											label={__('UTM Source', 'quillcrm')}
											required={true}
										>
											<Input
												placeholder={__(
													'Source',
													'quillcrm'
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
												style={{
													borderRadius: '8px',
												}}
												className={cn(
													'h-12 bg-white',
													validationErrors.utm_source &&
													'!border-red-500 focus-visible:!ring-red-500'
												)}
											/>
											{validationErrors.utm_source && (
												<p className="text-red-500 text-sm mt-1">
													{
														validationErrors.utm_source
													}
												</p>
											)}
										</FormField>

										<FormField
											label={__('UTM Medium', 'quillcrm')}
											required={true}
										>
											<Input
												placeholder={__(
													'Medium',
													'quillcrm'
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
												style={{
													borderRadius: '8px',
												}}
												className={cn(
													'h-12 bg-white',
													validationErrors.utm_medium &&
													'!border-red-500 focus-visible:!ring-red-500'
												)}
											/>
											{validationErrors.utm_medium && (
												<p className="text-red-500 text-sm mt-1">
													{
														validationErrors.utm_medium
													}
												</p>
											)}
										</FormField>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											label={__('UTM Name', 'quillcrm')}
											required={true}
										>
											<Input
												placeholder={__(
													'Name',
													'quillcrm'
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
												style={{
													borderRadius: '8px',
												}}
												className={cn(
													'h-12 bg-white',
													validationErrors.utm_name &&
													'!border-red-500 focus-visible:!ring-red-500'
												)}
											/>
											{validationErrors.utm_name && (
												<p className="text-red-500 text-sm mt-1">
													{validationErrors.utm_name}
												</p>
											)}
										</FormField>

										<FormField
											label={__('UTM Term', 'quillcrm')}
										>
											<Input
												placeholder={__(
													'Term',
													'quillcrm'
												)}
												value={
													template.settings
														?.utm_term || ''
												}
												style={{
													borderRadius: '8px',
												}}
												className={cn(
													'h-12 bg-white',
													validationErrors.utm_term &&
													'!border-red-500 focus-visible:!ring-red-500'
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
										label={__('UTM Content', 'quillcrm')}
									>
										<Input
											placeholder={__(
												'Content',
												'quillcrm'
											)}
											value={
												template.settings
													?.utm_content || ''
											}
											style={{
												borderRadius: '8px',
											}}
											className={cn(
												'h-12 bg-white',
												validationErrors.utm_content &&
												'!border-red-500 focus-visible:!ring-red-500'
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

					<FeedBuilder setVisibile={handleOpenEmailBuilder} />
				</div>
			</PanelLayout>
			<EmailBuilderSelection
				setVisible={setEmailBuilderSelectionVisible}
				visible={emailBuilderSelectionVisible}
				campaign={campaign}
			/>
		</div>
	);
};

export default Templates;
