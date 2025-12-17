/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Integration as IntegrationType } from '@quillcrm/config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TwilioCredentialsProps {
	integration: IntegrationType;
	slug: string;
	fieldsValue: Record<string, any>;
	setFieldsValue: (value: Record<string, any>) => void;
}

interface TestCheck {
	label: string;
	status: 'success' | 'error' | 'warning';
	message: string;
	help_url?: string;
}

interface TestResult {
	success: boolean;
	message: string;
	checks: Record<string, TestCheck>;
}

const TwilioCredentials: React.FC<TwilioCredentialsProps> = ({
	integration,
	slug,
	fieldsValue,
	setFieldsValue,
}) => {
	const { fields } = integration;
	const [isTesting, setIsTesting] = useState(false);
	const [testResult, setTestResult] = useState<TestResult | null>(null);

	const handleTestConnection = async () => {
		const accountSid = fieldsValue.account_sid || '';
		const authToken = fieldsValue.auth_token || '';
		const phoneNumber = fieldsValue.phone_number || '';

		// Validation
		if (!accountSid || !authToken || !phoneNumber) {
			setTestResult({
				success: false,
				message: __('Please fill in all fields before testing', 'quillcrm'),
				checks: {},
			});
			return;
		}

		setIsTesting(true);
		setTestResult(null);

		try {
			const result: TestResult = await apiFetch({
				path: '/qc/v1/integrations/twilio/test-whatsapp',
				method: 'POST',
				data: {
					account_sid: accountSid,
					auth_token: authToken,
					phone_number: phoneNumber,
				},
			});

			setTestResult(result);
		} catch (error: any) {
			let errorMessage = __('Failed to test connection', 'quillcrm');

			if (error.message) {
				errorMessage = error.message;
			} else if (error.data?.message) {
				errorMessage = error.data.message;
			}

			setTestResult({
				success: false,
				message: errorMessage,
				checks: {},
			});
		} finally {
			setIsTesting(false);
		}
	};

	const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
		switch (status) {
			case 'success':
				return <CheckCircle className="w-5 h-5 text-green-600" />;
			case 'error':
				return <XCircle className="w-5 h-5 text-red-600" />;
			case 'warning':
				return <AlertCircle className="w-5 h-5 text-yellow-600" />;
		}
	};

	const getStatusBgColor = (status: 'success' | 'error' | 'warning') => {
		switch (status) {
			case 'success':
				return 'bg-green-50 border-green-200';
			case 'error':
				return 'bg-red-50 border-red-200';
			case 'warning':
				return 'bg-yellow-50 border-yellow-200';
		}
	};

	return (
		<div className="space-y-6">
			{/* Info Banner */}
			<div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
				<p className="text-sm text-blue-800">
					{__(
						'To send SMS and WhatsApp messages, you need to configure your Twilio account credentials. You can find these in your Twilio Console.',
						'quillcrm'
					)}
				</p>
				<a
					href="https://console.twilio.com/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
				>
					{__('Open Twilio Console →', 'quillcrm')}
				</a>
			</div>

			{/* Credential Fields */}
			<div className="space-y-4">
				{/* Account SID */}
				<div className="space-y-2">
					<Label htmlFor="account_sid">
						{__('Account SID', 'quillcrm')}
					</Label>
					<Input
						id="account_sid"
						value={fieldsValue.account_sid || ''}
						onChange={(e) => {
							setFieldsValue({
								...fieldsValue,
								account_sid: e.target.value,
							});
							// Clear test result when fields change
							setTestResult(null);
						}}
						placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
						className="h-12 bg-white"
					/>
					<p className="text-sm text-gray-500">
						{__('Your Twilio Account SID (starts with AC)', 'quillcrm')}
					</p>
				</div>

				{/* Auth Token */}
				<div className="space-y-2">
					<Label htmlFor="auth_token">
						{__('Auth Token', 'quillcrm')}
					</Label>
					<Input
						id="auth_token"
						type="password"
						value={fieldsValue.auth_token || ''}
						onChange={(e) => {
							setFieldsValue({
								...fieldsValue,
								auth_token: e.target.value,
							});
							// Clear test result when fields change
							setTestResult(null);
						}}
						placeholder="********************************"
						className="h-12 bg-white"
					/>
					<p className="text-sm text-gray-500">
						{__('Your Twilio Auth Token (keep this secret)', 'quillcrm')}
					</p>
				</div>

				{/* Phone Number */}
				<div className="space-y-2">
					<Label htmlFor="phone_number">
						{__('Phone Number', 'quillcrm')}
					</Label>
					<Input
						id="phone_number"
						value={fieldsValue.phone_number || ''}
						onChange={(e) => {
							setFieldsValue({
								...fieldsValue,
								phone_number: e.target.value,
							});
							// Clear test result when fields change
							setTestResult(null);
						}}
						placeholder="+1234567890"
						className="h-12 bg-white"
					/>
					<p className="text-sm text-gray-500">
						{__(
							'Your Twilio phone number in E.164 format (e.g., +1234567890)',
							'quillcrm'
						)}
					</p>
				</div>
			</div>

			{/* Test Connection Button */}
			<div className="pt-2">
				<Button
					type="button"
					onClick={handleTestConnection}
					disabled={isTesting}
					variant="outline"
					className="w-full h-12"
				>
					{isTesting ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							{__('Testing Connection...', 'quillcrm')}
						</>
					) : (
						__('Test WhatsApp Connection', 'quillcrm')
					)}
				</Button>
			</div>

			{/* Test Results */}
			{testResult && (
				<div className="space-y-4 mt-6">
					{/* Overall Status */}
					<Card
						className={`p-4 border-2 ${getStatusBgColor(
							testResult.success ? 'success' : 'error'
						)}`}
					>
						<div className="flex items-start gap-3">
							{getStatusIcon(testResult.success ? 'success' : 'error')}
							<div className="flex-1">
								<p className="font-medium text-gray-900">
									{testResult.message}
								</p>
							</div>
						</div>
					</Card>

					{/* Individual Checks */}
					{Object.keys(testResult.checks).length > 0 && (
						<div className="space-y-3">
							<h4 className="font-medium text-gray-900">
								{__('Validation Details:', 'quillcrm')}
							</h4>
							{Object.entries(testResult.checks).map(([key, check]) => (
								<Card
									key={key}
									className={`p-4 border ${getStatusBgColor(
										check.status
									)}`}
								>
									<div className="flex items-start gap-3">
										{getStatusIcon(check.status)}
										<div className="flex-1">
											<p className="font-medium text-sm text-gray-900">
												{check.label}
											</p>
											<p className="text-sm text-gray-700 mt-1">
												{check.message}
											</p>
											{check.help_url && (
												<a
													href={check.help_url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
												>
													{__('Learn more →', 'quillcrm')}
												</a>
											)}
										</div>
									</div>
								</Card>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default TwilioCredentials;

