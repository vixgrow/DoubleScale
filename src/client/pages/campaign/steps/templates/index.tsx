/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../../state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import {
	CategoryIcon,
	FeedBuilder,
	FormField,
	PanelLayout,
	PanelSettings,
	PlayIcon,
} from '@quillcrm/components';
import type { Template as TemplateType, EmailTemplate } from '@quillcrm/client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import EmailBuilderSelection from './email-builder-selection';
import ConfigAPI from '@quillcrm/config';
import { isEmail } from 'validator';

// Zod validation schema for nested template structure
const templateSchema = z.object({
	from_name: z.string().min(1, __('From name is required', 'quillcrm')),
	from_email: z
		.string()
		.min(1, __('From email is required', 'quillcrm'))
		.email(
			__(
				'Please enter a valid email address for From Email',
				'quillcrm'
			)
		),
	reply_to: z
		.string()
		.min(1, __('Reply to email is required', 'quillcrm'))
		.email(
			__(
				'Please enter a valid email address for Reply To',
				'quillcrm'
			)
		),
	preview_text: z
		.string()
		.min(1, __('Preview text is required', 'quillcrm')),
});

const Templates: React.FC = () => {
	const [emailBuilderSelectionVisible, setEmailBuilderSelectionVisible] =
		useState(false);
	const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
	const [testEmailAddress, setTestEmailAddress] = useState('');
	const [validationErrors, setValidationErrors] = useState<{
		[key: string]: string;
	}>({});
	const { campaign, saveCampaignStep } = useCampaignContext();
	const navigate = useNavigate();
	const adminEmail = ConfigAPI.getAdminEmail();
	const blogName = ConfigAPI.getBlogName();

	// Using new unified template structure with flat properties
	const defaultTemplate: EmailTemplate = {
		name: campaign?.name || __('New Email', 'quillcrm'),
		type: 'email',
		subject: __('New Email', 'quillcrm'),
		body: 'Email body',
		settings: {
			from_name: blogName,
			from_email: adminEmail,
			reply_to: adminEmail,
			preview_text: '',
		},
	};
	const [templates, setTemplates] = useState<EmailTemplate[]>(
		(campaign?.settings.templates as EmailTemplate[]) || []
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

	const tabLength = 4;

	const clearError = (fieldName: string) => {
		setValidationErrors((prev) => {
			const newErrors = { ...prev };
			delete newErrors[fieldName];
			return newErrors;
		});
	};

	const templatesSettings = [
		{
			title: __('Template', 'quillcrm'),
			closable: false,
		},
		{
			title: __('A Variant', 'quillcrm'),
		},
		{
			title: __('B Variant', 'quillcrm'),
		},
	];

	const tabs = campaign?.settings.ab_test
		? templates
		: [templates[0] ?? defaultTemplate];
	const tabList = tabs.map((template, index) => ({
		key: index.toString(),
		label: templatesSettings[index].title,
		children: (
			<Template
				template={template}
				updateTemplate={(data) =>
					updateTemplate(index, data as Partial<EmailTemplate>)
				}
			/>
		),
		closable: templatesSettings[index].closable ?? true,
	}));

	const validate = (template: Partial<EmailTemplate>) => {
		// Check subject and body first
		if (!template.subject || template.subject.trim() === '') {
			createNotice({
				type: 'error',
				message: __('Subject is required', 'quillcrm'),
			});
			return false;
		}

		if (!template.body || template.body.trim() === '') {
			createNotice({
				type: 'error',
				message: __('Body is required', 'quillcrm'),
			});
			return false;
		}

		// Validate settings with Zod
		const result = templateSchema.safeParse(template.settings);

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
			const template = templates[currentTab];
			await apiFetch({
				path: '/qc/v1/campaigns/send-test-email',
				method: 'POST',
				data: {
					email: emailAddress,
					subject: template.subject,
					body: template.body || 'Email body',
					from_name: template.settings.from_name,
					from_email: template.settings.from_email,
					reply_to: template.settings.reply_to,
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

	const saveTemplateStepAndNavigate = async () => {
		// Validate current template
		if (!validate(templates[currentTab])) {
			return;
		}

		// Save template step data
		const templateStepData = {
			templates: templates,
		};

		// Save the step with template data and navigate only if successful
		const saveSuccess = await saveCampaignStep('builder', templateStepData);
		if (saveSuccess) {
			navigate(getToLink(`campaigns/${campaign?.id}/builder`));
		}
	};

	console.log(campaign);
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
				onNext={saveTemplateStepAndNavigate}
				onBack={() => {
					if (currentTab - 1 >= 0) {
						setCurrentTab(currentTab - 1);
						navigate(getToLink(`campaigns`));
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
									value={templates[currentTab]?.settings.from_name}
									onChange={(e) => {
										clearError('from_name');
										updateTemplate(currentTab, {
											settings: {
												...templates[currentTab]?.settings,
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
									value={templates[currentTab]?.settings.from_email}
									onChange={(e) => {
										clearError('from_email');
										updateTemplate(currentTab, {
											settings: {
												...templates[currentTab]?.settings,
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
									value={templates[currentTab]?.settings.reply_to}
									onChange={(e) => {
										clearError('reply_to');
										updateTemplate(currentTab, {
											settings: {
												...templates[currentTab]?.settings,
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
									value={templates[currentTab]?.settings.preview_text}
									onChange={(e) => {
										clearError('preview_text');
										updateTemplate(currentTab, {
											settings: {
												...templates[currentTab]?.settings,
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
