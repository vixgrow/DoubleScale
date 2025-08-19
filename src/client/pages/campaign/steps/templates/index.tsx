/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

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
	const { campaign, isLoading, saveCampaign, isSaving } =
		useCampaignContext();
	const navigate = useNavigate();
	const adminEmail = ConfigAPI.getAdminEmail();
	const blogName = ConfigAPI.getBlogName();
	const defaultTemplate = {
		from_name: blogName,
		from_email: adminEmail,
		reply_to: adminEmail,
		preview_text: '',
		subject: __('New Email', 'quillcrm'),
		body: 'Email body',
		enable_utm: false,
		utm_source: '',
		utm_medium: '',
		utm_name: '',
		utm_term: '',
		utm_content: '',
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
				updateTemplate={(data) => updateTemplate(index, data)}
			/>
		),
		closable: templatesSettings[index].closable ?? true,
	}));

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

		if (!template.from_name) {
			createNotice({
				type: 'error',
				message: __('From name is required', 'quillcrm'),
			});
			return false;
		}

		if (!template.from_email) {
			createNotice({
				type: 'error',
				message: __('From email is required', 'quillcrm'),
			});
			return false;
		}

		if (!isEmail(template.from_email)) {
			createNotice({
				type: 'error',
				message: __('From email is not valid', 'quillcrm'),
			});
			return false;
		}

		return true;
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
				totalSteps={tabList.length}
				currentStep={currentTab}
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
								/>
							</FormField>

							<FormField
								label={__('From Name', 'quillcrm')}
								required={true}
							>
								<Input
									placeholder={__('Name here', 'quillcrm')}
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
								/>
							</FormField>

							<FormField
								label={__('Subject', 'quillcrm')}
								required={true}
							>
								<Input
									placeholder={__('Subject here', 'quillcrm')}
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
									<Switch />
								</div>

								<Button variant="default">
									{__('Send Test Email', 'quillcrm')}
								</Button>
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
