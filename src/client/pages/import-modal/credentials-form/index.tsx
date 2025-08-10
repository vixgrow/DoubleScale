// components/ApiCredentials.tsx
import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { map, isEmpty, trim } from 'lodash';
import { ArrowUpLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field } from '@quillcrm/components';
import { useImportContext } from '../contexts';
import { useImportActions } from '../use-importActions';

interface ApiCredentialsProps {
    importer: any;
}

const ApiCredentials: React.FC<ApiCredentialsProps> = ({ importer }) => {
    const { state, updateCredentials } = useImportContext();
    const { credentials, source } = state;
    const { validateCredentials } = useImportActions();
    const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'error'>('idle');
    const [validationMessage, setValidationMessage] = useState('');

    // Platform-specific validation
    const validateApiCredentials = async () => {
        if (!validateCredentials()) {
            setValidationStatus('error');
            setValidationMessage(__('Please fill in all required fields', 'quillcrm'));
            return;
        }

        setValidationStatus('validating');
        
        try {
            // This would typically call a validation endpoint
            // For now, we'll simulate the validation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Platform-specific validation logic could go here
            if (source === 'activecampaign') {
                const { api_key, api_url } = credentials;
                if (!api_url?.includes('.api-us1.com') && !api_url?.includes('.activehosted.com')) {
                    setValidationStatus('error');
                    setValidationMessage(__('API URL should be in format: https://yoursubdomain.api-us1.com', 'quillcrm'));
                    return;
                }
            } else if (source === 'hubspot') {
                const { access_token } = credentials;
                if (access_token && access_token.length < 20) {
                    setValidationStatus('error');
                    setValidationMessage(__('HubSpot access token appears to be too short. Please verify your token.', 'quillcrm'));
                    return;
                }
            }
            
            setValidationStatus('valid');
            setValidationMessage(__('Credentials validated successfully!', 'quillcrm'));
        } catch (error) {
            setValidationStatus('error');
            setValidationMessage(__('Failed to validate credentials. Please check your API key and URL.', 'quillcrm'));
        }
    };

    // Auto-validate when credentials change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (validateCredentials() && validationStatus !== 'validating') {
                validateApiCredentials();
            } else if (!validateCredentials()) {
                setValidationStatus('idle');
                setValidationMessage('');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [credentials]);

    const getValidationIcon = () => {
        switch (validationStatus) {
            case 'validating':
                return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
            case 'valid':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <Card className="space-y-4 p-6 shadow-none rounded-2xl">
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-2xl font-normal text-[#09090B]">
                        {importer.name} {__('Data Import Tool', 'quillcrm')}
                    </CardTitle>
                    <div className="text-[#71717A] text-lg">
                        {__(
                            'Start syncing your contacts to the Quill CRM using your API credentials.',
                            'quillcrm'
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0 space-y-4">
                    {map(importer.credentials, (field, key) => (
                        <div key={key} className="space-y-2">
                            <Field
                                label={field.label}
                                type={field.type}
                                value={credentials[key]}
                                onChange={(value) => updateCredentials(key, value)}
                                placeholder={field.label}
                            />
                            {key === 'api_url' && source === 'activecampaign' && (
                                <p className="text-sm text-gray-500">
                                    {__('Format: https://yoursubdomain.api-us1.com or https://yoursubdomain.activehosted.com', 'quillcrm')}
                                </p>
                            )}
                            {key === 'access_token' && source === 'hubspot' && (
                                <p className="text-sm text-gray-500">
                                    {__('Private App access token from HubSpot Developer settings. Requires crm.objects.contacts.read and crm.lists.read scopes.', 'quillcrm')}
                                </p>
                            )}
                        </div>
                    ))}

                    {/* Validation Status */}
                    {validationStatus !== 'idle' && (
                        <Alert className={`
                            ${validationStatus === 'valid' ? 'border-green-200 bg-green-50' : ''}
                            ${validationStatus === 'error' ? 'border-red-200 bg-red-50' : ''}
                            ${validationStatus === 'validating' ? 'border-blue-200 bg-blue-50' : ''}
                        `}>
                            <div className="flex items-center space-x-2">
                                {getValidationIcon()}
                                <AlertDescription className="text-sm">
                                    {validationMessage}
                                </AlertDescription>
                            </div>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-[#F6F6F6] rounded-xl shadow-none border border-gray-200">
                <CardContent className="p-6 space-y-3">
                    <CardTitle className="text-2xl font-normal text-[#09090B] mb-2">
                        {__(`Find your ${importer.name} credentials`, 'quillcrm')}
                    </CardTitle>

                    {source === 'activecampaign' ? (
                        <div>
                            <ul className="list-decimal list-inside text-lg text-[#71717A] space-y-2">
                                <li>{__('Sign in to your ActiveCampaign account', 'quillcrm')}</li>
                                <li>{__('Go to Settings → Developer', 'quillcrm')}</li>
                                <li>{__('Copy your API URL and Key from the API Access section', 'quillcrm')}</li>
                                <li>{__('Your API URL format should be: https://yoursubdomain.api-us1.com', 'quillcrm')}</li>
                            </ul>
                            <a
                                href="https://help.activecampaign.com/hc/en-us/articles/207317590-Getting-started-with-the-API"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-base text-[#274C77] hover:underline mt-4"
                            >
                                <ArrowUpLeft className="w-4 h-4 mr-1" />
                                {__('ActiveCampaign API Documentation', 'quillcrm')}
                            </a>
                        </div>
                    ) : source === 'mailerlite' ? (
                        <div>
                            <ul className="list-decimal list-inside text-lg text-[#71717A] space-y-2">
                                <li>{__('Sign in to your MailerLite account', 'quillcrm')}</li>
                                <li>{__('Go to Integrations → Developer API', 'quillcrm')}</li>
                                <li>{__('Generate a new API token or copy an existing one', 'quillcrm')}</li>
                                <li>{__('Make sure the token has read permissions for subscribers and groups', 'quillcrm')}</li>
                            </ul>
                            <a
                                href="https://developers.mailerlite.com/docs/authentication"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-base text-[#274C77] hover:underline mt-4"
                            >
                                <ArrowUpLeft className="w-4 h-4 mr-1" />
                                {__('MailerLite API Documentation', 'quillcrm')}
                            </a>
                        </div>
                    ) : source === 'hubspot' ? (
                        <div>
                            <ul className="list-decimal list-inside text-lg text-[#71717A] space-y-2">
                                <li>{__('Sign in to your HubSpot account', 'quillcrm')}</li>
                                <li>{__('Go to Settings → Integrations → Private Apps', 'quillcrm')}</li>
                                <li>{__('Create a new Private App or select an existing one', 'quillcrm')}</li>
                                <li>{__('Enable these scopes: crm.objects.contacts.read and crm.lists.read', 'quillcrm')}</li>
                                <li>{__('Copy the Access Token from the Auth tab', 'quillcrm')}</li>
                            </ul>
                            <a
                                href="https://developers.hubspot.com/docs/api/private-apps"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-base text-[#274C77] hover:underline mt-4"
                            >
                                <ArrowUpLeft className="w-4 h-4 mr-1" />
                                {__('HubSpot Private Apps Documentation', 'quillcrm')}
                            </a>
                        </div>
                    ) : (
                        <div>
                            <ul className="list-decimal list-inside text-lg text-[#71717A] space-y-2">
                                <li>{__(`Sign in to your ${importer.name} account`, 'quillcrm')}</li>
                                <li>{__(`Navigate to API settings or Developer section`, 'quillcrm')}</li>
                                <li>{__('Generate or copy your API credentials', 'quillcrm')}</li>
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ApiCredentials;