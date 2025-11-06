/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Copy, Check, ExternalLink } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { Settings } from '@quillcrm/client';
import { Field, Editor } from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';
import { FromEmailSelector } from '@/components/from-email-selector';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EmailSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
}

interface BounceWebhook {
	name: string;
	url: string;
}

interface BounceWebhooks {
	[provider: string]: BounceWebhook;
}

interface ProviderInfo {
	description: string;
	docUrl?: string;
	setupInstructions?: string;
}

const PROVIDER_INFO: Record<string, ProviderInfo> = {
	sendgrid: {
		description: __('Configure SendGrid Event Webhook for bounce notifications', 'quillcrm'),
		docUrl: 'https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook',
		setupInstructions: __(
			'Go to SendGrid Dashboard → Settings → Mail Settings → Event Webhook. Enable "Bounced" and "Dropped" events, then paste the webhook URL.',
			'quillcrm'
		),
	},
	mailgun: {
		description: __('Set up Mailgun webhooks for bounce and failure events', 'quillcrm'),
		docUrl: 'https://documentation.mailgun.com/en/latest/user_manual.html#webhooks',
		setupInstructions: __(
			'In Mailgun Dashboard → Webhooks, enable "Permanent Failure" and "Temporary Failure" events with this URL.',
			'quillcrm'
		),
	},
	postmark: {
		description: __('Configure Postmark bounce webhook', 'quillcrm'),
		docUrl: 'https://postmarkapp.com/developer/webhooks/bounce-webhook',
		setupInstructions: __(
			'Navigate to Postmark Dashboard → Servers → [Your Server] → Webhooks → Bounce, and paste this URL.',
			'quillcrm'
		),
	},
	sparkpost: {
		description: __('Set up SparkPost webhooks for bounce handling', 'quillcrm'),
		docUrl: 'https://developers.sparkpost.com/api/webhooks/',
		setupInstructions: __(
			'In SparkPost Dashboard → Webhooks → Create Webhook, select "Bounce" and "Out of Band" events.',
			'quillcrm'
		),
	},
	amazonses: {
		description: __('Configure Amazon SES bounce notifications via SNS', 'quillcrm'),
		docUrl: 'https://docs.aws.amazon.com/ses/latest/dg/configure-sns-notifications.html',
		setupInstructions: __(
			'Set up an SNS topic for bounces in AWS SES Console → Email Addresses → Notifications, then subscribe this webhook URL to that topic.',
			'quillcrm'
		),
	},
	pepipost: {
		description: __('Configure Pepipost webhook for bounce tracking', 'quillcrm'),
		docUrl: 'https://docs.pepipost.com/docs/webhooks',
		setupInstructions: __('Add this webhook URL in Pepipost Dashboard → Settings → Webhooks.', 'quillcrm'),
	},
	brevo: {
		description: __('Set up Brevo (formerly Sendinblue) bounce handling', 'quillcrm'),
		docUrl: 'https://developers.brevo.com/docs/webhooks',
		setupInstructions: __(
			'In Brevo Dashboard → Transactional → Settings → Webhooks, add this URL for bounce events.',
			'quillcrm'
		),
	},
	smtp2go: {
		description: __('Configure SMTP2GO webhook for bounce events', 'quillcrm'),
		docUrl: 'https://support.smtp2go.com/hc/en-gb/articles/223076368-Webhook-Reference',
		setupInstructions: __('Add webhook URL in SMTP2GO Dashboard → Settings → Webhooks.', 'quillcrm'),
	},
	elasticemail: {
		description: __('Set up Elastic Email bounce notifications', 'quillcrm'),
		docUrl: 'https://elasticemail.com/developers/webhooks',
		setupInstructions: __(
			'Configure webhook in Elastic Email Dashboard → Settings → Notification → Webhooks.',
			'quillcrm'
		),
	},
	postal: {
		description: __('Configure Postal server bounce webhook', 'quillcrm'),
		docUrl: 'https://github.com/postalserver/postal/wiki/Webhooks',
		setupInstructions: __('Add this webhook URL in your Postal server webhook settings.', 'quillcrm'),
	},
};

const EmailSettings: React.FC<EmailSettingsProps> = ({
    settings,
    onChange,
}) => {
    const {
        from_name,
        from_email,
        reply_to,
        email_footer,
        max_in_second,
        max_in_day,
    } = settings.email;

	const [selectedProvider, setSelectedProvider] = useState<string>('');
	const [webhooks, setWebhooks] = useState<BounceWebhooks | null>(null);
	const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (selectedProvider && !webhooks) {
			fetchWebhooks();
		}
	}, [selectedProvider]);

	const fetchWebhooks = async () => {
		try {
			setIsLoadingWebhooks(true);
			const response = (await apiFetch({
				path: '/qc/v1/settings/bounce-webhooks',
			})) as BounceWebhooks;
			setWebhooks(response);
		} catch (error) {
			console.error('Failed to fetch bounce webhooks:', error);
		} finally {
			setIsLoadingWebhooks(false);
		}
	};

	const handleCopyWebhook = async () => {
		if (!selectedProvider || !webhooks?.[selectedProvider]) return;

		try {
			await navigator.clipboard.writeText(webhooks[selectedProvider].url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

    const handleFieldChange = (key: string, value: string) => {
        onChange({
            ...settings,
            email: {
                ...settings.email,
                [key]: value,
            },
        });
    };

	const selectedWebhook = selectedProvider && webhooks ? webhooks[selectedProvider] : null;
	const providerInfo = selectedProvider ? PROVIDER_INFO[selectedProvider] : null;

    return (
        <div className="email-settings qcrm-fields">
            <div className="text-[#09090B] font-semibold text-2xl">
                {__('Email', 'quillcrm')}
            </div>
            <div className="flex gap-5 items-start mb-3">
                <div className="flex-1">
                    <Field
                        label={__('From Name', 'quillcrm')}
                        value={from_name || ConfigAPI.getBlogName()}
                        onChange={(value) => handleFieldChange('from_name', value)}
                        type="text"
                    />
                </div>
                <div className="flex-1">
                    <div className="qcrm-field-label text-[#09090B] font-normal text-base flex items-center justify-between mb-[10px]">
                        {__('From Email', 'quillcrm')}
                    </div>
                    <div className="qcrm-field-input">
                        <FromEmailSelector
                            value={from_email || ConfigAPI.getAdminEmail()}
                            onChange={(email, name) => {
                                handleFieldChange('from_email', email);
                                // Auto-fill from name if provided and current from_name is empty
                                if (name && !from_name) {
                                    handleFieldChange('from_name', name);
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <Field
                        label={__('Reply To', 'quillcrm')}
                        value={reply_to || ConfigAPI.getBlogName()}
                        onChange={(value) => handleFieldChange('reply_to', value)}
                        type="email"
                    />
                </div>
            </div>
            <div className="flex gap-5 items-start w-full">
                <div className="w-full flex flex-col gap-5">
                    <Field
                        label={__('Max Emails in Second', 'quillcrm')}
                        value={max_in_second}
                        onChange={(value) =>
                            handleFieldChange('max_in_second', value)
                        }
                        type="number"
                        min={1}
                    />
                    <Field
                        label={__('Max Emails in Day', 'quillcrm')}
                        value={max_in_day}
                        onChange={(value) =>
                            handleFieldChange('max_in_day', value)
                        }
                        type="number"
                        min={1}
                    />
                </div>
                <div className="w-full">
                    <div className="text-[#09090B] font-normal text-base mb-2">
                        {__('Email Footer', 'quillcrm')}
                    </div>
                    <div>
                        <Editor
                            message={email_footer}
                            onChange={(content) =>
                                handleFieldChange('email_footer', content)
                            }
                        />
                    </div>
                </div>
            </div>

			{/* Bounce Handler Configuration */}
			<div className="mt-8 pt-8 border-t border-gray-200">
				<div className="text-[#09090B] font-semibold text-xl mb-4">
					{__('Bounce Handler', 'quillcrm')}
				</div>
				<p className="text-gray-600 text-sm mb-6">
					{__(
						'Configure webhook notifications from your email service provider to automatically handle bounced emails.',
						'quillcrm'
					)}
				</p>

				<div className="max-w-2xl">
					<div className="mb-4">
						<label className="text-[#09090B] font-normal text-base mb-2 block">
							{__('Select Email Service Provider', 'quillcrm')}
						</label>
						<Select value={selectedProvider} onValueChange={setSelectedProvider}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder={__('Choose your email provider...', 'quillcrm')} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="sendgrid">SendGrid</SelectItem>
								<SelectItem value="mailgun">Mailgun</SelectItem>
								<SelectItem value="postmark">Postmark</SelectItem>
								<SelectItem value="sparkpost">SparkPost</SelectItem>
								<SelectItem value="amazonses">Amazon SES</SelectItem>
								<SelectItem value="pepipost">Pepipost</SelectItem>
								<SelectItem value="brevo">Brevo (Sendinblue)</SelectItem>
								<SelectItem value="smtp2go">SMTP2GO</SelectItem>
								<SelectItem value="elasticemail">Elastic Email</SelectItem>
								<SelectItem value="postal">Postal</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{selectedProvider && (
						<Card className="mt-6">
							<CardHeader>
								<CardTitle className="text-lg">
									{selectedWebhook?.name || selectedProvider}
								</CardTitle>
								{providerInfo && (
									<CardDescription>{providerInfo.description}</CardDescription>
								)}
							</CardHeader>
							<CardContent className="space-y-4">
								{isLoadingWebhooks ? (
									<div className="animate-pulse space-y-3">
										<div className="h-10 bg-gray-200 rounded"></div>
										<div className="h-20 bg-gray-200 rounded"></div>
									</div>
								) : selectedWebhook ? (
									<>
										{/* Webhook URL */}
										<div className="space-y-2">
											<label className="text-sm font-medium text-gray-700">
												{__('Webhook URL', 'quillcrm')}
											</label>
											<div className="flex gap-2">
												<input
													type="text"
													value={selectedWebhook.url}
													readOnly
													className="flex-1 px-3 py-2 text-sm border rounded-md bg-gray-50 font-mono text-gray-600"
												/>
												<Button
													onClick={handleCopyWebhook}
													variant="outline"
													size="sm"
													className="shrink-0"
												>
													{copied ? (
														<>
															<Check className="h-4 w-4 mr-1 text-green-600" />
															{__('Copied!', 'quillcrm')}
														</>
													) : (
														<>
															<Copy className="h-4 w-4 mr-1" />
															{__('Copy', 'quillcrm')}
														</>
													)}
												</Button>
											</div>
										</div>

										{/* Setup Instructions */}
										{providerInfo?.setupInstructions && (
											<Alert>
												<AlertDescription className="text-sm">
													<strong>{__('Setup Instructions:', 'quillcrm')}</strong>{' '}
													{providerInfo.setupInstructions}
												</AlertDescription>
											</Alert>
										)}

										{/* Documentation Link */}
										{providerInfo?.docUrl && (
											<div>
												<a
													href={providerInfo.docUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
												>
													<ExternalLink className="h-4 w-4" />
													{__('View Provider Documentation', 'quillcrm')}
												</a>
											</div>
										)}

										{/* How It Works Info */}
										<Alert className="bg-blue-50 border-blue-200 mt-4">
											<AlertDescription className="text-sm text-blue-900">
												<strong>{__('How it works:', 'quillcrm')}</strong>{' '}
												{__(
													'When an email bounces, your provider sends a notification to this webhook. QuillCRM automatically marks contacts as bounced (hard bounce) or tracks soft bounces. After 3 soft bounces, contacts are converted to hard bounce status.',
													'quillcrm'
												)}
											</AlertDescription>
										</Alert>
									</>
								) : null}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
        </div>
    );
};

export default EmailSettings;
