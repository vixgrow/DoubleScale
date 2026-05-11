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

/**
 * Internal dependencies
 */
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
	defaultCredentialsForMailer,
	isSmtpOAuthMailer,
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
import { SmtpGeneralSettingsPanel } from './builtin-smtp/general-settings-panel';
import { ConnectionWizardDialog } from './builtin-smtp/connection-wizard-dialog';
import {
	DeleteConnectionDialog,
	DeleteProviderAccountDialog,
} from './builtin-smtp/smtp-delete-dialogs';
import {
	applyStoredAccountRowToForm,
	buildSmtpCredentialsForRest,
	emptyConnection,
	mergeVaultAccountIntoForm,
	migrateConnectionForm,
	normalizeApiCredentials,
	parseMailerAccountsResponse,
	restErrorToDetailLines,
	validateConnectionForm,
	validateConnectionFormWithVaultLinkFallback,
	vaultBackedDisplayNameFromForm,
	type ApplyStoredRowOpts,
	type MailerAccountRowMeta,
} from './builtin-smtp/form-utils';
import type { SmtpConnection, SmtpSettingsPayload } from './types';
import config from '@doublescale/config';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type BuiltinSmtpSettingsProps = {
	addConnectionRef?: { current: (() => void) | null };
	connectionsView: 'table' | 'card';
};

const BuiltinSmtpSettings: React.FC<BuiltinSmtpSettingsProps> = ({
	addConnectionRef,
	connectionsView,
}) => {
	// -------------------------------------------------------------------------
	// Settings state
	// -------------------------------------------------------------------------
	const [settings, setSettings] = useState<SmtpSettingsPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// -------------------------------------------------------------------------
	// Wizard state
	// -------------------------------------------------------------------------
	/** Detailed messages when saving a connection (validation, REST, or success summary). */
	const [connectionSaveFeedback, setConnectionSaveFeedback] = useState<{
		variant: 'error' | 'success';
		title: string;
		lines: string[];
		closeWizardOnDismiss?: boolean;
	} | null>(null);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [accountEditModalOpen, setAccountEditModalOpen] = useState(false);
	const [rightAccountPanelMode, setRightAccountPanelMode] = useState<
		'add' | 'edit'
	>('add');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<SmtpConnection>(emptyConnection());
	/** 1 = name, 2 = provider, 3 = vault/credentials, 4 = from + save connection */
	const [wizardStep, setWizardStep] = useState(1);

	const [mailerAccountsBySlug, setMailerAccountsBySlug] = useState<
		Record<string, Record<string, MailerAccountRowMeta>>
	>({});
	const [mailerAccountsLoading, setMailerAccountsLoading] = useState(false);
	const mailerAccountsRequestId = useRef(0);

	/** Stable vault/connection id for new connections until "Save connection". */
	const pendingNewVaultAccountIdRef = useRef<string | null>(null);
	/**
	 * User clicked "Add new account". Next non-OAuth vault POST must use a new account id.
	 * (Do not derive from `reuseStoredProviderAccount`: an empty account list forces "new"
	 * there even when a row is selected, and breaks add vs update.)
	 */
	const forceNewMailerVaultAccountOnNextSaveRef = useRef(false);
	/** Wizard form before opening Edit-account modal from pencil icon (restore on modal close). */
	const accountEditWizardSnapshotRef = useRef<SmtpConnection | null>(null);

	// -------------------------------------------------------------------------
	// Delete: provider vault account
	// -------------------------------------------------------------------------
	const [providerAccountToDelete, setProviderAccountToDelete] = useState<{
		mailerSlug: string;
		accountId: string;
		label: string;
	} | null>(null);
	const [deletingProviderAccount, setDeletingProviderAccount] =
		useState(false);

	// -------------------------------------------------------------------------
	// Delete: SMTP connection
	// -------------------------------------------------------------------------
	const [smtpConnectionToDeleteId, setSmtpConnectionToDeleteId] = useState<
		string | null
	>(null);
	const [deletingSmtpConnection, setDeletingSmtpConnection] = useState(false);

	// -------------------------------------------------------------------------
	// Step-4 from-email options
	// -------------------------------------------------------------------------
	const [wizardFromEmailOptions, setWizardFromEmailOptions] = useState<
		MailerFromEmailOption[]
	>([]);
	const [wizardFromEmailsLoading, setWizardFromEmailsLoading] =
		useState(false);
	const [wizardFromEmailsFetchFailed, setWizardFromEmailsFetchFailed] =
		useState(false);

	// =========================================================================
	// Data loading
	// =========================================================================

	const reload = useCallback(async (options?: { showLoading?: boolean }) => {
		const showLoading = options?.showLoading !== false;
		if (showLoading) {
			setLoading(true);
		}
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
			let fallback_connection =
				(data.fallback_connection as string) || '';
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
			if (showLoading) {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

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

	// =========================================================================
	// Effects
	// =========================================================================

	useEffect(() => {
		if (!dialogOpen) {
			return;
		}
		void loadMailerAccounts(form.mailer || 'smtp');
	}, [dialogOpen, form.mailer, loadMailerAccounts]);

	/** Fetch from-email options when entering step 4. */
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
		const adopt = (
			slug: 'gmail' | 'outlook' | 'zoho',
			accountId: string
		) => {
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

	/** Clear stale OAuth account ids missing from the mailer store. */
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

	// =========================================================================
	// Derived state (step-3)
	// =========================================================================

	const providerBucket = mailerAccountsBySlug[form.mailer || 'smtp'];
	const storedAccountCount = Object.keys(providerBucket || {}).length;

	/** When editing, list only the connection's linked vault account (add flow shows all). */
	const providerAccountEntriesForList = useMemo(() => {
		const bucket = providerBucket || {};
		const sortEntries = (
			entries: [string, MailerAccountRowMeta][]
		): [string, MailerAccountRowMeta][] =>
			entries.slice().sort((a, b) => {
				const aLabel = a[1]?.name || a[0];
				const bLabel = b[1]?.name || b[0];
				return aLabel.localeCompare(bLabel, undefined, {
					sensitivity: 'base',
				});
			});
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

	const reuseStoredProviderAccount =
		(form.mailer || 'smtp') !== 'phpmailer' &&
		Boolean(String(form.account_id || '').trim()) &&
		Boolean(providerBucket?.[String(form.account_id || '').trim()]);

	const oauthAuthorizeHref = useMemo(() => {
		const slug = form.mailer || '';
		if (slug !== 'gmail' && slug !== 'outlook' && slug !== 'zoho') {
			return null;
		}
		const param =
			slug === 'gmail'
				? 'smtp-gmail=authorize'
				: slug === 'outlook'
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
	}, [form.mailer]);

	// =========================================================================
	// Wizard handlers
	// =========================================================================

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

	const restoreWizardAfterClosingEditAccountModal = () => {
		const snap = accountEditWizardSnapshotRef.current;
		if (!snap) {
			return;
		}
		accountEditWizardSnapshotRef.current = null;
		setForm(snap);
	};

	const handleDialogOpenChange = (open: boolean) => {
		if (!open) {
			restoreWizardAfterClosingEditAccountModal();
			setWizardStep(1);
			setConnectionSaveFeedback(null);
			setProviderAccountToDelete(null);
			setAccountEditModalOpen(false);
			setRightAccountPanelMode('add');
			pendingNewVaultAccountIdRef.current = null;
			forceNewMailerVaultAccountOnNextSaveRef.current = false;
		}
		setDialogOpen(open);
	};

	const dismissConnectionSaveFeedback = () => {
		setConnectionSaveFeedback((prev) => {
			if (
				prev?.variant === 'success' &&
				prev?.closeWizardOnDismiss !== false
			) {
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
		setRightAccountPanelMode('add');
		forceNewMailerVaultAccountOnNextSaveRef.current = false;
		pendingNewVaultAccountIdRef.current = `conn_${Math.random()
			.toString(36)
			.slice(2, 10)}`;
		setForm(emptyConnection());
		setWizardStep(1);
		setDialogOpen(true);
	};

	useEffect(() => {
		if (!addConnectionRef) {
			return;
		}
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
		setRightAccountPanelMode('edit');
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
				setMailerAccountsBySlug((prev) => ({
					...prev,
					[slug]: parsed,
				}));
				const row = parsed[accountId];
				if (row) {
					setForm((prev) =>
						mergeVaultAccountIntoForm(prev, row, slug)
					);
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
				const msg = __(
					'Please enter a connection name.',
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
			const v = validateConnectionFormWithVaultLinkFallback(
				form,
				mailerAccountsBySlug,
				forceNewMailerVaultAccountOnNextSaveRef.current
			);
			if (v) {
				setError(v);
				setConnectionSaveFeedback({
					variant: 'error',
					title: __('Cannot continue', 'doublescale'),
					lines: [v],
				});
				return;
			}
			if (
				isSmtpOAuthMailer(form.mailer || '') &&
				!String(form.account_id || '').trim()
			) {
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
				!String(form.account_name || '').trim() &&
				!vaultBackedDisplayNameFromForm(form, mailerAccountsBySlug)
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

	const selectVaultAccountRow = useCallback(
		(
			accId: string,
			meta: MailerAccountRowMeta | undefined,
			slug: string,
			opts?: ApplyStoredRowOpts
		) => {
			forceNewMailerVaultAccountOnNextSaveRef.current = false;
			setForm((f) =>
				applyStoredAccountRowToForm(f, accId, meta, slug, opts)
			);
		},
		[]
	);

	const selectLinkedAccountOnly = useCallback((accId: string) => {
		forceNewMailerVaultAccountOnNextSaveRef.current = false;
		setForm((f) => ({ ...f, account_id: accId }));
	}, []);

	// =========================================================================
	// Save handlers
	// =========================================================================

	const handleOpenOAuthAuthorize = async () => {
		const slug = form.mailer || '';
		if (!isSmtpOAuthMailer(slug)) {
			return;
		}
		const href = oauthAuthorizeHref;
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
		setSaving(true);
		setError(null);
		try {
			await saveMailerAppSettings(slug, {
				client_id: clientId,
				client_secret: clientSecret,
				region:
					slug === 'zoho' ? String(app.region || 'com') : undefined,
			});
			window.open(href, '_blank', 'noopener,noreferrer');
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
		try {
			await saveSmtpSettings(next as Record<string, unknown>);
			setSettings(next);
			setSuccess(__('Saved.', 'doublescale'));
			setTimeout(() => setSuccess(null), 2500);
		} catch (e: unknown) {
			setError(
				e instanceof Error
					? e.message
					: __('Save failed.', 'doublescale')
			);
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
		const vbDisplay =
			vaultBackedDisplayNameFromForm(form, mailerAccountsBySlug) ||
			undefined;
		const trimmedAidEarly = String(form.account_id || '').trim();
		const vaultBucketEarly = mailerAccountsBySlug[slug] || {};
		const linkedExistingVaultAccount =
			trimmedAidEarly &&
			vaultBucketEarly[trimmedAidEarly] &&
			!forceNewMailerVaultAccountOnNextSaveRef.current;

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

		/** Vault row already stored server-side; UI may omit secrets from the account list. */
		if (linkedExistingVaultAccount && !isSmtpOAuthMailer(slug)) {
			const strictVal = validateConnectionForm(form, {
				vaultBackedDisplayName: vbDisplay,
			});
			if (strictVal !== null) {
				const relaxedVal = validateConnectionForm(form, {
					skipApiMailerCredentialKeys: true,
					vaultBackedDisplayName: vbDisplay,
					skipSmtpRelayFieldsWhenVaultLinked: true,
				});
				if (relaxedVal === null) {
					const rowMeta = vaultBucketEarly[trimmedAidEarly];
					const resolvedAccountName =
						String(form.account_name || '').trim() ||
						String(rowMeta?.name || '').trim() ||
						trimmedAidEarly;

					setForm((f) => ({
						...f,
						account_id: trimmedAidEarly,
						account_name: resolvedAccountName,
					}));
					setConnectionSaveFeedback({
						variant: 'success',
						title: __('Using saved account', 'doublescale'),
						lines: [
							__(
								'The selected provider account is linked. Continue the wizard and save the connection when you are ready.',
								'doublescale'
							),
						],
						closeWizardOnDismiss: false,
					});
					return;
				}
				setError(relaxedVal);
				setConnectionSaveFeedback({
					variant: 'error',
					title: __('Cannot save provider account', 'doublescale'),
					lines: [relaxedVal],
				});
				return;
			}
		}

		const validation = validateConnectionForm(form, {
			vaultBackedDisplayName: vbDisplay,
		});
		if (validation) {
			setError(validation);
			setConnectionSaveFeedback({
				variant: 'error',
				title: __('Cannot save provider account', 'doublescale'),
				lines: [validation],
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
		if (
			!isSmtpOAuthMailer(slug) &&
			!String(form.account_name || '').trim()
		) {
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
					region:
						slug === 'zoho'
							? String(app.region || 'com')
							: undefined,
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
						'Credentials were stored in the vault. Go to the last step and press "Save connection" to store this SMTP connection.',
						'doublescale'
					),
					sprintf(
						__('Provider account ID: %s', 'doublescale'),
						accountId
					),
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

		const validation = validateConnectionFormWithVaultLinkFallback(
			form,
			mailerAccountsBySlug,
			forceNewMailerVaultAccountOnNextSaveRef.current
		);
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
		const accountId = isSmtpOAuthMailer(slug)
			? String(form.account_id || '').trim()
			: String(form.account_id || id).trim() || id;
		const accountName =
			String(
				form.account_name || form.from_name || accountId || id
			).trim() || id;

		const trimmedAidForVault = String(form.account_id || '').trim();
		const vaultBucketForSave = mailerAccountsBySlug[slug] || {};
		const linkedExistingVaultRow =
			trimmedAidForVault &&
			vaultBucketForSave[trimmedAidForVault] &&
			!forceNewMailerVaultAccountOnNextSaveRef.current;

		const vaultFormCredentialComplete =
			validateConnectionForm(form) === null;

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
					region:
						slug === 'zoho'
							? String(app.region || 'com')
							: undefined,
				});
			} else if (
				!(linkedExistingVaultRow && !vaultFormCredentialComplete)
			) {
				if (slug === 'smtp') {
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
			await reload({ showLoading: false });
			setSuccess(__('Saved.', 'doublescale'));
			setTimeout(() => setSuccess(null), 2500);
			const connLabel = String(form.connection_name || '').trim() || id;
			setConnectionSaveFeedback({
				variant: 'success',
				title: __('Connection saved', 'doublescale'),
				closeWizardOnDismiss: true,
				lines: [
					__(
						'Your connection and provider settings were stored successfully.',
						'doublescale'
					),
					sprintf(
						__('Connection name: %s', 'doublescale'),
						connLabel
					),
					sprintf(__('Mail provider: %s', 'doublescale'), slug),
					...(slug !== 'phpmailer'
						? [
								sprintf(
									__(
										'Provider account ID: %s',
										'doublescale'
									),
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

	const executeDeleteSmtpConnection = async () => {
		const id = smtpConnectionToDeleteId;
		if (!settings || !id) {
			return;
		}
		setDeletingSmtpConnection(true);
		setError(null);
		try {
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
			await saveSmtpSettings({
				...settings,
				connections,
				default_connection,
				fallback_connection,
			} as Record<string, unknown>);
			setSettings({
				...settings,
				connections,
				default_connection,
				fallback_connection,
			});
			setSuccess(__('Saved.', 'doublescale'));
			setTimeout(() => setSuccess(null), 2500);
			setSmtpConnectionToDeleteId(null);
		} catch (e: unknown) {
			setError(
				e instanceof Error
					? e.message
					: __('Save failed.', 'doublescale')
			);
		} finally {
			setDeletingSmtpConnection(false);
		}
	};

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

	return (
		<div className="space-y-6 builtin-smtp-settings">
			{error && (
				<Alert variant="destructive">
					<AlertTitle>{__('Error', 'doublescale')}</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{success && (
				<Alert>
					<AlertTitle>{__('Success', 'doublescale')}</AlertTitle>
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}

			<div
				className={cn(
					'grid gap-6 p-6 min-h-screen lg:grid-cols-[minmax(0,1fr)_380px] rounded-2xl border border-border bg-white shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]',
					connectionsView === 'card' && connectionIds.length > 0
						? 'lg:items-stretch'
						: 'lg:items-start'
				)}
			>
				<SmtpGeneralSettingsPanel
					settings={settings}
					connectionIds={connectionIds}
					saving={saving}
					setSettings={setSettings}
					saveGeneral={saveGeneral}
				/>

				<div
					className={cn(
						'flex w-full min-w-0 flex-col gap-4 lg:order-1',
						connectionsView === 'card' &&
							connectionIds.length > 0 &&
							'lg:min-h-0'
					)}
				>
					<SmtpConnectionsPanel
						connectionsView={connectionsView}
						connections={settings.connections}
						onEdit={openEdit}
						onRequestDelete={(id) =>
							setSmtpConnectionToDeleteId(id)
						}
					/>
				</div>
			</div>

			{/* ---------------------------------------------------------------- */}
			{/* Wizard Dialog (+ Edit Account Modal + Save Feedback Dialog)       */}
			{/* ---------------------------------------------------------------- */}
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
				restoreWizardAfterClosingEditAccountModal={
					restoreWizardAfterClosingEditAccountModal
				}
				connectionSaveFeedback={connectionSaveFeedback}
				dismissConnectionSaveFeedback={dismissConnectionSaveFeedback}
				wizardFromEmailOptions={wizardFromEmailOptions}
				wizardFromEmailsLoading={wizardFromEmailsLoading}
				wizardFromEmailsFetchFailed={wizardFromEmailsFetchFailed}
			/>

			{/* ---------------------------------------------------------------- */}
			{/* Delete Dialogs                                                    */}
			{/* ---------------------------------------------------------------- */}
			<DeleteProviderAccountDialog
				providerAccountToDelete={providerAccountToDelete}
				deletingProviderAccount={deletingProviderAccount}
				setProviderAccountToDelete={setProviderAccountToDelete}
				executeDeleteProviderAccount={executeDeleteProviderAccount}
			/>

			<DeleteConnectionDialog
				smtpConnectionToDeleteId={smtpConnectionToDeleteId}
				deletingSmtpConnection={deletingSmtpConnection}
				connections={settings.connections}
				setSmtpConnectionToDeleteId={setSmtpConnectionToDeleteId}
				executeDeleteSmtpConnection={executeDeleteSmtpConnection}
			/>
		</div>
	);
};

export default BuiltinSmtpSettings;
