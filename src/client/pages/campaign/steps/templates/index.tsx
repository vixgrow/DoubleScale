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

	const validate = (template: Partial<TemplateType>) => {
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

		if (template.settings.enable_utm) {
			if (!template.settings.utm_source) {
				createNotice({
					type: 'error',
					message: __('UTM Source is required', 'quillcrm'),
				});
			}

			if (!template.settings.utm_medium) {
				createNotice({
					type: 'error',
					message: __('UTM Medium is required', 'quillcrm'),
				});
			}

			if (!template.settings.utm_name) {
				createNotice({
					type: 'error',
					message: __('UTM Name is required', 'quillcrm'),
				});
			}
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

	console.log('templates', templates);
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
																	utm_source:
																		e.target
																			.value,
																},
															}
														)
													}
												/>
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
																	utm_medium:
																		e.target
																			.value,
																},
															}
														)
													}
												/>
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
																	utm_name:
																		e.target
																			.value,
																},
															}
														)
													}
												/>
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
