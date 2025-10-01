/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { isString } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../../state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import {
	Breadcrumb,
	CategoryIcon,
	FeedBuilder,
	FormField,
	PanelLayout,
	PanelSettings,
	PlayIcon,
	Template,
} from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';
import type { Template as TemplateType } from '@quillcrm/client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import EmailBuilderSelection from './email-builder-selection';

// Zod validation schema
const templateSettingsSchema = z.object({
	from_name: z.string().min(1, __('From name is required', 'quillcrm')),
	from_email: z.string().email(__('From email is not valid', 'quillcrm')),
	reply_to: z.string().email(__('Reply to email is not valid', 'quillcrm')),
	preview_text: z.string().min(1, __('Preview text is required', 'quillcrm')),
	enable_utm: z.boolean().optional(),
	utm_source: z.string().optional(),
	utm_medium: z.string().optional(),
	utm_name: z.string().optional(),
	utm_term: z.string().optional(),
	utm_content: z.string().optional(),
});

const templateSchema = z
	.object({
		subject: z.string().min(1, __('Subject is required', 'quillcrm')),
		body: z.string().min(1, __('Body is required', 'quillcrm')),
		settings: templateSettingsSchema,
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
			path: ['settings'],
		}
	);

const Templates: React.FC = () => {
	const [emailBuilderSelectionVisible, setEmailBuilderSelectionVisible] =
		useState(false);
	const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
	const [testEmailAddress, setTestEmailAddress] = useState('');
	const [validationErrors, setValidationErrors] = useState<{
		[key: string]: string;
	}>({});
	const { campaign, isLoading, saveCampaign, isSaving } =
		useCampaignContext();
	const navigate = useNavigate();

	// Using template table structure
	const defaultTemplate = {
		name: campaign?.name || __('New Email', 'quillcrm'),
		type: 'email',
		subject: __('New Email', 'quillcrm'),
		body: 'Email body',
		settings: {
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
		},
	};
	const [templates, setTemplates] = useState<TemplateType[]>(
		campaign?.settings.templates || []
	);
	const [currentTab, setCurrentTab] = useState(0);
	const { createNotice } = useDispatch('quillcrm/core');

	useEffect(() => {
		if (templates.length === 0) {
			setTemplates([defaultTemplate]);
		}
	}, []);

	const addTemplate = () => {
		if (!campaign) {
			return;
		}

		const newTemplates = templates ? [...templates] : [];
		newTemplates.push(defaultTemplate);
		setTemplates(newTemplates);
		setCurrentTab(newTemplates.length - 1);
	};

	const removeTemplate = (index: number) => {
		if (!campaign) {
			return;
		}

		const newTemplates = templates ? [...templates] : [];
		newTemplates.splice(index, 1);
		setTemplates(newTemplates);
		setCurrentTab(0);
	};

	const updateTemplate = (index: number, data: Partial<TemplateType>) => {
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

	const save = async () => {
		if (!campaign) {
			return;
		}

		// Validate templates
		const isValid = templates.every((template) => validate(template));
		if (!isValid) {
			return;
		}

		await saveCampaign({
			settings: {
				...campaign.settings,
				templates,
			},
		});
		navigate(getToLink(`campaigns/${campaign.id}/contacts`));
	};

	const tabLength = 4;

	const clearError = (fieldName: string) => {
		setValidationErrors((prev) => {
			const newErrors = { ...prev };
			delete newErrors[fieldName];
			return newErrors;
		});
	};

	const validate = (template: Partial<TemplateType>) => {
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

	const sendTestEmail = async () => {
		if (!templates[currentTab]) {
			return;
		}

		// Validate the current template before sending
		if (!validate(templates[currentTab])) {
			return;
		}

		// Ask for test email address if not provided
		const emailAddress =
			testEmailAddress ||
			prompt(__('Enter test email address:', 'quillcrm'));
		if (!emailAddress) {
			return;
		}

		// Validate email using Zod
		const emailValidation = z.string().email().safeParse(emailAddress);
		if (!emailValidation.success) {
			createNotice({
				type: 'error',
				message: __('Please enter a valid email address', 'quillcrm'),
			});
			return;
		}

		setTestEmailAddress(emailAddress);
		setIsSendingTestEmail(true);

		try {
			await apiFetch({
				path: '/qc/v1/emails/send-test',
				method: 'POST',
				data: {
					template: templates[currentTab],
					email: emailAddress,
					campaign_id: campaign?.id,
				},
			});

			createNotice({
				type: 'success',
				message: __('Test email sent successfully', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to send test email', 'quillcrm'),
			});
		} finally {
			setIsSendingTestEmail(false);
		}
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
				totalSteps={tabLength}
				currentStep={currentTab}
				onNext={() => {
					// if (currentTab + 1 < tabLength) {
					// 	setCurrentTab(currentTab + 1);
					// }
				}}
				onBack={() => {
					if (currentTab - 1 >= 0) {
						setCurrentTab(currentTab - 1);
					}
				}}
			>
				<div className="flex gap-6">
					<PanelSettings
						title={__('Campaign Template', 'quillcrm')}
						description={__(
							'Name your campaign to help you remember what its about. only you will see this.',
							'quillcrm'
						)}
						icon={<CategoryIcon />}
						className="w-1/2"
					>
						<div>
							<FormField
								label={__('From Name', 'quillcrm')}
								required={true}
							>
								<Input
									placeholder={__('Name here', 'quillcrm')}
									value={
										templates[currentTab]?.settings
											?.from_name
									}
									onChange={(e) => {
										clearError('from_name');
										updateTemplate(currentTab, {
											settings: {
												...(templates[currentTab]
													?.settings || {}),
												from_name: e.target.value,
											},
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
							>
								<Input
									type="email"
									placeholder={__(
										'name@gmail.com',
										'quillcrm'
									)}
									value={
										templates[currentTab]?.settings
											?.from_email
									}
									onChange={(e) => {
										clearError('from_email');
										updateTemplate(currentTab, {
											settings: {
												...(templates[currentTab]
													?.settings || {}),
												from_email: e.target.value,
											},
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

							<FormField
								label={__('Reply To', 'quillcrm')}
								required={true}
							>
								<Input
									type="email"
									placeholder={__(
										'name@gmail.com',
										'quillcrm'
									)}
									value={
										templates[currentTab]?.settings
											?.reply_to
									}
									onChange={(e) => {
										clearError('reply_to');
										updateTemplate(currentTab, {
											settings: {
												...(templates[currentTab]
													?.settings || {}),
												reply_to: e.target.value,
											},
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
							>
								<Input
									placeholder={__('Subject here', 'quillcrm')}
									value={templates[currentTab]?.subject}
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
										templates[currentTab]?.settings
											?.preview_text
									}
									onChange={(e) => {
										clearError('preview_text');
										updateTemplate(currentTab, {
											settings: {
												...(templates[currentTab]
													?.settings || {}),
												preview_text: e.target.value,
											},
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
											templates[currentTab]?.settings
												?.enable_utm
										}
										onCheckedChange={(checked) =>
											updateTemplate(currentTab, {
												settings: {
													...(templates[currentTab]
														?.settings || {}),
													enable_utm: checked,
												},
											})
										}
									/>
								</div>

								{templates[currentTab]?.settings
									?.enable_utm && (
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
															?.settings
															?.utm_source
													}
													onChange={(e) => {
														clearError(
															'utm_source'
														);
														updateTemplate(
															currentTab,
															{
																settings: {
																	...(templates[
																		currentTab
																	]
																		?.settings ||
																		{}),
																	utm_source:
																		e.target
																			.value,
																},
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
															?.settings
															?.utm_medium
													}
													onChange={(e) => {
														clearError(
															'utm_medium'
														);
														updateTemplate(
															currentTab,
															{
																settings: {
																	...(templates[
																		currentTab
																	]
																		?.settings ||
																		{}),
																	utm_medium:
																		e.target
																			.value,
																},
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
															?.settings?.utm_name
													}
													onChange={(e) => {
														clearError('utm_name');
														updateTemplate(
															currentTab,
															{
																settings: {
																	...(templates[
																		currentTab
																	]
																		?.settings ||
																		{}),
																	utm_name:
																		e.target
																			.value,
																},
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
															?.settings?.utm_term
													}
													onChange={(e) =>
														updateTemplate(
															currentTab,
															{
																settings: {
																	...(templates[
																		currentTab
																	]
																		?.settings ||
																		{}),
																	utm_term:
																		e.target
																			.value,
																},
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
														?.settings?.utm_content
												}
												onChange={(e) =>
													updateTemplate(currentTab, {
														settings: {
															...(templates[
																currentTab
															]?.settings || {}),
															utm_content:
																e.target.value,
														},
													})
												}
											/>
										</FormField>
									</div>
								)}

								<div className="mt-4">
									<Button
										variant="default"
										onClick={sendTestEmail}
										disabled={isSendingTestEmail}
									>
										{isSendingTestEmail
											? __('Sending...', 'quillcrm')
											: __('Send Test Email', 'quillcrm')}
									</Button>
								</div>
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
