/**
 * Settings → Support
 *
 * Two sub-tabs:
 *  - Mailboxes: CRUD over the support mailbox REST controller
 *    (`/doublescale/v1/support/mailboxes`). A mailbox is a shared routing
 *    channel (department) — there is no per-user mailbox. `box_type='web'`
 *    needs no email setup; the `box_type='email'` (IMAP intake) UI is rendered
 *    through the `doublescale_support_mailbox_email_channel` filter slot — Free
 *    supplies a ProFeatureNotice default, and Pro's support-pro bundle swaps in
 *    the real box_type toggle + connection picker (the engine reuses the CRM's
 *    inbound poll via `doublescale_email_received`, not a Support-side poller).
 *  - Notifications: outbound email toggles consumed by the PHP
 *    `Support\Services\EmailNotifications` listener.
 *
 * Visible to CRM Managers (and Admins). Mirrors the shape of the Mailbox tab.
 *
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import {
	Inbox,
	Bell,
	Loader2,
	CheckCircle,
	XCircle,
	Plus,
	Trash2,
	Pencil,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

interface MailboxIdentity {
	connection_id?: string;
}

interface Mailbox {
	id: number;
	slug: string;
	email: string;
	box_type: 'web' | 'email';
	is_default: boolean;
	name: string;
	// The mailbox's chosen sending identity, stored inside the `data` blob.
	// `connection_id` references an SMTP connection (see available_identities).
	identity?: MailboxIdentity;
}

// A sending identity the current user may bind — an SMTP connection surfaced
// by the list endpoint's `meta.available_identities` (capability-scoped server
// side: managers see all, others only their own personal connection).
interface AvailableIdentity {
	connection_id: string;
	name: string;
	from_email: string;
	from_name: string;
	is_personal: boolean;
}

interface NoticeState {
	type: 'success' | 'error';
	message: string;
}

const NOTIFICATION_TOGGLES: Array<{
	key: string;
	label: string;
	help: string;
}> = [
	{
		key: 'ticket_created_to_customer',
		label: __('Ticket received confirmation', 'doublescale'),
		help: __(
			'Email the customer when their ticket is created.',
			'doublescale'
		),
	},
	{
		key: 'reply_to_customer',
		label: __('Agent reply notification', 'doublescale'),
		help: __(
			'Email the customer when an agent replies to their ticket.',
			'doublescale'
		),
	},
	{
		key: 'status_change_to_customer',
		label: __('Resolved / closed notification', 'doublescale'),
		help: __(
			'Email the customer when their ticket is marked resolved or closed.',
			'doublescale'
		),
	},
];

const NOTIFICATION_DEFAULTS: Record<string, boolean> = {
	ticket_created_to_customer: true,
	reply_to_customer: true,
	status_change_to_customer: true,
};

// ---------------------------------------------------------------------------
// Mailboxes sub-tab
// ---------------------------------------------------------------------------

const MailboxesPanel: React.FC = () => {
	const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
	const [availableIdentities, setAvailableIdentities] = useState<
		AvailableIdentity[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [notice, setNotice] = useState<NoticeState | null>(null);
	const [editing, setEditing] = useState<Partial<Mailbox> | null>(null);

	const fetchMailboxes = useCallback(async () => {
		setIsLoading(true);
		try {
			const res: any = await apiFetch({
				path: '/doublescale/v1/support/mailboxes?per_page=100',
			});
			// Hoist the sending identity out of the `data` blob to the top level
			// so the editor (which sets `editing` straight from a row) can read
			// `editing.identity` without digging into `data`.
			const rows: Mailbox[] = (
				Array.isArray(res?.data) ? res.data : []
			).map((mb: any) => ({
				...mb,
				identity:
					mb?.data && typeof mb.data === 'object'
						? mb.data.identity
						: undefined,
			}));
			setMailboxes(rows);
			// Sending identities this user may bind, delivered alongside the
			// list (capability-scoped on the server). Drives the picker below.
			setAvailableIdentities(
				Array.isArray(res?.meta?.available_identities)
					? res.meta.available_identities
					: []
			);
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err?.message ||
					__('Failed to load mailboxes.', 'doublescale'),
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMailboxes();
	}, [fetchMailboxes]);

	const handleSave = async () => {
		if (!editing) {
			return;
		}
		const isNew = !editing.id;
		try {
			await apiFetch({
				path: isNew
					? '/doublescale/v1/support/mailboxes'
					: `/doublescale/v1/support/mailboxes/${editing.id}`,
				method: isNew ? 'POST' : 'PUT',
				data: {
					email: editing.email,
					box_type: editing.box_type || 'web',
					is_default: !!editing.is_default,
					data: {
						name: editing.name || '',
						// Persist the chosen sending identity inside `data`. Omit
						// the key entirely when none is selected (mailbox then has
						// no identity → outbound skip-sends + logs server-side).
						...(editing.identity?.connection_id
							? {
									identity: {
										connection_id:
											editing.identity.connection_id,
									},
								}
							: {}),
					},
				},
			});
			setNotice({
				type: 'success',
				message: isNew
					? __('Mailbox created.', 'doublescale')
					: __('Mailbox updated.', 'doublescale'),
			});
			setEditing(null);
			fetchMailboxes();
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err?.message ||
					__('Failed to save mailbox.', 'doublescale'),
			});
		}
	};

	const handleDelete = async (id: number) => {
		// eslint-disable-next-line no-alert
		if (!window.confirm(__('Delete this mailbox?', 'doublescale'))) {
			return;
		}
		try {
			await apiFetch({
				path: `/doublescale/v1/support/mailboxes/${id}`,
				method: 'DELETE',
			});
			setNotice({
				type: 'success',
				message: __('Mailbox deleted.', 'doublescale'),
			});
			fetchMailboxes();
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err?.message ||
					__('Failed to delete mailbox.', 'doublescale'),
			});
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="text-foreground font-semibold text-2xl">
					{__('Mailboxes', 'doublescale')}
				</div>
				{!editing && (
					<Button
						variant="gradient"
						className="rounded-lg"
						onClick={() =>
							setEditing({
								box_type: 'web',
								is_default: mailboxes.length === 0,
							})
						}
					>
						<Plus className="w-4 h-4 mr-2" />
						{__('Add mailbox', 'doublescale')}
					</Button>
				)}
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

			{editing && (
				<Card>
					<CardContent className="p-6 space-y-5">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									{__('Name', 'doublescale')}
								</Label>
								<Input
									type="text"
									value={editing.name || ''}
									placeholder={__(
										'e.g. Sales',
										'doublescale'
									)}
									onChange={(e) =>
										setEditing((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									{__('Email', 'doublescale')}
								</Label>
								<Input
									type="email"
									value={editing.email || ''}
									placeholder="support@example.com"
									onChange={(e) =>
										setEditing((prev) => ({
											...prev,
											email: e.target.value,
										}))
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									{__('Support channel', 'doublescale')}
								</Label>
								{/*
								 * Free shows a single, visible "Web" channel (portal /
								 * form intake). The Email (IMAP) channel is added by
								 * Pro through the filter slot below — absent in Free,
								 * matching Fluent Support's free/pro tiering.
								 */}
								<div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-gray-700">
									{__('Web — portal / form', 'doublescale')}
								</div>
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									{__('Sender identity', 'doublescale')}
								</Label>
								{availableIdentities.length > 0 ? (
									<select
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
										value={
											editing.identity?.connection_id ||
											''
										}
										onChange={(e) =>
											setEditing((prev) => ({
												...prev,
												identity: e.target.value
													? {
															connection_id:
																e.target.value,
														}
													: undefined,
											}))
										}
									>
										<option value="">
											{__(
												'Select a sending identity…',
												'doublescale'
											)}
										</option>
										{availableIdentities.map((idn) => (
											<option
												key={idn.connection_id}
												value={idn.connection_id}
											>
												{idn.from_name
													? `${idn.from_name} <${idn.from_email}>`
													: idn.from_email}
												{idn.is_personal
													? __(
															' (personal)',
															'doublescale'
														)
													: ''}
											</option>
										))}
									</select>
								) : (
									<div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
										{__(
											'No sending identity available. Connect an email in SMTP settings, or ask an administrator.',
											'doublescale'
										)}
									</div>
								)}
								<p className="text-xs text-gray-500">
									{__(
										'Outgoing replies for this mailbox are sent from this address. Required to email customers.',
										'doublescale'
									)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Switch
								checked={!!editing.is_default}
								onCheckedChange={(checked: boolean) =>
									setEditing((prev) => ({
										...prev,
										is_default: checked,
									}))
								}
							/>
							<span className="text-sm text-gray-700">
								{__(
									'Default mailbox for new tickets',
									'doublescale'
								)}
							</span>
						</div>

						{
							/*
							 * Email-channel (IMAP intake) slot. Free renders the
							 * upsell; Pro's support-pro bundle replaces it via
							 * `addFilter('doublescale_support_mailbox_email_channel', …)`
							 * with the real box_type toggle. The default value below
							 * is what shows when Pro is absent, so Free standalone is
							 * unchanged.
							 *
							 * Context passed to Pro:
							 *  - `editing` / `setEditing` — read & mutate the mailbox
							 *    row currently being edited.
							 *  - `availableIdentities` — the same capability-scoped
							 *    connection list that backs the Sender-identity picker
							 *    above. Pro's Email channel MIRRORS that chosen
							 *    identity for inbound (one connection = From + inbox,
							 *    like the global Mailbox tab), so it needs the list to
							 *    resolve the selected `connection_id` → display email
							 *    for its "Receiving via …" confirmation.
							 */
							applyFilters(
								'doublescale_support_mailbox_email_channel',
								<ProFeatureNotice
									featureName={__(
										'Email channel (IMAP intake)',
										'doublescale'
									)}
									description={__(
										'Turn a mailbox into an email channel so tickets are created from incoming email via IMAP polling. Reuses the Sender-identity SMTP connection for both sending and receiving. Available in DoubleScale Pro.',
										'doublescale'
									)}
								/>,
								{ editing, setEditing, availableIdentities }
							) as React.ReactNode
						}

						<div className="flex justify-end gap-3">
							<Button
								variant="outline"
								className="rounded-lg"
								onClick={() => setEditing(null)}
							>
								{__('Cancel', 'doublescale')}
							</Button>
							<Button
								variant="gradient"
								className="rounded-lg min-w-[120px]"
								onClick={handleSave}
								disabled={
									availableIdentities.length > 0 &&
									!editing.identity?.connection_id
								}
							>
								{__('Save', 'doublescale')}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{!editing && (
				<Card>
					<CardContent className="p-0">
						{mailboxes.length === 0 ? (
							<div className="p-8 text-center text-gray-500">
								{__(
									'No mailboxes yet. Add one to start routing tickets.',
									'doublescale'
								)}
							</div>
						) : (
							<ul className="divide-y">
								{mailboxes.map((mb) => (
									<li
										key={mb.id}
										className="flex items-center justify-between px-6 py-4"
									>
										<div>
											<div className="font-medium text-gray-900 flex items-center gap-2">
												{mb.name || mb.slug}
												{mb.is_default && (
													<span className="text-xs rounded bg-indigo-50 text-indigo-700 px-2 py-0.5">
														{__(
															'Default',
															'doublescale'
														)}
													</span>
												)}
												<span className="text-xs rounded bg-gray-100 text-gray-600 px-2 py-0.5">
													{mb.box_type}
												</span>
											</div>
											<div className="text-sm text-gray-500">
												{mb.email}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setEditing(mb)}
											>
												<Pencil className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													handleDelete(mb.id)
												}
											>
												<Trash2 className="w-4 h-4 text-red-500" />
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
};

// ---------------------------------------------------------------------------
// Notifications sub-tab
// ---------------------------------------------------------------------------

const NotificationsPanel: React.FC = () => {
	const [toggles, setToggles] = useState<Record<string, boolean>>(
		NOTIFICATION_DEFAULTS
	);
	// The `/support/settings` endpoint merges notifications into the support
	// blob server-side, so the panel only needs to hold the toggle map.
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [notice, setNotice] = useState<NoticeState | null>(null);

	const fetchSettings = useCallback(async () => {
		setIsLoading(true);
		try {
			// Dedicated, support-scoped endpoint (gated on `doublescale_view_support`)
			// so every support role can read these toggles without touching the
			// global `/settings` blob, which stays CRM-manager-only.
			const res: any = await apiFetch({
				path: '/doublescale/v1/support/settings',
			});
			const stored = res?.notifications || {};
			setToggles({ ...NOTIFICATION_DEFAULTS, ...stored });
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err?.message ||
					__('Failed to load settings.', 'doublescale'),
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
				path: '/doublescale/v1/support/settings',
				method: 'POST',
				data: { notifications: toggles },
			});
			setNotice({
				type: 'success',
				message: __('Notification settings saved.', 'doublescale'),
			});
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err?.message ||
					__('Failed to save settings.', 'doublescale'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-foreground font-semibold text-2xl">
				{__('Email notifications', 'doublescale')}
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
					{NOTIFICATION_TOGGLES.map((t) => (
						<div
							key={t.key}
							className="flex items-start justify-between gap-4"
						>
							<div>
								<div className="font-medium text-gray-900">
									{t.label}
								</div>
								<div className="text-sm text-gray-500">
									{t.help}
								</div>
							</div>
							<Switch
								checked={toggles[t.key] ?? true}
								onCheckedChange={(checked: boolean) =>
									setToggles((prev) => ({
										...prev,
										[t.key]: checked,
									}))
								}
							/>
						</div>
					))}
					<div className="flex justify-end">
						<Button
							variant="gradient"
							className="rounded-lg min-w-[140px]"
							disabled={isSaving}
							onClick={handleSave}
						>
							{isSaving ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
									{__('Saving…', 'doublescale')}
								</>
							) : (
								__('Save', 'doublescale')
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

// ---------------------------------------------------------------------------
// Tab shell
// ---------------------------------------------------------------------------

const SupportSettings: React.FC = () => {
	const [activeTab, setActiveTab] = useState('mailboxes');

	return (
		<div className="space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="bg-transparent gap-2">
					<TabsTrigger
						value="mailboxes"
						className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
					>
						<Inbox size={18} />
						{__('Mailboxes', 'doublescale')}
					</TabsTrigger>
					<TabsTrigger
						value="notifications"
						className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
					>
						<Bell size={18} />
						{__('Notifications', 'doublescale')}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="mailboxes">
					<MailboxesPanel />
				</TabsContent>
				<TabsContent value="notifications">
					<NotificationsPanel />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default SupportSettings;
