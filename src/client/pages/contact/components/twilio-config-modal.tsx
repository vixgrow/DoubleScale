/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@doublescale/components';
import { Settings, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TwilioConfigModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

interface TestCheck {
	label: string;
	status: 'success' | 'error' | 'warning';
	message: string;
	details?: any;
	help?: string;
}

interface TestResult {
	success: boolean;
	message: string;
	checks: Record<string, TestCheck>;
}

const TwilioConfigModal: React.FC<TwilioConfigModalProps> = ({
	open,
	onClose,
	onSuccess,
}) => {
	const { createNotice } = useDispatch('doublescale/core');
	const [accountSid, setAccountSid] = useState('');
	const [authToken, setAuthToken] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
	const [testResult, setTestResult] = useState<TestResult | null>(null);

	const handleSave = async () => {
		// Validation
		if (!accountSid || !authToken || !phoneNumber) {
			createNotice({
				type: 'error',
				message: __('Please fill in all fields', 'doublescale'),
			});
			return;
		}

		setIsSaving(true);
		try {
			// Save Twilio configuration via existing integration API
			// Uses the same endpoint as the Integrations settings page
			await apiFetch({
				path: '/doublescale/v1/integrations/twilio',
				method: 'POST',
				data: {
					settings: {
						account_sid: accountSid,
						auth_token: authToken,
						phone_number: phoneNumber,
					},
				},
			});

			createNotice({
				type: 'success',
				message: __('Twilio configured successfully!', 'doublescale'),
			});

			// Reset form
			setAccountSid('');
			setAuthToken('');
			setPhoneNumber('');

			// Call success callback to refresh provider status
			if (onSuccess) {
				onSuccess();
			}

			onClose();
		} catch (error: any) {
			let errorMessage = __('Failed to save Twilio configuration', 'doublescale');

			if (error.message) {
				errorMessage = error.message;
			} else if (error.data?.message) {
				errorMessage = error.data.message;
			}

			createNotice({
				type: 'error',
				message: errorMessage,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleTestConnection = async () => {
		// Validation
		if (!accountSid || !authToken || !phoneNumber) {
			createNotice({
				type: 'error',
				message: __('Please fill in all fields before testing', 'doublescale'),
			});
			return;
		}

		setIsTesting(true);
		setTestResult(null);

		try {
			const result: TestResult = await apiFetch({
				path: '/doublescale/v1/integrations/twilio/test-whatsapp',
				method: 'POST',
				data: {
					account_sid: accountSid,
					auth_token: authToken,
					phone_number: phoneNumber,
				},
			});

			setTestResult(result);

			if (result.success) {
				createNotice({
					type: 'success',
					message: result.message,
				});
			} else {
				createNotice({
					type: 'warning',
					message: result.message,
				});
			}
		} catch (error: any) {
			let errorMessage = __('Failed to test connection', 'doublescale');

			if (error.message) {
				errorMessage = error.message;
			} else if (error.data?.message) {
				errorMessage = error.data.message;
			}

			createNotice({
				type: 'error',
				message: errorMessage,
			});

			setTestResult({
				success: false,
				message: errorMessage,
				checks: {},
			});
		} finally {
			setIsTesting(false);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSave();
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
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogOverlay className="z-[1800000]" />
			<DialogContent className="max-w-2xl z-[1800001]" removePortal={true}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings className="w-5 h-5" />
						{__('Configure Twilio Integration', 'doublescale')}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
							<p className="text-sm text-blue-800">
								{__(
									'To send SMS and WhatsApp messages, you need to configure your Twilio account credentials. You can find these in your Twilio Console.',
									'doublescale'
								)}
							</p>
							<a
								href="https://console.twilio.com/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
							>
								{__('Open Twilio Console →', 'doublescale')}
							</a>
						</div>

						<Field
							label={__('Account SID', 'doublescale')}
							type="text"
							value={accountSid}
							onChange={(value) => setAccountSid(value)}
							placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
							required
							helperText={__(
								'Your Twilio Account SID (starts with AC)',
								'doublescale'
							)}
						/>

						<Field
							label={__('Auth Token', 'doublescale')}
							type="password"
							value={authToken}
							onChange={(value) => setAuthToken(value)}
							placeholder="********************************"
							required
							helperText={__(
								'Your Twilio Auth Token (keep this secret)',
								'doublescale'
							)}
						/>

						<Field
							label={__('Phone Number', 'doublescale')}
							type="text"
							value={phoneNumber}
							onChange={(value) => setPhoneNumber(value)}
							placeholder="+1234567890"
							required
							helperText={__(
								'Your Twilio phone number in E.164 format (e.g., +1234567890)',
								'doublescale'
							)}
						/>

						{/* Test Connection Button */}
						<div className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleTestConnection}
								disabled={isTesting || isSaving}
								className="w-full"
							>
								{isTesting ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										{__('Testing Connection...', 'doublescale')}
									</>
								) : (
									<>
										<Settings className="w-4 h-4 mr-2" />
										{__('Test WhatsApp Connection', 'doublescale')}
									</>
								)}
							</Button>
						</div>

						{/* Test Results */}
						{testResult && (
							<div className="space-y-3 mt-4">
								<div
									className={`p-4 rounded-lg border ${
										testResult.success
											? 'bg-green-50 border-green-200'
											: 'bg-yellow-50 border-yellow-200'
									}`}
								>
									<div className="flex items-start gap-3">
										{testResult.success ? (
											<CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
										) : (
											<AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
										)}
										<div className="flex-1">
											<p className="font-medium text-sm">
												{testResult.message}
											</p>
										</div>
									</div>
								</div>

								{/* Individual Checks */}
								{Object.entries(testResult.checks).map(([key, check]) => (
									<div
										key={key}
										className={`p-3 rounded-lg border ${getStatusBgColor(
											check.status
										)}`}
									>
										<div className="flex items-start gap-3">
											{getStatusIcon(check.status)}
											<div className="flex-1 min-w-0">
												<p className="font-medium text-sm">
													{check.label}
												</p>
												<p className="text-sm text-gray-700 mt-1">
													{check.message}
												</p>
												{check.help && (
													<a
														href={check.help}
														target="_blank"
														rel="noopener noreferrer"
														className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
													>
														{__('Learn More →', 'doublescale')}
													</a>
												)}
												{check.details && (
													<div className="mt-2 text-xs text-gray-600">
														{check.details.template_count !== undefined && (
															<span>
																{__('Templates: ', 'doublescale')}
																{check.details.template_count}
															</span>
														)}
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSaving}
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							type="submit"
							disabled={isSaving}
							className="bg-primary"
						>
							{isSaving
								? __('Saving...', 'doublescale')
								: __('Save Configuration', 'doublescale')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default TwilioConfigModal;

