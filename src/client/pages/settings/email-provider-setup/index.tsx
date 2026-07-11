/**
 * Email Provider Setup Tab
 *
 * Configure OAuth credentials for Gmail and Outlook.
 * These credentials are used by all CRM users to connect their personal email accounts.
 * Extracted from the Shared Email (email-inbound) page into its own Mailbox sub-tab.
 *
 * @since 1.0.0
 */

import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

import {
	CheckCircle,
	XCircle,
	Loader2,
	Mail,
	Copy,
	AlertTriangle,
	ShieldCheck,
} from 'lucide-react';

import { Button } from '@doublescale/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@doublescale/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertIcon } from '@doublescale/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const EmailProviderSetup: React.FC = () => {
	const [oauthApps, setOauthApps] = useState<{
		gmail: { client_id: string; has_secret: boolean };
		outlook: { client_id: string; has_secret: boolean };
		oauth_redirect_uri?: string;
	}>({
		gmail: { client_id: '', has_secret: false },
		outlook: { client_id: '', has_secret: false },
	});
	const [oauthAppInputs, setOauthAppInputs] = useState<{
		gmail: { client_id: string; client_secret: string };
		outlook: { client_id: string; client_secret: string };
	}>({
		gmail: { client_id: '', client_secret: '' },
		outlook: { client_id: '', client_secret: '' },
	});
	const [isSaving, setIsSaving] = useState(false);
	const [notice, setNotice] = useState<{
		type: 'success' | 'error' | 'warning';
		message: string;
	} | null>(null);
	const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
	const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'outlook'>('gmail');
	const [editingCredentials, setEditingCredentials] = useState(false);
	const [hassmtp, setHassmtp] = useState(true);
	const [isLoading, setIsLoading] = useState(true);

	const fetchOauthApps = useCallback(async () => {
		try {
			const response: any = await apiFetch({
				path: '/doublescale/v1/settings/email-oauth-apps',
			});
			setOauthApps(response);
			setOauthAppInputs({
				gmail: { client_id: response.gmail?.client_id || '', client_secret: '' },
				outlook: { client_id: response.outlook?.client_id || '', client_secret: '' },
			});
		} catch {
			// Silently fail — non-critical.
		}
	}, []);

	const fetchsmtpStatus = useCallback(async () => {
		try {
			const response: any = await apiFetch({
				path: '/doublescale/v1/settings/email-inbound',
			});
			setHassmtp(response.smtp_detection?.has_smtp ?? false);
		} catch {
			setHassmtp(false);
		}
	}, []);

	useEffect(() => {
		Promise.all([fetchOauthApps(), fetchsmtpStatus()]).finally(() => {
			setIsLoading(false);
		});
	}, [fetchOauthApps, fetchsmtpStatus]);

	const handleSave = async () => {
		setIsSaving(true);
		setNotice(null);

		try {
			const result: any = await apiFetch({
				path: '/doublescale/v1/settings/email-oauth-apps',
				method: 'POST',
				data: {
					[selectedProvider]: oauthAppInputs[selectedProvider],
				},
			});

			if (result.warnings && result.warnings.length > 0) {
				setNotice({
					type: 'warning',
					message: result.warnings.join(' '),
				});
			} else {
				setNotice({
					type: 'success',
					message:
						result.message ||
						__('OAuth app credentials saved.', 'doublescale'),
				});
			}

			await fetchOauthApps();
			setEditingCredentials(false);
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err.message ||
					__('Failed to save OAuth app credentials.', 'doublescale'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
				<span className="ml-3 text-gray-500">
					{__('Loading...', 'doublescale')}
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="text-foreground font-semibold text-2xl">
				{__('Email Provider Setup', 'doublescale')}
			</div>

			{/* Info Banner */}
			<Alert className="border-primary bg-primary/10 text-primary flex items-center gap-2">
				<div className="text-primary">
					<AlertIcon width={16} height={16} />
				</div>
				<AlertDescription className="text-base text-primary">
					{__(
						'Configure OAuth credentials for Gmail and Outlook. These credentials will be used by all CRM users to connect their personal email accounts.',
						'doublescale'
					)}
				</AlertDescription>
			</Alert>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<ShieldCheck className="w-5 h-5" />
						{__('Provider Credentials', 'doublescale')}
					</CardTitle>
					<CardDescription>
						{__(
							'Set up your Google Cloud or Azure AD application credentials to enable OAuth-based email connections.',
							'doublescale'
						)}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
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

					{!hassmtp ? (
						<Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
							<AlertDescription className="flex items-center gap-2">
								<AlertTriangle className="w-4 h-4 flex-shrink-0" />
								{__('smtp plugin is required for email provider setup. Please install and activate smtp.', 'doublescale')}
							</AlertDescription>
						</Alert>
					) : (
					<>
					{/* Provider Tab Selector */}
					<div>
						<Label className="text-sm font-normal mb-2 block">
							{__('Select your email provider:', 'doublescale')}
						</Label>
						<div className="flex gap-2">
							{(['gmail', 'outlook'] as const).map((provider) => {
								const isConfigured = oauthApps[provider].has_secret;
								const label = provider === 'gmail' ? 'Gmail' : 'Outlook';
								const Logo = provider === 'gmail' ? GmailLogo : OutlookLogo;
								return (
									<button
										key={provider}
										type="button"
										className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
											selectedProvider === provider
												? 'border-primary bg-primary/5 text-primary'
												: 'border-border text-muted-foreground hover:border-border/80'
										}`}
										onClick={() => {
											setSelectedProvider(provider);
											setEditingCredentials(false);
										}}
									>
										<Logo />
										{label}
										{isConfigured && (
											<CheckCircle className="w-3.5 h-3.5 text-green-600" />
										)}
									</button>
								);
							})}
						</div>
					</div>

					{/* Selected Provider Content */}
					{(() => {
						const provider = selectedProvider;
						const isConfigured = oauthApps[provider].has_secret;
						const providerLabel = provider === 'gmail' ? 'Gmail' : 'Outlook';

						if (isConfigured && !editingCredentials) {
							return (
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-2 py-0.5 font-medium">
											{__('Configured', 'doublescale')}
										</span>
									</div>
									<div className="text-sm text-gray-600">
										<span className="font-medium">{__('Client ID:', 'doublescale')}</span>{' '}
										{oauthApps[provider].client_id
											? `${oauthApps[provider].client_id.slice(0, 20)}...${oauthApps[provider].client_id.slice(-20)}`
											: '—'}
									</div>
									<div className="text-sm text-gray-600">
										<span className="font-medium">{__('Client Secret:', 'doublescale')}</span>{' '}
										{'••••••••'}
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setEditingCredentials(true)}
									>
										{__('Edit Credentials', 'doublescale')}
									</Button>
								</div>
							);
						}

						return (
							<div className="space-y-4">
								{oauthApps.oauth_redirect_uri && (
									<div>
										<Label className="text-sm font-normal mb-2 block">
											{__('Redirect URI', 'doublescale')}
										</Label>
										<div className="flex gap-2">
											<Input
												type="text"
												value={oauthApps.oauth_redirect_uri}
												readOnly
												className="bg-gray-50 font-mono text-xs"
											/>
											<Button
												variant="outline"
												className="h-12 px-3"
												type="button"
												onClick={() => {
													navigator.clipboard.writeText(
														oauthApps.oauth_redirect_uri || ''
													);
													setCopiedRedirectUri(true);
													setTimeout(
														() => setCopiedRedirectUri(false),
														2000
													);
												}}
											>
												{copiedRedirectUri ? (
													<CheckCircle className="w-4 h-4 text-green-600" />
												) : (
													<Copy className="w-4 h-4" />
												)}
											</Button>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											{__(
												'Add this URL as an authorized redirect URI in your Google Cloud / Azure AD app settings.',
												'doublescale'
											)}
										</p>
									</div>
								)}

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-normal mb-2 block">
											{__('Client ID', 'doublescale')}
										</Label>
										<Input
											type="text"
											value={oauthAppInputs[provider].client_id}
											onChange={(e) =>
												setOauthAppInputs((prev) => ({
													...prev,
													[provider]: {
														...prev[provider],
														client_id: e.target.value,
													},
												}))
											}
											placeholder={
												provider === 'gmail'
													? 'your-gmail-client-id.apps.googleusercontent.com'
													: 'your-outlook-application-id'
											}
											className=""
										/>
									</div>
									<div>
										<Label className="text-sm font-normal mb-2 block">
											{__('Client Secret', 'doublescale')}
										</Label>
										<Input
											type="password"
											value={oauthAppInputs[provider].client_secret}
											onChange={(e) =>
												setOauthAppInputs((prev) => ({
													...prev,
													[provider]: {
														...prev[provider],
														client_secret: e.target.value,
													},
												}))
											}
											placeholder={
												oauthApps[provider].has_secret
													? '••••••••'
													: __('Enter client secret', 'doublescale')
											}
											className=""
										/>
									</div>
								</div>

								<div className="flex gap-2">
									<Button
										onClick={handleSave}
										disabled={isSaving || !oauthAppInputs[provider].client_id.trim() || !oauthAppInputs[provider].client_secret.trim()}
									>
										{isSaving && (
											<Loader2 className="w-4 h-4 animate-spin mr-2" />
										)}
										{sprintf(
											__('Save %s Credentials', 'doublescale'),
											providerLabel
										)}
									</Button>
									{isConfigured && editingCredentials && (
										<Button
											variant="outline"
											onClick={() => setEditingCredentials(false)}
										>
											{__('Cancel', 'doublescale')}
										</Button>
									)}
								</div>
							</div>
						);
					})()}
					</>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default EmailProviderSetup;
