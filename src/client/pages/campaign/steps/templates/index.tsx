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
import type { Template as TemplateType, EmailTemplate } from '@quillcrm/client';
import { isEmail } from 'validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import EmailBuilderSelection from './email-builder-selection';

const Templates: React.FC = () => {
	const [emailBuilderSelectionVisible, setEmailBuilderSelectionVisible] =
		useState(false);
	const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
	const [testEmailAddress, setTestEmailAddress] = useState('');
	const { campaign, isLoading, saveCampaign, isSaving } =
		useCampaignContext();
	const navigate = useNavigate();
	const adminEmail = ConfigAPI.getAdminEmail();
	const blogName = ConfigAPI.getBlogName();
	// Using template table structure
	const defaultTemplate: EmailTemplate = {
		name: __('New Email', 'quillcrm'),
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
		if (!template.subject) {
			createNotice({
				type: 'error',
				message: __('Subject is required', 'quillcrm'),
			});
			return false;
		}

		if (!template.body) {
			createNotice({
				type: 'error',
				message: __('Body is required', 'quillcrm'),
			});
			return false;
		}

		if (!template.settings?.from_name) {
			createNotice({
				type: 'error',
				message: __('From name is required', 'quillcrm'),
			});
			return false;
		}

		if (!template.settings?.from_email) {
			createNotice({
				type: 'error',
				message: __('From email is required', 'quillcrm'),
			});
			return false;
		}

		if (!isEmail(template.settings.from_email)) {
			createNotice({
				type: 'error',
				message: __('From email is not valid', 'quillcrm'),
			});
			return false;
		}

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

		if (!isEmail(emailAddress)) {
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
				totalSteps={1}
				currentStep={0}
				onNext={save}
				onBack={() => navigate(getToLink(`campaigns`))}
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
									onChange={(e) =>
										updateTemplate(currentTab, {
											settings: {
												...(templates[currentTab]
													?.settings || {}),
												from_name: e.target.value,
											},
										})
									}
								/>
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
									onChange={(e) =>
										updateTemplate(currentTab, {
											settings: {
												...(templates[currentTab]
													?.settings || {}),
												from_email: e.target.value,
											},
										})
									}
								/>
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
									onChange={(e) =>
										updateTemplate(currentTab, {
											settings: {
												...(templates[currentTab]
													?.settings || {}),
												reply_to: e.target.value,
											},
										})
									}
								/>
							</FormField>

							<FormField
								label={__('Subject', 'quillcrm')}
								required={true}
							>
								<Input
									placeholder={__('Subject here', 'quillcrm')}
									value={templates[currentTab]?.subject}
									onChange={(e) =>
										updateTemplate(currentTab, {
											subject: e.target.value,
										})
									}
								/>
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
									onChange={(e) =>
										updateTemplate(currentTab, {
											settings: {
												...(templates[currentTab]
													?.settings || {}),
												preview_text: e.target.value,
											},
										})
									}
								/>
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

					<FeedBuilder
						setVisibile={setEmailBuilderSelectionVisible}
					/>
				</div>
			</PanelLayout>
			<EmailBuilderSelection
				setVisible={setEmailBuilderSelectionVisible}
				visible={emailBuilderSelectionVisible}
			/>
		</div>
	);
};

export default Templates;
