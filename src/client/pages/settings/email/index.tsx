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
	slug: string;
	name: string;
	url: string;
	description?: string;
	doc_url?: string;
	setup_instructions?: string;
}

interface BounceWebhooks {
	[provider: string]: BounceWebhook;
}

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

	// Fetch webhooks on component mount
	useEffect(() => {
		fetchWebhooks();
	}, []);

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

	// Get sorted provider list for dropdown
	const providersList = webhooks
		? Object.values(webhooks).sort((a, b) => a.name.localeCompare(b.name))
		: [];

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
						<Select
							value={selectedProvider}
							onValueChange={setSelectedProvider}
							disabled={isLoadingWebhooks || !webhooks}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={
										isLoadingWebhooks
											? __('Loading providers...', 'quillcrm')
											: __('Choose your email provider...', 'quillcrm')
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{providersList.map((provider) => (
									<SelectItem key={provider.slug} value={provider.slug}>
										{provider.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{selectedProvider && selectedWebhook && (
						<Card className="mt-6">
							<CardHeader>
								<CardTitle className="text-lg">{selectedWebhook.name}</CardTitle>
								{selectedWebhook.description && (
									<CardDescription>{selectedWebhook.description}</CardDescription>
								)}
							</CardHeader>
							<CardContent className="space-y-4">
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
								{selectedWebhook.setup_instructions && (
									<Alert>
										<AlertDescription className="text-sm">
											<strong>{__('Setup Instructions:', 'quillcrm')}</strong>{' '}
											{selectedWebhook.setup_instructions}
										</AlertDescription>
									</Alert>
								)}

								{/* Documentation Link */}
								{selectedWebhook.doc_url && (
									<div>
										<a
											href={selectedWebhook.doc_url}
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
							</CardContent>
						</Card>
					)}
				</div>
			</div>
        </div>
    );
};

export default EmailSettings;
