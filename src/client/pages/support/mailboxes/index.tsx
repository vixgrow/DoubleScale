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
	MoreVertical,
	Info,
	FolderCheck,
	Bell,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';
import ConfigAPI from '@doublescale/config';
import { useNavigate, getToLink } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { FromEmailSelector } from '@/components/from-email-selector';
import SupportRichText from '@/components/editor/support-rich-text';
import { htmlEditorHasMeaningfulContent } from '@/components/editor/utils';
import type { VerifiedSender } from '@/shared/config/types/config-data';
import AttachmentLimitsCard from './attachment-limits-card';

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

// Custom-IMAP receive credentials for an email channel whose From address is NOT
// a Gmail/Outlook OAuth account. Stored under `data.imap`; the password is
// encrypted server-side and only ever arrives here masked as '********'. Hoisted
// to a top-level `editing.imap` on load (like `identity`) and re-nested on save.
interface MailboxImap {
	host?: string;
	port?: number;
	encryption?: 'ssl' | 'tls' | 'none';
	username?: string;
	password?: string;
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
	imap?: MailboxImap;
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
			// Use the meaningful-content check (not a bare trim) so a
			// legacy empty Lexical body (`<p><br></p>`) is treated as
			// blank and falls back to the built-in default copy instead
			// of rendering an empty paragraph in the customer email.
			if (
				typeof s.body === 'string' &&
				htmlEditorHasMeaningfulContent(s.body)
			) {
				base.body = s.body;
			}
		}
		out[evt.key] = base;
	});
	return out;
};

const TOKENS_HINT = __(
	'Tokens: {customer_full_name}, {customer_first_name}, {ticket_title}, {ticket_id}, {ticket_status}, {ticket_public_url}, {site_name}, {reply_content}. {ticket_public_url} needs a published WordPress page containing the [doublescale_support_portal] shortcode.',
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
								<SupportRichText
									message={tpl.body}
									placeholder={__('Body', 'doublescale')}
									onChange={(html) =>
										setTemplate(evt.key, {
											// Normalize Lexical's empty `<p><br></p>` to
											// '' so clearing the body reverts to the
											// built-in default on reload (seedTemplateMap
											// keeps a body only when it has real content).
											// Otherwise an "empty" editor would persist a
											// blank paragraph as the email body.
											body: htmlEditorHasMeaningfulContent(
												html
											)
												? html
												: '',
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
	const navigate = useNavigate();
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
	const [movingId, setMovingId] = useState<number | null>(null);
	const [moveDestinationId, setMoveDestinationId] = useState<number | null>(
		null
	);
	const [isMoving, setIsMoving] = useState(false);
	const [settingDefaultId, setSettingDefaultId] = useState<number | null>(
		null
	);

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
				// Hoist custom-IMAP creds flat (password arrives masked). Same
				// pattern as identity; re-nested under `data` on save.
				imap:
					mb?.data &&
					typeof mb.data === 'object' &&
					mb.data.imap &&
					typeof mb.data.imap === 'object'
						? mb.data.imap
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
	// An email box can receive either via an OAuth From address OR via a complete
	// custom-IMAP block (host + username + password). Mirrors the server-side
	// receivability gate. The password may be the masked '********' sentinel for a
	// saved box, which still counts as "present".
	const hasCustomImap =
		!!editing?.imap &&
		String(editing.imap.host || '').trim() !== '' &&
		String(editing.imap.username || '').trim() !== '' &&
		String(editing.imap.password || '').trim() !== '';
	// Identity (from_email) is the only From source, so it is required for every
	// box. Email (IMAP) boxes additionally require a receivable address OR custom
	// IMAP credentials — mirror the server-side gate, case-insensitively.
	const saveDisabled =
		!fromEmailValid ||
		(isEmailBox && !fromEmailReceivable && !hasCustomImap);

	const handleSave = async () => {
		if (!editing) {
			return;
		}
		const isNew = !editing.id;
		if (isNew && mailboxes.length >= 1) {
			setNotice({
				type: 'error',
				message: __(
					'Only one mailbox is allowed.',
					'doublescale'
				),
			});
			return;
		}
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
						// Re-nest the hoisted custom-IMAP block. Only sent for an
						// email box that actually has one; a masked password rides
						// through unchanged ('********' = keep stored, server-side).
						...(boxType === 'email' && editing.imap
							? { imap: editing.imap }
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

	// Open the delete picker for a mailbox, defaulting the destination to the
	// first OTHER mailbox so the operator can confirm in one click.
	const openDelete = (id: number) => {
		const target = mailboxes.find((m) => m.id === id);
		if (target?.is_default || mailboxes.length <= 1) {
			return;
		}
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

	const handleSetAsDefault = async (id: number) => {
		setNotice(null);
		setSettingDefaultId(id);
		try {
			await apiFetch({
				path: `/doublescale/v1/support/mailboxes/${id}`,
				method: 'PUT',
				data: { is_default: true },
			});
			setNotice({
				type: 'success',
				message: __(
					'Mailbox set as default for new tickets.',
					'doublescale'
				),
			});
			fetchMailboxes();
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err?.message ||
					__('Failed to set default mailbox.', 'doublescale'),
			});
		} finally {
			setSettingDefaultId(null);
		}
	};

	const openMoveTickets = (id: number) => {
		setNotice(null);
		const others = mailboxes.filter((m) => m.id !== id);
		const preferred = others.find((m) => m.is_default) ?? others[0] ?? null;
		setMovingId(id);
		setMoveDestinationId(preferred ? preferred.id : null);
	};

	const cancelMoveTickets = () => {
		setMovingId(null);
		setMoveDestinationId(null);
	};

	const confirmMoveTickets = async () => {
		if (movingId === null || moveDestinationId === null) {
			return;
		}
		setIsMoving(true);
		try {
			const res: any = await apiFetch({
				path: `/doublescale/v1/support/mailboxes/${movingId}/move-tickets`,
				method: 'POST',
				data: { new_box_id: moveDestinationId },
			});
			const moved = Number(res?.moved ?? 0);
			setNotice({
				type: 'success',
				message: sprintf(
					/* translators: %d: number of tickets moved. */
					_n(
						'%d ticket moved to the selected mailbox.',
						'%d tickets moved to the selected mailbox.',
						moved,
						'doublescale'
					),
					moved
				),
			});
			cancelMoveTickets();
			fetchMailboxes();
		} catch (err: any) {
			setNotice({
				type: 'error',
				message:
					err?.message ||
					__('Failed to move tickets.', 'doublescale'),
			});
		} finally {
			setIsMoving(false);
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
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="text-foreground font-semibold text-2xl">
						{__('Mailboxes', 'doublescale')}
					</div>
					<button
						type="button"
						onClick={() =>
							navigate(
								getToLink('settings/notifications/support')
							)
						}
						className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
					>
						<Bell className="w-3.5 h-3.5" />
						{__(
							'Manage your support notification settings',
							'doublescale'
						)}
						<ArrowRight className="w-3 h-3" />
					</button>
				</div>
				{!editing && mailboxes.length === 0 && (
					<Button
						variant="gradient"
						className="rounded-lg"
						onClick={() =>
							setEditing({
								box_type: 'web',
								is_default: true,
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

			<Dialog
				open={deletingId !== null}
				onOpenChange={(open) => {
					if (!open) {
						cancelDelete();
					}
				}}
			>
				<DialogContent className="max-w-lg rounded-xl">
					{deletingId !== null &&
						(() => {
							const target = mailboxes.find(
								(m) => m.id === deletingId
							);
							const others = mailboxes.filter(
								(m) => m.id !== deletingId
							);
							return (
								<>
									<DialogHeader>
										<DialogTitle>
											{__(
												'Are You Sure? You can not undo this action.',
												'doublescale'
											)}
										</DialogTitle>
									</DialogHeader>

									<div className="space-y-2">
										<Label className="text-sm font-medium inline-flex items-center gap-1.5">
											{__(
												'Move existing tickets to',
												'doublescale'
											)}
											<span
												className="text-muted-foreground"
												title={__(
													'Please select the mailbox where the existing tickets will be transferred.',
													'doublescale'
												)}
											>
												<Info className="w-3.5 h-3.5" />
											</span>
										</Label>
										<Select
											value={
												fallbackId !== null
													? String(fallbackId)
													: undefined
											}
											onValueChange={(value) =>
												setFallbackId(Number(value))
											}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={__(
														'Select mailbox',
														'doublescale'
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												{others.map((m) => (
													<SelectItem
														key={m.id}
														value={String(m.id)}
													>
														{m.name || m.slug}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<p className="text-xs text-muted-foreground">
											{__(
												'Please select the mailbox where the existing tickets will be transferred.',
												'doublescale'
											)}
										</p>
									</div>

									<DialogFooter className="gap-2 sm:gap-0">
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
											className="rounded-lg"
											onClick={confirmDelete}
											disabled={
												isDeleting ||
												fallbackId === null
											}
										>
											{isDeleting ? (
												<>
													<Loader2 className="w-4 h-4 animate-spin mr-2" />
													{__(
														'Deleting…',
														'doublescale'
													)}
												</>
											) : (
												sprintf(
													/* translators: %s: mailbox name. */
													__(
														'Confirm Delete %s',
														'doublescale'
													),
													target?.name ||
														target?.slug ||
														__('Mailbox', 'doublescale')
												)
											)}
										</Button>
									</DialogFooter>
								</>
							);
						})()}
				</DialogContent>
			</Dialog>

			<Dialog
				open={movingId !== null}
				onOpenChange={(open) => {
					if (!open) {
						cancelMoveTickets();
					}
				}}
			>
				<DialogContent className="max-w-lg rounded-xl">
					{movingId !== null &&
						(() => {
							const source = mailboxes.find(
								(m) => m.id === movingId
							);
							const others = mailboxes.filter(
								(m) => m.id !== movingId
							);
							return (
								<>
									<DialogHeader>
										<DialogTitle>
											{__('Move tickets', 'doublescale')}
											{source
												? ` — ${source.name || source.slug}`
												: ''}
										</DialogTitle>
									</DialogHeader>

									<div className="space-y-2">
										<Label className="text-sm font-medium">
											{__(
												'Move tickets to',
												'doublescale'
											)}
										</Label>
										<Select
											value={
												moveDestinationId !== null
													? String(moveDestinationId)
													: undefined
											}
											onValueChange={(value) =>
												setMoveDestinationId(
													Number(value)
												)
											}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={__(
														'Select mailbox',
														'doublescale'
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												{others.map((m) => (
													<SelectItem
														key={m.id}
														value={String(m.id)}
													>
														{m.name || m.slug}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{source?.ticket_count !== undefined &&
											source.ticket_count > 0 && (
												<p className="text-xs text-muted-foreground">
													{sprintf(
														/* translators: %d: number of tickets. */
														_n(
															'%d ticket will be moved.',
															'%d tickets will be moved.',
															source.ticket_count,
															'doublescale'
														),
														source.ticket_count
													)}
												</p>
											)}
									</div>

									<DialogFooter className="gap-2 sm:gap-0">
										<Button
											variant="outline"
											className="rounded-lg"
											onClick={cancelMoveTickets}
											disabled={isMoving}
										>
											{__('Cancel', 'doublescale')}
										</Button>
										<Button
											variant="gradient"
											className="rounded-lg"
											onClick={confirmMoveTickets}
											disabled={
												isMoving ||
												moveDestinationId === null
											}
										>
											{isMoving ? (
												<>
													<Loader2 className="w-4 h-4 animate-spin mr-2" />
													{__(
														'Moving…',
														'doublescale'
													)}
												</>
											) : (
												__('Move tickets', 'doublescale')
											)}
										</Button>
									</DialogFooter>
								</>
							);
						})()}
				</DialogContent>
			</Dialog>

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

								<div className="space-y-1">
									<div className="flex items-center gap-3">
										<Switch
											checked={!!editing.is_default}
											disabled={
												!!editing.id &&
												!!editing.is_default
											}
											onCheckedChange={(
												checked: boolean
											) =>
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
									{!!editing.id && !!editing.is_default && (
										<p className="text-xs text-muted-foreground pl-11">
											{__(
												'Set another mailbox as default before unsetting this one.',
												'doublescale'
											)}
										</p>
									)}
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
													'Create tickets from incoming email. Inbound is polled over IMAP using a Gmail or Outlook-connected account, or any mailbox via custom IMAP credentials. Available in DoubleScale Pro.',
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
										<div className="flex items-center gap-1">
											<Button
												variant="outline"
												size="icon"
												className="h-9 w-9 rounded-lg"
												onClick={() => setEditing(mb)}
												aria-label={__(
													'Edit mailbox',
													'doublescale'
												)}
											>
												<SettingsIcon className="w-4 h-4" />
											</Button>
											{mailboxes.length > 1 && (
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-9 w-9"
															aria-label={__(
																'More options',
																'doublescale'
															)}
														>
															<MoreVertical className="w-4 h-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														className="min-w-[10rem]"
													>
														{!mb.is_default && (
															<DropdownMenuItem
																className="cursor-pointer gap-2"
																onSelect={() =>
																	handleSetAsDefault(
																		mb.id
																	)
																}
																disabled={
																	settingDefaultId ===
																	mb.id
																}
															>
																{settingDefaultId ===
																mb.id ? (
																	<Loader2 className="w-4 h-4 animate-spin" />
																) : (
																	<FolderCheck className="w-4 h-4" />
																)}
																{__(
																	'Set as Default',
																	'doublescale'
																)}
															</DropdownMenuItem>
														)}
														<DropdownMenuItem
															className="cursor-pointer gap-2"
															onSelect={() =>
																openMoveTickets(
																	mb.id
																)
															}
														>
															<Pencil className="w-4 h-4" />
															{__(
																'Move Tickets',
																'doublescale'
															)}
														</DropdownMenuItem>
														<DropdownMenuItem
															className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
															onSelect={() =>
																openDelete(mb.id)
															}
															disabled={
																mb.is_default
															}
														>
															<Trash2 className="w-4 h-4" />
															{__(
																'Delete',
																'doublescale'
															)}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											)}
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			)}

			{!editing && <AttachmentLimitsCard onNotice={setNotice} />}
		</div>
	);
};

export default SupportMailboxes;
