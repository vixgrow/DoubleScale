/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Card, Tabs } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../../state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import Template from './template';

const Templates: React.FC = () => {
	const { campaign, isLoading, saveCampaign, isSaving, updateSettings } =
		useCampaignContext();
	const navigate = useNavigate();
	const defaultTemplate = {
		from_name: '',
		from_email: '',
		reply_to: '',
		preview_text: '',
		subject: '',
		body: '',
		enable_utm: false,
		utm_source: '',
		utm_medium: '',
		utm_name: '',
		utm_term: '',
		utm_content: '',
	};
	const { templates = [], ab_test } = campaign?.settings ?? {};
	const [currentTab, setCurrentTab] = useState(0);

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

	const updateTemplate = (index: number, data: { [key: string]: any }) => {
		if (!campaign) {
			return;
		}

		const newTemplates = templates ? [...templates] : [];
		newTemplates[index] = {
			...newTemplates[index],
			...data,
		};
		updateSettings('templates', newTemplates);
	};

	const save = async () => {
		if (!campaign) {
			return;
		}
		await saveCampaign();
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

	const tabs = ab_test ? templates : [templates[0] ?? defaultTemplate];
	const tabList = tabs.map((template, index) => ({
		key: index,
		label: templatesSettings[index].title,
		children: (
			<Template
				template={template}
				updateTemplate={(data) => updateTemplate(index, data)}
			/>
		),
		closable: templatesSettings[index].closable ?? true,
	}));

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
							items={tabList as any}
							onEdit={(key: any, action) => {
								if (action === 'add') {
									addTemplate();
								} else {
									removeTemplate(key);
								}
							}}
							hideAdd={templates.length >= 3 || !ab_test}
							activeKey={currentTab as any}
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
