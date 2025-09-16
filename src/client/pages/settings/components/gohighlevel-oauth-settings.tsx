/**
 * GoHighLevel OAuth Settings Component
 *
 * @since 1.0.0
 * @package QuillCRM
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Typography, Card, Steps, Tag, Space } from 'antd';
import { __ } from '@wordpress/i18n';
import {
	SettingOutlined,
	CheckCircleOutlined,
	ExclamationCircleOutlined,
	CopyOutlined,
	LinkOutlined,
} from '@ant-design/icons';
import apiFetch from '@wordpress/api-fetch';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface GoHighLevelOAuthSettingsProps {
	initialSettings?: {
		client_id: string;
		client_secret: string;
	};
	onSettingsChange?: (settings: any) => void;
}

interface OAuthStatus {
	isConfigured: boolean;
	redirectUri: string;
}

const GoHighLevelOAuthSettings: React.FC<GoHighLevelOAuthSettingsProps> = ({
	initialSettings = { client_id: '', client_secret: '' },
	onSettingsChange,
}) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<OAuthStatus>({
		isConfigured: false,
		redirectUri: '',
	});

	useEffect(() => {
		// Initialize form with settings
		form.setFieldsValue(initialSettings);
		
		// Check if configured
		const isConfigured = !!(initialSettings.client_id && initialSettings.client_secret);
		setStatus(prev => ({
			...prev,
			isConfigured,
			redirectUri: `${window.location.origin}/wp-admin/admin.php`,
		}));
	}, [initialSettings, form]);

	const handleSaveSettings = async (values: any) => {
		setLoading(true);
		try {
			// Save settings via WordPress REST API
			await apiFetch({
				path: '/qc/v1/settings/oauth/gohighlevel',
				method: 'POST',
				data: values,
			});

			setStatus(prev => ({
				...prev,
				isConfigured: !!(values.client_id && values.client_secret),
			}));

			onSettingsChange?.(values);
		} catch (error) {
			console.error('Failed to save settings:', error);
		} finally {
			setLoading(false);
		}
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch (err) {
			console.error('Failed to copy text:', err);
		}
	};

	const setupSteps = [
		{
			title: __('Create GoHighLevel App', 'quillcrm'),
			content: (
				<ul>
					<li>
						{__('Go to ', 'quillcrm')}
						<a
							href="https://marketplace.gohighlevel.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							{__('GoHighLevel Marketplace', 'quillcrm')}
						</a>
					</li>
					<li>{__('Log in with your GoHighLevel account', 'quillcrm')}</li>
					<li>{__('Navigate to "My Apps" from the menu', 'quillcrm')}</li>
					<li>{__('Click "Create App" button', 'quillcrm')}</li>
				</ul>
			),
		},
		{
			title: __('Configure App Settings', 'quillcrm'),
			content: (
				<ul>
					<li>{__('Enter app name: "QuillCRM Import"', 'quillcrm')}</li>
					<li>{__('Select "Private" from Account Type dropdown', 'quillcrm')}</li>
					<li>{__('Select "Sub-Account" from Distribution Type', 'quillcrm')}</li>
					<li>{__('Click "Create app" button', 'quillcrm')}</li>
				</ul>
			),
		},
		{
			title: __('Set Required Scopes', 'quillcrm'),
			content: (
				<div>
					<Paragraph>
						{__('Select these read-only scopes for contact importing:', 'quillcrm')}
					</Paragraph>
					<Space direction="vertical" size="small">
						<Tag><code>contacts.readonly</code> - {__('Read contact information', 'quillcrm')}</Tag>
						<Tag><code>locations.readonly</code> - {__('Read location details', 'quillcrm')}</Tag>
						<Tag><code>custom-fields.readonly</code> - {__('Read custom field definitions', 'quillcrm')}</Tag>
						<Tag><code>tags.readonly</code> - {__('Read tag information', 'quillcrm')}</Tag>
					</Space>
				</div>
			),
		},
		{
			title: __('Add Redirect URL', 'quillcrm'),
			content: (
				<div>
					<Paragraph>
						{__('Add this exact URL to your GoHighLevel app:', 'quillcrm')}
					</Paragraph>
					<div className="flex items-center gap-2 p-3 bg-gray-100 border rounded">
						<code className="flex-1 text-sm">{status.redirectUri}</code>
						<Button
							size="small"
							icon={<CopyOutlined />}
							onClick={() => copyToClipboard(status.redirectUri)}
						>
							{__('Copy', 'quillcrm')}
						</Button>
					</div>
				</div>
			),
		},
		{
			title: __('Get Client Credentials', 'quillcrm'),
			content: (
				<ul>
					<li>{__('In your GoHighLevel app, go to "Client Keys" section', 'quillcrm')}</li>
					<li>{__('Click "Add" button to create a new client key', 'quillcrm')}</li>
					<li>{__('Enter key name: "QuillCRM Import"', 'quillcrm')}</li>
					<li>{__('Copy the Client ID and Client Secret', 'quillcrm')}</li>
					<li>{__('Paste them into the form below and save', 'quillcrm')}</li>
				</ul>
			),
		},
	];

	return (
		<div className="gohighlevel-oauth-settings max-w-4xl">
			<div className="mb-6">
				<Title level={3}>
					<SettingOutlined className="mr-2" />
					{__('GoHighLevel OAuth Configuration', 'quillcrm')}
				</Title>
				<Paragraph type="secondary">
					{__('Configure OAuth authentication for GoHighLevel contact imports', 'quillcrm')}
				</Paragraph>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Configuration Form */}
				<Card
					title={__('OAuth App Credentials', 'quillcrm')}
					extra={
						status.isConfigured ? (
							<Tag color="success" icon={<CheckCircleOutlined />}>
								{__('Configured', 'quillcrm')}
							</Tag>
						) : (
							<Tag color="warning" icon={<ExclamationCircleOutlined />}>
								{__('Not Configured', 'quillcrm')}
							</Tag>
						)
					}
				>
					<Form
						form={form}
						layout="vertical"
						onFinish={handleSaveSettings}
						className="oauth-credentials-form"
					>
						<Form.Item
							name="client_id"
							label={__('Client ID', 'quillcrm')}
							rules={[
								{
									required: true,
									message: __('Client ID is required', 'quillcrm'),
								},
							]}
							extra={__('Your GoHighLevel app Client ID from the marketplace', 'quillcrm')}
						>
							<Input
								placeholder={__('Enter Client ID', 'quillcrm')}
								size="large"
							/>
						</Form.Item>

						<Form.Item
							name="client_secret"
							label={__('Client Secret', 'quillcrm')}
							rules={[
								{
									required: true,
									message: __('Client Secret is required', 'quillcrm'),
								},
							]}
							extra={__('Your GoHighLevel app Client Secret (keep confidential)', 'quillcrm')}
						>
							<Input.Password
								placeholder={__('Enter Client Secret', 'quillcrm')}
								size="large"
							/>
						</Form.Item>

						<Form.Item className="mb-0">
							<Button
								type="primary"
								htmlType="submit"
								loading={loading}
								size="large"
								block
								icon={<LinkOutlined />}
							>
								{loading
									? __('Saving...', 'quillcrm')
									: __('Save OAuth Configuration', 'quillcrm')
								}
							</Button>
						</Form.Item>
					</Form>

					{status.isConfigured && (
						<Alert
							type="success"
							message={__('✓ OAuth is configured and ready to use', 'quillcrm')}
							className="mt-4"
						/>
					)}
				</Card>

				{/* Setup Instructions */}
				<Card title={__('Setup Instructions', 'quillcrm')}>
					<Steps direction="vertical" size="small" className="custom-steps">
						{setupSteps.map((step, index) => (
							<Step
								key={index}
								title={step.title}
								description={step.content}
								status="process"
							/>
						))}
					</Steps>

					<Alert
						type="info"
						message={__('Security Note', 'quillcrm')}
						description={__(
							'This OAuth integration only requests read-only permissions and temporarily stores access tokens (15 minutes) for the import process. No long-term credentials are stored.',
							'quillcrm'
						)}
						showIcon
						className="mt-4"
					/>
				</Card>
			</div>

			<style jsx>{`
				.custom-steps .ant-steps-item-description {
					margin-top: 8px;
				}
				
				.custom-steps .ant-steps-item-description ul {
					margin: 0;
					padding-left: 20px;
				}
				
				.custom-steps .ant-steps-item-description li {
					margin-bottom: 4px;
					line-height: 1.6;
				}
			`}</style>
		</div>
	);
};

export default GoHighLevelOAuthSettings;