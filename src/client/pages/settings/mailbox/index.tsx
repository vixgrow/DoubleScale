/**
 * Mailbox Settings Tab
 *
 * Combines Shared Email (team IMAP inbox), Personal Email
 * (per-user email account), and Email Provider Setup into
 * a single settings tab with sub-tabs.
 *
 * - Shared Email: visible to CRM Manager (and Admin) only
 * - Personal Email: visible to all CRM roles
 * - Email Provider Setup: visible to CRM Manager (and Admin) only
 *
 * @since 1.7.0
 */

import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useCallback } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { Mail, UserCircle, ShieldCheck, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';

interface SharedIdentity {
	from_email: string;
	from_name: string;
	reply_to: string;
}

const SharedEmailFreeIdentity: React.FC = () => {
	const [identity, setIdentity] = useState<SharedIdentity>({
		from_email: '',
		from_name: '',
		reply_to: '',
	});
	const [defaults, setDefaults] = useState<SharedIdentity>({
		from_email: '',
		from_name: '',
		reply_to: '',
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

	const fetchSettings = useCallback(async () => {
		setIsLoading(true);
		try {
			const response: any = await apiFetch({
				path: '/doublescale/v1/settings/email-inbound',
			});
			setIdentity({
				from_email: response.from_email || '',
				from_name: response.from_name || '',
				reply_to: response.reply_to || '',
			});
			if (response.defaults) {
				setDefaults({
					from_email: response.defaults.from_email || '',
					from_name: response.defaults.from_name || '',
					reply_to: response.defaults.reply_to || '',
				});
			}
		} catch (err: any) {
			setNotice({
				type: 'error',
				message: err?.message || __('Failed to load settings', 'doublescale'),
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	const handleSave = async () => {
		setIsSaving(true);
		setNotice(null);
		try {
			await apiFetch({
				path: '/doublescale/v1/settings/email-inbound',
				method: 'POST',
				data: identity,
			});
			setNotice({
				type: 'success',
				message: __('Sending identity saved.', 'doublescale'),
			});
		} catch (err: any) {
			setNotice({
				type: 'error',
				message: err?.message || __('Failed to save settings', 'doublescale'),
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
					{__('Loading…', 'doublescale')}
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-foreground font-semibold text-2xl">
				{__('Shared Sending Identity', 'doublescale')}
			</div>

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

			<Card>
				<CardContent className="p-6 space-y-5">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label className="text-sm font-medium">
								{__('From Email', 'doublescale')}
							</Label>
							<Input
								type="email"
								value={identity.from_email}
								placeholder={defaults.from_email}
								onChange={(e) =>
									setIdentity((prev) => ({
										...prev,
										from_email: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium">
								{__('From Name', 'doublescale')}
							</Label>
							<Input
								type="text"
								value={identity.from_name}
								placeholder={defaults.from_name}
								onChange={(e) =>
									setIdentity((prev) => ({
										...prev,
										from_name: e.target.value,
									}))
								}
							/>
						</div>
					</div>
					<div className="space-y-2 max-w-md">
						<Label className="text-sm font-medium">
							{__('Reply-To', 'doublescale')}
						</Label>
						<Input
							type="email"
							value={identity.reply_to}
							placeholder={defaults.reply_to}
							onChange={(e) =>
								setIdentity((prev) => ({
									...prev,
									reply_to: e.target.value,
								}))
							}
						/>
					</div>
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
									{__('Saving…', 'doublescale')}
								</>
							) : (
								__('Save Identity', 'doublescale')
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			<ProFeatureNotice
				featureName={__('IMAP Polling & OAuth Sync', 'doublescale')}
				description={__(
					'Sync incoming email into the CRM via IMAP, connect Gmail or Outlook with OAuth, exclude internal domains, auto-create contacts from unknown senders, and sync your Sent folder with DoubleScale Pro.',
					'doublescale'
				)}
			/>
		</div>
	);
};

const MailboxSettings: React.FC = () => {
	const { isCrmManager } = useCapabilities();

	const canManage = useMemo(
		() => isCrmManager(),
		[isCrmManager]
	);

	const defaultTab = canManage ? 'shared' : 'personal';
	const [activeTab, setActiveTab] = useState(defaultTab);

	const SharedEmailComponent = useMemo(
		() =>
			applyFilters(
				'doublescale_mailbox_shared_email_settings',
				SharedEmailFreeIdentity
			) as React.ComponentType,
		[]
	);

	const PersonalEmailComponent = useMemo(
		() =>
			applyFilters(
				'doublescale_mailbox_personal_email_settings',
				() => (
					<ProFeatureNotice
						featureName={__('Personal Email', 'doublescale')}
						description={__(
							'Connect your personal Gmail or Outlook account via OAuth to send and receive emails as yourself in the CRM. Auto-create contacts from unknown senders and sync your Sent folder with DoubleScale Pro.',
							'doublescale'
						)}
					/>
				)
			) as React.ComponentType,
		[]
	);

	const EmailProviderSetupComponent = useMemo(
		() =>
			applyFilters(
				'doublescale_mailbox_email_provider_setup_settings',
				() => (
					<ProFeatureNotice
						featureName={__('Email Provider Setup', 'doublescale')}
						description={__(
							'Configure Gmail and Outlook OAuth credentials so your team can connect personal email accounts. Manage Google Cloud / Azure AD client IDs and secrets with DoubleScale Pro.',
							'doublescale'
						)}
					/>
				)
			) as React.ComponentType,
		[]
	);

	return (
		<div className="space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="bg-transparent gap-2">
					{canManage && (
						<TabsTrigger
							value="shared"
							className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
						>
							<Mail size={18} />
							{__('Shared Email', 'doublescale')}
						</TabsTrigger>
					)}
					<TabsTrigger
						value="personal"
						className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
					>
						<UserCircle size={18} />
						{__('Personal Email', 'doublescale')}
					</TabsTrigger>
					{canManage && (
						<TabsTrigger
							value="provider-setup"
							className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
						>
							<ShieldCheck size={18} />
							{__('Email Provider Setup', 'doublescale')}
						</TabsTrigger>
					)}
				</TabsList>

				{canManage && (
					<TabsContent value="shared">
						<SharedEmailComponent />
					</TabsContent>
				)}
				<TabsContent value="personal">
					<PersonalEmailComponent />
				</TabsContent>
				{canManage && (
					<TabsContent value="provider-setup">
						<EmailProviderSetupComponent />
					</TabsContent>
				)}
			</Tabs>
		</div>
	);
};

export default MailboxSettings;
