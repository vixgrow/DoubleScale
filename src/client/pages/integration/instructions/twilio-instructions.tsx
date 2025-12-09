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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WebhookData {
    sms: {
        name: string;
        url: string;
        description: string;
    };
    whatsapp: {
        name: string;
        url: string;
        description: string;
    };
}

const TwilioInstructions: React.FC = () => {
    const [webhooks, setWebhooks] = useState<WebhookData | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch webhook URLs from API
        apiFetch({ path: '/qc/v1/settings/messaging-webhooks' })
            .then((response: any) => {
                setWebhooks(response);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Failed to fetch webhook URLs:', error);
                setIsLoading(false);
            });
    }, []);

    const copyToClipboard = (url: string, channel: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedUrl(channel);
            setTimeout(() => setCopiedUrl(null), 2000);
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-destructive mb-2">
                    {__('Twilio Configuration', 'quillcrm')}
                </h2>
                <p className="text-sm text-gray-600">
                    {__('Follow these instructions to connect QuillCRM with your Twilio account', 'quillcrm')}
                </p>
            </div>

            {/* Step 1: Get Credentials */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {__('Step 1: Get Twilio Credentials', 'quillcrm')}
                    </CardTitle>
                    <CardDescription>
                        {__('Retrieve your Account SID and Auth Token from Twilio', 'quillcrm')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li>
                            {__('Go to your', 'quillcrm')}{' '}
                            <a
                                href="https://console.twilio.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-secondary font-medium hover:underline inline-flex items-center gap-1"
                            >
                                {__('Twilio Console', 'quillcrm')}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </li>
                        <li>{__('Click on the account dropdown', 'quillcrm')}</li>
                        <li>{__('Select "API keys & tokens"', 'quillcrm')}</li>
                        <li>{__('Go to "Live credentials"', 'quillcrm')}</li>
                        <li>{__('Copy your Account SID and Auth Token', 'quillcrm')}</li>
                        <li>{__('Paste them in the integration settings above', 'quillcrm')}</li>
                    </ol>
                </CardContent>
            </Card>

            {/* Step 2: Configure Webhooks */}
            {!isLoading && webhooks && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {__('Step 2: Configure Incoming Message Webhooks', 'quillcrm')}
                        </CardTitle>
                        <CardDescription>
                            {__('Enable two-way messaging by configuring these webhook URLs in Twilio', 'quillcrm')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* SMS Webhook */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-900">
                                {webhooks.sms.name}
                            </h4>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-3 font-mono text-xs break-all">
                                    {webhooks.sms.url}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(webhooks.sms.url, 'sms')}
                                    className="shrink-0"
                                >
                                    {copiedUrl === 'sms' ? (
                                        <>
                                            <Check className="w-4 h-4 mr-1" />
                                            {__('Copied!', 'quillcrm')}
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-1" />
                                            {__('Copy', 'quillcrm')}
                                        </>
                                    )}
                                </Button>
                            </div>
                            <Alert className="bg-blue-50 border-blue-200">
                                <AlertDescription className="text-xs text-blue-800">
                                    {webhooks.sms.description}
                                </AlertDescription>
                            </Alert>
                        </div>

                        {/* WhatsApp Webhook */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-gray-900">
                                {webhooks.whatsapp.name}
                            </h4>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-3 font-mono text-xs break-all">
                                    {webhooks.whatsapp.url}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(webhooks.whatsapp.url, 'whatsapp')}
                                    className="shrink-0"
                                >
                                    {copiedUrl === 'whatsapp' ? (
                                        <>
                                            <Check className="w-4 h-4 mr-1" />
                                            {__('Copied!', 'quillcrm')}
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-1" />
                                            {__('Copy', 'quillcrm')}
                                        </>
                                    )}
                                </Button>
                            </div>
                            <Alert className="bg-blue-50 border-blue-200">
                                <AlertDescription className="text-xs text-blue-800">
                                    {webhooks.whatsapp.description}
                                </AlertDescription>
                            </Alert>
                        </div>

                        {/* Configuration Instructions */}
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                                {__('How to configure in Twilio:', 'quillcrm')}
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-xs text-gray-700">
                                <li>{__('Go to Twilio Console → Phone Numbers → Manage → Active numbers', 'quillcrm')}</li>
                                <li>{__('Select your SMS/WhatsApp enabled phone number', 'quillcrm')}</li>
                                <li>{__('Scroll to "Messaging Configuration"', 'quillcrm')}</li>
                                <li>{__('Under "A MESSAGE COMES IN", select "Webhook"', 'quillcrm')}</li>
                                <li>{__('Paste the webhook URL from above', 'quillcrm')}</li>
                                <li>{__('Set HTTP method to "POST"', 'quillcrm')}</li>
                                <li>{__('Click "Save"', 'quillcrm')}</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isLoading && (
                <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                        {__('Loading webhook URLs...', 'quillcrm')}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TwilioInstructions;

