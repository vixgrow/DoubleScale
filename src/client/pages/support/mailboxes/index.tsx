/**
 * Support → Mailboxes
 *
 * CRUD over the support mailbox REST controller
 * (`/doublescale/v1/support/mailboxes`). A mailbox is a shared routing channel
 * (department) — there is no per-user mailbox. Each mailbox stores ONE sending
 * identity, `data.identity.from_email`: the From/Reply-To used to send and, for
 * an `email` (IMAP intake) box, the address inbound mail is matched against.
 * `box_type='web'` is portal/forms only; `box_type='email'` adds email intake on
 * top and is Pro-only (its toggle + IMAP status render in the Pro slot via the
 * `doublescale_support_mailbox_email_channel` filter).
 *
 * The mailbox detail uses two subtabs (Settings / Email Notifications). Each
 * mailbox owns its customer-email templates; they are pre-filled with the
 * built-in default copy (served as `meta.notification_defaults`) so operators
 * see and edit exactly what goes out.
 *
 * Visible to support-capable roles (Support Manager/Agent, CRM Manager, Admin).
 *
 * @since 1.0.0
 */

import { __, _n, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { isEmail } from 'validator';
import {
	Loader2,
	CheckCircle,
	XCircle,
	Plus,
	Trash2,
	Pencil,
	ArrowRight,
	Copy,
	Check,
	Settings as SettingsIcon,
	Mail,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';
import ConfigAPI from '@doublescale/config';
import { useNavigate, getToLink } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { FromEmailSelector } from '@/components/from-email-selector';
import type { VerifiedSender } from '@/shared/config/types/config-data';

// One customer-facing notification template.
interface NotificationTemplate {
	enabled: boolean;
	subject: string;
	body: string;
}

type NotificationMap = Record<string, NotificationTemplate>;

// A mailbox's sending identity — the From address only. From Name and Reply-To
// are derived server-side (From Name from the matching SMTP connection, Reply-To
// from the From address), never stored here.
interface MailboxIdentity {
	from_email?: string;
}

interface Mailbox {
	id: number;
	slug: string;
	email: string;
	box_type: 'web' | 'email';
	is_default: boolean;
	name: string;
	// Tickets currently routed here (the list query adds withCount); shown as
	// a row badge and used to warn before delete.
	ticket_count?: number;
	// Hoisted out of the `data` blob in fetchMailboxes so the editor can read
	// them flat.
	identity?: MailboxIdentity;
	notifications?: NotificationMap;
}

// meta.notification_defaults: event key → the built-in default { subject, body }.
type DefaultsMap = Record<string, { subject?: string; body?: string }>;

interface NoticeState {
	type: 'success' | 'error';
	message: string;
}

// The three customer-facing events. Admin/agent alerts are Pro's job, so there
// is deliberately no admin event here.
const NOTIFICATION_EVENTS: Array<{ key: string; label: string; help: string }> =
	[
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

const EMPTY_TEMPLATE: NotificationTemplate = {
	enabled: true,
	subject: '',
	body: '',
};

// Build the editor's template map by seeding each event with the built-in
// default copy (so it is always visible/editable), then overlaying the
// mailbox's own stored override where present.
const seedTemplateMap = (
	stored: any,
	defaults: DefaultsMap
): NotificationMap => {
	const out: NotificationMap = {};
	const src = stored && typeof stored === 'object' ? stored : {};
	NOTIFICATION_EVENTS.forEach((evt) => {
		const d = defaults?.[evt.key] || {};
		const base: NotificationTemplate = {
			enabled: true,
			subject: typeof d.subject === 'string' ? d.subject : '',
			body: typeof d.body === 'string' ? d.body : '',
		};
		const s = src[evt.key];
		if (typeof s === 'boolean') {
			base.enabled = s;
		} else if (s && typeof s === 'object') {
			if (s.enabled !== undefined) {
				base.enabled = !!s.enabled;
			}
			if (typeof s.subject === 'string' && s.subject.trim()) {
				base.subject = s.subject;
			}
			if (typeof s.body === 'string' && s.body.trim()) {
				base.body = s.body;
			}
		}
		out[evt.key] = base;
	});
	return out;
};

const TOKENS_HINT = __(
	'Tokens: {customer_first_name}, {ticket_title}, {ticket_id}, {ticket_status}, {site_name}, {reply_content}.',
	'doublescale'
);

const NotificationTemplatesEditor: React.FC<{
	templates: NotificationMap;
	onChange: (next: NotificationMap) => void;
}> = ({ templates, onChange }) => {
	const setTemplate = (key: string, patch: Partial<NotificationTemplate>) => {
		const current = templates[key] || EMPTY_TEMPLATE;
		onChange({ ...templates, [key]: { ...current, ...patch } });
	};

	return (
		<div className="space-y-4">
			{NOTIFICATION_EVENTS.map((evt) => {
				const tpl = templates[evt.key] || EMPTY_TEMPLATE;
				return (
					<div
						key={evt.key}
						className="rounded-lg border border-input p-4 space-y-3"
					>
						<div className="flex items-start justify-between gap-4">
							<div>
								<div className="font-medium text-gray-900">
									{evt.label}
								</div>
								<div className="text-sm text-gray-500">
									{evt.help}
								</div>
							</div>
							<Switch
								checked={tpl.enabled}
								onCheckedChange={(checked: boolean) =>
									setTemplate(evt.key, { enabled: checked })
								}
							/>
						</div>
						{tpl.enabled && (
							<div className="space-y-2">
								<Input
									type="text"
									value={tpl.subject}
									placeholder={__('Subject', 'doublescale')}
									onChange={(e) =>
										setTemplate(evt.key, {
											subject: e.target.value,
										})
									}
								/>
								<textarea
									className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									rows={5}
									value={tpl.body}
									placeholder={__('Body', 'doublescale')}
									onChange={(e) =>
										setTemplate(evt.key, {
											body: e.target.value,
										})
									}
								/>
								<p className="text-xs text-gray-400">
									{TOKENS_HINT}
								</p>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

// "Add a connection in SMTP" deep-link (no inline credential form). New
// connections are created in the SMTP module (Gmail/Outlook OAuth + custom
// SMTP), then chosen here; we never duplicate that credential form.
const AddConnectionHint: React.FC<{ forEmailBox: boolean }> = ({
	forEmailBox,
}) => {
	const navigate = useNavigate();
	const { hasRequiredCapability } = useCapabilities();
	const smtpModuleOn = ConfigAPI.isModuleEnabled('smtp');
	// SMTP REST is gated on manage_options || doublescale_crm_manager, so
	// support-only roles can't open it — show them informational text instead.
	const canManageSmtp = hasRequiredCapability([
		'manage_options',
		'doublescale_crm_manager',
	]);

	if (!smtpModuleOn) {
		return (
			<p className="text-xs text-gray-500">
				{__(
					'Enable the SMTP module to add email connections.',
					'doublescale'
				)}
			</p>
		);
	}

	if (!canManageSmtp) {
		return (
			<p className="text-xs text-gray-500">
				{__(
					'No support email found? Ask an administrator to add an email connection in SMTP settings.',
					'doublescale'
				)}
			</p>
		);
	}

	return (
		<button
			type="button"
			onClick={() => navigate(getToLink('settings/smtp'))}
			className="text-xs text-primary hover:underline inline-flex items-center gap-1"
		>
			{forEmailBox
				? __(
						"Don't see your support email? Add a Gmail/Outlook connection in SMTP settings",
						'doublescale'
					)
				: __(
						"Don't see your support email? Add an email connection in SMTP settings",
						'doublescale'
					)}
			<ArrowRight className="w-3 h-3" />
		</button>
	);
};

// Per-mailbox customer-portal shortcode. Carries the mailbox's own id so the
// portal auto-scopes: tickets created through it route to this mailbox and the
// customer sees only its tickets. Rendered by PortalFrontendHandler; this card
// is copy-only (the operator pastes it onto a page themselves).
const PortalShortcodeCard: React.FC<{ boxId: number }> = ({ boxId }) => {
	const [copied, setCopied] = useState(false);
	const shortcode = `[doublescale_support_portal box_id="${boxId}"]`;

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(shortcode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard can be unavailable (insecure context); fail silently —
			// the shortcode text is visible for manual copy regardless.
		}
	};

	return (
		<div className="rounded-lg border border-input p-4 space-y-3">
			<div>
				<div className="font-medium text-gray-900">
					{__('Customer portal', 'doublescale')}
				</div>
				<p className="text-sm text-gray-500">
					{__(
						"Paste this shortcode on any page to show this mailbox's support portal. It is visible only to logged-in customers and scopes the portal to this mailbox.",
						'doublescale'
					)}
				</p>
			</div>
			<div className="flex items-center gap-2">
				<code className="flex-1 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-gray-800">
					{shortcode}
				</code>
				<Button variant="outline" className="rounded-lg" onClick={copy}>
					{copied ? (
						<>
							<Check className="w-4 h-4 mr-1" />
							{__('Copied', 'doublescale')}
						</>
					) : (
						<>
							<Copy className="w-4 h-4 mr-1" />
							{__('Copy', 'doublescale')}
						</>
					)}
				</Button>
			</div>
		</div>
	);
};

const SupportMailboxes: React.FC = () => {
	const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
	const [smtpSenders, setSmtpSenders] = useState<VerifiedSender[]>([]);
	const [receivableEmails, setReceivableEmails] = useState<string[]>([]);
	const [notificationDefaults, setNotificationDefaults] =
		useState<DefaultsMap>({});
	const [isLoading, setIsLoading] = useState(true);
	const [notice, setNotice] = useState<NoticeState | null>(null);
	const [editing, setEditing] = useState<Partial<Mailbox> | null>(null);
	// The mailbox the operator is deleting. Deletion requires re-routing its
	// tickets to another mailbox first (mailbox_id is NOT NULL server-side), so
	// we open a destination picker instead of a bare confirm.
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [fallbackId, setFallbackId] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchMailboxes = useCallback(async () => {
		setIsLoading(true);
		try {
			const res: any = await apiFetch({
				path: '/doublescale/v1/support/mailboxes?per_page=100',
			});
			const defaults: DefaultsMap =
				res?.meta?.notification_defaults &&
				typeof res.meta.notification_defaults === 'object'
					? res.meta.notification_defaults
					: {};
			// Hoist identity + notifications out of the `data` blob to the top
			// level so the editor (which sets `editing` straight from a row) can
			// read them without digging into `data`.
			const rows: Mailbox[] = (
				Array.isArray(res?.data) ? res.data : []
			).map((mb: any) => ({
				...mb,
				identity:
					mb?.data && typeof mb.data === 'object'
						? mb.data.identity
						: undefined,
				notifications: seedTemplateMap(
					mb?.data && typeof mb.data === 'object'
						? mb.data.notifications
						: undefined,
					defaults
				),
			}));
			setMailboxes(rows);
			setNotificationDefaults(defaults);
			// Senders for the From-address picker (served ungated so support-only
			// roles get it) and the receivable subset (lower-cased) for the
			// email-channel gate.
			setSmtpSenders(
				Array.isArray(res?.meta?.smtp_senders)
					? res.meta.smtp_senders
					: []
			);
			setReceivableEmails(
				Array.isArray(res?.meta?.receivable_emails)
					? res.meta.receivable_emails.map((e: string) =>
							String(e).toLowerCase()
						)
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

	const fromEmail = (editing?.identity?.from_email || '').trim();
	const isEmailBox = (editing?.box_type || 'web') === 'email';
	const fromEmailValid = fromEmail !== '' && isEmail(fromEmail);
	const fromEmailReceivable = receivableEmails.includes(
		fromEmail.toLowerCase()
	);
	// Send capability. A customer email only goes out when its From address
	// resolves to one of the SMTP connections: the server pins that connection
	// and, if the From matches none, SKIPS + logs rather than sending under a
	// look-alike account (deterministic-or-skip). `smtp_senders` is that
	// connection set, so an address absent from it is a likely silent skip we
	// should flag. A receive-capable address is always a Gmail/Outlook OAuth
	// connection, hence implicitly send-capable too.
	const senderEmails = smtpSenders.map((s) =>
		String(s.email).toLowerCase()
	);
	const fromEmailIsKnownSender =
		senderEmails.includes(fromEmail.toLowerCase()) || fromEmailReceivable;
	// Identity (from_email) is the only From source, so it is required for every
	// box. Email (IMAP) boxes additionally require a receive-capable address —
	// mirror the server-side gate, case-insensitively.
	const saveDisabled = !fromEmailValid || (isEmailBox && !fromEmailReceivable);

	const handleSave = async () => {
		if (!editing) {
			return;
		}
		const isNew = !editing.id;
		const boxType = editing.box_type || 'web';
		try {
			await apiFetch({
				path: isNew
					? '/doublescale/v1/support/mailboxes'
					: `/doublescale/v1/support/mailboxes/${editing.id}`,
				method: isNew ? 'POST' : 'PUT',
				// `email` is never sent — the backend derives it from
				// data.identity.from_email for every box type.
				data: {
					box_type: boxType,
					is_default: !!editing.is_default,
					data: {
						name: editing.name || '',
						identity: { from_email: fromEmail },
						notifications: editing.notifications || {},
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

	// Open the delete picker for a mailbox, defaulting the destination to the
	// first OTHER mailbox so the operator can confirm in one click.
	const openDelete = (id: number) => {
		setNotice(null);
		const others = mailboxes.filter((m) => m.id !== id);
		// Default the destination to the default mailbox (the natural home for
		// re-routed tickets); fall back to the first other mailbox when the box
		// being deleted IS the default.
		const preferred = others.find((m) => m.is_default) ?? others[0] ?? null;
		setDeletingId(id);
		setFallbackId(preferred ? preferred.id : null);
	};

	const cancelDelete = () => {
		setDeletingId(null);
		setFallbackId(null);
	};

	const confirmDelete = async () => {
		if (deletingId === null || fallbackId === null) {
			return;
		}
		setIsDeleting(true);
		try {
			await apiFetch({
				path: `/doublescale/v1/support/mailboxes/${deletingId}`,
				method: 'DELETE',
				data: { fallback_id: fallbackId },
			});
			setNotice({
				type: 'success',
				message: __(
					'Mailbox deleted and its tickets re-routed.',
					'doublescale'
				),
			});
			cancelDelete();
			fetchMailboxes();
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err?.message ||
					__('Failed to delete mailbox.', 'doublescale'),
			});
		} finally {
			setIsDeleting(false);
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
								identity: { from_email: '' },
								notifications: seedTemplateMap(
									undefined,
									notificationDefaults
								),
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

			{deletingId !== null &&
				(() => {
					const target = mailboxes.find((m) => m.id === deletingId);
					const others = mailboxes.filter((m) => m.id !== deletingId);
					return (
						<Card>
							<CardContent className="p-6 space-y-5">
								<div className="space-y-1">
									<div className="font-semibold text-gray-900">
										{__('Delete mailbox', 'doublescale')}
										{target
											? ` — ${target.name || target.slug}`
											: ''}
									</div>
									<p className="text-sm text-gray-500">
										{__(
											"This mailbox's tickets must be moved to another mailbox before it can be deleted.",
											'doublescale'
										)}
									</p>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium">
										{__('Move tickets to', 'doublescale')}
									</Label>
									<select
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
										value={fallbackId ?? ''}
										onChange={(e) =>
											setFallbackId(
												e.target.value
													? Number(e.target.value)
													: null
											)
										}
									>
										{others.map((m) => (
											<option key={m.id} value={m.id}>
												{m.name || m.slug}
											</option>
										))}
									</select>
									{target?.is_default && (
										<p className="text-xs text-amber-700">
											{__(
												'This is the default mailbox — the mailbox you choose will become the new default for new tickets.',
												'doublescale'
											)}
										</p>
									)}
								</div>

								<div className="flex justify-end gap-3">
									<Button
										variant="outline"
										className="rounded-lg"
										onClick={cancelDelete}
										disabled={isDeleting}
									>
										{__('Cancel', 'doublescale')}
									</Button>
									<Button
										variant="destructive"
										className="rounded-lg min-w-[120px]"
										onClick={confirmDelete}
										disabled={
											isDeleting || fallbackId === null
										}
									>
										{isDeleting ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin mr-2" />
												{__('Deleting…', 'doublescale')}
											</>
										) : (
											__('Delete mailbox', 'doublescale')
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					);
				})()}

			{editing && (
				<Card>
					<CardContent className="p-6 space-y-5">
						<Tabs defaultValue="settings">
							<TabsList className="bg-transparent gap-2">
								<TabsTrigger
									value="settings"
									className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
								>
									<SettingsIcon size={16} />
									{__('Settings', 'doublescale')}
								</TabsTrigger>
								<TabsTrigger
									value="notifications"
									className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
								>
									<Mail size={16} />
									{__('Email Notifications', 'doublescale')}
								</TabsTrigger>
							</TabsList>

							<TabsContent
								value="settings"
								className="space-y-5 pt-4"
							>
								{/*
								 * Name and Sending identity share one row: the inputs sit
								 * half-width side by side rather than stretching across the
								 * page. The identity helper text and warnings render full
								 * width below, where they have room to read.
								 */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
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
											{__('Sending identity', 'doublescale')}
										</Label>
										<FromEmailSelector
											value={editing.identity?.from_email || ''}
											senders={smtpSenders}
											onChange={(email) =>
												setEditing((prev) => ({
													...prev,
													identity: { from_email: email },
												}))
											}
											error={
												fromEmail !== '' && !fromEmailValid
													? __(
														'Enter a valid email address.',
														'doublescale'
													)
													: undefined
											}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<p className="text-xs text-gray-500">
										{__(
											'Outgoing emails for this mailbox are sent from this address. Required to email customers.',
											'doublescale'
										)}
									</p>
									{/*
									 * Send-capability guard. The server skips (and logs) a notification
									 * whose From address matches no SMTP connection rather than sending
									 * under a look-alike account, so an unrecognised address is a likely
									 * silent skip. Warn, do not block: the support-scoped sender list
									 * may not be exhaustive.
									 */}
									{fromEmailValid && !fromEmailIsKnownSender && (
										<p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
											{__(
												"This address isn't one of your SMTP connections, so DoubleScale may not be able to send from it and customer emails could fail to deliver. Pick a connected address above, or add this one in SMTP settings.",
												'doublescale'
											)}
										</p>
									)}
									<AddConnectionHint forEmailBox={isEmailBox} />
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

								{/*
								 * Receive-tickets-by-email (IMAP / email piping)
								 * card — always rendered. Free shows the upsell
								 * default below; Pro replaces it via
								 * addFilter('doublescale_support_mailbox_email_channel', …)
								 * with a toggle (flips box_type web↔email) and the
								 * "Polling … over IMAP" / send-only status. The
								 * context carries `receivableEmails` so Pro can
								 * gate on the chosen from_email.
								 */}
								<div className="rounded-lg border border-input p-4 space-y-3">
									<div>
										<div className="font-medium text-gray-900">
											{__(
												'Receive tickets by email',
												'doublescale'
											)}
										</div>
										<p className="text-sm text-gray-500">
											{__(
												'Turn this mailbox into an email channel so incoming email opens tickets automatically.',
												'doublescale'
											)}
										</p>
									</div>
									{
										applyFilters(
											'doublescale_support_mailbox_email_channel',
											<ProFeatureNotice
												featureName={__(
													'Email channel (IMAP intake)',
													'doublescale'
												)}
												description={__(
													"Create tickets from incoming email. Inbound is polled over IMAP using the From address's own credentials (a Gmail or Outlook-connected account). Available in DoubleScale Pro.",
													'doublescale'
												)}
											/>,
											{
												editing,
												setEditing,
												receivableEmails,
											}
										) as React.ReactNode
									}
								</div>

								{editing.id ? (
									<PortalShortcodeCard boxId={editing.id} />
								) : (
									<p className="text-xs text-gray-400">
										{__(
											'Save this mailbox to get its portal shortcode.',
											'doublescale'
										)}
									</p>
								)}
							</TabsContent>

							<TabsContent
								value="notifications"
								className="space-y-4 pt-4"
							>
								<p className="text-sm text-gray-500">
									{__(
										'These customer emails are sent from this mailbox. They start from the built-in default copy — edit any of them, or switch one off to stop that email for this mailbox.',
										'doublescale'
									)}
								</p>
								<NotificationTemplatesEditor
									templates={
										editing.notifications ||
										seedTemplateMap(
											undefined,
											notificationDefaults
										)
									}
									onChange={(next) =>
										setEditing((prev) => ({
											...prev,
											notifications: next,
										}))
									}
								/>
							</TabsContent>
						</Tabs>

						<div className="flex justify-end gap-3 border-t border-input pt-5">
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
								disabled={saveDisabled}
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
													{mb.box_type === 'email'
														? __(
																'Web + Email',
																'doublescale'
															)
														: __(
																'Web',
																'doublescale'
															)}
												</span>
											</div>
											<div className="text-sm text-gray-500">
												{mb.email}
												{mb.ticket_count !== undefined && (
													<span className="ml-2 text-gray-400">
														{sprintf(
															/* translators: %d: number of tickets routed to this mailbox. */
															_n(
																'%d ticket',
																'%d tickets',
																mb.ticket_count,
																'doublescale'
															),
															mb.ticket_count
														)}
													</span>
												)}
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
												disabled={mailboxes.length <= 1}
												title={
													mailboxes.length <= 1
														? __(
																'You cannot delete the only mailbox.',
																'doublescale'
															)
														: __(
																'Delete mailbox',
																'doublescale'
															)
												}
												onClick={() =>
													openDelete(mb.id)
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

export default SupportMailboxes;
