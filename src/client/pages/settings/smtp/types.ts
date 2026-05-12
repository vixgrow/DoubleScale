/**
 * SMTP module settings payload (matches REST /doublescale/v1/smtp/settings).
 */
export type SmtpOAuthApp = {
	client_id?: string;
	client_secret?: string;
	/** Zoho only — matches PHP mailer app settings. */
	region?: string;
};

export type SmtpConnection = {
	mailer: string;
	/** Friendly label for this connection in lists (wizard step 1); optional legacy `name` key supported. */
	connection_name?: string;
	/** Display name sent to provider account REST as `name` (e.g. AWS requires it). */
	account_name?: string;
	account_id: string;
	from_email?: string;
	from_name?: string;
	force_from_email?: boolean;
	force_from_name?: boolean;
	host?: string;
	port?: string | number;
	encryption?: string;
	auth?: boolean;
	user?: string;
	pass?: string;
	/** @deprecated Prefer `credentials`; kept for older saved connections. */
	api_key?: string;
	/** Provider-specific secrets/params; keys match PHP `credentials` array. */
	credentials?: Record<string, unknown>;
	/** OAuth app registration (Gmail / Outlook / Zoho); saved via smtp settings endpoint. */
	oauth_app?: SmtpOAuthApp;
	[key: string]: unknown;
};

export type SmtpSettingsPayload = {
	default_connection?: string;
	fallback_connection?: string;
	connections?: Record<string, SmtpConnection>;
	disable_summary_email?: boolean;
};

/**
 * One row from REST `prepare_log` (bundled SMTP email log).
 */
export type EmailLogRow = {
	log_id?: number;
	subject?: string;
	status?: string;
	/** GMT stored value from DB (when present). */
	datetime?: string;
	local_datetime?: string;
	timestamp?: string;
	from?: string;
	connection_id?: string;
	connection_name?: string;
	provider?: string;
	provider_name?: string;
	account_id?: string;
	account_name?: string;
	/** Provider / API error detail (unserialized from log row). */
	response?: string | Record<string, unknown> | unknown[];
	recipients?: string | string[] | Record<string, unknown> | unknown;
	headers?: string | Record<string, unknown> | unknown[];
	attachments?: unknown;
	body?: string;
	initiator_name?: string;
	initiator_slug?: string;
	initiator_type?: string;
	context?: string | Record<string, unknown> | unknown[];
	/** Human-readable CRM source (campaign / email sequence) when present. */
	source_label?: string;
	/** Admin URL to open campaign or email sequence in DoubleScale. */
	source_link?: string;
	resend_count?: number | string;
	[key: string]: unknown;
};
