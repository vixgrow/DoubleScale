/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button, Card, Tabs } from 'antd';
import { isString } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../../state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { Template } from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';
import type { Template as TemplateType } from '@quillcrm/client';
import { isEmail } from 'validator';

const Templates: React.FC = () => {
	const { campaign, isLoading, saveCampaign, isSaving, updateSettings } =
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
		updateSettings('templates', newTemplates);
		setCurrentTab(newTemplates.length - 1);
	};

	const removeTemplate = (index: number) => {
		if (!campaign) {
			return;
		}

		const newTemplates = templates ? [...templates] : [];
		newTemplates.splice(index, 1);
		updateSettings('templates', newTemplates);
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

		updateSettings('templates', newTemplates);
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
		<Card loading={isLoading}>
			{campaign && (
				<>
					<div className="qcrm-templates">
						<Tabs
							tabPosition="top"
							type="editable-card"
							tabBarGutter={20}
							tabBarStyle={{ marginBottom: 0 }}
							items={tabList}
							onEdit={(key, action) => {
								if (action === 'add') {
									addTemplate();
								} else {
									if (!isString(key)) {
										return;
									}
									const id = parseInt(key);
									removeTemplate(id);
								}
							}}
							hideAdd={
								templates.length >= 3 ||
								!campaign?.settings.ab_test
							}
							activeKey={currentTab.toString()}
							onChange={(key) => setCurrentTab(Number(key))}
						/>
					</div>
					<div className="qcrm-actions">
						<Button
							type="default"
							onClick={() =>
								navigate(
									getToLink(
										`campaigns/${campaign.id}/information`
									)
								)
							}
						>
							{__('Back', 'quillcrm')}
						</Button>
						<Button
							type="primary"
							onClick={save}
							loading={isSaving}
						>
							{__('Next', 'quillcrm')}
						</Button>
					</div>
				</>
			)}
		</Card>
	);
};

export default Templates;
