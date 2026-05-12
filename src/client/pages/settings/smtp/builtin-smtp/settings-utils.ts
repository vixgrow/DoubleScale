/**
 * Pure helpers for built-in SMTP settings (no React). Keeps the main screen lean and testable.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	defaultCredentialsForMailer,
	getMailerCredentialFields,
	getOAuthAppFields,
	isSmtpOAuthMailer,
} from '../mailer-options';
import type { SmtpConnection, SmtpOAuthApp } from '../types';
import config from '@doublescale/config';

/**
 * Expand REST / api-fetch errors into lines for the connection-save feedback modal.
 */
export function restErrorToDetailLines(err: unknown): string[] {
	const lines: string[] = [];
	if (typeof err === 'string' && err.trim()) {
		return [err.trim()];
	}
	if (err instanceof Error && err.message.trim()) {
		lines.push(err.message.trim());
	}
	if (err && typeof err === 'object') {
		const o = err as Record<string, unknown>;
		const msg = typeof o.message === 'string' ? o.message.trim() : '';
		if (msg && !lines.includes(msg)) {
			lines.unshift(msg);
		}
		const code = typeof o.code === 'string' ? o.code.trim() : '';
		if (code) {
			lines.push(sprintf(__('REST error code: %s', 'doublescale'), code));
		}
		const data = o.data as Record<string, unknown> | undefined;
		if (data && typeof data === 'object') {
			if (typeof data.status === 'number') {
				lines.push(
					sprintf(
						__('HTTP status: %s', 'doublescale'),
						String(data.status)
					)
				);
			}
			const dm =
				typeof data.message === 'string' ? data.message.trim() : '';
			if (dm && !lines.includes(dm)) {
				lines.push(dm);
			}
			if (data.details !== undefined && data.details !== null) {
				const d = data.details;
				if (typeof d === 'string' && d.trim()) {
					lines.push(d.trim());
				} else {
					try {
						lines.push(JSON.stringify(d, null, 2));
					} catch {
						lines.push(String(d));
					}
				}
			}
			if (data.params && typeof data.params === 'object') {
				try {
					lines.push(
						`${__('Validation parameters:', 'doublescale')}\n${JSON.stringify(
							data.params,
							null,
							2
						)}`
					);
				} catch {
					/* noop */
				}
			}
			if (data.errors && typeof data.errors === 'object') {
				try {
					lines.push(
						`${__('REST field errors:', 'doublescale')}\n${JSON.stringify(
							data.errors,
							null,
							2
						)}`
					);
				} catch {
					lines.push(String(data.errors));
				}
			}
		}
	}
	if (lines.length === 0) {
		lines.push(__('An unknown error occurred.', 'doublescale'));
	}
	return lines;
}

/** Aligns with PHP App::maybe_authorize() admin.php query args (SMTP-compatible). */
export function oauthAdminAuthorizeUrl(mailerSlug: string): string | null {
	if (
		mailerSlug !== 'gmail' &&
		mailerSlug !== 'outlook' &&
		mailerSlug !== 'zoho'
	) {
		return null;
	}
	const param =
		mailerSlug === 'gmail'
			? 'smtp-gmail=authorize'
			: mailerSlug === 'outlook'
				? 'smtp-outlook=authorize'
				: 'smtp-zoho=authorize';
	const candidates: string[] = [];
	const cfg = config as { adminUrl?: string };
	const cfgAdmin = String(cfg.adminUrl ?? '').trim();
	if (cfgAdmin) {
		candidates.push(cfgAdmin);
	}
	if (typeof window !== 'undefined' && window.location?.href) {
		candidates.push(window.location.href);
	}
	for (const baseCandidate of candidates) {
		try {
			const baseStr = baseCandidate.endsWith('/')
				? baseCandidate
				: baseCandidate.replace(/[^/]*$/, '');
			const url = new URL(`admin.php?${param}`, baseStr);
			if (url.protocol.startsWith('http')) {
				return url.toString();
			}
		} catch {
			continue;
		}
	}
	return null;
}

export const emptyConnection = (): SmtpConnection => ({
	mailer: 'smtp',
	connection_name: '',
	account_id: '',
	account_name: '',
	from_email: '',
	from_name: '',
	force_from_email: false,
	force_from_name: false,
	host: '',
	port: '587',
	encryption: 'tls',
	auth: true,
	user: '',
	pass: '',
	api_key: '',
	credentials: {},
	oauth_app: {
		client_id: '',
		client_secret: '',
		region: 'com',
	},
});

export function migrateConnectionForm(c: SmtpConnection): SmtpConnection {
	const mailer = c.mailer || 'smtp';
	const merged: SmtpConnection = { ...emptyConnection(), ...c, mailer };
	const fields = getMailerCredentialFields(mailer);
	let creds: Record<string, unknown> =
		merged.credentials && typeof merged.credentials === 'object'
			? { ...merged.credentials }
			: {};
	if (fields?.length) {
		creds = { ...defaultCredentialsForMailer(mailer), ...creds };
		if (typeof merged.api_key === 'string' && merged.api_key) {
			if (mailer === 'mailersend') {
				creds.api_token = creds.api_token || merged.api_key;
			} else if (!creds.api_key) {
				creds.api_key = merged.api_key;
			}
		}
	}
	const oauth_app: SmtpOAuthApp = {
		client_id: merged.oauth_app?.client_id || '',
		client_secret: merged.oauth_app?.client_secret || '',
		region: merged.oauth_app?.region || 'com',
	};
	const legacyName =
		typeof (merged as { name?: unknown }).name === 'string'
			? String((merged as { name?: unknown }).name || '').trim()
			: '';
	return {
		...merged,
		credentials: creds,
		oauth_app,
		account_name: merged.account_name || '',
		connection_name:
			String(merged.connection_name || '').trim() || legacyName || '',
	};
}

/** Human-readable row label for tables and selects (still keyed by connection id in data). */
export function getConnectionDisplayLabel(
	conn: SmtpConnection | undefined,
	connectionId: string
): string {
	if (!conn) {
		return connectionId;
	}
	const legacy = conn as unknown as { name?: unknown };
	const legacyName =
		typeof legacy.name === 'string' ? String(legacy.name || '').trim() : '';
	const friendly = String(conn.connection_name || legacyName).trim();
	if (friendly) {
		return friendly;
	}
	const label = String(conn.account_name || '').trim();
	if (label) {
		return label;
	}
	const fromName = String(conn.from_name || '').trim();
	if (fromName) {
		return fromName;
	}
	const fromEmail = String(conn.from_email || '').trim();
	if (fromEmail) {
		return fromEmail;
	}
	return connectionId;
}

/**
 * Merge GET …/mailers/{slug}/accounts/{id} payload into the wizard form so Edit shows vault-backed secrets (AWS keys, SMTP password, etc.).
 */
export function mergeVaultAccountIntoForm(
	form: SmtpConnection,
	account: { name?: string; credentials?: Record<string, unknown> },
	mailerSlug: string
): SmtpConnection {
	const name = String(account.name || '').trim();
	const raw = account.credentials;
	const creds =
		raw && typeof raw === 'object' && !Array.isArray(raw)
			? { ...(raw as Record<string, unknown>) }
			: {};
	const mergedCredentials: Record<string, unknown> = {
		...defaultCredentialsForMailer(mailerSlug),
		...((form.credentials || {}) as Record<string, unknown>),
		...creds,
	};
	const next: SmtpConnection = {
		...form,
		account_name: name || form.account_name || '',
		credentials: mergedCredentials,
	};
	if (mailerSlug === 'smtp') {
		const c = mergedCredentials;
		return {
			...next,
			host: String(c.smtp_host ?? next.host ?? ''),
			port:
				c.smtp_port !== undefined && c.smtp_port !== null
					? String(c.smtp_port)
					: String(next.port ?? ''),
			encryption: String(c.encryption ?? next.encryption ?? 'tls'),
			auth: Boolean(c.authentication ?? next.auth),
			user: String(c.username ?? next.user ?? ''),
			pass: String(c.password ?? next.pass ?? ''),
		};
	}
	return next;
}

/** Parsed mailer account row (list API may include credentials for hydrating the edit form). */
export type MailerAccountRowMeta = {
	name?: string;
	credentials?: Record<string, unknown>;
};

/**
 * When picking a row in “All accounts”, merge the list API row into the form so the
 * right-hand credential fields show that account (and Edit still works if it was already selected).
 */
export function applyMailerAccountRowToForm(
	form: SmtpConnection,
	accountId: string,
	meta: MailerAccountRowMeta,
	mailerSlug: string
): SmtpConnection {
	return mergeVaultAccountIntoForm(
		{ ...form, account_id: accountId },
		meta,
		mailerSlug
	);
}

/** Select value: create new provider account with the credentials in this form. */
export const NEW_MAILER_ACCOUNT = '__new_mailer_account__';

export function parseMailerAccountsResponse(
	raw: unknown
): Record<string, MailerAccountRowMeta> {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return {};
	}
	const out: Record<string, MailerAccountRowMeta> = {};
	for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
		if (val && typeof val === 'object' && !Array.isArray(val)) {
			const v = val as { name?: unknown; credentials?: unknown };
			const name = v.name;
			const row: MailerAccountRowMeta = {
				name: typeof name === 'string' ? name : undefined,
			};
			const creds = v.credentials;
			if (creds && typeof creds === 'object' && !Array.isArray(creds)) {
				row.credentials = creds as Record<string, unknown>;
			}
			out[id] = row;
		}
	}
	return out;
}

export function getProviderAccountBinding(
	slug: string,
	accountId: string,
	bucket: Record<string, MailerAccountRowMeta> | undefined
): string {
	if (slug === 'phpmailer' || !bucket || Object.keys(bucket).length === 0) {
		return NEW_MAILER_ACCOUNT;
	}
	const aid = String(accountId || '').trim();
	if (aid && bucket[aid]) {
		return aid;
	}
	return NEW_MAILER_ACCOUNT;
}

export function mailerAccountSelectLabel(
	id: string,
	meta?: MailerAccountRowMeta
): string {
	const n = String(meta?.name || '').trim();
	return n || id;
}

/** Two-letter badge for provider cards in the mailer picker. */
export function mailerInitialsFromLabel(label: string): string {
	const cleaned = label.replace(/\s+/g, ' ').trim();
	const words = cleaned.split(' ').filter(Boolean);
	if (words.length >= 2) {
		const a = words[0][0] || '';
		const b = words[1][0] || '';
		return (a + b).toUpperCase();
	}
	return cleaned.slice(0, 2).toUpperCase();
}

export function buildSmtpCredentialsForRest(
	form: SmtpConnection
): Record<string, unknown> {
	const portRaw = form.port === '' ? '587' : String(form.port ?? '587');
	const portNum = Number(portRaw);
	return {
		smtp_host: String(form.host || '').trim(),
		smtp_port: Number.isFinite(portNum) ? portNum : portRaw,
		encryption: String(form.encryption || 'tls'),
		auto_tls:
			typeof form.credentials?.auto_tls === 'boolean'
				? form.credentials.auto_tls
				: true,
		authentication: Boolean(form.auth),
		username: String(form.user || ''),
		password: String(form.pass || ''),
	};
}

export function normalizeApiCredentials(
	slug: string,
	raw: Record<string, unknown>
): Record<string, unknown> {
	const out = { ...raw };
	if (slug === 'mailgun' && !String(out.region || '').trim()) {
		out.region = 'us';
	}
	if (slug === 'sparkpost' && !String(out.region || '').trim()) {
		out.region = 'us';
	}
	return out;
}

export function validateConnectionForm(
	form: SmtpConnection,
	opts?: { reuseStoredProviderAccount?: boolean }
): string | null {
	const mailer = form.mailer || 'smtp';
	if (mailer === 'phpmailer') {
		return null;
	}
	if (isSmtpOAuthMailer(mailer)) {
		const fields = getOAuthAppFields(mailer);
		const app = form.oauth_app || {};
		for (const f of fields || []) {
			const v = String(
				(app as Record<string, unknown>)[f.key] ?? ''
			).trim();
			if (f.required && !v) {
				return __(
					'Please complete all required OAuth app fields.',
					'doublescale'
				);
			}
		}
		return null;
	}
	if (opts?.reuseStoredProviderAccount) {
		return null;
	}
	if (mailer === 'smtp') {
		if (!String(form.host || '').trim()) {
			return __('SMTP host is required.', 'doublescale');
		}
		if (!String(form.port ?? '').trim()) {
			return __('SMTP port is required.', 'doublescale');
		}
		if (form.auth) {
			if (!String(form.user || '').trim()) {
				return __(
					'SMTP username is required when authentication is enabled.',
					'doublescale'
				);
			}
			if (!String(form.pass || '').trim()) {
				return __(
					'SMTP password is required when authentication is enabled.',
					'doublescale'
				);
			}
		}
		return null;
	}
	const fields = getMailerCredentialFields(mailer);
	for (const f of fields || []) {
		if (f.required) {
			const v = String((form.credentials || {})[f.key] ?? '').trim();
			if (!v) {
				return __(
					'Please fill all required provider credentials.',
					'doublescale'
				);
			}
		}
	}
	if (mailer === 'aws') {
		const name = String(form.account_name || form.from_name || '').trim();
		if (!name) {
			return __(
				'Account name or From name is required for Amazon SES.',
				'doublescale'
			);
		}
	}
	return null;
}

export function formatConnectionDate(connection: SmtpConnection): string {
	const raw = String(
		(connection as Record<string, unknown>).created_at ??
			(connection as Record<string, unknown>).created_date ??
			(connection as Record<string, unknown>).created ??
			(connection as Record<string, unknown>).updated_at ??
			''
	).trim();
	if (!raw) return '—';

	const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
	const d = new Date(normalized);
	if (Number.isNaN(d.getTime())) return raw;

	const day = String(d.getDate()).padStart(2, '0');
	const month = d.toLocaleString('en-US', { month: 'short' });
	const year = d.getFullYear();
	const h24 = d.getHours();
	const h12 = h24 % 12 || 12;
	const min = String(d.getMinutes()).padStart(2, '0');
	const period = h24 >= 12 ? 'pm' : 'am';
	return `${day} ${month}, ${year} - ${h12}:${min} ${period}`;
}
