import React, { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { map } from 'lodash';
import { ArrowUpLeft, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field } from '@doublescale/components';
import { useImportContext } from '../contexts';
import { useImportActions } from '../use-importActions';
import GoHighLevelOAuth from '../components/gohighlevel-oauth';

interface ImporterCredential {
	label: string;
	type: string;
	description?: string;
	docs_url?: string;
	title?: string;
}

interface Importer {
	name: string;
	credentials: Record<string, ImporterCredential>;
}

interface ApiCredentialsProps {
	importer: Importer;
}

type ValidationStatus = 'idle' | 'error';

const MIN_HUBSPOT_TOKEN_LENGTH = 20;

const ApiCredentials: React.FC<ApiCredentialsProps> = ({ importer }) => {
	const { state, updateCredentials } = useImportContext();
	const { credentials, source } = state;
	const { validateCredentials, getSourceData } = useImportActions();
	const [validationStatus, setValidationStatus] =
		useState<ValidationStatus>('idle');
	const [validationMessage, setValidationMessage] = useState('');

	const validatePlatformSpecificCredentials = useCallback(
		(source: string, credentials: Record<string, any>) => {
			switch (source) {
				case 'activecampaign': {
					const { api_url } = credentials;
					if (
						!api_url?.includes('.api-us1.com') &&
						!api_url?.includes('.activehosted.com')
					) {
						return {
							isValid: false,
							message: __(
								'API URL should be in format: https://yoursubdomain.api-us1.com',
								'doublescale'
							),
						};
					}
					break;
				}
				case 'hubspot': {
					const { access_token } = credentials;
					if (
						access_token &&
						access_token.length < MIN_HUBSPOT_TOKEN_LENGTH
					) {
						return {
							isValid: false,
							message: __(
								'HubSpot access token appears to be too short. Please verify your token.',
								'doublescale'
							),
						};
					}
					break;
				}
				case 'pipedrive': {
					const { api_domain, api_token } = credentials;
					if (api_domain && !api_domain.includes('.pipedrive.com')) {
						return {
							isValid: false,
							message: __(
								'API Domain should be in format: yourcompany.pipedrive.com (without https://)',
								'doublescale'
							),
						};
					}
					if (api_token && api_token.length < 30) {
						return {
							isValid: false,
							message: __(
								'Pipedrive API token appears to be too short. Please verify your token.',
								'doublescale'
							),
						};
					}
					break;
				}
			}
			return { isValid: true, message: '' };
		},
		[]
	);

	const validateApiCredentials = useCallback(() => {
		if (!validateCredentials()) {
			setValidationStatus('idle');
			setValidationMessage('');
			return;
		}

		const platformValidation = validatePlatformSpecificCredentials(
			source,
			credentials
		);
		if (!platformValidation.isValid) {
			setValidationStatus('error');
			setValidationMessage(platformValidation.message);
			return;
		}

		setValidationStatus('idle');
		setValidationMessage('');
	}, [
		validateCredentials,
		source,
		credentials,
		validatePlatformSpecificCredentials,
	]);

	useEffect(() => {
		validateApiCredentials();
	}, [validateApiCredentials]);

	const getValidationIcon = useCallback(() => {
		switch (validationStatus) {
			case 'error':
				return <AlertCircle className="w-4 h-4 text-red-500" />;
			default:
				return null;
		}
	}, [validationStatus]);

	return (
		<div className="space-y-6">
			<Card className="space-y-4 p-6 shadow-none rounded-2xl">
				<CardHeader className="p-0 mb-4">
					<CardTitle className="text-2xl font-normal text-[#09090B]">
						{importer.name} {__('Data Import Tool', 'doublescale')}
					</CardTitle>
					<div className="text-[#71717A] text-lg">
						{__(
							'Start syncing your contacts to the Quill CRM using your API credentials.',
							'doublescale'
						)}
					</div>
				</CardHeader>

				<CardContent className="p-0 space-y-4">
					{/* GoHighLevel uses OAuth, all other providers use regular credentials */}
					{source === 'gohighlevel' ? (
						<GoHighLevelOAuth
							credentials={importer.credentials}
							onConnectionChange={(connected) => {
								console.log(
									'GoHighLevel: Connection state changed:',
									connected
								);
							}}
							onDataFetched={(_data) => {
								console.log(
									'GoHighLevel: Data fetched, triggering getSourceData...'
								);
								// Trigger the import actions to fetch source data
								getSourceData();
							}}
						/>
					) : (
						<>
							{map(importer.credentials, (field, key) => {
								// Skip info fields - they're handled in InstructionsCard
								if (field.type === 'info') return null;

								return (
									<CredentialField
										key={key}
										fieldKey={key}
										field={field}
										value={credentials[key]}
										source={source}
										onChange={(value) =>
											updateCredentials(key, value)
										}
									/>
								);
							})}

							<ValidationAlert
								status={validationStatus}
								message={validationMessage}
								getIcon={getValidationIcon}
							/>
						</>
					)}
				</CardContent>
			</Card>

			<InstructionsCard importer={importer} source={source} />
		</div>
	);
};

interface CredentialFieldProps {
	fieldKey: string;
	field: ImporterCredential;
	value: any;
	source: string;
	onChange: (value: any) => void;
}

const CredentialField: React.FC<CredentialFieldProps> = ({
	fieldKey,
	field,
	value,
	source,
	onChange,
}) => {
	const getFieldHelpText = () => {
		if (fieldKey === 'api_url' && source === 'activecampaign') {
			return __(
				'Format: https://yoursubdomain.api-us1.com or https://yoursubdomain.activehosted.com',
				'doublescale'
			);
		}
		if (fieldKey === 'access_token' && source === 'hubspot') {
			return __(
				'Private App access token from HubSpot Developer settings. Requires crm.objects.contacts.read and crm.lists.read scopes.',
				'doublescale'
			);
		}
		if (fieldKey === 'api_domain' && source === 'pipedrive') {
			return __(
				'Your Pipedrive company domain without https:// (e.g., yourcompany.pipedrive.com)',
				'doublescale'
			);
		}
		if (fieldKey === 'api_token' && source === 'pipedrive') {
			return __(
				'Personal API token from Settings > Personal preferences > API in your Pipedrive account',
				'doublescale'
			);
		}
		return null;
	};

	const helpText = getFieldHelpText();

	return (
		<div className="space-y-2">
			<Field
				label={field.label}
				type={field.type}
				value={value}
				onChange={onChange}
				placeholder={field.label}
			/>
			{helpText && <p className="text-sm text-gray-500">{helpText}</p>}
		</div>
	);
};

interface ValidationAlertProps {
	status: ValidationStatus;
	message: string;
	getIcon: () => React.ReactNode;
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({
	status,
	message,
	getIcon,
}) => {
	if (status === 'idle') return null;

	const getAlertClasses = () => {
		switch (status) {
			case 'error':
				return 'border-red-200 bg-red-50';
			default:
				return '';
		}
	};

	return (
		<Alert className={getAlertClasses()}>
			<div className="flex items-center space-x-2">
				{getIcon()}
				<AlertDescription className="text-sm">
					{message}
				</AlertDescription>
			</div>
		</Alert>
	);
};

interface PlatformInstructions {
	steps: string[];
	docUrl?: string;
	docText?: string;
}

const PLATFORM_INSTRUCTIONS: Record<string, PlatformInstructions> = {
	activecampaign: {
		steps: [
			__('Sign in to your ActiveCampaign account', 'doublescale'),
			__('Go to Settings → Developer', 'doublescale'),
			__(
				'Copy your API URL and Key from the API Access section',
				'doublescale'
			),
			__(
				'Your API URL format should be: https://yoursubdomain.api-us1.com',
				'doublescale'
			),
		],
		docUrl: 'https://help.activecampaign.com/hc/en-us/articles/207317590-Getting-started-with-the-API',
		docText: __('ActiveCampaign API Documentation', 'doublescale'),
	},
	mailerlite: {
		steps: [
			__('Sign in to your MailerLite account', 'doublescale'),
			__('Go to Integrations → Developer API', 'doublescale'),
			__('Generate a new API token or copy an existing one', 'doublescale'),
			__(
				'Make sure the token has read permissions for subscribers and groups',
				'doublescale'
			),
		],
		docUrl: 'https://developers.mailerlite.com/docs/authentication',
		docText: __('MailerLite API Documentation', 'doublescale'),
	},
	hubspot: {
		steps: [
			__('Sign in to your HubSpot account', 'doublescale'),
			__('Go to Settings → Integrations → Private Apps', 'doublescale'),
			__(
				'Create a new Private App or select an existing one',
				'doublescale'
			),
			__(
				'Enable these scopes: crm.objects.contacts.read and crm.lists.read',
				'doublescale'
			),
			__('Copy the Access Token from the Auth tab', 'doublescale'),
		],
		docUrl: 'https://developers.hubspot.com/docs/api/private-apps',
		docText: __('HubSpot Private Apps Documentation', 'doublescale'),
	},
	pipedrive: {
		steps: [
			__('Sign in to your Pipedrive account', 'doublescale'),
			__('Go to Settings → Personal preferences → API', 'doublescale'),
			__('Copy your Personal API token', 'doublescale'),
			__(
				'Note your company domain from the browser URL (e.g., yourcompany.pipedrive.com)',
				'doublescale'
			),
		],
		docUrl: 'https://developers.pipedrive.com/docs/api/v1',
		docText: __('Pipedrive API Documentation', 'doublescale'),
	},
	gohighlevel: {
		steps: [
			__('OAuth authentication is configured automatically', 'doublescale'),
			__(
				'Click the "Connect GoHighLevel Account" button above',
				'doublescale'
			),
			__('Authorize DoubleScale in the popup window', 'doublescale'),
			__('Select your GoHighLevel location', 'doublescale'),
			__('The connection will be established automatically', 'doublescale'),
		],
		docUrl: 'https://highlevel.stoplight.io/docs/integrations/0443d7d1a4bd0-overview',
		docText: __('GoHighLevel API Documentation', 'doublescale'),
	},
};

interface InstructionsCardProps {
	importer: Importer;
	source: string;
}

const InstructionsCard: React.FC<InstructionsCardProps> = ({
	importer,
	source,
}) => {
	const instructions = PLATFORM_INSTRUCTIONS[source];

	// Check if there's a dynamic info field from the backend
	const infoField = Object.values(importer.credentials).find(
		(field) => field.type === 'info'
	);

	const getDefaultInstructions = (): PlatformInstructions => ({
		steps: [
			__(`Sign in to your ${importer.name} account`, 'doublescale'),
			__('Navigate to API settings or Developer section', 'doublescale'),
			__('Generate or copy your API credentials', 'doublescale'),
		],
	});

	// Use dynamic info field if available, otherwise fall back to hardcoded instructions
	const currentInstructions = infoField
		? {
				steps: [infoField.description || ''],
				docUrl: infoField.docs_url,
				docText: infoField.docs_url
					? __('Documentation', 'doublescale')
					: undefined,
			}
		: instructions || getDefaultInstructions();

	return (
		<Card className="bg-[#F6F6F6] rounded-xl shadow-none border border-gray-200">
			<CardContent className="p-6 space-y-3">
				<CardTitle className="text-2xl font-normal text-[#09090B] mb-2">
					{infoField?.title ||
						__(
							`Find your ${importer.name} credentials`,
							'doublescale'
						)}
				</CardTitle>

				{infoField ? (
					<div
						className="text-lg text-[#71717A] space-y-2"
						dangerouslySetInnerHTML={{
							__html: infoField.description || '',
						}}
					/>
				) : (
					<ul className="list-decimal list-inside text-lg text-[#71717A] space-y-2">
						{currentInstructions.steps.map(
							(step: string, index: number) => (
								<li key={index}>{step}</li>
							)
						)}
					</ul>
				)}

				{currentInstructions.docUrl && currentInstructions.docText && (
					<a
						href={currentInstructions.docUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center text-base text-[#274C77] hover:underline mt-4"
					>
						<ArrowUpLeft className="w-4 h-4 mr-1" />
						{currentInstructions.docText}
					</a>
				)}
			</CardContent>
		</Card>
	);
};

export default ApiCredentials;
