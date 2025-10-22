/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignStep } from '../shared';
import {
	CategoryIcon,
	FeedBuilder,
	FormField,
	PanelLayout,
	PanelSettings,
	PlayIcon,
	Stepper,
} from '@quillcrm/components';
import type { EmailTemplate } from '@quillcrm/client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import EmailBuilderSelection from './email-builder-selection';
import {
	createTemplate as createTemplateAPI,
	updateTemplate as updateTemplateAPI,
	getTemplate,
} from '@/builder/api/templates';
import { campaignSteps } from '../shared/stepsConfig';
import { ArrowRight } from 'lucide-react';

// Zod validation schema for flat template structure
const templateSchema = z
	.object({
		subject: z.string().min(1, __('Subject is required', 'quillcrm')),
		body: z.string().min(1, __('Body is required', 'quillcrm')),
		from_name: z.string().min(1, __('From name is required', 'quillcrm')),
		from_email: z.email(
			__('Please enter a valid email address for From Email', 'quillcrm')
		),
		reply_to: z.email(
			__('Please enter a valid email address for Reply To', 'quillcrm')
		),
		preview_text: z
			.string()
			.min(1, __('Preview text is required', 'quillcrm')),
		enable_utm: z.boolean().optional(),
		utm_source: z.string().optional(),
		utm_medium: z.string().optional(),
		utm_name: z.string().optional(),
		utm_term: z.string().optional(),
		utm_content: z.string().optional(),
	})
	.refine(
		(data) => {
			// If UTM is enabled, require UTM fields
			if (data.enable_utm) {
				return !!(data.utm_source && data.utm_medium && data.utm_name);
			}
			return true;
		},
		{
			message: __(
				'All UTM fields are required when UTM is enabled',
				'quillcrm'
			),
			path: ['utm_source'],
		}
	);

const Templates: React.FC = () => {
	const isMountedRef = useRef(true);
	const [emailBuilderSelectionVisible, setEmailBuilderSelectionVisible] =
		useState(false);
	const [validationErrors, setValidationErrors] = useState<{
		[key: string]: string;
	}>({});
	const { campaign, saveCampaignStep, saveCampaignSettings, goToStep } =
		useCampaignStep();

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Get existing step data
	const existingTemplateData = useSelect(
		(select: any) => select('quillcrm/campaign').getStepData('template'),
		[]
	);

	// Using old flat template structure
	const defaultTemplate: EmailTemplate = {
		name: campaign?.name || __('New Email', 'quillcrm'),
		type: 'email' as const,
		subject: __('New Email', 'quillcrm'),
		body: 'Email body', // Default rich-text content
		email_body: {
			type: 'rich-text',
			value: 'Email body',
		},
		from_name: '',
		from_email: '',
		reply_to: '',
		preview_text: '',
		enable_utm: false,
		utm_source: '',
		utm_medium: '',
		utm_name: '',
		utm_term: '',
		utm_content: '',
	};
	const [templates, setTemplates] = useState<EmailTemplate[]>(
		(campaign?.settings?.templates as EmailTemplate[]) || []
	);
	const [currentTab] = useState(0);
	const { createNotice } = useDispatch('quillcrm/core');

	useEffect(() => {
		// Load template from template table if we have a template_id
		const loadTemplate = async () => {
			// Don't reload if we already have templates loaded
			if (templates.length > 0 && templates[0].id) {
				console.log('Template already loaded, skipping reload');
				return;
			}

			try {
				if (existingTemplateData?.template_id) {
					console.log(
						'Loading template by ID:',
						existingTemplateData.template_id
					);
					const template = await getTemplate(
						existingTemplateData.template_id
					);
					setTemplates([template]);
					console.log('Loaded template from API:', template);
				} else if (
					campaign?.settings?.templates &&
					campaign.settings.templates.length > 0
				) {
					// Load from campaign settings if available
					const campaignTemplates = campaign.settings
						.templates as EmailTemplate[];
					setTemplates(campaignTemplates);
					console.log(
						'Loaded templates from campaign settings:',
						campaignTemplates
					);
				} else if (templates.length === 0) {
					setTemplates([defaultTemplate]);
					console.log('Using default template:', defaultTemplate);
				}
			} catch (error: any) {
				console.error('Failed to load template:', error);
				createNotice({
					type: 'error',
					message:
						error.message ||
						__('Failed to load template', 'quillcrm'),
				});
				// Fallback to default template
				setTemplates([defaultTemplate]);
			}
		};

		loadTemplate();
	}, [existingTemplateData?.template_id]);

	const updateTemplate = (index: number, data: Partial<EmailTemplate>) => {
		if (!campaign) {
			return;
		}

		const newTemplates = templates ? [...templates] : [];
		newTemplates[index] = newTemplates[index]
			? {
					...newTemplates[index],
					...data,
				}
			: {
					...defaultTemplate,
					...data,
				};

		setTemplates(newTemplates);
	};

	const clearError = (fieldName: string) => {
		setValidationErrors((prev) => {
			const newErrors = { ...prev };
			delete newErrors[fieldName];
			return newErrors;
		});
	};

	const validate = (template: Partial<EmailTemplate>) => {
		const result = templateSchema.safeParse(template);

		if (!result.success) {
			const errors: { [key: string]: string } = {};

			result.error.issues.forEach((issue) => {
				// Convert nested paths like "settings.from_name" to just "from_name"
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
		if (!templates[currentTab]) {
			return;
		}

		// Validate the current template before opening the modal
		if (!validate(templates[currentTab])) {
			return;
		}

		setEmailBuilderSelectionVisible(true);
	};

	const saveTemplateStepAndNavigate = async () => {
		const currentTemplate = templates[currentTab];

		if (!currentTemplate || !campaign) {
			createNotice({
				type: 'error',
				message: __(
					'No template data found. Please refresh the page and try again.',
					'quillcrm'
				),
			});
			return;
		}

		// Validate current template
		if (!validate(currentTemplate)) {
			createNotice({
				type: 'error',
				message: __(
					'Please fix the validation errors before proceeding',
					'quillcrm'
				),
			});
			return;
		}

		try {
			// Create or update template in templates table
			let savedTemplate: EmailTemplate;
			const templateData = {
				...templates[currentTab],
				name: `Campaign ${campaign?.id} - Email Template`,
				type: 'email' as const,
			};

			// Update existing template if it has an ID, otherwise create new one
			if (templateData.id) {
				// Update existing template
				console.log('Updating existing template:', templateData.id);
				savedTemplate = await updateTemplateAPI(
					templateData.id,
					templateData
				);
			} else {
				// Create new template
				console.log(
					'Creating new template with metadata:',
					templateData
				);
				savedTemplate = await createTemplateAPI(templateData);
			}

			// Check if component is still mounted before continuing
			if (!isMountedRef.current) return;

			console.log('Saved template:', savedTemplate);

			// Save template_id to campaign step data
			const saveSuccess = await saveCampaignStep('template', {
				template_id: savedTemplate.id!,
			});

			if (!isMountedRef.current) return;

			if (!saveSuccess) {
				throw new Error('Failed to save template step data');
			}

			// Update campaign settings with only template_ids
			// The backend will fetch full template data using attach_templates()
			await saveCampaignSettings({
				settings: {
					...campaign.settings,
					template_ids: [savedTemplate.id!],
				},
			});

			if (!isMountedRef.current) return;

			createNotice({
				type: 'success',
				message: __('Template metadata saved successfully', 'quillcrm'),
			});

			goToStep('builder');
		} catch (error: any) {
			if (!isMountedRef.current) return;

			console.error('Save template error:', error);
			createNotice({
				type: 'error',
				message:
					error.message ||
					__(
						'An error occurred while saving. Please try again.',
						'quillcrm'
					),
			});
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
						title={__('Campaign Template', 'quillcrm')}
						description={__(
							'Name your campaign to help you remember what its about. only you will see this.',
							'quillcrm'
						)}
						icon={<CategoryIcon />}
						className="w-2/3 h-full"
					>
						<div>
							<div className="flex gap-4">
								<FormField
									label={__('From Name', 'quillcrm')}
									required={true}
									className="flex-1"
								>
									<Input
										placeholder={__(
											'Name here',
											'quillcrm'
										)}
										value={
											templates[currentTab]?.from_name ||
											''
										}
										onChange={(e) => {
											clearError('from_name');
											updateTemplate(currentTab, {
												from_name: e.target.value,
											});
										}}
										className={cn(
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
									<Input
										type="email"
										placeholder={__(
											'name@gmail.com',
											'quillcrm'
										)}
										value={
											templates[currentTab]?.from_email ||
											''
										}
										onChange={(e) => {
											clearError('from_email');
											updateTemplate(currentTab, {
												from_email: e.target.value,
											});
										}}
										className={cn(
											validationErrors.from_email &&
												'!border-red-500 focus-visible:!ring-red-500'
										)}
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
										value={
											templates[currentTab]?.reply_to ||
											''
										}
										onChange={(e) => {
											clearError('reply_to');
											updateTemplate(currentTab, {
												reply_to: e.target.value,
											});
										}}
										className={cn(
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
										placeholder={__(
											'Subject here',
											'quillcrm'
										)}
										value={
											templates[currentTab]?.subject || ''
										}
										onChange={(e) => {
											clearError('subject');
											updateTemplate(currentTab, {
												subject: e.target.value,
											});
										}}
										className={cn(
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
									value={
										templates[currentTab]?.preview_text ||
										''
									}
									onChange={(e) => {
										clearError('preview_text');
										updateTemplate(currentTab, {
											preview_text: e.target.value,
										});
									}}
									className={cn(
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
											templates[currentTab]?.enable_utm ||
											false
										}
										onCheckedChange={(checked) =>
											updateTemplate(currentTab, {
												enable_utm: checked,
											})
										}
									/>
								</div>

								{templates[currentTab]?.enable_utm && (
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<FormField
												label={__(
													'UTM Source',
													'quillcrm'
												)}
												required={true}
											>
												<Input
													placeholder={__(
														'Source',
														'quillcrm'
													)}
													value={
														templates[currentTab]
															?.utm_source || ''
													}
													onChange={(e) => {
														clearError(
															'utm_source'
														);
														updateTemplate(
															currentTab,
															{
																utm_source:
																	e.target
																		.value,
															}
														);
													}}
													className={cn(
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
												label={__(
													'UTM Medium',
													'quillcrm'
												)}
												required={true}
											>
												<Input
													placeholder={__(
														'Medium',
														'quillcrm'
													)}
													value={
														templates[currentTab]
															?.utm_medium || ''
													}
													onChange={(e) => {
														clearError(
															'utm_medium'
														);
														updateTemplate(
															currentTab,
															{
																utm_medium:
																	e.target
																		.value,
															}
														);
													}}
													className={cn(
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
												label={__(
													'UTM Name',
													'quillcrm'
												)}
												required={true}
											>
												<Input
													placeholder={__(
														'Name',
														'quillcrm'
													)}
													value={
														templates[currentTab]
															?.utm_name || ''
													}
													onChange={(e) => {
														clearError('utm_name');
														updateTemplate(
															currentTab,
															{
																utm_name:
																	e.target
																		.value,
															}
														);
													}}
													className={cn(
														validationErrors.utm_name &&
															'!border-red-500 focus-visible:!ring-red-500'
													)}
												/>
												{validationErrors.utm_name && (
													<p className="text-red-500 text-sm mt-1">
														{
															validationErrors.utm_name
														}
													</p>
												)}
											</FormField>
											<FormField
												label={__(
													'UTM Term',
													'quillcrm'
												)}
											>
												<Input
													placeholder={__(
														'Term',
														'quillcrm'
													)}
													value={
														templates[currentTab]
															?.utm_term || ''
													}
													onChange={(e) =>
														updateTemplate(
															currentTab,
															{
																utm_term:
																	e.target
																		.value,
															}
														)
													}
												/>
											</FormField>
										</div>
										<FormField
											label={__(
												'UTM Content',
												'quillcrm'
											)}
										>
											<Input
												placeholder={__(
													'Content',
													'quillcrm'
												)}
												value={
													templates[currentTab]
														?.utm_content || ''
												}
												onChange={(e) =>
													updateTemplate(currentTab, {
														utm_content:
															e.target.value,
													})
												}
											/>
										</FormField>
									</div>
								)}
							</div>

							<Separator />

							<div className="flex justify-end py-4">
								{/* <Button
									variant="outline"
									onClick={sendTestEmail}
									disabled={isSendingTestEmail}
								>
									{isSendingTestEmail
										? __('Sending...', 'quillcrm')
										: __('Send Test Email', 'quillcrm')}
								</Button> */}

								<Button
									variant="gradient"
									onClick={saveTemplateStepAndNavigate}
								>
									{__('Next', 'quillcrm')} <ArrowRight />
								</Button>
							</div>
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
