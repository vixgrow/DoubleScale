/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';

/**
 * Mailers that send via provider OAuth/API (not plain SMTP credentials in this form).
 */
export const SMTP_OAUTH_MAILERS = ['gmail', 'outlook', 'zoho'] as const;

export type SmtpOAuthMailer = (typeof SMTP_OAUTH_MAILERS)[number];

export function isSmtpOAuthMailer(mailer: string): mailer is SmtpOAuthMailer {
	return (SMTP_OAUTH_MAILERS as readonly string[]).includes(mailer);
}

/**
 * Mailer slugs supported by the bundled SMTP module (see PHP Mailers::get_mailers()).
 */
export const SMTP_MAILER_OPTIONS: { value: string; label: string }[] = [
	{ value: 'phpmailer', label: 'Default (PHPMailer)' },
	{ value: 'smtp', label: 'SMTP' },
	{ value: 'sendgrid', label: 'SendGrid' },
	{ value: 'mailgun', label: 'Mailgun' },
	{ value: 'aws', label: 'Amazon SES (AWS)' },
	{ value: 'gmail', label: 'Gmail' },
	{ value: 'postmark', label: 'Postmark' },
	{ value: 'sendinblue', label: 'Brevo (Sendinblue)' },
	{ value: 'loops', label: 'Loops' },
	{ value: 'mailersend', label: 'MailerSend' },
	{ value: 'mailjet', label: 'Mailjet' },
	{ value: 'mandrill', label: 'Mandrill' },
	{ value: 'sparkpost', label: 'SparkPost' },
	{ value: 'sendlayer', label: 'SendLayer' },
	{ value: 'smtp2go', label: 'SMTP2GO' },
	{ value: 'smtpcom', label: 'SMTP.com' },
	{ value: 'elasticemail', label: 'Elastic Email' },
	{ value: 'outlook', label: 'Outlook' },
	{ value: 'zoho', label: 'Zoho' },
	{ value: 'socketlabs', label: 'SocketLabs' },
];

/**
 * Logo filenames under `assets/images/mailers/` (mailer slug → file).
 */
export const SMTP_MAILER_LOGO_FILES: Record<string, string> = {
	phpmailer: 'php.svg',
	smtp: 'smtp.svg',
	sendgrid: 'sendgrid.svg',
	mailgun: 'mailgun.svg',
	aws: 'aws.svg',
	gmail: 'gmail.svg',
	postmark: 'postmark.svg',
	sendinblue: 'sendinblue.svg',
	loops: 'loops.svg',
	mailersend: 'mailersend.svg',
	mailjet: 'mailjet.svg',
	mandrill: 'mandrill.svg',
	sparkpost: 'sparkpost.svg',
	sendlayer: 'sendlayer.svg',
	smtp2go: 'smtp2go.svg',
	smtpcom: 'smtpcom.svg',
	elasticemail: 'elasticemail.svg',
	outlook: 'outlook.svg',
	zoho: 'zoho.svg',
	socketlabs: 'socketlabs.svg',
};

/**
 * Absolute URL to the bundled logo for a mailer slug, if present.
 * Logos ship with the core plugin under `assets/images/mailers/`.
 */
export function getSmtpMailerLogoUrl(mailerSlug: string): string | undefined {
	const file = SMTP_MAILER_LOGO_FILES[mailerSlug];
	if (!file) {
		return undefined;
	}
	const base = ConfigAPI.getPluginDirUrl();
	const sep = base.endsWith('/') ? '' : '/';
	return `${base}${sep}assets/images/mailers/${file}`;
}

/** Wizard grouping for the provider picker (step 2). */
export type SmtpMailerUiCategory = 'default' | 'relay' | 'oauth' | 'api';

export const SMTP_MAILER_CATEGORY_ORDER: SmtpMailerUiCategory[] = [
	'default',
	'relay',
	'oauth',
	'api',
];

export const SMTP_MAILER_CATEGORY_LABEL: Record<SmtpMailerUiCategory, string> =
	{
		default: __('Built-in', 'doublescale'),
		relay: __('SMTP relay', 'doublescale'),
		oauth: __('OAuth mailbox', 'doublescale'),
		api: __('Transactional API', 'doublescale'),
	};

export type SmtpMailerUiMeta = {
	category: SmtpMailerUiCategory;
	/** Short line on provider cards (step 2). */
	summary: string;
	/** Step 3 — what “add/link account” means for this mailer. */
	accountSetupDescription: string;
	/** Optional help under the account name field. */
	accountNameHint?: string;
	docUrl?: string;
	docLabel?: string;
};

/**
 * Per-mailer UX copy and doc links for the connection wizard.
 * Keys align with `SMTP_MAILER_OPTIONS` / PHP mailer slugs.
 */
export const SMTP_MAILER_UI_META: Record<string, SmtpMailerUiMeta> = {
	phpmailer: {
		category: 'default',
		summary: __(
			'WordPress default mail transport — no external provider account.',
			'doublescale'
		),
		accountSetupDescription: __(
			'No API keys or SMTP vault entry is required. Set From identity below if you want this connection to participate in routing.',
			'doublescale'
		),
	},
	smtp: {
		category: 'relay',
		summary: __(
			'Generic SMTP — use your host’s server, port, and login.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Either pick a saved SMTP credential set or choose “Create new” and enter host, port, encryption, and username/password. Those values are stored as the provider account for this mailer.',
			'doublescale'
		),
		docLabel: __('What is SMTP?', 'doublescale'),
		docUrl: 'https://developer.mozilla.org/en-US/docs/Glossary/SMTP',
	},
	sendgrid: {
		category: 'api',
		summary: __(
			'SendGrid HTTP API — API key authentication.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Create an API key in SendGrid with mail-send permission, then add it here as a new provider account or reuse one you already stored.',
			'doublescale'
		),
		docLabel: __('SendGrid API keys', 'doublescale'),
		docUrl: 'https://docs.sendgrid.com/ui/account-and-settings/api-keys',
	},
	mailgun: {
		category: 'api',
		summary: __(
			'Mailgun — domain, region, and private API key.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Each provider account is a domain + API key pair (and region). Add a new account for each Mailgun domain you send from, or select an existing stored account.',
			'doublescale'
		),
		docLabel: __('Mailgun sending domains', 'doublescale'),
		docUrl: 'https://documentation.mailgun.com/en/latest/user_manual.html#sending-domains',
	},
	aws: {
		category: 'api',
		summary: __(
			'Amazon SES — IAM access key, secret, and region.',
			'doublescale'
		),
		accountSetupDescription: __(
			'SES requires a friendly account name when creating the stored credential. After saving, verify identities and sending limits in the AWS console for this region.',
			'doublescale'
		),
		accountNameHint: __(
			'Required for Amazon SES — stored with the credential in the provider vault.',
			'doublescale'
		),
		docLabel: __('Amazon SES documentation', 'doublescale'),
		docUrl: 'https://docs.aws.amazon.com/ses/',
	},
	gmail: {
		category: 'oauth',
		summary: __(
			'Gmail — OAuth 2.0; authorize a mailbox in wp-admin.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Register a Google Cloud OAuth client, paste client ID and secret here, save them, then authorize. When the popup completes, pick the mailbox from the provider account list.',
			'doublescale'
		),
		docLabel: __('Google OAuth 2.0', 'doublescale'),
		docUrl: 'https://developers.google.com/identity/protocols/oauth2',
	},
	postmark: {
		category: 'api',
		summary: __(
			'Postmark — server API token and optional message stream.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Use a Server API token from Postmark. You can store one account per server or reuse a token across connections.',
			'doublescale'
		),
		docLabel: __('Postmark API', 'doublescale'),
		docUrl: 'https://postmarkapp.com/developer',
	},
	sendinblue: {
		category: 'api',
		summary: __(
			'Brevo (Sendinblue) — v3 API key and optional sending domain.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Generate an SMTP & API key in Brevo. Each key (and optional domain hint) can be its own stored provider account.',
			'doublescale'
		),
		docLabel: __('Brevo API', 'doublescale'),
		docUrl: 'https://developers.brevo.com/',
	},
	loops: {
		category: 'api',
		summary: __(
			'Loops — API key plus transactional template ID.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Create a Loops API key and the transactional ID from your Loops workspace, then save as a new provider account.',
			'doublescale'
		),
		docLabel: __('Loops API', 'doublescale'),
		docUrl: 'https://loops.so/docs',
	},
	mailersend: {
		category: 'api',
		summary: __('MailerSend — bearer API token.', 'doublescale'),
		accountSetupDescription: __(
			'Use a token from MailerSend with email-sending scope. Store one account per token or reuse an existing account.',
			'doublescale'
		),
		docLabel: __('MailerSend API', 'doublescale'),
		docUrl: 'https://developers.mailersend.com/',
	},
	mailjet: {
		category: 'api',
		summary: __('Mailjet — API key and secret key pair.', 'doublescale'),
		accountSetupDescription: __(
			'Both keys are required for each stored Mailjet account. Add a new pair or select a saved account.',
			'doublescale'
		),
		docLabel: __('Mailjet REST API', 'doublescale'),
		docUrl: 'https://dev.mailjet.com/',
	},
	mandrill: {
		category: 'api',
		summary: __(
			'Mandrill (Mailchimp) — transactional API key.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Use your Mandrill API key from Mailchimp Transactional. One stored account per key is typical.',
			'doublescale'
		),
		docLabel: __('Mandrill API docs', 'doublescale'),
		docUrl: 'https://mailchimp.com/developer/transactional/api/messages/',
	},
	sparkpost: {
		category: 'api',
		summary: __('SparkPost — API key and EU/US region.', 'doublescale'),
		accountSetupDescription: __(
			'Match the API key to the correct SparkPost region. Create separate stored accounts if you send from both.',
			'doublescale'
		),
		docLabel: __('SparkPost API', 'doublescale'),
		docUrl: 'https://developers.sparkpost.com/api/',
	},
	sendlayer: {
		category: 'api',
		summary: __('SendLayer — API key.', 'doublescale'),
		accountSetupDescription: __(
			'Paste your SendLayer API key to create a new provider account or pick one already in the vault.',
			'doublescale'
		),
		docLabel: __('SendLayer', 'doublescale'),
		docUrl: 'https://sendlayer.com/docs/',
	},
	smtp2go: {
		category: 'api',
		summary: __('SMTP2GO — REST API key.', 'doublescale'),
		accountSetupDescription: __(
			'Create an API key in SMTP2GO and store it here. Reuse the same stored account on multiple connections if needed.',
			'doublescale'
		),
		docLabel: __('SMTP2GO API', 'doublescale'),
		docUrl: 'https://developers.smtp2go.com/',
	},
	smtpcom: {
		category: 'api',
		summary: __(
			'SMTP.com — API key and sender display name.',
			'doublescale'
		),
		accountSetupDescription: __(
			'SMTP.com expects both an API key and a sender name label for the account. Enter both when creating a new stored account.',
			'doublescale'
		),
		docLabel: __('SMTP.com API', 'doublescale'),
		docUrl: 'https://www.smtp.com/api/',
	},
	elasticemail: {
		category: 'api',
		summary: __('Elastic Email — API key.', 'doublescale'),
		accountSetupDescription: __(
			'Use an Elastic Email API key with sending permissions. Store each key as its own provider account.',
			'doublescale'
		),
		docLabel: __('Elastic Email API', 'doublescale'),
		docUrl: 'https://elasticemail.com/resources/developer/',
	},
	outlook: {
		category: 'oauth',
		summary: __(
			'Microsoft 365 / Outlook — OAuth in wp-admin.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Register an app in Microsoft Entra (Azure AD), paste client ID and secret, save, then authorize. Choose the authorized mailbox from the list.',
			'doublescale'
		),
		docLabel: __('Microsoft identity platform', 'doublescale'),
		docUrl: 'https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app',
	},
	zoho: {
		category: 'oauth',
		summary: __(
			'Zoho Mail — OAuth; pick your Zoho data center.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Choose the correct Zoho domain, enter OAuth client credentials, save, then authorize in wp-admin and select the Zoho mailbox account.',
			'doublescale'
		),
		docLabel: __('Zoho Mail API', 'doublescale'),
		docUrl: 'https://www.zoho.com/mail/help/dev-platform.html',
	},
	socketlabs: {
		category: 'api',
		summary: __(
			'SocketLabs — API key and numeric server ID.',
			'doublescale'
		),
		accountSetupDescription: __(
			'Both values come from the SocketLabs control panel. Store them together as one provider account per server.',
			'doublescale'
		),
		docLabel: __('SocketLabs injection API', 'doublescale'),
		docUrl: 'https://www.socketlabs.com/docs/',
	},
};

const SMTP_MAILER_UI_FALLBACK: SmtpMailerUiMeta = {
	category: 'api',
	summary: __(
		'Transactional email API — credentials stored per provider account.',
		'doublescale'
	),
	accountSetupDescription: __(
		'Choose an existing stored account or create a new one with the credential fields below.',
		'doublescale'
	),
};

export function getSmtpMailerUiMeta(mailer: string): SmtpMailerUiMeta {
	return SMTP_MAILER_UI_META[mailer] ?? SMTP_MAILER_UI_FALLBACK;
}

export function getSmtpMailerOptionLabel(mailer: string): string {
	const o = SMTP_MAILER_OPTIONS.find((x) => x.value === mailer);
	return o?.label ?? mailer;
}

export type MailerFieldType =
	| 'text'
	| 'password'
	| 'select'
	| 'toggle'
	| 'number';

export type MailerFieldOption = { value: string; label: string };

export type MailerField = {
	key: string;
	label: string;
	type: MailerFieldType;
	required?: boolean;
	options?: MailerFieldOption[];
	help?: string;
};

/** AWS SES regions (aligned with SMTP provider list). */
export const AWS_SES_REGION_OPTIONS: MailerFieldOption[] = [
	{ value: 'us-east-2', label: 'US East (Ohio)' },
	{ value: 'us-east-1', label: 'US East (N. Virginia)' },
	{ value: 'us-west-1', label: 'US West (N. California)' },
	{ value: 'us-west-2', label: 'US West (Oregon)' },
	{ value: 'af-south-1', label: 'Africa (Cape Town)' },
	{ value: 'ap-southeast-3', label: 'Asia Pacific (Jakarta)' },
	{ value: 'ap-south-2', label: 'Asia Pacific (Hyderabad)' },
	{ value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
	{ value: 'ap-northeast-3', label: 'Asia Pacific (Osaka)' },
	{ value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
	{ value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
	{ value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
	{ value: 'ap-southeast-4', label: 'Asia Pacific (Melbourne)' },
	{ value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
	{ value: 'ca-central-1', label: 'Canada (Central)' },
	{ value: 'ca-west-1', label: 'Canada West (Calgary)' },
	{ value: 'eu-central-1', label: 'Europe (Frankfurt)' },
	{ value: 'eu-central-2', label: 'Europe (Zurich)' },
	{ value: 'eu-west-1', label: 'Europe (Ireland)' },
	{ value: 'eu-west-2', label: 'Europe (London)' },
	{ value: 'eu-south-1', label: 'Europe (Milan)' },
	{ value: 'eu-south-2', label: 'Europe (Spain)' },
	{ value: 'eu-west-3', label: 'Europe (Paris)' },
	{ value: 'eu-north-1', label: 'Europe (Stockholm)' },
	{ value: 'il-central-1', label: 'Israel (Tel Aviv)' },
	{ value: 'me-south-1', label: 'Middle East (Bahrain)' },
	{ value: 'me-central-1', label: 'Middle East (UAE)' },
	{ value: 'sa-east-1', label: 'South America (São Paulo)' },
	{ value: 'us-gov-west-1', label: 'AWS GovCloud (US)' },
];

const MAILGUN_REGION_OPTIONS: MailerFieldOption[] = [
	{ value: 'us', label: __('US', 'doublescale') },
	{ value: 'eu', label: __('EU', 'doublescale') },
];

const SPARKPOST_REGION_OPTIONS: MailerFieldOption[] = [
	{ value: 'us', label: __('US', 'doublescale') },
	{ value: 'eu', label: __('EU', 'doublescale') },
];

/**
 * Credential fields per mailer slug (keys must match PHP `credentials` in Accounts::init_account_api).
 * OAuth mailers (gmail, outlook, zoho) and phpmailer are omitted — handled separately in the UI.
 * SMTP relay uses the dedicated host/port block; credentials are built when saving.
 */
export const MAILER_CREDENTIAL_FIELDS: Record<string, MailerField[]> = {
	sendgrid: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'sending_domain',
			label: __('Sending domain (optional)', 'doublescale'),
			type: 'text',
			required: false,
		},
	],
	mailgun: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'domain_name',
			label: __('Domain name', 'doublescale'),
			type: 'text',
			required: true,
		},
		{
			key: 'region',
			label: __('Region', 'doublescale'),
			type: 'select',
			required: true,
			options: MAILGUN_REGION_OPTIONS,
		},
	],
	postmark: [
		{
			key: 'api_key',
			label: __('Server API token', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'message_stream_id',
			label: __('Message stream ID (optional)', 'doublescale'),
			type: 'text',
			required: false,
		},
	],
	sendinblue: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'sending_domain',
			label: __('Sending domain (optional)', 'doublescale'),
			type: 'text',
			required: false,
		},
	],
	loops: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'transactional_id',
			label: __('Transactional ID', 'doublescale'),
			type: 'text',
			required: true,
		},
	],
	mailersend: [
		{
			key: 'api_token',
			label: __('API token', 'doublescale'),
			type: 'password',
			required: true,
		},
	],
	mailjet: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'secret_key',
			label: __('Secret key', 'doublescale'),
			type: 'password',
			required: true,
		},
	],
	smtp2go: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
	],
	smtpcom: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'sender_name',
			label: __('Sender name', 'doublescale'),
			type: 'text',
			required: true,
		},
	],
	sendlayer: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
	],
	sparkpost: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'region',
			label: __('Region', 'doublescale'),
			type: 'select',
			required: true,
			options: SPARKPOST_REGION_OPTIONS,
		},
	],
	elasticemail: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
	],
	mandrill: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
	],
	socketlabs: [
		{
			key: 'api_key',
			label: __('API key', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'server_id',
			label: __('Server ID', 'doublescale'),
			type: 'text',
			required: true,
		},
	],
	aws: [
		{
			key: 'access_key',
			label: __('Access key ID', 'doublescale'),
			type: 'text',
			required: true,
		},
		{
			key: 'secret_key',
			label: __('Secret access key', 'doublescale'),
			type: 'password',
			required: true,
		},
		{
			key: 'region',
			label: __('Region', 'doublescale'),
			type: 'select',
			required: true,
			options: AWS_SES_REGION_OPTIONS,
		},
	],
};

export const ZOHO_REGION_OPTIONS: MailerFieldOption[] = [
	{ value: 'com', label: 'zoho.com' },
	{ value: 'eu', label: 'zoho.eu' },
	{ value: 'in', label: 'zoho.in' },
	{ value: 'com.cn', label: 'zoho.com.cn' },
	{ value: 'com.au', label: 'zoho.com.au' },
	{ value: 'jp', label: 'zoho.jp' },
];

/** OAuth app fields (stored via smtp mailer settings, not accounts/credentials). */
export const OAUTH_APP_FIELDS: Record<
	'gmail' | 'outlook' | 'zoho',
	MailerField[]
> = {
	gmail: [
		{
			key: 'client_id',
			label: __('Client ID', 'doublescale'),
			type: 'text',
			required: true,
		},
		{
			key: 'client_secret',
			label: __('Client secret', 'doublescale'),
			type: 'password',
			required: true,
		},
	],
	outlook: [
		{
			key: 'client_id',
			label: __('Client ID', 'doublescale'),
			type: 'text',
			required: true,
		},
		{
			key: 'client_secret',
			label: __('Client secret', 'doublescale'),
			type: 'password',
			required: true,
		},
	],
	zoho: [
		{
			key: 'region',
			label: __('Zoho domain', 'doublescale'),
			type: 'select',
			required: true,
			options: ZOHO_REGION_OPTIONS,
		},
		{
			key: 'client_id',
			label: __('Client ID', 'doublescale'),
			type: 'text',
			required: true,
		},
		{
			key: 'client_secret',
			label: __('Client secret', 'doublescale'),
			type: 'password',
			required: true,
		},
	],
};

export function getMailerCredentialFields(
	mailer: string
): MailerField[] | undefined {
	return MAILER_CREDENTIAL_FIELDS[mailer];
}

/** Empty credential object with sensible select defaults (for new connections / mailer switch). */
export function defaultCredentialsForMailer(
	mailer: string
): Record<string, string> {
	const fields = getMailerCredentialFields(mailer);
	if (!fields) {
		return {};
	}
	const out: Record<string, string> = {};
	for (const f of fields) {
		if (f.type === 'select' && f.options?.length) {
			if (mailer === 'aws' && f.key === 'region') {
				out[f.key] = 'us-east-1';
			} else {
				out[f.key] = f.options[0].value;
			}
		} else {
			out[f.key] = '';
		}
	}
	return out;
}

export function getOAuthAppFields(mailer: string): MailerField[] | undefined {
	if (mailer === 'gmail' || mailer === 'outlook' || mailer === 'zoho') {
		return OAUTH_APP_FIELDS[mailer];
	}
	return undefined;
}
