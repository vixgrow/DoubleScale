/**
 * WhatsApp Settings Page
 * 
 * Shows WhatsApp connection status for individual messaging.
 * WhatsApp campaigns are disabled - only used for automations and individual messaging.
 * 
 * @since 1.0.0
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { CheckCircle, XCircle, Loader2, Settings, ExternalLink, Phone, MessageCircle, Info } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { Settings as SettingsType } from '@doublescale/client';
import { Button } from '@doublescale/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@doublescale/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertIcon } from '@doublescale/components';
import { getToLink, useNavigate } from '@doublescale/navigation';

interface WhatsAppSettingsProps {
	// These props are passed by the settings page but not used
	// since WhatsApp settings are managed via the integration page
	settings?: SettingsType;
	onChange?: (settings: SettingsType) => void;
}

interface WhatsAppStatus {
	connected: boolean;
	provider_name?: string;
	phone_number?: string;
	verified_name?: string;
	phone_number_id?: string;
}

const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = (_props) => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
	const [status, setStatus] = useState<WhatsAppStatus | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadStatus();
	}, []);

	const loadStatus = async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Check provider status
			const providerStatus: any = await apiFetch({
				path: '/doublescale/v1/integrations/provider-status?channel=whatsapp',
			});

			if (!providerStatus.connected) {
				setStatus({ connected: false });
				return;
			}

			// If connected, try to get more details
			try {
				const integrationSettings: any = await apiFetch({
					path: '/doublescale/v1/integrations/meta-whatsapp',
				});

				// Try to get phone number details
				let phoneNumber: string | undefined;
				let verifiedName: string | undefined;

				if (integrationSettings?.settings?.phone_number_id) {
					try {
						const testResult: any = await apiFetch({
							path: '/doublescale/v1/integrations/meta-whatsapp/test',
							method: 'POST',
							data: {
								access_token: integrationSettings.settings.access_token,
								phone_number_id: integrationSettings.settings.phone_number_id,
								business_account_id: integrationSettings.settings.business_account_id,
							},
						});

						if (testResult.success && testResult.data?.phone_numbers?.length > 0) {
							const phone = testResult.data.phone_numbers.find(
								(p: any) => p.id === integrationSettings.settings.phone_number_id
							) || testResult.data.phone_numbers[0];
							
							phoneNumber = phone.display_phone_number;
							verifiedName = phone.verified_name;
						}
					} catch (e) {
						// Test endpoint might fail, that's okay
					}
				}

				setStatus({
					connected: true,
					provider_name: providerStatus.provider_name || 'Meta WhatsApp',
					phone_number: phoneNumber,
					verified_name: verifiedName,
					phone_number_id: integrationSettings?.settings?.phone_number_id,
				});
			} catch (e) {
				// Settings fetch failed but provider is connected
				setStatus({
					connected: true,
					provider_name: providerStatus.provider_name || 'Meta WhatsApp',
				});
			}
		} catch (err: any) {
			setError(err.message || __('Failed to check WhatsApp status', 'doublescale'));
			setStatus({ connected: false });
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfigure = () => {
		navigate(getToLink('integrations/meta-whatsapp'));
	};

	return (
		<div className="whatsapp-settings space-y-6">
			<div className="text-[#09090B] font-semibold text-2xl">
				{__('WhatsApp', 'doublescale')}
			</div>

			{/* Info Banner */}
			<Alert className="border-secondary bg-secondary/10 text-secondary flex items-center gap-2">
				<div className="text-secondary">
					<AlertIcon width={16} height={16} />
				</div>
				<AlertDescription className="text-base text-secondary">
					{__(
						'WhatsApp messaging is available for individual contact messaging and automations. All messages use Meta-approved templates.',
						'doublescale'
					)}
				</AlertDescription>
			</Alert>

			<Card className="shadow-sm border-blue-200 bg-blue-50/40">
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex items-center gap-2">
						<Info className="w-4 h-4 text-blue-600" />
						{__('How WhatsApp unsubscribe works', 'doublescale')}
					</CardTitle>
					<CardDescription>
						{__(
							'Understand how contacts opt out and whether you need to add unsubscribe text to your messages.',
							'doublescale'
						)}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3 text-sm text-gray-700">
					<p>
						{__(
							'When a contact replies with a standard opt-out keyword — such as STOP, UNSUBSCRIBE, CANCEL, END, QUIT, or STOP ALL — DoubleScale automatically marks them as unsubscribed from WhatsApp. You do not need to configure anything for this.',
							'doublescale'
						)}
					</p>
					<p>
						<strong>{__('Do I need to add "Reply STOP to unsubscribe"?', 'doublescale')}</strong>{' '}
						{__(
							'Unlike SMS, DoubleScale does not append this sentence to WhatsApp messages. Messages are sent using Meta-approved templates, so include unsubscribe instructions directly in your template body when you create or edit templates in Meta Business Manager.',
							'doublescale'
						)}
					</p>
					<p>
						{__(
							'Contacts can resubscribe by replying with START, SUBSCRIBE, YES, or UNSTOP. The reply must be that keyword only (not part of a longer sentence).',
							'doublescale'
						)}
					</p>
				</CardContent>
			</Card>

			{/* Connection Status Card */}
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<MessageCircle className="w-5 h-5" />
						{__('Meta WhatsApp Business API', 'doublescale')}
					</CardTitle>
					<CardDescription>
						{__('Connect to Meta WhatsApp Business API to send WhatsApp messages to your contacts.', 'doublescale')}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center gap-3 py-4">
							<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
							<span className="text-gray-500">
								{__('Checking connection status...', 'doublescale')}
							</span>
						</div>
					) : error ? (
						<div className="flex items-center gap-3 py-4">
							<XCircle className="w-5 h-5 text-red-500" />
							<span className="text-red-600">{error}</span>
						</div>
					) : status?.connected ? (
						<div className="space-y-4">
							{/* Connected Status */}
							<div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
								<CheckCircle className="w-6 h-6 text-green-600" />
								<div className="flex-1">
									<p className="font-medium text-green-800">
										{__('Connected', 'doublescale')}
									</p>
									<p className="text-sm text-green-600">
										{status.provider_name || __('Meta WhatsApp Business API', 'doublescale')}
									</p>
								</div>
							</div>

							{/* Phone Number Details */}
							{status.phone_number && (
								<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
									<Phone className="w-5 h-5 text-gray-600" />
									<div className="flex-1">
										<p className="font-medium text-gray-800">
											{status.phone_number}
										</p>
										{status.verified_name && (
											<p className="text-sm text-gray-500">
												{status.verified_name}
											</p>
										)}
									</div>
								</div>
							)}

							{/* Actions */}
							<div className="flex gap-3 pt-2">
								<Button
									variant="outline"
									onClick={handleConfigure}
									className="flex items-center gap-2"
								>
									<Settings className="w-4 h-4" />
									{__('Manage Connection', 'doublescale')}
								</Button>
								<Button
									variant="ghost"
									asChild
									className="flex items-center gap-2"
								>
									<a
										href="https://business.facebook.com/wa/manage/message-templates/"
										target="_blank"
										rel="noopener noreferrer"
									>
										<ExternalLink className="w-4 h-4" />
										{__('Manage Templates', 'doublescale')}
									</a>
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{/* Not Connected Status */}
							<div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
								<XCircle className="w-6 h-6 text-yellow-600" />
								<div className="flex-1">
									<p className="font-medium text-yellow-800">
										{__('Not Connected', 'doublescale')}
									</p>
									<p className="text-sm text-yellow-600">
										{__('Connect Meta WhatsApp to send messages to your contacts.', 'doublescale')}
									</p>
								</div>
							</div>

							{/* Configure Button */}
							<Button
								onClick={handleConfigure}
								className="flex items-center gap-2"
							>
								<Settings className="w-4 h-4" />
								{__('Configure Meta WhatsApp', 'doublescale')}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Features Card */}
			<Card className="shadow-sm bg-gray-50">
				<CardHeader>
					<CardTitle className="text-base">
						{__('Available Features', 'doublescale')}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-2 text-sm text-gray-600">
						<li className="flex items-center gap-2">
							<CheckCircle className="w-4 h-4 text-green-500" />
							{__('Send WhatsApp messages from contact detail page', 'doublescale')}
						</li>
						<li className="flex items-center gap-2">
							<CheckCircle className="w-4 h-4 text-green-500" />
							{__('Use WhatsApp in automation workflows', 'doublescale')}
						</li>
						<li className="flex items-center gap-2">
							<CheckCircle className="w-4 h-4 text-green-500" />
							{__('Track message delivery status', 'doublescale')}
						</li>
						<li className="flex items-center gap-2">
							<CheckCircle className="w-4 h-4 text-green-500" />
							{__('Use Meta-approved message templates', 'doublescale')}
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
};

export default WhatsAppSettings;
