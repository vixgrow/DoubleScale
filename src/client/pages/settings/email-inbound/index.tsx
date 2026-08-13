/**
 * Inbox Settings Page
 *
 * Configure incoming email processing via IMAP polling.
 * Supports Custom IMAP, Gmail OAuth, Outlook OAuth, and smtp providers.
 * Self-contained component that manages its own fetch/save via dedicated REST endpoints.
 *
 * @since 1.0.0
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import {
	CheckCircle,
	CheckCircle2,
	XCircle,
	Loader2,
	Mail,
	Server,
	Info,
	Link,
	Unlink,
	ShieldCheck,
} from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@doublescale/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@doublescale/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangleIcon, AlertIcon, ContactTotalEmailsIcon, EmailProviderSetupIcon } from '@doublescale/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { FromEmailSelector } from '@/components/from-email-selector';

// ─── Provider Logos ─────────────────────────────────────────────────────────

const GmailLogo: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
		<path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
	</svg>
);

const OutlookLogo: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
		<path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 0 1-.588.236h-8.108v-8.39l2.4 1.71.238.127h.08a.39.39 0 0 0 .318-.159V9.85l-3.036-2.17V6.677h8.348c.228 0 .42.08.576.238.158.156.238.35.238.576l-.228-.104zm-10.934.16v12.588L0 18.27V2.676l13.066 1.862v3.009zm-4.96 1.478c-.558-.373-1.2-.56-1.926-.56-.838 0-1.538.318-2.098.953-.56.636-.84 1.47-.84 2.504 0 .988.262 1.8.786 2.436.524.636 1.196.954 2.016.954.762 0 1.416-.2 1.962-.6.546-.4.852-.944.918-1.632H7.592v-1.272h3.612v1.272c-.066.762-.372 1.458-.918 2.088-.546.63-1.302 1.05-2.268 1.26a5.04 5.04 0 0 1-1.098.12c-1.236 0-2.28-.434-3.132-1.302-.852-.868-1.278-1.99-1.278-3.366 0-1.332.444-2.442 1.332-3.33.888-.888 1.95-1.332 3.186-1.332.762 0 1.464.166 2.106.498.642.332 1.128.788 1.458 1.368l-1.494.94z" fill="#0078D4"/>
	</svg>
);

// ─── Types ──────────────────────────────────────────────────────────────────

interface OAuthProviderState {
	connected: boolean;
	email: string;
	needs_reauth: boolean;
}

interface DetectedProvider {
	email: string;
	provider: string;
	imap_host: string;
	imap_port: number;
	encryption: string;
}

interface SmtpDetection {
	has_smtp: boolean;
	from_emails: string[];
	gmail_detected: boolean;
	gmail_accounts: Array<{ id: string; email: string }>;
	gmail_app: { client_id?: string; has_secret?: boolean };
	outlook_detected: boolean;
	outlook_accounts: Array<{ id: string; email: string }>;
	outlook_app: { client_id?: string; has_secret?: boolean };
	detected_providers: DetectedProvider[];
}

interface EmailInboundSettings {
	enabled: boolean;
	auto_create_contacts: boolean;
	sync_sent: boolean;
	excluded_domains: string[];
	from_email: string;
	from_name: string;
	reply_to: string;
	imap_provider: 'custom' | 'gmail' | 'outlook' | 'smtp_gmail' | 'smtp_outlook';
	smtp_gmail_account: string;
	smtp_outlook_account: string;
	imap: {
		host: string;
		port: number;
		encryption: string;
		username: string;
		password: string;
		sent_folder: string;
	};
	oauth: {
		gmail: OAuthProviderState;
		outlook: OAuthProviderState;
	};
}

const defaultOAuthProvider: OAuthProviderState = {
	connected: false,
	email: '',
	needs_reauth: false,
};

const defaultSettings: EmailInboundSettings = {
	enabled: false,
	auto_create_contacts: false,
	sync_sent: true,
	excluded_domains: [],
	from_email: '',
	from_name: '',
	reply_to: '',
	imap_provider: 'custom',
	smtp_gmail_account: '',
	smtp_outlook_account: '',
	imap: {
		host: '',
		port: 993,
		encryption: 'ssl',
		username: '',
		password: '',
		sent_folder: 'Sent',
	},
	oauth: {
		gmail: { ...defaultOAuthProvider },
		outlook: { ...defaultOAuthProvider },
	},
};

// ─── Component ──────────────────────────────────────────────────────────────

const EmailInboundSettingsPage: React.FC = () => {
	const [settings, setSettings] =
		useState<EmailInboundSettings>(defaultSettings);
	const [defaults, setDefaults] = useState({
		from_email: '',
		from_name: '',
		reply_to: '',
	});
	const [oauthAppsConfigured, setOauthAppsConfigured] = useState<{
		gmail: boolean;
		outlook: boolean;
	}>({ gmail: false, outlook: false });
	const [smtpDetection, setSmtpDetection] = useState<SmtpDetection>({
		has_smtp: false,
		from_emails: [],
		gmail_detected: false,
		gmail_accounts: [],
		gmail_app: {},
		outlook_detected: false,
		outlook_accounts: [],
		outlook_app: {},
		detected_providers: [],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
	const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>(
		{}
	);
	const [isDisconnecting, setIsDisconnecting] = useState<
		Record<string, boolean>
	>({});
	const [notice, setNotice] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);
	const [testResult, setTestResult] = useState<{
		success: boolean;
		message: string;
	} | null>(null);
	// Ref for the OAuth message listener cleanup.
	const oauthCleanupRef = useRef<(() => void) | null>(null);
	const checkClosedRef = useRef<ReturnType<typeof setInterval> | null>(null);


	// ─── Fetch Settings ─────────────────────────────────────────────────

	const fetchSettings = useCallback(async () => {
		setIsLoading(true);
		try {
			const response: any = await apiFetch({
				path: '/doublescale/v1/settings/email-inbound',
			});

		setSettings({
			enabled: response.enabled || false,
			auto_create_contacts: !!response.auto_create_contacts,
			sync_sent: !!response.sync_sent,
			excluded_domains: Array.isArray(
				response.excluded_domains
			)
				? response.excluded_domains
				: [],
			from_email: response.from_email || '',
			from_name: response.from_name || '',
			reply_to: response.reply_to || '',
			imap_provider: response.imap_provider || 'custom',
				smtp_gmail_account:
					response.smtp_gmail_account || '',
				smtp_outlook_account:
					response.smtp_outlook_account || '',
				imap: {
					host: response.imap?.host || '',
					port: response.imap?.port || 993,
					encryption: response.imap?.encryption || 'ssl',
					username: response.imap?.username || '',
					password: response.imap?.password || '',
					sent_folder: response.imap?.sent_folder || 'Sent',
				},
				oauth: {
					gmail: {
						connected:
							response.oauth?.gmail?.connected || false,
						email: response.oauth?.gmail?.email || '',
						needs_reauth:
							response.oauth?.gmail?.needs_reauth ||
							false,
					},
					outlook: {
						connected:
							response.oauth?.outlook?.connected || false,
						email: response.oauth?.outlook?.email || '',
						needs_reauth:
							response.oauth?.outlook?.needs_reauth ||
							false,
					},
				},
			});

		if (response.defaults) {
			setDefaults(response.defaults);
		}

		if (response.oauth_apps_configured) {
			setOauthAppsConfigured(response.oauth_apps_configured);
		}

		const detection = response.smtp_detection;
		if (detection) {
				setSmtpDetection(detection);
			}

		// Auto-select IMAP provider when current selection is 'custom' but OAuth is available.
		const currentProvider = response.imap_provider || 'custom';
		if (currentProvider === 'custom') {
			const appsConfigured = response.oauth_apps_configured || {};
			if (detection?.gmail_detected) {
				setSettings((prev) => ({
					...prev,
					imap_provider: 'smtp_gmail',
					smtp_gmail_account: detection.gmail_accounts?.[0]?.id || '',
				}));
			} else if (appsConfigured.gmail) {
				setSettings((prev) => ({ ...prev, imap_provider: 'gmail' }));
			} else if (detection?.outlook_detected) {
				setSettings((prev) => ({
					...prev,
					imap_provider: 'smtp_outlook',
					smtp_outlook_account: detection.outlook_accounts?.[0]?.id || '',
				}));
			} else if (appsConfigured.outlook) {
				setSettings((prev) => ({ ...prev, imap_provider: 'outlook' }));
			}
		}
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err.message ||
					__('Failed to load settings', 'doublescale'),
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	// Clean up OAuth listener and interval on unmount.
	useEffect(() => {
		return () => {
			oauthCleanupRef.current?.();
			if (checkClosedRef.current) {
				clearInterval(checkClosedRef.current);
			}
		};
	}, []);

	// ─── Save ───────────────────────────────────────────────────────────

	const handleSave = async () => {
		setIsSaving(true);
		setNotice(null);

		try {
			await apiFetch({
				path: '/doublescale/v1/settings/email-inbound',
				method: 'POST',
			data: {
				enabled: settings.enabled,
				auto_create_contacts: settings.auto_create_contacts,
				sync_sent: settings.sync_sent,
				excluded_domains: settings.excluded_domains,
				from_email: settings.from_email,
				from_name: settings.from_name,
				reply_to: settings.reply_to,
				imap_provider: settings.imap_provider,
					smtp_gmail_account:
						settings.smtp_gmail_account,
					smtp_outlook_account:
						settings.smtp_outlook_account,
					imap: settings.imap,
				},
			});

			setNotice({
				type: 'success',
				message: __(
					'Inbox settings saved successfully.',
					'doublescale'
				),
			});
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err.message ||
					__('Failed to save settings', 'doublescale'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	// ─── Test Connection ────────────────────────────────────────────────

	const handleTestConnection = async () => {
		setIsTesting(true);
		setTestResult(null);

		try {
			const provider = settings.imap_provider;
			const data: Record<string, any> = { provider };

			if (provider === 'custom') {
				data.host = settings.imap.host;
				data.port = settings.imap.port;
				data.encryption = settings.imap.encryption;
				data.username = settings.imap.username;
				data.password = settings.imap.password;
			} else if (provider === 'smtp_gmail') {
				data.account_id =
					settings.smtp_gmail_account || '';
			} else if (provider === 'smtp_outlook') {
				data.account_id =
					settings.smtp_outlook_account || '';
			}

			const result: any = await apiFetch({
				path: '/doublescale/v1/settings/email-inbound/test',
				method: 'POST',
				data,
			});

			setTestResult({
				success: result.success,
				message: result.message,
			});
		} catch (err: any) {
			setTestResult({
				success: false,
				message:
					err.message ||
					__('Connection test failed', 'doublescale'),
			});
		} finally {
			setIsTesting(false);
		}
	};

	// ─── OAuth Connect ──────────────────────────────────────────────────

	const handleOAuthConnect = async (
		provider: 'gmail' | 'outlook'
	) => {
		setIsConnecting((prev) => ({ ...prev, [provider]: true }));
		setNotice(null);
		setTestResult(null);

		try {
			// Uses centralized admin-configured credentials (no client_id/secret needed).
			const response: any = await apiFetch({
				path: '/doublescale/v1/settings/email-inbound/oauth/authorize',
				method: 'POST',
				data: { provider },
			});

			if (!response.authorization_url) {
				throw new Error(
					__(
						'Failed to get authorization URL.',
						'doublescale'
					)
				);
			}

			// Clean up any previous listener.
			oauthCleanupRef.current?.();

			// Set up postMessage listener.
			const handleMessage = (event: MessageEvent) => {
				if (event.origin !== window.location.origin) return;
				if (event.data?.type !== 'DOUBLESCALE_OAUTH_RESULT')
					return;
				if (event.data?.scope && event.data.scope !== 'shared') return;
				if (event.data?.provider !== provider) return;

				// Clean up.
				window.removeEventListener('message', handleMessage);
				oauthCleanupRef.current = null;

				if (event.data.status === 'success') {
					setNotice({
						type: 'success',
						message:
							event.data.message ||
							__(
								'Connected successfully!',
								'doublescale'
							),
					});
					// Refetch to get updated connected state + email.
					fetchSettings();
				} else {
					setNotice({
						type: 'error',
						message:
							event.data.message ||
							__(
								'Authorization failed.',
								'doublescale'
							),
					});
				}

				setIsConnecting((prev) => ({
					...prev,
					[provider]: false,
				}));
			};

			window.addEventListener('message', handleMessage);
			oauthCleanupRef.current = () => {
				window.removeEventListener('message', handleMessage);
				if (checkClosedRef.current) {
					clearInterval(checkClosedRef.current);
					checkClosedRef.current = null;
				}
			};

			// Open OAuth popup.
			const popup = window.open(
				response.authorization_url,
				'doublescale_oauth_popup',
				'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
			);

			if (!popup) {
				window.removeEventListener('message', handleMessage);
				oauthCleanupRef.current = null;
				throw new Error(
					__(
						'Failed to open popup. Please allow popups for this site.',
						'doublescale'
					)
				);
			}

			// Monitor popup close (user closed it manually).
			checkClosedRef.current = setInterval(() => {
				if (popup.closed) {
					if (checkClosedRef.current) {
						clearInterval(checkClosedRef.current);
						checkClosedRef.current = null;
					}
					setIsConnecting((prev) => ({
						...prev,
						[provider]: false,
					}));
				}
			}, 1000);
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err.message ||
					__(
						'Failed to initiate OAuth authorization.',
						'doublescale'
					),
			});
			setIsConnecting((prev) => ({
				...prev,
				[provider]: false,
			}));
		}
	};

	// ─── OAuth Disconnect ───────────────────────────────────────────────

	const handleOAuthDisconnect = async (
		provider: 'gmail' | 'outlook'
	) => {
		setIsDisconnecting((prev) => ({ ...prev, [provider]: true }));
		setNotice(null);
		setTestResult(null);

		try {
			const result: any = await apiFetch({
				path: '/doublescale/v1/settings/email-inbound/oauth/disconnect',
				method: 'POST',
				data: { provider },
			});

			setNotice({
				type: 'success',
				message:
					result.message ||
					__('Disconnected successfully.', 'doublescale'),
			});

			// Update local state.
			setSettings((prev) => ({
				...prev,
				oauth: {
					...prev.oauth,
					[provider]: {
						...prev.oauth[provider],
						connected: false,
						email: '',
						needs_reauth: false,
					},
				},
			}));
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err.message ||
					__('Failed to disconnect.', 'doublescale'),
			});
		} finally {
			setIsDisconnecting((prev) => ({
				...prev,
				[provider]: false,
			}));
		}
	};

	// ─── Helpers ────────────────────────────────────────────────────────

	const updateImap = (key: string, value: any) => {
		setSettings((prev) => ({
			...prev,
			imap: { ...prev.imap, [key]: value },
		}));
	};

	// Current OAuth provider shorthand.
	const currentProvider = settings.imap_provider as
		| 'gmail'
		| 'outlook';
	const isOAuthProvider =
		settings.imap_provider === 'gmail' ||
		settings.imap_provider === 'outlook';
	const oauthState = isOAuthProvider
		? settings.oauth[currentProvider]
		: null;

	// Test connection button disabled state.
	const isTestDisabled = () => {
		if (isTesting) return true;
		if (settings.imap_provider === 'custom') {
			return (
				!settings.imap.host ||
				!settings.imap.username ||
				!settings.imap.password
			);
		}
		if (settings.imap_provider === 'smtp_gmail') {
			return !smtpDetection.gmail_detected;
		}
		if (settings.imap_provider === 'smtp_outlook') {
			return !smtpDetection.outlook_detected;
		}
		// For OAuth providers, must be connected.
		return !oauthState?.connected;
	};

	const smtpFromEmails = smtpDetection.from_emails || [];

	const getSelectedGmailEmail = () => {
		const acct = smtpDetection.gmail_accounts.find(
			(a) => a.id === settings.smtp_gmail_account
		);
		return acct?.email || smtpDetection.gmail_accounts[0]?.email || '';
	};

	const getSelectedOutlookEmail = () => {
		const acct = smtpDetection.outlook_accounts.find(
			(a) => a.id === settings.smtp_outlook_account
		);
		return acct?.email || smtpDetection.outlook_accounts[0]?.email || '';
	};

	// ─── Loading State ──────────────────────────────────────────────────

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
				<span className="ml-3 text-gray-500">
					{__('Loading settings...', 'doublescale')}
				</span>
			</div>
		);
	}

	// ─── Render ─────────────────────────────────────────────────────────

	return (
		<div className="inbox-settings space-y-6">
			{/* Header */}
			<div className="text-foreground font-semibold text-2xl">
				{__('Inbox', 'doublescale')}
			</div>

			{/* Info Banner */}
			<Alert className="border-primary bg-primary/10 text-primary flex items-center gap-2">
				<div className="text-primary">
					<AlertIcon width={16} height={16} />
				</div>
				<AlertDescription className="text-base text-primary">
				{__(
					'Receive incoming emails from contacts via IMAP polling. Replies are automatically linked to conversations and can trigger automations.',
					'doublescale'
				)}
				</AlertDescription>
			</Alert>

			{/* Notice */}
			{notice && (
				<Alert
					className={
						notice.type === 'success'
							? 'border-green-200 bg-green-50 text-green-800'
							: 'border-red-200 bg-red-50 text-red-800'
					}
				>
					<AlertDescription className="flex items-center gap-2">
						{notice.type === 'success' ? (
							<CheckCircle className="w-4 h-4" />
						) : (
							<XCircle className="w-4 h-4" />
						)}
						{notice.message}
					</AlertDescription>
				</Alert>
			)}

		{/* Sending Identity */}
		<Card className="shadow-sm">
			<CardHeader>
				<CardTitle className="text-lg flex items-center gap-2">
					<ContactTotalEmailsIcon width={24} height={24} />
					{__('Sending Identity', 'doublescale')}
				</CardTitle>
				<CardDescription>
					{__(
						'Configure how outgoing emails appear to recipients when using the shared mailbox.',
						'doublescale'
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
					<div>
						<Label className="text-sm font-normal mb-2 block">
							{__('From Email', 'doublescale')}
						</Label>
						<FromEmailSelector
							value={settings.from_email}
							onChange={(email, name) => {
								setSettings((prev) => ({
									...prev,
									from_email: email,
									...( name && !prev.from_name ? { from_name: name } : {} ),
								}));
							}}
							placeholder={defaults.from_email}
						/>
					</div>
					<div>
						<Label className="text-sm font-normal mb-2 block">
							{__('From Name', 'doublescale')}
						</Label>
						<Input
							type="text"
							value={settings.from_name}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									from_name: e.target.value,
								}))
							}
						placeholder={defaults.from_name}
						className="!border-border !rounded-lg"
						/>
					</div>
					<div>
						<Label className="text-sm font-normal mb-2 block">
							{__('Reply To', 'doublescale')}
						</Label>
						<Input
							type="email"
							value={settings.reply_to}
							onChange={(e) =>
								setSettings((prev) => ({
									...prev,
									reply_to: e.target.value,
								}))
							}
						placeholder={
							settings.from_email ||
							defaults.reply_to
						}
						className="!border-border !rounded-lg"
						/>
					</div>
				</div>
			</CardContent>
		</Card>

			{/* Enable Toggle */}
			<Card className="shadow-sm">
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<div>
							<Label className="text-base font-medium">
								{__(
									'Enable Inbox',
									'doublescale'
								)}
							</Label>
							<p className="text-sm text-gray-500 mt-1">
								{__(
									'When enabled, incoming emails will be processed and linked to contacts.',
									'doublescale'
								)}
							</p>
						</div>
						<Switch
							checked={settings.enabled}
							onCheckedChange={(checked) =>
								setSettings((prev) => ({
									...prev,
									enabled: checked,
								}))
							}
						/>
					</div>
				</CardContent>
			</Card>

		{/* IMAP Configuration */}
		{settings.enabled && (
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Server className="w-5 h-5" />
							{__('IMAP Configuration', 'doublescale')}
						</CardTitle>
						<CardDescription>
							{__(
								'Connect to your email server to poll for incoming messages every 60 seconds.',
								'doublescale'
							)}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Smart Provider Grid */}
						{(() => {
							// Merged Gmail tab: use smtp_gmail if detected, otherwise gmail OAuth
							const showGmail = oauthAppsConfigured.gmail || smtpDetection.gmail_detected;
							const gmailIsSmtp = smtpDetection.gmail_detected;
							const gmailProvider = gmailIsSmtp ? 'smtp_gmail' : 'gmail';
							const gmailActive = settings.imap_provider === 'smtp_gmail' || settings.imap_provider === 'gmail';

							// Merged Outlook tab
							const showOutlook = oauthAppsConfigured.outlook || smtpDetection.outlook_detected;
							const outlookIsSmtp = smtpDetection.outlook_detected;
							const outlookProvider = outlookIsSmtp ? 'smtp_outlook' : 'outlook';
							const outlookActive = settings.imap_provider === 'smtp_outlook' || settings.imap_provider === 'outlook';

							// Custom IMAP: show when no OAuth configured, OR when non-Gmail/non-Outlook senders exist
							const hasNonOAuthSenders = smtpDetection.from_emails.length > 0
								&& (smtpDetection.detected_providers.length > 0
									|| (!smtpDetection.gmail_detected && !smtpDetection.outlook_detected));
							const showCustomImap = (!oauthAppsConfigured.gmail && !oauthAppsConfigured.outlook) || hasNonOAuthSenders;

							const tabs: { key: string; label: string; subtitle: string; icon: 'gmail' | 'outlook' | 'server'; active: boolean; onClick: () => void }[] = [];

							if (showGmail) {
								tabs.push({
									key: 'gmail',
									label: 'Gmail',
									subtitle: gmailIsSmtp
										? __('Connected via smtp', 'doublescale')
										: __('OAuth 2.0', 'doublescale'),
									icon: 'gmail',
									active: gmailActive,
									onClick: () => {
										const update: any = { imap_provider: gmailProvider };
										if (gmailIsSmtp) {
											update.smtp_gmail_account = smtpDetection.gmail_accounts[0]?.id || '';
										}
										setSettings((prev) => ({ ...prev, ...update }));
										setTestResult(null);
									},
								});
							}

							if (showOutlook) {
								tabs.push({
									key: 'outlook',
									label: 'Outlook',
									subtitle: outlookIsSmtp
										? __('Connected via smtp', 'doublescale')
										: __('OAuth 2.0', 'doublescale'),
									icon: 'outlook',
									active: outlookActive,
									onClick: () => {
										const update: any = { imap_provider: outlookProvider };
										if (outlookIsSmtp) {
											update.smtp_outlook_account = smtpDetection.outlook_accounts[0]?.id || '';
										}
										setSettings((prev) => ({ ...prev, ...update }));
										setTestResult(null);
									},
								});
							}

							if (showCustomImap) {
								tabs.push({
									key: 'custom',
									label: __('Custom IMAP', 'doublescale'),
									subtitle: __('Any IMAP server', 'doublescale'),
									icon: 'server',
									active: settings.imap_provider === 'custom',
									onClick: () => {
										setSettings((prev) => ({ ...prev, imap_provider: 'custom' }));
										setTestResult(null);
									},
								});
							}

							if (tabs.length === 0) {
								return (
									<Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
										<AlertDescription className="flex items-center gap-2">
											<AlertTriangleIcon width={20} height={20} />
											{__('Set up Gmail or Outlook in the Email Provider Setup tab.', 'doublescale')}
										</AlertDescription>
									</Alert>
								);
							}

							return (
								<div className={`grid gap-3 grid-cols-${tabs.length}`}>
									{tabs.map((tab) => (
										<div
											key={tab.key}
											className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
												tab.active
													? 'border-primary bg-primary/10'
													: 'border-gray-200 hover:border-gray-300'
											}`}
											onClick={tab.onClick}
										>
											<div className="flex items-center gap-2">
												{tab.icon === 'gmail' ? (
													<GmailLogo />
												) : tab.icon === 'outlook' ? (
													<OutlookLogo />
												) : (
													<Server className={`w-4 h-4 ${tab.active ? 'text-primary' : 'text-gray-400'}`} />
												)}
												<span className="font-medium text-sm">{tab.label}</span>
											</div>
											<p className="text-xs text-gray-500 mt-1">{tab.subtitle}</p>
										</div>
									))}
								</div>
							);
						})()}

						{/* Custom IMAP Fields */}
						{settings.imap_provider === 'custom' && (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="imap-host">
											{__(
												'IMAP Host',
												'doublescale'
											)}
										</Label>
										<Input
											id="imap-host"
											placeholder="imap.gmail.com"
											value={
												settings.imap.host
											}
											onChange={(e) =>
												updateImap(
													'host',
													e.target.value
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="imap-port">
											{__(
												'Port',
												'doublescale'
											)}
										</Label>
										<Input
											id="imap-port"
											type="number"
											placeholder="993"
											value={
												settings.imap.port
											}
											onChange={(e) =>
												updateImap(
													'port',
													parseInt(
														e.target
															.value
													) || 993
												)
											}
											className="!border-border !rounded-lg"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="imap-encryption">
										{__(
											'Encryption',
											'doublescale'
										)}
									</Label>
									<Select
										value={
											settings.imap.encryption
										}
										onValueChange={(value) =>
											updateImap(
												'encryption',
												value
											)
										}
									>
										<SelectTrigger id="imap-encryption">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ssl">
												SSL
											</SelectItem>
											<SelectItem value="tls">
												TLS
											</SelectItem>
											<SelectItem value="none">
												{__(
													'None',
													'doublescale'
												)}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="imap-username">
											{__(
												'Username',
												'doublescale'
											)}
										</Label>
										<Input
											id="imap-username"
											placeholder="your-email@gmail.com"
											value={
												settings.imap
													.username
											}
											onChange={(e) =>
												updateImap(
													'username',
													e.target.value
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="imap-password">
											{__(
												'Password',
												'doublescale'
											)}
										</Label>
										<Input
											id="imap-password"
											type="password"
											placeholder="••••••••"
											value={
												settings.imap
													.password
											}
											onChange={(e) =>
												updateImap(
													'password',
													e.target.value
												)
											}
											className="!border-border !rounded-lg"
										/>
									</div>
								</div>
							</div>
						)}

					{/* smtp Gmail Section */}
					{settings.imap_provider ===
						'smtp_gmail' && (
						<div className="space-y-4">
							<div className="rounded-md bg-green-50 border border-green-200 p-4">
								<div className="flex items-start gap-3">
									<CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
									<div>
										<p className="text-sm font-medium text-green-800">
											{sprintf(
												__('Gmail connected via smtp — %s', 'doublescale'),
												getSelectedGmailEmail()
											)}
										</p>
										<p className="text-sm text-green-700 mt-1">
											{__(
												'Reusing OAuth credentials from smtp for IMAP access. No additional setup needed.',
												'doublescale'
											)}
										</p>
									</div>
								</div>
							</div>

						</div>
					)}

					{/* smtp Outlook Section */}
					{settings.imap_provider ===
						'smtp_outlook' && (
						<div className="space-y-4">
							<div className="rounded-md bg-green-50 border border-green-200 p-4">
								<div className="flex items-start gap-3">
									<CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
									<div>
										<p className="text-sm font-medium text-green-800">
											{sprintf(
												__('Outlook connected via smtp — %s', 'doublescale'),
												getSelectedOutlookEmail()
											)}
										</p>
										<p className="text-sm text-green-700 mt-1">
											{__(
												'Reusing OAuth credentials from smtp for IMAP access. No additional setup needed.',
												'doublescale'
											)}
										</p>
									</div>
								</div>
							</div>

						</div>
					)}

						{/* Hint: SMTP detected but no IMAP configured */}
						{smtpFromEmails.length > 0 &&
							settings.imap_provider ===
								'custom' &&
							!settings.imap.host && (
								<div className="rounded-md bg-blue-50 border border-blue-200 p-4">
									<div className="flex items-start gap-3">
										<AlertIcon width={16} height={16} />
										<p className="text-sm text-blue-700">
											{sprintf(
												__(
													"You're sending emails from %s. Configure IMAP for that inbox to automatically capture replies.",
													'doublescale'
												),
												smtpFromEmails.join(
													', '
												)
											)}
										</p>
									</div>
								</div>
							)}

						{/* Help text for transactional SMTP providers */}
						{smtpDetection.has_smtp &&
							!smtpDetection.gmail_detected &&
							!smtpDetection.outlook_detected &&
							smtpFromEmails.length > 0 &&
							settings.imap_provider ===
								'custom' && (
								<div className="rounded-md bg-gray-50 border border-gray-200 p-4">
									<div className="flex items-start gap-3">
										<AlertIcon width={16} height={16} />
										<p className="text-sm text-gray-600">
											{__(
												'When using transactional email providers (SendGrid, Mailgun, Postmark, etc.), configure IMAP for the inbox where replies actually land — typically your domain email server (wherever your MX records point).',
												'doublescale'
											)}
										</p>
									</div>
								</div>
							)}

						{/* Auto-fill from detected SMTP providers */}
						{smtpDetection.detected_providers.length > 0 &&
							settings.imap_provider ===
								'custom' &&
							!settings.imap.host && (
								<div className="rounded-md bg-blue-50 border border-blue-200 p-4">
									<div className="flex items-start gap-3">
										<AlertIcon width={16} height={16} />
										<div className="flex-1 space-y-2">
											<p className="text-sm text-blue-700">
												{__(
													'We detected email providers from your smtp configuration. Auto-fill IMAP settings?',
													'doublescale'
												)}
											</p>
											<div className="flex flex-wrap gap-2">
												{smtpDetection.detected_providers.map(
													(
														dp,
														idx
													) => (
														<button
															key={
																idx
															}
															type="button"
															className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
															onClick={() => {
																setSettings(
																	(
																		prev
																	) => ({
																		...prev,
																		imap: {
																			...prev.imap,
																			host: dp.imap_host,
																			port: dp.imap_port,
																			encryption:
																				dp.encryption,
																			username:
																				dp.email,
																		},
																	})
																);
															}}
														>
															{sprintf(
																__(
																	'%1$s (%2$s)',
																	'doublescale'
																),
																dp.provider,
																dp.email
															)}
														</button>
													)
												)}
											</div>
										</div>
									</div>
								</div>
							)}

						{/* OAuth Provider Section (Gmail / Outlook) */}
						{isOAuthProvider && oauthState && (
							<div className="space-y-4">
								{(() => {
									const providerName =
										currentProvider === 'gmail'
											? 'Gmail'
											: 'Outlook';
									const isConfigured =
										oauthAppsConfigured[currentProvider];

									if (!isConfigured) {
										return (
											<Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
												<AlertDescription className="flex items-center gap-2">
													<AlertTriangleIcon width={20} height={20} />
													{sprintf(
														__(
															'%s is not configured. Please set up %s OAuth credentials in the Email Provider Setup section above.',
															'doublescale'
														),
														providerName,
														providerName
													)}
												</AlertDescription>
											</Alert>
										);
									}

									if (oauthState.connected && !oauthState.needs_reauth) {
										return (
											<div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
												<div className="flex items-center gap-3">
													<EmailProviderSetupIcon width={24} height={24} />
													<div>
														<p className="font-medium text-green-800">
															{__(
																'Connected',
																'doublescale'
															)}
														</p>
														<p className="text-sm text-green-700">
															{oauthState.email ||
																__(
																	'Email address not available',
																	'doublescale'
																)}
														</p>
													</div>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleOAuthDisconnect(
															currentProvider
														)
													}
													disabled={
														isDisconnecting[
															currentProvider
														]
													}
													className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
												>
													{isDisconnecting[
														currentProvider
													] ? (
														<Loader2 className="w-3.5 h-3.5 animate-spin" />
													) : (
														<Unlink className="w-3.5 h-3.5" />
													)}
													{isDisconnecting[
														currentProvider
													]
														? __(
																'Disconnecting...',
																'doublescale'
															)
														: __(
																'Disconnect',
																'doublescale'
															)}
												</Button>
											</div>
										);
									}

									if (oauthState.needs_reauth) {
										return (
											<div className="space-y-3">
												<Alert className="border-yellow-200 bg-yellow-50">
													<AlertDescription className="flex items-center gap-2 text-yellow-800">
														<AlertTriangleIcon width={20} height={20} />
														{__(
															'Authorization has expired or was revoked. Please reconnect to resume email polling.',
															'doublescale'
														)}
													</AlertDescription>
												</Alert>
												<Button
													onClick={() =>
														handleOAuthConnect(
															currentProvider
														)
													}
													disabled={
														isConnecting[
															currentProvider
														]
													}
													className="flex items-center gap-2"
												>
													{isConnecting[
														currentProvider
													] ? (
														<Loader2 className="w-4 h-4 animate-spin" />
													) : (
														<Link className="w-4 h-4" />
													)}
													{__(
														'Reconnect',
														'doublescale'
													)}
												</Button>
											</div>
										);
									}

									return (
										<Button
											onClick={() =>
												handleOAuthConnect(
													currentProvider
												)
											}
											disabled={
												isConnecting[
													currentProvider
												]
											}
											className="flex items-center gap-2"
										>
											{isConnecting[
												currentProvider
											] ? (
												<Loader2 className="w-4 h-4 animate-spin" />
											) : (
												<Link className="w-4 h-4" />
											)}
											{sprintf(
												__(
													'Connect %s',
													'doublescale'
												),
												providerName
											)}
										</Button>
									);
								})()}
							</div>
						)}

						{/* Test Connection */}
						<div className="pt-2">
							<Button
								variant="secondaryDeepBlue"
								onClick={handleTestConnection}
								disabled={isTestDisabled()}
								className="flex items-center gap-2"
							>
								{isTesting ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<ContactTotalEmailsIcon width={24} height={24} />
								)}
								{isTesting
									? __(
											'Testing...',
											'doublescale'
										)
									: __(
											'Test Connection',
											'doublescale'
										)}
							</Button>

							{testResult && (
								<div
									className={`mt-3 flex items-center gap-2 p-3 rounded-lg ${
										testResult.success
											? 'bg-green-50 border border-green-200 text-green-800'
											: 'bg-red-50 border border-red-200 text-red-800'
									}`}
								>
									{testResult.success ? (
										<CheckCircle className="w-4 h-4 flex-shrink-0" />
									) : (
										<XCircle className="w-4 h-4 flex-shrink-0" />
									)}
									<span className="text-sm">
										{testResult.message}
									</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Auto-create Contacts */}
			{settings.enabled && (
				<Card className="shadow-sm">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<Label className="text-base font-medium">
									{__(
										'Auto-create Contacts',
										'doublescale'
									)}
								</Label>
								<p className="text-sm text-gray-500 mt-1">
									{__(
										'Automatically create new contacts when receiving emails from unknown senders. Emails from no-reply addresses are always ignored.',
										'doublescale'
									)}
								</p>
							</div>
							<Switch
								checked={settings.auto_create_contacts}
								onCheckedChange={(checked) =>
									setSettings((prev) => ({
										...prev,
										auto_create_contacts: checked,
									}))
								}
							/>
						</div>

						{/* Excluded Domains — only visible when auto-create is ON */}
						{settings.auto_create_contacts && (
							<div className="mt-4 pt-4 border-t">
								<Label className="text-sm font-medium">
									{__(
										'Excluded Domains',
										'doublescale'
									)}
								</Label>
								<p className="text-sm text-gray-500 mt-1 mb-2">
									{__(
										'Emails from these domains will be ignored. Enter one domain per line (e.g. newsletter.example.com).',
										'doublescale'
									)}
								</p>
								<Textarea
									value={settings.excluded_domains.join(
										'\n'
									)}
									onChange={(e) => {
										const domains =
											e.target.value.split(
												'\n'
											);
										setSettings((prev) => ({
											...prev,
											excluded_domains:
												domains,
										}));
									}}
									placeholder={
										'newsletter.example.com\nnoreply.github.com\nmarketing.company.com'
									}
									rows={4}
									className="font-mono text-sm"
								/>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Sync Sent Folder */}
			{settings.enabled && (
				<Card className="shadow-sm">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<Label className="text-base font-medium">
									{__(
										'Sync Sent Folder',
										'doublescale'
									)}
								</Label>
								<p className="text-sm text-gray-500 mt-1">
									{__(
										'When enabled, emails you send from your email client (e.g. Gmail, Outlook) will appear in the CRM contact timeline. This provides a complete conversation view without requiring you to send emails through the CRM.',
										'doublescale'
									)}
								</p>
							</div>
							<Switch
								checked={settings.sync_sent}
								onCheckedChange={(checked) =>
									setSettings((prev) => ({
										...prev,
										sync_sent: checked,
									}))
								}
							/>
						</div>

						{/* Sent Folder Name — only for custom IMAP when sync_sent is ON */}
						{settings.sync_sent &&
							settings.imap_provider === 'custom' && (
								<div className="mt-4 pt-4 border-t">
									<Label
										htmlFor="imap-sent-folder"
										className="text-sm font-medium"
									>
										{__(
											'Sent Folder Name',
											'doublescale'
										)}
									</Label>
									<p className="text-sm text-gray-500 mt-1 mb-2">
										{__(
											'The IMAP folder where sent emails are stored. Common names: "Sent", "Sent Items", "Sent Messages".',
											'doublescale'
										)}
									</p>
									<Input
										id="imap-sent-folder"
										value={
											settings.imap
												.sent_folder
										}
										onChange={(e) =>
											updateImap(
												'sent_folder',
												e.target.value
											)
										}
										placeholder="Sent"
										className="max-w-xs"
									/>
								</div>
							)}
					</CardContent>
				</Card>
			)}

			{/* Save Button */}
			<div className="flex justify-end">
				<Button
					onClick={handleSave}
					disabled={isSaving}
					className="flex items-center gap-2"
				>
					{isSaving && (
						<Loader2 className="w-4 h-4 animate-spin" />
					)}
					{isSaving
						? __('Saving...', 'doublescale')
						: __('Save Settings', 'doublescale')}
				</Button>
			</div>
		</div>
	);
};

export default EmailInboundSettingsPage;
