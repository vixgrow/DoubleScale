/**
 * GoHighLevel OAuth Component
 * 
 * Dedicated component for GoHighLevel OAuth flow, separated from general import logic
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Form, Alert, Typography } from 'antd';
import { __ } from '@wordpress/i18n';
import { LinkOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useGoHighLevelOAuth } from '../hooks/use-gohighlevel-oauth';

const { Text, Title } = Typography;

interface GoHighLevelOAuthProps {
	credentials: {
		oauth_status?: {
			type: 'oauth_connected';
			label: string;
			connected_at: string;
			expires_in: number;
			location_name?: string;
			location_id?: string;
		};
		oauth_setup?: {
			type: 'oauth_setup_required';
			label: string;
			description: string;
			fields: {
				[key: string]: {
					label: string;
					type: string;
					required: boolean;
					description: string;
				};
			};
			redirect_url: string;
		};
	};
	onConnectionChange?: (connected: boolean) => void;
	onDataFetched?: (data: any) => void;
}

const GoHighLevelOAuth: React.FC<GoHighLevelOAuthProps> = ({
	credentials,
	onConnectionChange,
	onDataFetched,
}) => {
	const [form] = Form.useForm();
	const [connectionStatus, setConnectionStatus] = useState<
		'connected' | 'disconnected' | 'setup_required'
	>('disconnected');

	const goHighLevelOAuth = useGoHighLevelOAuth({
		onSuccess: (data) => {
			setConnectionStatus('connected');
			onConnectionChange?.(true);
		},
		onError: (error) => {
			console.error('GoHighLevel OAuth error:', error);
		},
		onDataFetched: (data) => {
			onDataFetched?.(data);
		},
	});

	useEffect(() => {
		if (credentials.oauth_status) {
			setConnectionStatus('connected');
		} else if (credentials.oauth_setup) {
			setConnectionStatus('setup_required');
		} else {
			setConnectionStatus('disconnected');
		}
	}, [credentials]);

	const handleConnect = async (values: { client_id: string; client_secret: string }) => {
		try {
			await goHighLevelOAuth.connectWithCredentials(values);
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	const handleDisconnect = async () => {
		try {
			await goHighLevelOAuth.disconnect();
			setConnectionStatus('disconnected');
			onConnectionChange?.(false);
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	const formatTimeRemaining = (seconds: number): string => {
		return goHighLevelOAuth.formatTimeRemaining(seconds);
	};

	// Setup required state
	if (
		connectionStatus === 'setup_required' &&
		credentials.oauth_setup?.type === 'oauth_setup_required'
	) {
		const setup = credentials.oauth_setup;
		
		return (
			<div className="gohighlevel-oauth-setup">
				<div className="setup-header mb-6">
					<div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<ExclamationCircleOutlined className="text-blue-600 mt-1" />
						<div className="flex-1">
							<Title level={4} className="!mb-2">
								{setup.label}
							</Title>
							<Text className="text-gray-600">
								{setup.description}
							</Text>
						</div>
					</div>
				</div>

				<Form
					form={form}
					layout="vertical"
					onFinish={handleConnect}
					className="oauth-credentials-form"
				>
					{Object.entries(setup.fields).map(([key, field]) => (
						<Form.Item
							key={key}
							name={key}
							label={field.label}
							rules={[
								{
									required: field.required,
									message: `${field.label} is required`,
								},
							]}
							extra={field.description}
						>
							<Input
								type={field.type === 'password' ? 'password' : 'text'}
								placeholder={field.label}
								size="large"
							/>
						</Form.Item>
					))}

					{goHighLevelOAuth.error && (
						<Alert
							type="error"
							message={goHighLevelOAuth.error}
							className="mb-4"
							showIcon
						/>
					)}

					<div className="form-actions mb-6">
						<Button
							type="primary"
							htmlType="submit"
							loading={goHighLevelOAuth.connecting}
							size="large"
							block
							icon={<LinkOutlined />}
						>
							{goHighLevelOAuth.connecting
								? __('Connecting...', 'quillcrm')
								: __('Connect to GoHighLevel', 'quillcrm')}
						</Button>
					</div>
				</Form>

				<div className="redirect-url-section">
					<Text strong className="block mb-2">
						{__('Redirect URL for your GoHighLevel app:', 'quillcrm')}
					</Text>
					<div className="flex items-center gap-2 p-2 bg-gray-100 border rounded">
						<code className="flex-1 text-sm">
							{setup.redirect_url}
						</code>
						<Button
							size="small"
							onClick={() =>
								navigator.clipboard.writeText(setup.redirect_url)
							}
						>
							{__('Copy', 'quillcrm')}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// Connected state
	if (connectionStatus === 'connected' && credentials.oauth_status) {
		const status = credentials.oauth_status;
		const timeRemaining = formatTimeRemaining(status.expires_in);
		const isExpiringSoon = goHighLevelOAuth.isExpiringSoon(status.expires_in);

		return (
			<div className="gohighlevel-oauth-connected">
				<div
					className={`flex items-start gap-3 p-4 rounded-lg border ${
						isExpiringSoon
							? 'bg-yellow-50 border-yellow-200'
							: 'bg-green-50 border-green-200'
					}`}
				>
					<CheckCircleOutlined
						className={`mt-1 ${
							isExpiringSoon
								? 'text-yellow-600'
								: 'text-green-600'
						}`}
					/>
					<div className="flex-1">
						<h3 className="font-medium text-gray-900 mb-1">
							{status.label}
						</h3>
						<div className="space-y-1 text-sm text-gray-600">
							{status.location_name && (
								<div>
									<strong>{__('Location:', 'quillcrm')}</strong>{' '}
									{status.location_name}
								</div>
							)}
							<div>
								<strong>{__('Connected:', 'quillcrm')}</strong>{' '}
								{status.connected_at}
							</div>
							<div
								className={
									isExpiringSoon
										? 'text-yellow-700 font-medium'
										: ''
								}
							>
								<strong>{__('Expires:', 'quillcrm')}</strong>{' '}
								{timeRemaining}
							</div>
						</div>

						{isExpiringSoon && (
							<div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
								{__(
									'Connection expires soon. Please reconnect if import takes longer.',
									'quillcrm'
								)}
							</div>
						)}
					</div>
					<div className="flex flex-col gap-2">
						<Button size="small" onClick={handleDisconnect} danger>
							{__('Disconnect', 'quillcrm')}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return null;
};

export default GoHighLevelOAuth;