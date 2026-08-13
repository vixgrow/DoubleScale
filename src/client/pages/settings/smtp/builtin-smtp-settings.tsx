/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { ConnectionWizardDialog } from './builtin-smtp/connection-wizard-dialog';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from '@doublescale/components';
import {
	defaultCredentialsForMailer,
	getMailerCredentialFields,
	getOAuthAppFields,
	getSmtpMailerLogoUrl,
	getSmtpMailerOptionLabel,
	getSmtpMailerUiMeta,
	isSmtpOAuthMailer,
	type MailerField,
	SMTP_MAILER_CATEGORY_LABEL,
	SMTP_MAILER_OPTIONS,
} from './mailer-options';
import {
	deleteMailerAccount,
	fetchMailerAccounts,
	fetchMailerFromEmails,
	fetchSmtpSettings,
	mailerUsesFetchedFromEmails,
	saveMailerAccount,
	saveMailerAppSettings,
	saveSmtpSettings,
	type MailerFromEmailOption,
} from './smtp-api';
import { getConnectionDisplayLabel } from './builtin-smtp/settings-utils';
import { SmtpConnectionsPanel } from './builtin-smtp/smtp-connections-panel';
import type {
	SmtpConnection,
	SmtpOAuthApp,
	SmtpSettingsPayload,
} from './types';
import config from '@doublescale/config';
import { cn } from '@/lib/utils';
import AwsIdentitiesPanel from './aws-identities-panel';
import { SettingsIcon, NoticeBanner } from '@doublescale/components';
import type { NoticeMessage } from '@doublescale/client';

/** Match routing selects + account name (rounded-lg, light border) for API key, From email, etc. */
const SMTP_CONNECTION_INPUT_CLASS =
	'h-10 w-full rounded-lg border border-[#D0D0D0] bg-white text-sm text-[#29292E] shadow-sm placeholder:text-[#6B6C76] focus-visible:border-[#6549CA] focus-visible:ring-2 focus-visible:ring-[#6549CA]/20';

const SMTP_CONNECTION_SELECT_TRIGGER_CLASS =
	'h-10 w-full rounded-lg border border-[#D0D0D0] bg-white text-[#29292E] focus:ring-[#6549CA]/20 focus:border-[#6549CA]';

/**
 * Expand REST / api-fetch errors into lines for the connection-save feedback modal.
 */
function restErrorToDetailLines(err: unknown): string[] {
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
					sprintf(__('HTTP status: %s', 'doublescale'), String(data.status))
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
function oauthAdminAuthorizeUrl(mailerSlug: string): string | null {
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
	const cfgAdmin = String(config.adminUrl ?? '').trim();
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

function resolveFromEmailForSelect(
	current: string | undefined,
	options: MailerFromEmailOption[]
): string {
	if (!options.length) {
		return '';
	}
	const trimmed = String(current ?? '').trim();
	if (trimmed && options.some((o) => o.value === trimmed)) {
		return trimmed;
	}
	return options[0].value;
}

const emptyConnection = (): SmtpConnection => ({
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

function migrateConnectionForm(c: SmtpConnection): SmtpConnection {
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
			? String((merged as { name?: string }).name || '').trim()
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

/**
 * Merge mailer account list row (may include credentials) into the wizard form for Edit.
 */
function mergeVaultAccountIntoForm(
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
	if (mailerSlug === 'mailersend') {
		const tok = mergedCredentials.api_token;
		if (tok !== undefined && tok !== null && String(tok).trim()) {
			return { ...next, api_key: String(tok) };
		}
	}
	const ak = mergedCredentials.api_key;
	if (ak !== undefined && ak !== null && String(ak).trim()) {
		return { ...next, api_key: String(ak) };
	}
	return next;
}

type ApplyStoredRowOpts = { allowToggleOff?: boolean };

/** Clear linked vault account so the right column returns to “add new” credentials. */
function clearVaultAccountSelection(
	form: SmtpConnection,
	mailerSlug: string
): SmtpConnection {
	const cleared: SmtpConnection = {
		...form,
		account_id: '',
		account_name: '',
		credentials: defaultCredentialsForMailer(mailerSlug),
	};
	if (mailerSlug === 'smtp') {
		return {
			...cleared,
			host: '',
			port: '587',
			encryption: 'tls',
			auth: true,
			user: '',
			pass: '',
		};
	}
	return { ...cleared, api_key: '' };
}

/** Select / deselect a vault row and merge credentials into the wizard form. */
function applyStoredAccountRowToForm(
	form: SmtpConnection,
	accId: string,
	meta: MailerAccountRowMeta | undefined,
	mailerSlug: string,
	opts?: ApplyStoredRowOpts
): SmtpConnection {
	const allowToggle = opts?.allowToggleOff !== false;
	const cur = String(form.account_id || '').trim();
	if (allowToggle && cur === accId) {
		return clearVaultAccountSelection(form, mailerSlug);
	}
	return mergeVaultAccountIntoForm(
		{ ...form, account_id: accId },
		meta || {},
		mailerSlug
	);
}

/** Select value: create new provider account with the credentials in this form. */
const NEW_MAILER_ACCOUNT = '__new_mailer_account__';

type MailerAccountRowMeta = {
	name?: string;
	credentials?: Record<string, unknown>;
};

function parseMailerAccountsResponse(
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

function getProviderAccountBinding(
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

function mailerAccountSelectLabel(
	id: string,
	meta?: MailerAccountRowMeta
): string {
	const n = String(meta?.name || '').trim();
	return n || id;
}

/** Two-letter badge for provider cards in the mailer picker. */
function mailerInitialsFromLabel(label: string): string {
	const cleaned = label.replace(/\s+/g, ' ').trim();
	const words = cleaned.split(' ').filter(Boolean);
	if (words.length >= 2) {
		const a = words[0][0] || '';
		const b = words[1][0] || '';
		return (a + b).toUpperCase();
	}
	return cleaned.slice(0, 2).toUpperCase();
}

function buildSmtpCredentialsForRest(
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

function normalizeApiCredentials(
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

function validateConnectionForm(form: SmtpConnection): string | null {
	const mailer = form.mailer || 'smtp';
	if (mailer === 'phpmailer') {
		return null;
	}
	if (isSmtpOAuthMailer(mailer)) {
		const fields = getOAuthAppFields(mailer);
		const app = form.oauth_app || {};
		for (const f of fields || []) {
			const v = String((app as Record<string, unknown>)[f.key] ?? '').trim();
			if (f.required && !v) {
				return __(
					'Please complete all required OAuth app fields.',
					'doublescale'
				);
			}
		}
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

type BuiltinSmtpSettingsProps = {
	addConnectionRef?: { current: (() => void) | null };
	connectionsView: 'table' | 'card';
};

const BuiltinSmtpSettings: React.FC<BuiltinSmtpSettingsProps> = ({
	addConnectionRef,
	connectionsView,
}) => {
	const [settings, setSettings] = useState<SmtpSettingsPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	/** Detailed messages when saving a connection (validation, REST, or success summary). */
	const [connectionSaveFeedback, setConnectionSaveFeedback] = useState<{
		variant: 'error' | 'success';
		title: string;
		lines: string[];
		/** When false, dismissing success does not close the connection wizard. */
		closeWizardOnDismiss?: boolean;
	} | null>(null);

	/** OAuth: confirm save + open sign-in popup without leaving this screen (keeps client secret in form). */
	const [oauthAuthorizeDialogOpen, setOauthAuthorizeDialogOpen] =
		useState(false);
	const oauthAuthorizeDialogHrefRef = useRef<string | null>(null);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<SmtpConnection>(emptyConnection());
	/** 1 = name, 2 = provider, 3 = vault/credentials, 4 = from + save connection */
	const [wizardStep, setWizardStep] = useState(1);

	const [mailerAccountsBySlug, setMailerAccountsBySlug] = useState<
		Record<string, Record<string, MailerAccountRowMeta>>
	>({});
	const [mailerAccountsLoading, setMailerAccountsLoading] = useState(false);
	const mailerAccountsRequestId = useRef(0);
	/** Stable vault/connection id for new connections until “Save connection”. */
	const pendingNewVaultAccountIdRef = useRef<string | null>(null);
	/**
	 * User clicked “Add new account”. Next non-OAuth vault POST must use a new account id.
	 * (Do not derive this from `reuseStoredProviderAccount`: an empty account list forces “new”
	 * there even when a row is selected, and breaks add vs update.)
	 */
	const forceNewMailerVaultAccountOnNextSaveRef = useRef(false);
	/** Confirm before DELETE on a stored provider vault account. */
	const [providerAccountToDelete, setProviderAccountToDelete] = useState<{
		mailerSlug: string;
		accountId: string;
		label: string;
	} | null>(null);
	const [deletingProviderAccount, setDeletingProviderAccount] =
		useState(false);

	const [wizardFromEmailOptions, setWizardFromEmailOptions] = useState<
		MailerFromEmailOption[]
	>([]);
	const [wizardFromEmailsLoading, setWizardFromEmailsLoading] =
		useState(false);
	const [wizardFromEmailsFetchFailed, setWizardFromEmailsFetchFailed] =
		useState(false);

	const accountEditWizardSnapshotRef = useRef<SmtpConnection | null>(null);
	const [accountEditModalOpen, setAccountEditModalOpen] = useState(false);
	const [rightAccountPanelMode, setRightAccountPanelMode] = useState<
		'add' | 'edit'
	>('add');

	const reload = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = (await fetchSmtpSettings()) as SmtpSettingsPayload;
			const connections =
				(data.connections as Record<string, SmtpConnection>) || {};
			const ids = Object.keys(connections);
			let default_connection = (data.default_connection as string) || '';
			if (
				ids.length > 0 &&
				(!default_connection || !ids.includes(default_connection))
			) {
				default_connection = ids[0];
			}
			let fallback_connection = (data.fallback_connection as string) || '';
			if (fallback_connection && !ids.includes(fallback_connection)) {
				fallback_connection = '';
			}
			setSettings({
				default_connection,
				fallback_connection,
				connections,
				disable_summary_email: Boolean(data.disable_summary_email),
			});
		} catch (e: unknown) {
			setError(
				e instanceof Error
					? e.message
					: __('Could not load SMTP settings.', 'doublescale')
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	// Helper function to show notice
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	// Helper function to close notice
	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	const connectionIds = useMemo(() => {
		const c = settings?.connections || {};
		return Object.keys(c);
	}, [settings]);

	const loadMailerAccounts = useCallback(async (slug: string) => {
		if (slug === 'phpmailer') {
			return;
		}
		const rid = ++mailerAccountsRequestId.current;
		setMailerAccountsLoading(true);
		try {
			const raw = await fetchMailerAccounts(slug);
			if (mailerAccountsRequestId.current !== rid) {
				return;
			}
			const parsed = parseMailerAccountsResponse(raw);
			setMailerAccountsBySlug((prev) => ({ ...prev, [slug]: parsed }));
		} catch {
			if (mailerAccountsRequestId.current !== rid) {
				return;
			}
			setMailerAccountsBySlug((prev) => ({ ...prev, [slug]: {} }));
		} finally {
			if (mailerAccountsRequestId.current === rid) {
				setMailerAccountsLoading(false);
			}
		}
	}, []);

	const executeDeleteProviderAccount = useCallback(async () => {
		if (!providerAccountToDelete) {
			return;
		}
		const { mailerSlug, accountId } = providerAccountToDelete;
		setDeletingProviderAccount(true);
		setError(null);
		try {
			await deleteMailerAccount(mailerSlug, accountId);
			setProviderAccountToDelete(null);
			setForm((f) => {
				if ((f.mailer || '') !== mailerSlug) {
					return f;
				}
				if (String(f.account_id || '').trim() !== accountId) {
					return f;
				}
				return { ...f, account_id: '' };
			});
			void loadMailerAccounts(mailerSlug);
		} catch (e: unknown) {
			const lines = restErrorToDetailLines(e);
			setError(
				lines[0] ||
				__('Could not delete this provider account.', 'doublescale')
			);
		} finally {
			setDeletingProviderAccount(false);
		}
	}, [providerAccountToDelete, loadMailerAccounts]);

	useEffect(() => {
		if (!dialogOpen) {
			return;
		}
		void loadMailerAccounts(form.mailer || 'smtp');
	}, [dialogOpen, form.mailer, loadMailerAccounts]);

	useEffect(() => {
		if (wizardStep !== 4 || !dialogOpen) {
			setWizardFromEmailOptions([]);
			setWizardFromEmailsLoading(false);
			setWizardFromEmailsFetchFailed(false);
			return;
		}
		const slug = String(form.mailer || '').trim();
		const accountId = String(form.account_id || '').trim();
		if (!mailerUsesFetchedFromEmails(slug) || !accountId) {
			setWizardFromEmailOptions([]);
			setWizardFromEmailsLoading(false);
			setWizardFromEmailsFetchFailed(false);
			return;
		}

		let cancelled = false;
		setWizardFromEmailsFetchFailed(false);
		setWizardFromEmailsLoading(true);

		void fetchMailerFromEmails(slug, accountId)
			.then((res) => {
				if (cancelled) {
					return;
				}
				const opts = res.options || [];
				setWizardFromEmailOptions(opts);
				setWizardFromEmailsLoading(false);
				if (!opts.length) {
					return;
				}
				setForm((f) => {
					const cur = String(f.from_email || '').trim();
					const first = opts[0]?.value;
					if (!first) {
						return f;
					}
					if (!cur) {
						return { ...f, from_email: first };
					}
					if (opts.some((o) => o.value === cur)) {
						return f;
					}
					return { ...f, from_email: first };
				});
			})
			.catch(() => {
				if (cancelled) {
					return;
				}
				setWizardFromEmailOptions([]);
				setWizardFromEmailsLoading(false);
				setWizardFromEmailsFetchFailed(true);
			});

		return () => {
			cancelled = true;
		};
	}, [wizardStep, dialogOpen, form.mailer, form.account_id]);

	/**
	 * Gmail/Outlook/Zoho OAuth completes in a popup; PHP calls these globals on parent so the
	 * provider account dropdown refreshes without reloading wp-admin (SMTP-compatible).
	 */
	useEffect(() => {
		type OAuthPopupWin = Window &
			Partial<{
				add_new_gmail_account: (id: string, name: string) => void;
				add_new_outlook_account: (id: string, name: string) => void;
				add_new_zoho_account: (id: string, name: string) => void;
			}>;
		const w = window as OAuthPopupWin;
		const adopt = (slug: 'gmail' | 'outlook' | 'zoho', accountId: string) => {
			void loadMailerAccounts(slug);
			const aid = String(accountId || '').trim();
			if (!aid) {
				return;
			}
			forceNewMailerVaultAccountOnNextSaveRef.current = false;
			setForm((f) => {
				if ((f.mailer || '') !== slug) {
					return f;
				}
				return { ...f, account_id: aid };
			});
		};
		const onGmail = (id: string) => adopt('gmail', id);
		const onOutlook = (id: string) => adopt('outlook', id);
		const onZoho = (id: string) => adopt('zoho', id);
		w.add_new_gmail_account = onGmail;
		w.add_new_outlook_account = onOutlook;
		w.add_new_zoho_account = onZoho;
		return () => {
			if (w.add_new_gmail_account === onGmail) {
				delete w.add_new_gmail_account;
			}
			if (w.add_new_outlook_account === onOutlook) {
				delete w.add_new_outlook_account;
			}
			if (w.add_new_zoho_account === onZoho) {
				delete w.add_new_zoho_account;
			}
		};
	}, [loadMailerAccounts]);

	/** SMTP: OAuth account ids come from the provider after authorization, not the connection id—clear stale ids missing from the mailer store. */
	useEffect(() => {
		if (!dialogOpen || !isSmtpOAuthMailer(form.mailer || '')) {
			return;
		}
		const slug = form.mailer || 'smtp';
		const bucket = mailerAccountsBySlug[slug];
		if (bucket === undefined) {
			return;
		}
		const aid = String(form.account_id || '').trim();
		if (aid && !bucket[aid]) {
			setForm((f) => ({ ...f, account_id: '' }));
		}
	}, [dialogOpen, form.mailer, form.account_id, mailerAccountsBySlug]);

	const providerBucket = mailerAccountsBySlug[form.mailer || 'smtp'];
	const storedAccountCount = Object.keys(providerBucket || {}).length;

	/** When editing, list only the connection’s linked vault account (add flow shows all). */
	const providerAccountEntriesForList = useMemo(() => {
		const bucket = providerBucket || {};
		const sortEntries = (
			entries: [string, MailerAccountRowMeta][]
		): [string, MailerAccountRowMeta][] =>
			entries
				.slice()
				.sort((a, b) =>
					mailerAccountSelectLabel(a[0], a[1]).localeCompare(
						mailerAccountSelectLabel(b[0], b[1]),
						undefined,
						{ sensitivity: 'base' }
					)
				);
		const all = sortEntries(Object.entries(bucket));
		if (editingId === '__new__' || !editingId) {
			return all;
		}
		const aid = String(form.account_id || '').trim();
		if (!aid) {
			return all;
		}
		if (bucket[aid]) {
			return all.filter(([id]) => id === aid);
		}
		return [];
	}, [editingId, form.account_id, providerBucket]);

	const staleLinkedVaultAccount =
		editingId !== '__new__' &&
		Boolean(editingId) &&
		Boolean(String(form.account_id || '').trim()) &&
		!providerBucket?.[String(form.account_id || '').trim()] &&
		storedAccountCount > 0;

	const providerBinding = useMemo(
		() =>
			getProviderAccountBinding(
				form.mailer || 'smtp',
				String(form.account_id || ''),
				providerBucket
			),
		[form.mailer, form.account_id, providerBucket]
	);
	const reuseStoredProviderAccount =
		(form.mailer || 'smtp') !== 'phpmailer' &&
		providerBinding !== NEW_MAILER_ACCOUNT;

	const oauthAuthorizeHref = useMemo(
		() => oauthAdminAuthorizeUrl(form.mailer || ''),
		[form.mailer]
	);

	const step3MailerMeta = getSmtpMailerUiMeta(form.mailer || 'smtp');

	/** Add flow runs steps 1→4; edit starts at step 1 so the mail provider can be changed. */
	const applyMailerSelection = useCallback((mailerSlug: string) => {
		forceNewMailerVaultAccountOnNextSaveRef.current = false;
		setForm((f) => ({
			...f,
			mailer: mailerSlug,
			account_id: '',
			credentials: defaultCredentialsForMailer(mailerSlug),
			oauth_app: {
				client_id: '',
				client_secret: '',
				region: 'com',
			},
			api_key: '',
		}));
	}, []);

	const handleDialogOpenChange = (open: boolean) => {
		if (!open) {
			setWizardStep(1);
			setConnectionSaveFeedback(null);
			setProviderAccountToDelete(null);
			pendingNewVaultAccountIdRef.current = null;
			forceNewMailerVaultAccountOnNextSaveRef.current = false;
			setAccountEditModalOpen(false);
			accountEditWizardSnapshotRef.current = null;
		}
		setDialogOpen(open);
	};

	const dismissConnectionSaveFeedback = () => {
		setConnectionSaveFeedback((prev) => {
			if (prev?.variant === 'success' && prev?.closeWizardOnDismiss !== false) {
				setTimeout(() => {
					handleDialogOpenChange(false);
					setEditingId(null);
				}, 0);
			}
			return null;
		});
	};

	const openAdd = () => {
		setEditingId('__new__');
		forceNewMailerVaultAccountOnNextSaveRef.current = false;
		pendingNewVaultAccountIdRef.current = `conn_${Math.random()
			.toString(36)
			.slice(2, 10)}`;
		setForm(emptyConnection());
		setWizardStep(1);
		setDialogOpen(true);
	};

	useEffect(() => {
		if (!addConnectionRef) return;
		addConnectionRef.current = openAdd;
		return () => {
			addConnectionRef.current = null;
		};
	}, [addConnectionRef]);

	const openEdit = (id: string) => {
		const c = settings?.connections?.[id];
		if (!c) {
			return;
		}
		setEditingId(id);
		const migrated = migrateConnectionForm({
			...c,
			mailer: c.mailer || 'smtp',
		});
		let connName = String(migrated.connection_name || '').trim();
		if (!connName) {
			connName = getConnectionDisplayLabel(migrated, id);
		}
		const baseForm = { ...migrated, connection_name: connName };
		setForm(baseForm);
		/** Start from step 1 so the user can change connection name, provider, and account flow. */
		pendingNewVaultAccountIdRef.current = null;
		forceNewMailerVaultAccountOnNextSaveRef.current = false;
		setWizardStep(1);
		setDialogOpen(true);

		const slug = String(migrated.mailer || 'smtp');
		const accountId = String(migrated.account_id || '').trim();
		if (slug === 'phpmailer' || !accountId) {
			return;
		}
		void (async () => {
			try {
				const raw = await fetchMailerAccounts(slug);
				const parsed = parseMailerAccountsResponse(raw);
				setMailerAccountsBySlug((prev) => ({ ...prev, [slug]: parsed }));
				const row = parsed[accountId];
				if (row) {
					setForm((prev) => mergeVaultAccountIntoForm(prev, row, slug));
				}
			} catch {
				// keep connection row only
			}
		})();
	};

	const goWizardNext = () => {
		if (wizardStep === 1) {
			const n = String(form.connection_name || '').trim();
			if (!n) {
				const msg = __('Please enter a connection name.', 'doublescale');
				setError(msg);
				setConnectionSaveFeedback({
					variant: 'error',
					title: __('Cannot continue', 'doublescale'),
					lines: [msg],
				});
				return;
			}
			setError(null);
			setWizardStep(2);
			void loadMailerAccounts(form.mailer || 'smtp');
			return;
		}
		if (wizardStep === 2) {
			setError(null);
			setWizardStep(3);
			void loadMailerAccounts(form.mailer || 'smtp');
			return;
		}
		if (wizardStep === 3) {
			const v = validateConnectionForm(form);
			if (v) {
				setError(v);
				setConnectionSaveFeedback({
					variant: 'error',
					title: __('Cannot continue', 'doublescale'),
					lines: [v],
				});
				return;
			}
			if (isSmtpOAuthMailer(form.mailer || '') && !String(form.account_id || '').trim()) {
				const msg = __(
					'Select or authorize a provider account before continuing.',
					'doublescale'
				);
				setError(msg);
				setConnectionSaveFeedback({
					variant: 'error',
					title: __('Cannot continue', 'doublescale'),
					lines: [msg],
				});
				return;
			}
			if (
				(form.mailer || 'smtp') !== 'phpmailer' &&
				!isSmtpOAuthMailer(form.mailer || '') &&
				!String(form.account_name || '').trim()
			) {
				const msg = __('Please enter an account name.', 'doublescale');
				setError(msg);
				setConnectionSaveFeedback({
					variant: 'error',
					title: __('Cannot continue', 'doublescale'),
					lines: [msg],
				});
				return;
			}
			setError(null);
			setWizardStep(4);
		}
	};

	const goWizardPrev = () => {
		setError(null);
		setWizardStep((s) => Math.max(1, s - 1));
	};

	const chooseAddNewVaultAccount = useCallback(() => {
		if (saving || deletingProviderAccount || mailerAccountsLoading) {
			return;
		}
		forceNewMailerVaultAccountOnNextSaveRef.current = true;
		const slug = form.mailer || 'smtp';
		if (isSmtpOAuthMailer(slug)) {
			setForm((f) => ({ ...f, account_id: '' }));
			return;
		}
		setForm((f) => clearVaultAccountSelection(f, slug));
	}, [
		deletingProviderAccount,
		form.mailer,
		mailerAccountsLoading,
		saving,
	]);

	const selectVaultAccountRow = useCallback(
		(
			accId: string,
			meta: MailerAccountRowMeta | undefined,
			slug: string,
			opts?: ApplyStoredRowOpts
		) => {
			forceNewMailerVaultAccountOnNextSaveRef.current = false;
			setForm((f) => applyStoredAccountRowToForm(f, accId, meta, slug, opts));
		},
		[]
	);

	const selectLinkedAccountOnly = useCallback(
		(accId: string) => {
			const slug = form.mailer || 'smtp';
			const meta = mailerAccountsBySlug[slug]?.[accId];
			selectVaultAccountRow(accId, meta, slug, { allowToggleOff: false });
		},
		[form.mailer, mailerAccountsBySlug, selectVaultAccountRow]
	);

	const restoreWizardAfterClosingEditAccountModal = useCallback(() => {
		const snap = accountEditWizardSnapshotRef.current;
		if (snap) {
			setForm(snap);
		}
		accountEditWizardSnapshotRef.current = null;
	}, []);

	const openOAuthAuthorizeDialog = () => {
		const slug = form.mailer || '';
		if (!isSmtpOAuthMailer(slug)) {
			return;
		}
		const href = oauthAdminAuthorizeUrl(slug);
		if (!href) {
			const lines = [
				__(
					'Could not build the authorization URL. Please refresh the page and try again.',
					'doublescale'
				),
				sprintf(
					__('Admin URL from config: %s', 'doublescale'),
					String(config.adminUrl || '')
				),
			];
			setError(lines[0]);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('OAuth authorization', 'doublescale'),
				lines,
			});
			return;
		}
		const app = form.oauth_app || {};
		const clientId = String(app.client_id || '').trim();
		const clientSecret = String(app.client_secret || '').trim();
		if (!clientId || !clientSecret) {
			const msg = __(
				'Please enter the OAuth client ID and client secret before authorizing.',
				'doublescale'
			);
			setError(msg);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('OAuth app credentials', 'doublescale'),
				lines: [
					msg,
					__(
						'Both fields are required so the server can store the app before redirecting to Google, Microsoft, or Zoho.',
						'doublescale'
					),
				],
			});
			return;
		}
		setError(null);
		oauthAuthorizeDialogHrefRef.current = href;
		setOauthAuthorizeDialogOpen(true);
	};

	const handleOpenOAuthAuthorize = async () => {
		openOAuthAuthorizeDialog();
	};

	const confirmOAuthAuthorizeFromDialog = async () => {
		const slug = form.mailer || '';
		const href = oauthAuthorizeDialogHrefRef.current;
		if (!isSmtpOAuthMailer(slug) || !href) {
			setOauthAuthorizeDialogOpen(false);
			oauthAuthorizeDialogHrefRef.current = null;
			return;
		}
		const app = form.oauth_app || {};
		const clientId = String(app.client_id || '').trim();
		const clientSecret = String(app.client_secret || '').trim();
		if (!clientId || !clientSecret) {
			setOauthAuthorizeDialogOpen(false);
			oauthAuthorizeDialogHrefRef.current = null;
			const msg = __(
				'Please enter the OAuth client ID and client secret before authorizing.',
				'doublescale'
			);
			setError(msg);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('OAuth app credentials', 'doublescale'),
				lines: [msg],
			});
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await saveMailerAppSettings(slug, {
				client_id: clientId,
				client_secret: clientSecret,
				region: slug === 'zoho' ? String(app.region || 'com') : undefined,
			});
			// Named popup without noopener/noreferrer so PHP callback can call
			// window.opener.add_new_*_account (see SMTP provider App classes).
			const popup = window.open(
				href,
				'doublescale_smtp_oauth',
				'scrollbars=yes,resizable=yes,status=yes,width=640,height=720'
			);
			if (!popup) {
				const lines = [
					__(
						'Your browser blocked the sign-in window. Allow popups for this site, then try again.',
						'doublescale'
					),
				];
				setError(lines[0]);
				setConnectionSaveFeedback({
					variant: 'error',
					title: __('OAuth authorization', 'doublescale'),
					lines,
				});
				return;
			}
			setOauthAuthorizeDialogOpen(false);
			oauthAuthorizeDialogHrefRef.current = null;
		} catch (e: unknown) {
			const lines = restErrorToDetailLines(e);
			setError(lines[0] ?? __('Save failed.', 'doublescale'));
			setConnectionSaveFeedback({
				variant: 'error',
				title: __(
					'Could not save OAuth app credentials before opening authorization.',
					'doublescale'
				),
				lines,
			});
		} finally {
			setSaving(false);
		}
	};

	const persist = async (next: SmtpSettingsPayload) => {
		setSaving(true);
		setError(null);
		setSuccess(null);
		closeNotice();
		try {
			await saveSmtpSettings(next as Record<string, unknown>);
			setSettings(next);
			showNotice('success', __('Settings saved successfully.', 'doublescale'));
			setTimeout(() => closeNotice(), 3000);
		} catch (e: unknown) {
			const errorMessage = e instanceof Error
				? e.message
				: __('Save failed.', 'doublescale');
			setError(errorMessage);
			showNotice('error', errorMessage);
		} finally {
			setSaving(false);
		}
	};

	const saveGeneral = async () => {
		if (!settings) {
			return;
		}
		await persist({
			...settings,
			default_connection: settings.default_connection,
			fallback_connection: settings.fallback_connection,
			disable_summary_email: settings.disable_summary_email,
		});
	};

	/**
	 * Persist provider vault only (no SMTP connection row). Use before "Save connection".
	 */
	const saveProviderAccountOnly = async () => {
		if (!settings || !editingId) {
			return;
		}
		const slug = form.mailer || 'smtp';
		const validation = validateConnectionForm(form);
		if (validation) {
			setError(validation);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('Cannot save provider account', 'doublescale'),
				lines: [validation],
			});
			return;
		}
		if (slug === 'phpmailer') {
			setConnectionSaveFeedback({
				variant: 'success',
				title: __('Nothing to save', 'doublescale'),
				lines: [
					__(
						'The default mailer has no separate provider account to store.',
						'doublescale'
					),
				],
				closeWizardOnDismiss: false,
			});
			return;
		}
		if (isSmtpOAuthMailer(slug)) {
			const app = form.oauth_app || {};
			const clientId = String(app.client_id || '').trim();
			const clientSecret = String(app.client_secret || '').trim();
			if (!clientId || !clientSecret) {
				const msg = __(
					'Please enter the OAuth client ID and client secret.',
					'doublescale'
				);
				setError(msg);
				setConnectionSaveFeedback({
					variant: 'error',
					title: __('Cannot save provider account', 'doublescale'),
					lines: [msg],
				});
				return;
			}
		}
		if (isSmtpOAuthMailer(slug) && !String(form.account_id || '').trim()) {
			const msg = __(
				'Authorize and select a provider account first.',
				'doublescale'
			);
			setError(msg);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('Cannot save provider account', 'doublescale'),
				lines: [msg],
			});
			return;
		}
		if (!isSmtpOAuthMailer(slug) && !String(form.account_name || '').trim()) {
			const msg = __('Please enter an account name.', 'doublescale');
			setError(msg);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('Cannot save provider account', 'doublescale'),
				lines: [msg],
			});
			return;
		}
		const trimmedAid = String(form.account_id || '').trim();
		const vaultBucket = mailerAccountsBySlug[slug] || {};
		const intendNewVaultEntry =
			forceNewMailerVaultAccountOnNextSaveRef.current;
		if (intendNewVaultEntry) {
			forceNewMailerVaultAccountOnNextSaveRef.current = false;
		}
		let accountId: string;
		if (isSmtpOAuthMailer(slug)) {
			accountId = trimmedAid;
		} else if (intendNewVaultEntry) {
			accountId = `acc_${Math.random().toString(36).slice(2, 11)}`;
		} else if (trimmedAid && vaultBucket[trimmedAid]) {
			accountId = trimmedAid;
		} else if (trimmedAid) {
			// Upsert by id when the list has not refreshed yet or row is not in the parsed map.
			accountId = trimmedAid;
		} else {
			accountId = `acc_${Math.random().toString(36).slice(2, 11)}`;
		}
		const accountName =
			String(form.account_name || form.from_name || accountId).trim() ||
			accountId;

		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			if (isSmtpOAuthMailer(slug)) {
				const app = form.oauth_app || {};
				await saveMailerAppSettings(slug, {
					client_id: String(app.client_id || ''),
					client_secret: String(app.client_secret || ''),
					region: slug === 'zoho' ? String(app.region || 'com') : undefined,
				});
			} else if (slug === 'smtp') {
				await saveMailerAccount(
					'smtp',
					accountId,
					accountName,
					buildSmtpCredentialsForRest(form)
				);
			} else {
				await saveMailerAccount(
					slug,
					accountId,
					accountName,
					normalizeApiCredentials(
						slug,
						(form.credentials || {}) as Record<string, unknown>
					)
				);
			}
			if (slug !== 'phpmailer') {
				void loadMailerAccounts(slug);
			}
			setForm((f) => ({ ...f, account_id: accountId }));
			setConnectionSaveFeedback({
				variant: 'success',
				title: __('Provider account saved', 'doublescale'),
				lines: [
					__(
						'Credentials were stored in the vault. Go to the last step and press “Save connection” to store this SMTP connection.',
						'doublescale'
					),
					sprintf(__('Provider account ID: %s', 'doublescale'), accountId),
				],
				closeWizardOnDismiss: false,
			});
		} catch (e: unknown) {
			const lines = restErrorToDetailLines(e);
			setError(
				lines[0] ||
				__('Could not save provider account.', 'doublescale')
			);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('Could not save provider account', 'doublescale'),
				lines,
			});
		} finally {
			setSaving(false);
		}
	};

	const saveConnection = async () => {
		if (!settings || !editingId) {
			return;
		}
		const slug = form.mailer || 'smtp';

		const validation = validateConnectionForm(form);
		if (validation) {
			setError(validation);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('Cannot save connection', 'doublescale'),
				lines: [validation],
			});
			return;
		}
		if (isSmtpOAuthMailer(slug) && !String(form.account_id || '').trim()) {
			const msg = __(
				'Select or authorize a provider account before saving the connection.',
				'doublescale'
			);
			setError(msg);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('Cannot save connection', 'doublescale'),
				lines: [msg],
			});
			return;
		}
		const id =
			editingId === '__new__'
				? String(pendingNewVaultAccountIdRef.current || '').trim() ||
				`conn_${Math.random().toString(36).slice(2, 10)}`
				: editingId;
		if (editingId === '__new__' && !pendingNewVaultAccountIdRef.current) {
			pendingNewVaultAccountIdRef.current = id;
		}
		// Gmail/Outlook/Zoho: provider account ids are assigned by OAuth (never default to connection id — see SMTP AccountSelector).
		const accountId = isSmtpOAuthMailer(slug)
			? String(form.account_id || '').trim()
			: String(form.account_id || id).trim() || id;
		const accountName =
			String(form.account_name || form.from_name || accountId || id).trim() ||
			id;

		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			if (slug === 'phpmailer') {
				// No provider account store for default mailer.
			} else if (isSmtpOAuthMailer(slug)) {
				const app = form.oauth_app || {};
				await saveMailerAppSettings(slug, {
					client_id: String(app.client_id || ''),
					client_secret: String(app.client_secret || ''),
					region: slug === 'zoho' ? String(app.region || 'com') : undefined,
				});
			} else if (slug === 'smtp') {
				await saveMailerAccount(
					'smtp',
					accountId,
					accountName,
					buildSmtpCredentialsForRest(form)
				);
			} else {
				await saveMailerAccount(
					slug,
					accountId,
					accountName,
					normalizeApiCredentials(slug, (form.credentials || {}) as Record<string, unknown>)
				);
			}

			const connections = { ...(settings.connections || {}) };
			connections[id] = {
				...form,
				connection_name: String(form.connection_name || '').trim(),
				account_id: accountId,
				credentials: form.credentials || {},
				oauth_app: form.oauth_app || {},
			};
			await persist({ ...settings, connections });
			if (slug !== 'phpmailer') {
				void loadMailerAccounts(slug);
			}
			setSuccess(__('Saved.', 'doublescale'));
			setTimeout(() => setSuccess(null), 2500);
			const connLabel =
				String(form.connection_name || '').trim() || id;
			setConnectionSaveFeedback({
				variant: 'success',
				title: __('Connection saved', 'doublescale'),
				closeWizardOnDismiss: true,
				lines: [
					__(
						'Your connection and provider settings were stored successfully.',
						'doublescale'
					),
					sprintf(__('Connection name: %s', 'doublescale'), connLabel),
					sprintf(__('Mail provider: %s', 'doublescale'), slug),
					...(slug !== 'phpmailer'
						? [
							sprintf(
								__('Provider account ID: %s', 'doublescale'),
								accountId
							),
						]
						: []),
				],
			});
		} catch (e: unknown) {
			const lines = restErrorToDetailLines(e);
			setError(
				lines[0] ||
				__(
					'Could not save provider account or settings.',
					'doublescale'
				)
			);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('Could not save connection', 'doublescale'),
				lines,
			});
		} finally {
			setSaving(false);
		}
	};

	const deleteConnection = async (id: string) => {
		if (!settings) {
			return;
		}
		// eslint-disable-next-line no-alert
		if (!window.confirm(__('Remove this connection?', 'doublescale'))) {
			return;
		}
		const connections = { ...(settings.connections || {}) };
		delete connections[id];
		let default_connection = settings.default_connection;
		let fallback_connection = settings.fallback_connection;
		if (default_connection === id) {
			default_connection = '';
		}
		if (fallback_connection === id) {
			fallback_connection = '';
		}
		await persist({
			...settings,
			connections,
			default_connection,
			fallback_connection,
		});
	};

	/** SMTP relay only — PHPMailer/default mail has no connection credentials here. */
	const isSmtpRelay = form.mailer === 'smtp';
	const showSmtpRelayFields = isSmtpRelay;

	const oauthWizardFields =
		form.mailer !== 'phpmailer' && isSmtpOAuthMailer(form.mailer) ? (
			<>
				<Alert>
					<AlertTitle>
						{__('OAuth app credentials', 'doublescale')}
					</AlertTitle>
					<AlertDescription>
						{__(
							'Enter the client ID and client secret from your provider developer console. Save, then open provider authorization (left column); after OAuth completes, choose the mailbox from Provider account.',
							'doublescale'
						)}
					</AlertDescription>
				</Alert>
				{getOAuthAppFields(form.mailer)?.map((field: MailerField) => {
					const app = form.oauth_app || {};
					const val = String(
						(app as Record<string, unknown>)[field.key] ?? ''
					);
					const fid = `smtp-oauth-${field.key}`;
					if (field.type === 'select' && field.options?.length) {
						return (
							<div key={field.key} className="space-y-2">
								<Label htmlFor={fid}>{field.label}</Label>
								<Select
									value={val || field.options[0].value}
									onValueChange={(v) =>
										setForm((f) => ({
											...f,
											oauth_app: {
												...(f.oauth_app || {}),
												[field.key]: v,
											},
										}))
									}
								>
									<SelectTrigger id={fid}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{field.options.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						);
					}
					return (
						<div key={field.key} className="space-y-2">
							<Label htmlFor={fid}>{field.label}</Label>
							<Input
								id={fid}
								type={field.type === 'password' ? 'password' : 'text'}
								autoComplete={
									field.type === 'password' ? 'new-password' : 'off'
								}
								value={val}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										oauth_app: {
											...(f.oauth_app || {}),
											[field.key]: e.target.value,
										},
									}))
								}
							/>
						</div>
					);
				})}
			</>
		) : null;

	const apiWizardCredentialFields =
		form.mailer !== 'phpmailer' &&
			!isSmtpRelay &&
			!isSmtpOAuthMailer(form.mailer)
			? getMailerCredentialFields(form.mailer)?.map((field: MailerField) => {
				const creds = (form.credentials || {}) as Record<string, unknown>;
				const val = String(creds[field.key] ?? '');
				const fid = `smtp-cred-${field.key}`;
				const labelHasRequired =
					field.required !== false &&
					String(field.label).trim().length > 0;
				if (field.type === 'select' && field.options?.length) {
					return (
						<div key={field.key} className="space-y-2">
							<Label htmlFor={fid}>
								{field.label}
								{labelHasRequired ? (
									<span className="text-destructive"> *</span>
								) : null}
							</Label>
							<Select
								value={val || field.options[0].value}
								onValueChange={(v) =>
									setForm((f) => ({
										...f,
										credentials: {
											...(f.credentials || {}),
											[field.key]: v,
										},
									}))
								}
							>
								<SelectTrigger id={fid} className={SMTP_CONNECTION_SELECT_TRIGGER_CLASS}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{field.options.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{field.help ? (
								<div className="flex gap-2 text-xs text-muted-foreground">
									<InfoIcon width={16} height={16} color="#3a3a99" />
									<span>{field.help}</span>
								</div>
							) : null}
						</div>
					);
				}
				return (
					<div key={field.key} className="space-y-2">
						<Label htmlFor={fid}>
							{field.label}
							{labelHasRequired ? (
								<span className="text-destructive"> *</span>
							) : null}
						</Label>
						<Input
							id={fid}
							className={SMTP_CONNECTION_INPUT_CLASS}
							type={field.type === 'password' ? 'password' : 'text'}
							autoComplete={
								field.type === 'password' ? 'new-password' : 'off'
							}
							value={val}
							placeholder={field.label}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									credentials: {
										...(f.credentials || {}),
										[field.key]: e.target.value,
									},
								}))
							}
						/>
						{field.help ? (
							<div className="flex gap-2 text-xs text-muted-foreground">
								<InfoIcon width={16} height={16} color="#3a3a99" />
								<span>{field.help}</span>
							</div>
						) : null}
					</div>
				);
			})
			: null;

	if (loading) {
		return (
			<p className="text-sm text-muted-foreground">
				{__('Loading SMTP settings…', 'doublescale')}
			</p>
		);
	}

	if (!settings) {
		return null;
	}

	const fromEmailsApiActive =
		mailerUsesFetchedFromEmails(form.mailer || '') &&
		String(form.account_id || '').trim() !== '' &&
		!wizardFromEmailsFetchFailed;

	const showWizardFromEmailSelect =
		fromEmailsApiActive &&
		(wizardFromEmailsLoading || wizardFromEmailOptions.length > 0);

	return (
		<div className="space-y-6 builtin-smtp-settings">
			{notice && (
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}
			{error && !notice && (
				<Alert variant="destructive">
					<AlertTitle>{__('Error', 'doublescale')}</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{success && !notice && (
				<Alert>
					<AlertTitle>{__('Success', 'doublescale')}</AlertTitle>
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}

			<div
				className={cn(
					'grid gap-6 p-6 min-h-screen lg:grid-cols-[minmax(0,1fr)_380px] rounded-2xl border-[#D0D0D0] bg-white shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]',
					connectionsView === 'card' && connectionIds.length > 0
						? 'lg:items-stretch'
						: 'lg:items-start'
				)}
			>
				<div className="flex min-h-0 w-full flex-col gap-6 overflow-hidden rounded-2xl border border-[#D0D0D0] bg-[#F7F8FA] p-6 text-[#29292E] shadow-sm lg:order-2 lg:self-start">
					<div className="flex items-center gap-2">
						<div
							className=" text-[#CB5301]"
							aria-hidden
						>
							<SettingsIcon width={24} height={24} />
						</div>
						<h3 className="text-lg font-semibold leading-[30px] text-[#29292E]">
							{__('General Settings', 'doublescale')}
						</h3>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium text-[#29292E]">
							{__('Default connection', 'doublescale')}
						</Label>
						{connectionIds.length === 0 ? (
							<p className="text-xs text-[#6B6C76]">
								{__(
									'Add a connection below before choosing a default.',
									'doublescale'
								)}
							</p>
						) : (
							<Select
								value={
									settings.default_connection &&
										connectionIds.includes(settings.default_connection)
										? settings.default_connection
										: connectionIds[0]
								}
								onValueChange={(v) =>
									setSettings((s) => (s ? { ...s, default_connection: v } : s))
								}
							>
								<SelectTrigger className={SMTP_CONNECTION_SELECT_TRIGGER_CLASS}>
									<SelectValue placeholder={__('Select…', 'doublescale')} />
								</SelectTrigger>
								<SelectContent>
									{connectionIds.map((id) => (
										<SelectItem key={id} value={id}>
											{getConnectionDisplayLabel(
												settings.connections?.[id],
												id
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
					<div className="space-y-2">
						<Label className="text-sm font-medium text-[#29292E]">
							{__('Fallback connection', 'doublescale')}
						</Label>
						{connectionIds.length === 0 ? (
							<p className="text-xs text-[#6B6C76]">—</p>
						) : (
							<Select
								value={
									settings.fallback_connection
										? settings.fallback_connection
										: '__none__'
								}
								onValueChange={(v) =>
									setSettings((s) =>
										s
											? {
												...s,
												fallback_connection:
													v === '__none__' ? '' : v,
											}
											: s
									)
								}
							>
								<SelectTrigger className={SMTP_CONNECTION_SELECT_TRIGGER_CLASS}>
									<SelectValue placeholder={__('None', 'doublescale')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">
										{__('None', 'doublescale')}
									</SelectItem>
									{connectionIds.map((id) => (
										<SelectItem key={id} value={id}>
											{getConnectionDisplayLabel(
												settings.connections?.[id],
												id
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
					<div className="flex items-start justify-between gap-4 ">
						<div className="min-w-0 flex-1">
							<Label
								className="text-sm font-medium text-[#29292E]"
								htmlFor="smtp-disable-summary"
							>
								{__('Disable summary email', 'doublescale')}
							</Label>
						</div>
						<Switch
							id="smtp-disable-summary"
							className="mt-0.5 data-[state=checked]:bg-brandPrimary"
							checked={Boolean(settings.disable_summary_email)}
							onCheckedChange={(v) =>
								setSettings((s) =>
									s ? { ...s, disable_summary_email: v } : s
								)
							}
						/>
					</div>
					<div className="flex justify-end ">
						<Button
							type="button"
							variant="outline"
							disabled={saving}
							className=" border-brandPrimary text-brandPrimary hover:bg-[#fff]"
							onClick={() => void saveGeneral()}
						>
							{saving
								? __('Saving…', 'doublescale')
								: __('Save settings', 'doublescale')}
						</Button>
					</div>
				</div>

				<div
					className={cn(
						'flex w-full min-w-0 flex-col gap-4 lg:order-1',
						connectionsView === 'card' &&
						connectionIds.length > 0 &&
						' lg:min-h-0'
					)}
				>

				<SmtpConnectionsPanel
					connectionsView={connectionsView}
					connections={settings.connections}
					onEdit={openEdit}
					onRequestDelete={(id) => void deleteConnection(id)}
					onAdd={openAdd}
				/>
				</div>

			</div>

			{/* Email log is intentionally hidden for now.
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<div>
						<CardTitle>{__('Email log', 'doublescale')}</CardTitle>
						<CardDescription>
							{__('Recent sends recorded by the SMTP module.', 'doublescale')}
						</CardDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="text-destructive border-destructive/30 hover:bg-destructive/10"
									disabled={
										logLoading ||
										deletingAllLogs ||
										(logMeta?.total_items ?? 0) === 0
									}
								>
									{deletingAllLogs
										? __('Clearing…', 'doublescale')
										: __('Delete all logs', 'doublescale')}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										{__('Delete all email log entries?', 'doublescale')}
									</AlertDialogTitle>
									<AlertDialogDescription>
										{__(
											'This removes every row in the SMTP email log for this site. It cannot be undone.',
											'doublescale'
										)}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										{__('Cancel', 'doublescale')}
									</AlertDialogCancel>
									<AlertDialogAction
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										onClick={() => void handleFlushAllLogs()}
									>
										{__('Delete all', 'doublescale')}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={logLoading}
							onClick={() => void loadLogs()}
						>
							{logLoading
								? __('Loading…', 'doublescale')
								: __('Refresh log', 'doublescale')}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{logMeta && (
						<p className="text-xs text-muted-foreground mb-2">
							{__('Total entries:', 'doublescale')} {logMeta.total_items}
						</p>
					)}
					{logs.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{__(
								'No rows loaded yet. Send a test email, then press Refresh log.',
								'doublescale'
							)}
						</p>
					) : (
						<SmtpEmailLogTable
							logs={logs}
							onLogsMutated={() => void loadLogs()}
							onActionError={(msg) => setError(msg)}
						/>
					)}
				</CardContent>
			</Card>
			*/}

			<ConnectionWizardDialog
				open={dialogOpen}
				onOpenChange={handleDialogOpenChange}
				editingId={editingId}
				wizardStep={wizardStep}
				form={form}
				setForm={setForm}
				saving={saving}
				goWizardNext={goWizardNext}
				goWizardPrev={goWizardPrev}
				saveConnection={saveConnection}
				saveProviderAccountOnly={saveProviderAccountOnly}
				applyMailerSelection={applyMailerSelection}
				mailerAccountsLoading={mailerAccountsLoading}
				staleLinkedVaultAccount={staleLinkedVaultAccount}
				providerAccountEntriesForList={providerAccountEntriesForList}
				reuseStoredProviderAccount={reuseStoredProviderAccount}
				oauthAuthorizeHref={oauthAuthorizeHref}
				handleOpenOAuthAuthorize={handleOpenOAuthAuthorize}
				deletingProviderAccount={deletingProviderAccount}
				providerAccountToDelete={providerAccountToDelete}
				setProviderAccountToDelete={setProviderAccountToDelete}
				selectLinkedAccountOnly={selectLinkedAccountOnly}
				selectVaultAccountRow={selectVaultAccountRow}
				accountEditWizardSnapshotRef={accountEditWizardSnapshotRef}
				rightAccountPanelMode={rightAccountPanelMode}
				setRightAccountPanelMode={setRightAccountPanelMode}
				accountEditModalOpen={accountEditModalOpen}
				setAccountEditModalOpen={setAccountEditModalOpen}
				restoreWizardAfterClosingEditAccountModal={restoreWizardAfterClosingEditAccountModal}
				connectionSaveFeedback={connectionSaveFeedback}
				dismissConnectionSaveFeedback={dismissConnectionSaveFeedback}
				wizardFromEmailOptions={wizardFromEmailOptions}
				wizardFromEmailsLoading={wizardFromEmailsLoading}
				wizardFromEmailsFetchFailed={wizardFromEmailsFetchFailed}
			/>

			<Dialog
				open={oauthAuthorizeDialogOpen}
				onOpenChange={(open) => {
					if (!open) {
						setOauthAuthorizeDialogOpen(false);
						oauthAuthorizeDialogHrefRef.current = null;
					}
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{__('Save OAuth app and sign in', 'doublescale')}
						</DialogTitle>
						<DialogDescription asChild>
							<div className="space-y-3 text-sm text-muted-foreground">
								<p>
									{__(
										'Your client ID and client secret stay on this page. Only a separate sign-in window opens for Google, Microsoft, or Zoho.',
										'doublescale'
									)}
								</p>
								<p>
									{__(
										'When you continue, we save the app credentials to the server, then open that window. After you finish, the account list here can refresh automatically.',
										'doublescale'
									)}
								</p>
							</div>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setOauthAuthorizeDialogOpen(false);
								oauthAuthorizeDialogHrefRef.current = null;
							}}
							disabled={saving}
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							type="button"
							className="bg-brandPrimary hover:bg-brandPrimary focus:hover:bg-brandPrimary"
							disabled={saving}
							onClick={() => void confirmOAuthAuthorizeFromDialog()}
						>
							{saving
								? __('Saving…', 'doublescale')
								: __(
										'Save app & open sign-in window',
										'doublescale'
								  )}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={!!providerAccountToDelete}
				onOpenChange={(open) => {
					if (!open && !deletingProviderAccount) {
						setProviderAccountToDelete(null);
					}
				}}
			>
				<AlertDialogContent className='!flex !flex-col mx-1 w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-hidden gap-3 rounded-xl p-4 sm:mx-auto sm:w-full sm:p-8 !translate-x-[-50%] !translate-y-[-50%]'>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{__('Delete stored provider account?', 'doublescale')}
						</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="space-y-2 text-sm text-muted-foreground">
								<p>
									{sprintf(
										/* translators: 1: account label, 2: mailer name */
										__(
											'This removes the saved vault entry for “%1$s” under %2$s.',
											'doublescale'
										),
										providerAccountToDelete?.label ?? '',
										getSmtpMailerOptionLabel(
											providerAccountToDelete?.mailerSlug ?? ''
										)
									)}
								</p>
								<p>
									{__(
										'Any SMTP connection that still references this account may fail until you edit it and pick another account or create a new one.',
										'doublescale'
									)}
								</p>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className='flex flex-row justify-between mt-2'>
						<AlertDialogCancel disabled={deletingProviderAccount}>
							{__('Cancel', 'doublescale')}
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={deletingProviderAccount}
							onClick={(e) => {
								e.preventDefault();
								void executeDeleteProviderAccount();
							}}
						>
							{deletingProviderAccount
								? __('Deleting…', 'doublescale')
								: __('Delete account', 'doublescale')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default BuiltinSmtpSettings;
