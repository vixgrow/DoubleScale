/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

const SETTINGS_PATH = '/doublescale/v1/smtp/settings';
const EMAIL_LOG_PATH = '/doublescale/v1/smtp/email-log';
const EMAIL_LOG_MUTATION_PATH = `${EMAIL_LOG_PATH}/mutation`;
const SEND_TEST_PATH = '/doublescale/v1/smtp/send-test';
const ALERTS_TEST_PATH = '/doublescale/v1/smtp/alerts/test';

/** Mailer-specific settings (OAuth app, etc.) — registered under `smtp/v1` in PHP. */
const mailerSettingsPath = (slug: string) =>
	`/smtp/v1/mailers/${encodeURIComponent(slug)}/settings`;

const mailerFromEmailsPath = (slug: string, accountId: string) =>
	`${mailerSettingsPath(slug)}/${encodeURIComponent(accountId)}/from-emails`;

/** Mailers that expose `GET .../settings/{accountId}/from-emails` (Gmail profile, Zoho senders, Elastic account). */
const MAILERS_WITH_FROM_EMAIL_ENDPOINT = new Set([
	'gmail',
	'zoho',
	'elasticemail',
]);

export type MailerFromEmailOption = { value: string; label: string };

export function mailerUsesFetchedFromEmails(slug: string): boolean {
	return MAILERS_WITH_FROM_EMAIL_ENDPOINT.has(
		String(slug || '').toLowerCase()
	);
}

/**
 * List From addresses for a stored provider account (OAuth / API mailers).
 * REST: GET /smtp/v1/mailers/{slug}/settings/{accountId}/from-emails
 */
export async function fetchMailerFromEmails(
	slug: string,
	accountId: string
): Promise<{ success: boolean; options: MailerFromEmailOption[] }> {
	const res = await apiFetch<{
		success?: boolean;
		options?: MailerFromEmailOption[];
	}>({
		path: mailerFromEmailsPath(slug, accountId),
		method: 'GET',
	});
	return {
		success: Boolean(res?.success),
		options: Array.isArray(res?.options) ? res.options : [],
	};
}

const mailerAccountsPath = (slug: string) =>
	`/doublescale/v1/smtp/mailers/${encodeURIComponent(slug)}/accounts`;

const mailerAccountItemPath = (slug: string, accountId: string) =>
	`${mailerAccountsPath(slug)}/${encodeURIComponent(accountId)}`;

/** Human-readable message from WP REST / api-fetch errors. */
function getRestErrorMessage(error: unknown, fallback: string): string {
	if (error && typeof error === 'object') {
		const msg = (error as { message?: unknown }).message;
		if (typeof msg === 'string' && msg.trim()) {
			return msg.trim();
		}
	}
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
}

export async function fetchSmtpSettings(): Promise<Record<string, unknown>> {
	return apiFetch<Record<string, unknown>>({ path: SETTINGS_PATH });
}

export async function saveSmtpSettings(
	data: Record<string, unknown>
): Promise<{ success?: boolean }> {
	try {
		return await apiFetch({
			path: SETTINGS_PATH,
			method: 'POST',
			data,
		});
	} catch (e: unknown) {
		throw new Error(
			getRestErrorMessage(e, __('Could not save SMTP settings.', 'doublescale'))
		);
	}
}

/**
 * Create or update a mailer account (credentials stored for `account_id`).
 */
export async function saveMailerAccount(
	slug: string,
	accountId: string,
	name: string,
	credentials: Record<string, unknown>
): Promise<{ id?: string; name?: string }> {
	return apiFetch({
		path: mailerAccountsPath(slug),
		method: 'POST',
		data: {
			id: accountId,
			name,
			credentials,
		},
	});
}

/** Response from GET …/smtp/mailers/{slug}/accounts — account id → metadata (same shape as SMTP). */
export type MailerAccountsMap = Record<
	string,
	{ name?: string;[key: string]: unknown }
>;

/**
 * List provider accounts stored for a mailer (credentials may be present server-side;
 * UI should only display id / name).
 */
export async function fetchMailerAccounts(
	slug: string
): Promise<MailerAccountsMap> {
	return apiFetch<MailerAccountsMap>({
		path: mailerAccountsPath(slug),
	});
}

/**
 * Remove one stored provider account (vault entry) for a mailer.
 * REST: DELETE /doublescale/v1/smtp/mailers/{slug}/accounts/{id}
 */
export async function deleteMailerAccount(
	slug: string,
	accountId: string
): Promise<unknown> {
	try {
		return await apiFetch({
			path: mailerAccountItemPath(slug, accountId),
			method: 'DELETE',
		});
	} catch (e: unknown) {
		throw new Error(
			getRestErrorMessage(
				e,
				__('Could not delete this provider account.', 'doublescale')
			)
		);
	}
}

export type MailerAppSettingsPayload = {
	client_id: string;
	client_secret: string;
	/** Zoho mailer only */
	region?: string;
};

/**
 * Save OAuth app credentials (client id/secret) for Gmail, Outlook, or Zoho.
 */
export async function saveMailerAppSettings(
	slug: string,
	app: MailerAppSettingsPayload
): Promise<{ success?: boolean }> {
	const appPayload: Record<string, string> = {
		client_id: app.client_id,
		client_secret: app.client_secret,
	};
	if (slug === 'zoho') {
		appPayload.region = app.region && app.region.trim() ? app.region : 'com';
	}
	return apiFetch({
		path: mailerSettingsPath(slug),
		method: 'POST',
		data: { app: appPayload },
	});
}

export async function fetchSmtpEmailLogs(params: {
	page?: number;
	per_page?: number;
	status?: string;
	search?: string;
	/** Local calendar day, `Y-m-d` — paired with `end_date` for GMT range filter */
	start_date?: string;
	end_date?: string;
}): Promise<{
	items?: unknown[];
	total_items?: number;
	total_pages?: number;
	page?: number;
	per_page?: number;
}> {
	const q = new URLSearchParams();
	if (params.page != null) {
		q.set('page', String(params.page));
	}
	if (params.per_page != null) {
		q.set('per_page', String(params.per_page));
	}
	if (params.status) {
		q.set('status', params.status);
	}
	if (params.search) {
		q.set('search', params.search);
	}
	if (params.start_date) {
		q.set('start_date', params.start_date);
	}
	if (params.end_date) {
		q.set('end_date', params.end_date);
	}
	const suffix = q.toString() ? `?${q.toString()}` : '';
	return apiFetch({ path: `${EMAIL_LOG_PATH}${suffix}` });
}

type EmailLogMutationPayload =
	| { op: 'delete_one'; log_id: number }
	| { op: 'delete_many'; ids: number[] }
	| { op: 'flush' };

/**
 * SMTP log deletes via POST JSON (avoids hosts/CDNs blocking DELETE).
 */
async function postSmtpEmailLogMutation(
	payload: EmailLogMutationPayload
): Promise<{ success?: boolean }> {
	return apiFetch({
		path: EMAIL_LOG_MUTATION_PATH,
		method: 'POST',
		data: payload,
	});
}

/**
 * Remove one SMTP email log row.
 */
export async function deleteSmtpEmailLog(
	logId: number
): Promise<{ success?: boolean }> {
	try {
		return await postSmtpEmailLogMutation({
			op: 'delete_one',
			log_id: logId,
		});
	} catch (e: unknown) {
		throw new Error(
			getRestErrorMessage(
				e,
				__('Could not delete this log entry.', 'doublescale')
			)
		);
	}
}

/**
 * Remove multiple SMTP email log rows (checkbox bulk delete).
 */
export async function deleteSmtpEmailLogsByIds(
	ids: number[]
): Promise<{ success?: boolean }> {
	try {
		return await postSmtpEmailLogMutation({
			op: 'delete_many',
			ids,
		});
	} catch (e: unknown) {
		throw new Error(
			getRestErrorMessage(
				e,
				__('Could not delete selected log entries.', 'doublescale')
			)
		);
	}
}

/**
 * Remove all SMTP email log rows.
 */
export async function flushSmtpEmailLogs(): Promise<{
	success?: boolean;
}> {
	try {
		return await postSmtpEmailLogMutation({ op: 'flush' });
	} catch (e: unknown) {
		throw new Error(
			getRestErrorMessage(
				e,
				__('Could not clear the email log.', 'doublescale')
			)
		);
	}
}

export async function sendSmtpTestEmail(data: {
	email: string;
	connection: string;
	content_type: 'html' | 'plain';
	/** Custom body; omitted or empty uses the server default test copy. */
	message?: string;
}): Promise<{ success?: boolean; message?: string }> {
	return apiFetch({
		path: SEND_TEST_PATH,
		method: 'POST',
		data,
	});
}

export async function testSmtpAlert(data: {
	slug: 'slack' | 'webhook' | 'discord';
	data: string;
}): Promise<{ success?: boolean; message?: string }> {
	return apiFetch({
		path: ALERTS_TEST_PATH,
		method: 'POST',
		data,
	});
}

/* ----------------------------------------------------------------------------
 * Amazon SES identity management (mirrors SMTP /doublescale/v1 behavior).
 * Backend routes: /smtp/v1/mailers/aws/settings/{accountId}/identities
 * -------------------------------------------------------------------------- */

export type AwsIdentity = {
	type: 'email' | 'domain';
	identity: string;
	status: string;
	attributes?: Record<string, unknown>;
	dkim?: {
		DkimEnabled?: boolean;
		DkimTokens?: string[];
		DkimVerificationStatus?: string;
	};
};

const awsIdentitiesPath = (accountId: string) =>
	`/smtp/v1/mailers/aws/settings/${encodeURIComponent(accountId)}/identities`;

const awsResendVerificationPath = (accountId: string) =>
	`/smtp/v1/mailers/aws/settings/${encodeURIComponent(
		accountId
	)}/identities/resend-verification`;

export async function fetchAwsIdentities(
	accountId: string
): Promise<AwsIdentity[]> {
	try {
		const resp = (await apiFetch({
			path: awsIdentitiesPath(accountId),
			method: 'GET',
		})) as AwsIdentity[];
		return Array.isArray(resp) ? resp : [];
	} catch (e: unknown) {
		throw new Error(
			getRestErrorMessage(
				e,
				__('Could not load SES identities.', 'doublescale')
			)
		);
	}
}

export async function addAwsIdentity(
	accountId: string,
	identity: string,
	type: 'email' | 'domain'
): Promise<unknown> {
	try {
		return await apiFetch({
			path: awsIdentitiesPath(accountId),
			method: 'POST',
			data: { identity, type },
		});
	} catch (e: unknown) {
		throw new Error(
			getRestErrorMessage(
				e,
				__('Could not add SES identity.', 'doublescale')
			)
		);
	}
}

export async function deleteAwsIdentity(
	accountId: string,
	identity: string,
	type: 'email' | 'domain'
): Promise<unknown> {
	try {
		return await apiFetch({
			path: awsIdentitiesPath(accountId),
			method: 'DELETE',
			data: { identity, type },
		});
	} catch (e: unknown) {
		throw new Error(
			getRestErrorMessage(
				e,
				__('Could not delete SES identity.', 'doublescale')
			)
		);
	}
}

export async function resendAwsIdentityVerification(
	accountId: string,
	identity: string
): Promise<unknown> {
	try {
		return await apiFetch({
			path: awsResendVerificationPath(accountId),
			method: 'POST',
			data: { identity },
		});
	} catch (e: unknown) {
		throw new Error(
			getRestErrorMessage(
				e,
				__('Could not resend verification email.', 'doublescale')
			)
		);
	}
}
