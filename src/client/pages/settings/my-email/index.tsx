/**
 * My Email Settings Tab
 *
 * Simplified per-user email connection page. Users click "Connect Gmail" or
 * "Connect Outlook" — OAuth auto-configures IMAP, from_email, and enables polling.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

import {
	CheckCircle,
	XCircle,
	Loader2,
	AlertTriangle,
	Link,
	Unlink,
} from 'lucide-react';

import { Button } from '@doublescale/components/ui/button';
import {
	Card,
	CardContent,
} from '@doublescale/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertIcon } from '@doublescale/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// ─── Provider Logos ─────────────────────────────────────────────────────────

const GmailLogo: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
		<path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
	</svg>
);

const OutlookLogo: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
		<path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 0 1-.588.236h-8.108v-8.39l2.4 1.71.238.127h.08a.39.39 0 0 0 .318-.159V9.85l-3.036-2.17V6.677h8.348c.228 0 .42.08.576.238.158.156.238.35.238.576l-.228-.104zm-10.934.16v12.588L0 18.27V2.676l13.066 1.862v3.009zm-4.96 1.478c-.558-.373-1.2-.56-1.926-.56-.838 0-1.538.318-2.098.953-.56.636-.84 1.47-.84 2.504 0 .988.262 1.8.786 2.436.524.636 1.196.954 2.016.954.762 0 1.416-.2 1.962-.6.546-.4.852-.944.918-1.632H7.592v-1.272h3.612v1.272c-.066.762-.372 1.458-.918 2.088-.546.63-1.302 1.05-2.268 1.26a5.04 5.04 0 0 1-1.098.12c-1.236 0-2.28-.434-3.132-1.302-.852-.868-1.278-1.99-1.278-3.366 0-1.332.444-2.442 1.332-3.33.888-.888 1.95-1.332 3.186-1.332.762 0 1.464.166 2.106.498.642.332 1.128.788 1.458 1.368l-1.494.94z" fill="#0078D4"/>
	</svg>
);

// ─── Types ──────────────────────────────────────────────────────────────────

interface OAuthProviderState {
	connected: boolean;
	email: string;
	needs_reauth: boolean;
}

interface UserEmailAccount {
	from_name: string;
	sync_sent: boolean;
	auto_create_contacts: boolean;
	oauth: {
		gmail: OAuthProviderState;
		outlook: OAuthProviderState;
	};
	oauth_apps_configured: {
		gmail: boolean;
		outlook: boolean;
	};
	connected_provider: 'gmail' | 'outlook' | null;
	connected_email: string;
	smtp_health: {
		gmail: 'ok' | 'not_connected' | 'missing_smtp_account' | 'smtp_inactive';
		outlook: 'ok' | 'not_connected' | 'missing_smtp_account' | 'smtp_inactive';
	};
	defaults: {
		from_email: string;
		from_name: string;
		reply_to: string;
	};
}

const defaultAccount: UserEmailAccount = {
	from_name: '',
	sync_sent: true,
	auto_create_contacts: false,
	oauth: {
		gmail: { connected: false, email: '', needs_reauth: false },
		outlook: { connected: false, email: '', needs_reauth: false },
	},
	oauth_apps_configured: { gmail: false, outlook: false },
	connected_provider: null,
	connected_email: '',
	smtp_health: { gmail: 'ok', outlook: 'ok' },
	defaults: { from_email: '', from_name: '', reply_to: '' },
};

// ─── Component ──────────────────────────────────────────────────────────────

const MyEmailSettings: React.FC = () => {
	const [account, setAccount] = useState<UserEmailAccount>(defaultAccount);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({});
	const [isDisconnecting, setIsDisconnecting] = useState<Record<string, boolean>>({});
	const [notice, setNotice] = useState<{
		type: 'success' | 'error' | 'warning';
		message: string;
	} | null>(null);
	const oauthCleanupRef = useRef<(() => void) | null>(null);
	const checkClosedRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// ─── Fetch ──────────────────────────────────────────────────────────

	const fetchAccount = useCallback(async () => {
		setIsLoading(true);
		try {
			const response: any = await apiFetch({
				path: '/doublescale/v1/user-email-account',
			});

			setAccount({
				from_name: response.from_name || '',
				sync_sent: !!response.sync_sent,
				auto_create_contacts: !!response.auto_create_contacts,
				oauth: {
					gmail: {
						connected: response.oauth?.gmail?.connected || false,
						email: response.oauth?.gmail?.email || '',
						needs_reauth: response.oauth?.gmail?.needs_reauth || false,
					},
					outlook: {
						connected: response.oauth?.outlook?.connected || false,
						email: response.oauth?.outlook?.email || '',
						needs_reauth: response.oauth?.outlook?.needs_reauth || false,
					},
				},
				oauth_apps_configured: response.oauth_apps_configured || { gmail: false, outlook: false },
				connected_provider: response.connected_provider || null,
				connected_email: response.connected_email || '',
				smtp_health: response.smtp_health || { gmail: 'ok', outlook: 'ok' },
				defaults: response.defaults || { from_email: '', from_name: '', reply_to: '' },
			});
		} catch (err: any) {
			setNotice({
				type: 'error',
				message: err.message || __('Failed to load settings', 'doublescale'),
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAccount();
	}, [fetchAccount]);

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
			const result: any = await apiFetch({
				path: '/doublescale/v1/user-email-account',
				method: 'POST',
				data: {
					from_name: account.from_name,
					sync_sent: account.sync_sent,
					auto_create_contacts: account.auto_create_contacts,
				},
			});

			if (result?.warnings && result.warnings.length > 0) {
				setNotice({ type: 'warning', message: result.warnings.join(' ') });
			} else {
				setNotice({
					type: 'success',
					message: __('Settings saved.', 'doublescale'),
				});
			}
		} catch (err: any) {
			setNotice({
				type: 'error',
				message: err.message || __('Failed to save settings', 'doublescale'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	// ─── OAuth Connect ──────────────────────────────────────────────────

	const handleOAuthConnect = async (provider: 'gmail' | 'outlook') => {
		setIsConnecting((prev) => ({ ...prev, [provider]: true }));
		setNotice(null);

		try {
			const response: any = await apiFetch({
				path: '/doublescale/v1/user-email-account/oauth/authorize',
				method: 'POST',
				data: { provider },
			});

			if (!response.authorization_url) {
				throw new Error(__('Failed to get authorization URL.', 'doublescale'));
			}

			oauthCleanupRef.current?.();

			const handleMessage = (event: MessageEvent) => {
				if (event.origin !== window.location.origin) return;
				if (event.data?.type !== 'DOUBLESCALE_OAUTH_RESULT') return;
				if (event.data?.scope && event.data.scope !== 'personal') return;
				if (event.data?.provider !== provider) return;

				window.removeEventListener('message', handleMessage);
				oauthCleanupRef.current = null;

				if (event.data.status === 'success') {
					setNotice({
						type: 'success',
						message: event.data.message || __('Connected successfully!', 'doublescale'),
					});
					fetchAccount();
				} else {
					setNotice({
						type: 'error',
						message: event.data.message || __('Authorization failed.', 'doublescale'),
					});
				}

				setIsConnecting((prev) => ({ ...prev, [provider]: false }));
			};

			window.addEventListener('message', handleMessage);
			oauthCleanupRef.current = () => {
				window.removeEventListener('message', handleMessage);
				if (checkClosedRef.current) {
					clearInterval(checkClosedRef.current);
					checkClosedRef.current = null;
				}
			};

			const popup = window.open(
				response.authorization_url,
				'doublescale_oauth_popup',
				'width=600,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
			);

			if (!popup) {
				window.removeEventListener('message', handleMessage);
				oauthCleanupRef.current = null;
				throw new Error(
					__('Failed to open popup. Please allow popups for this site.', 'doublescale')
				);
			}

			checkClosedRef.current = setInterval(() => {
				if (popup.closed) {
					if (checkClosedRef.current) {
						clearInterval(checkClosedRef.current);
						checkClosedRef.current = null;
					}
					setIsConnecting((prev) => ({ ...prev, [provider]: false }));
				}
			}, 1000);
		} catch (err: any) {
			setNotice({
				type: 'error',
				message: err.message || __('Failed to initiate OAuth authorization.', 'doublescale'),
			});
			setIsConnecting((prev) => ({ ...prev, [provider]: false }));
		}
	};

	// ─── OAuth Disconnect ───────────────────────────────────────────────

	const handleOAuthDisconnect = async (provider: 'gmail' | 'outlook') => {
		setIsDisconnecting((prev) => ({ ...prev, [provider]: true }));
		setNotice(null);

		try {
			const result: any = await apiFetch({
				path: '/doublescale/v1/user-email-account/oauth/disconnect',
				method: 'POST',
				data: { provider },
			});

			setNotice({
				type: 'success',
				message: result.message || __('Disconnected successfully.', 'doublescale'),
			});

			fetchAccount();
		} catch (err: any) {
			setNotice({
				type: 'error',
				message: err.message || __('Failed to disconnect.', 'doublescale'),
			});
		} finally {
			setIsDisconnecting((prev) => ({ ...prev, [provider]: false }));
		}
	};

	// ─── Connection State ───────────────────────────────────────────────

	const getConnectionState = () => {
		for (const provider of ['gmail', 'outlook'] as const) {
			if (account.oauth[provider].connected) {
				return {
					state: 'connected' as const,
					provider,
					email: account.oauth[provider].email,
					needs_reauth: account.oauth[provider].needs_reauth,
				};
			}
		}
		return { state: 'not_connected' as const } as const;
	};

	const connection = getConnectionState();
	const availableProviders = (['gmail', 'outlook'] as const).filter(
		(p) => account.oauth_apps_configured[p]
	);

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
		<div className="my-email-settings space-y-6">
			{/* Header */}
			<div className="text-foreground font-semibold text-2xl">
				{__('My Email', 'doublescale')}
			</div>

			{/* Info Banner */}
			<Alert className="border-primary bg-primary/10 text-primary flex items-center gap-2">
				<div className="text-primary">
					<AlertIcon width={16} height={16} />
				</div>
				<AlertDescription className="text-base text-primary">
					{__(
						'Connect your personal email account to send and receive emails as yourself in the CRM.',
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
							: notice.type === 'warning'
								? 'border-yellow-200 bg-yellow-50 text-yellow-800'
								: 'border-red-200 bg-red-50 text-red-800'
					}
				>
					<AlertDescription className="flex items-center gap-2">
						{notice.type === 'success' ? (
							<CheckCircle className="w-4 h-4" />
						) : notice.type === 'warning' ? (
							<AlertTriangle className="w-4 h-4" />
						) : (
							<XCircle className="w-4 h-4" />
						)}
						{notice.message}
					</AlertDescription>
				</Alert>
			)}

			{/* Connection Card */}
			<Card>
				<CardContent className="p-6">
					{connection.state === 'connected' ? (
						<div className="space-y-3">
							{connection.needs_reauth ? (
								<>
									<Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
										<AlertDescription className="flex items-center gap-2">
											<AlertTriangle className="w-4 h-4" />
											{sprintf(
												__('Your %s authorization has expired. Please reconnect.', 'doublescale'),
												connection.provider === 'gmail' ? 'Gmail' : 'Outlook'
											)}
										</AlertDescription>
									</Alert>
									<Button
										variant="outline"
										onClick={() => handleOAuthConnect(connection.provider)}
										disabled={isConnecting[connection.provider]}
									>
										{isConnecting[connection.provider] ? (
											<Loader2 className="w-4 h-4 animate-spin mr-2" />
										) : (
											<Link className="w-4 h-4 mr-2" />
										)}
										{__('Reconnect', 'doublescale')}
									</Button>
								</>
							) : (
								<>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
											<CheckCircle className="w-4 h-4" />
											<span className="text-sm font-medium">
												{sprintf(
													__('Connected as %s', 'doublescale'),
													connection.email
												)}
											</span>
										</div>
										<Button
											variant="outline"
											size="sm"
											className="text-red-600 border-red-200 hover:bg-red-50"
											onClick={() => handleOAuthDisconnect(connection.provider)}
											disabled={isDisconnecting[connection.provider]}
										>
											{isDisconnecting[connection.provider] ? (
												<Loader2 className="w-4 h-4 animate-spin mr-2" />
											) : (
												<Unlink className="w-4 h-4 mr-2" />
											)}
											{__('Disconnect', 'doublescale')}
										</Button>
									</div>
									{account.smtp_health[connection.provider] === 'smtp_inactive' && (
										<Alert className="border-red-200 bg-red-50 text-red-800">
											<AlertDescription className="flex items-center gap-2">
												<AlertTriangle className="w-4 h-4 flex-shrink-0" />
												{__('smtp plugin is not active. Email sending, OAuth, and IMAP will not work. Please activate smtp.', 'doublescale')}
											</AlertDescription>
										</Alert>
									)}
									{account.smtp_health[connection.provider] === 'missing_smtp_account' && (
										<Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
											<AlertDescription className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<AlertTriangle className="w-4 h-4 flex-shrink-0" />
													{__('Your email sending connection is missing. Click Reconnect to fix.', 'doublescale')}
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleOAuthConnect(connection.provider)}
													disabled={isConnecting[connection.provider]}
												>
													{isConnecting[connection.provider] ? (
														<Loader2 className="w-4 h-4 animate-spin mr-2" />
													) : (
														<Link className="w-4 h-4 mr-2" />
													)}
													{__('Reconnect', 'doublescale')}
												</Button>
											</AlertDescription>
										</Alert>
									)}
								</>
							)}
						</div>
					) : availableProviders.length > 0 ? (
						<div className="flex items-center gap-3">
							{availableProviders.map((provider) => {
								const Logo = provider === 'gmail' ? GmailLogo : OutlookLogo;
								const isGmail = provider === 'gmail';
								return (
									<Button
										key={provider}
										variant="outline"
										onClick={() => handleOAuthConnect(provider)}
										disabled={isConnecting[provider]}
										className={`h-12 px-5 font-medium border-2 transition-colors ${
											isGmail
												? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
												: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
										}`}
									>
										{isConnecting[provider] ? (
											<Loader2 className="w-4 h-4 animate-spin mr-2" />
										) : (
											<Logo className="mr-2" />
										)}
										{sprintf(
											__('Connect %s', 'doublescale'),
											isGmail ? 'Gmail' : 'Outlook'
										)}
									</Button>
								);
							})}
						</div>
					) : (
						<Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
							<AlertDescription className="flex items-center gap-2">
								<AlertTriangle className="w-4 h-4 flex-shrink-0" />
								{__(
									'No email providers configured by your admin. Contact your CRM administrator to set up Gmail or Outlook in Settings > Mailbox > Email Provider Setup.',
									'doublescale'
								)}
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
			</Card>

			{/* Settings (only when connected) */}
			{connection.state === 'connected' && !connection.needs_reauth && (
				<>
					{/* Display Name */}
					<Card>
						<CardContent className="p-6 space-y-2">
							<Label className="text-sm font-medium">
								{__('Display Name', 'doublescale')}
							</Label>
							<Input
								type="text"
								value={account.from_name}
								onChange={(e) =>
									setAccount((prev) => ({
										...prev,
										from_name: e.target.value,
									}))
								}
								placeholder={account.defaults.from_name}
							className="max-w-md"
							/>
							<p className="text-xs text-gray-500">
								{__('How your name appears to email recipients.', 'doublescale')}
							</p>
						</CardContent>
					</Card>

					{/* Options */}
					<Card>
						<CardContent className="p-6 space-y-5">
							<div className="flex items-center justify-between">
								<div>
									<Label className="text-sm font-medium">
										{__('Sync Sent Folder', 'doublescale')}
									</Label>
									<p className="text-xs text-gray-500 mt-0.5">
										{__(
											'Track emails you send from your email client as CRM activities.',
											'doublescale'
										)}
									</p>
								</div>
								<Switch
									checked={account.sync_sent}
									onCheckedChange={(checked) =>
										setAccount((prev) => ({
											...prev,
											sync_sent: checked,
										}))
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<Label className="text-sm font-medium">
										{__('Auto-create Contacts', 'doublescale')}
									</Label>
									<p className="text-xs text-gray-500 mt-0.5">
										{__(
											'Automatically create CRM contacts from unknown email senders.',
											'doublescale'
										)}
									</p>
								</div>
								<Switch
									checked={account.auto_create_contacts}
									onCheckedChange={(checked) =>
										setAccount((prev) => ({
											...prev,
											auto_create_contacts: checked,
										}))
									}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Save Button */}
					<div className="flex justify-end">
						<Button
							onClick={handleSave}
							disabled={isSaving}
							variant="gradient"
							className="min-w-[140px] rounded-lg"
						>
							{isSaving ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
									{__('Saving...', 'doublescale')}
								</>
							) : (
								__('Save Settings', 'doublescale')
							)}
						</Button>
					</div>
				</>
			)}
		</div>
	);
};

export default MyEmailSettings;
