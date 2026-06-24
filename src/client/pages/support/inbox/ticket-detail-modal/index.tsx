/**
 * Full-screen ticket detail dialog — layout mirrors deal-detail-modal:
 * left summary + overview/custom fields, right conversation + composer.
 */

import { useState, useEffect } from '@wordpress/element';
import type { FC, ReactNode } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { Calendar, ChevronRight, Loader2, Mail, Sparkles } from 'lucide-react';

import ConfigAPI from '@doublescale/config';
import { getToLink } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import EditHeaderIcon from '@doublescale/shared/icons/edit-header';
import TrashIcon from '@doublescale/shared/icons/trash';
import { Input } from '@doublescale/components/ui/input';
import {
	DealCalenderIcon,
	NoteAddIcon,
	TagField,
} from '@doublescale/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	useTicket,
	useConversation,
	useAssignableAgents,
	useMailboxes,
	useAttachmentLimits,
	addReply,
	addNote,
	updateTicket,
	deleteTicket,
	uploadAttachment,
} from '@/hooks/support';
import {
	StatusPill,
	PriorityPill,
	AttachmentUploader,
	AttachmentList,
	CcRecipientsInput,
	toPendingAttachment,
	revokePendingPreviews,
	removePendingByHash,
	type PendingAttachment,
} from '@/components/support';
import SupportRichText from '@/components/editor/support-rich-text';
import { htmlEditorHasMeaningfulContent } from '@/components/editor/utils';
import {
	TICKET_STATUSES,
	TICKET_PRIORITIES,
	type TicketPriority,
	type TicketStatus,
} from '@/constants/support';
import type { ConversationItem } from '@/types/support';
import { EmailIcon, ReplyIcon } from '@/components/booking';
import CommentIcon from '@doublescale/shared/icons/comment';


export interface TicketDetailModalProps {
	ticketId: number | null;
	visible: boolean;
	onClose: () => void;
	onUpdate?: () => void;
	onDeleted?: () => void;
	removePortal?: boolean;
	navigate?: (path: string) => void;
}

type OverviewField =
	| 'title'
	| 'mailbox'
	| 'assignee'
	| 'tags'
	| 'status'
	| 'priority'
	| null;

const CARD_SHADOW = '0px 4px 20px 0px rgba(59, 130, 246, 0.14)';
const CARD_SHADOW_CLASS = 'shadow-[0px_4px_20px_0px_rgba(59,130,246,0.14)]';
const TAB_ICON_ACTIVE = '#3A3A99';
const TAB_ICON_INACTIVE = '#667085';

const formatTicketDate = (raw: string | null): string => {
	if (!raw) {
		return '';
	}
	try {
		const d = new Date(raw + 'Z');
		return d.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	} catch {
		return raw;
	}
};

const formatMessageTime = (raw: string | null): string => {
	if (!raw) {
		return '';
	}
	try {
		return new Date(raw + 'Z').toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return raw;
	}
};

const eventDescription = (item: ConversationItem): string => {
	const key = item.data.event_key ?? 'unknown';
	if (key === 'tags_changed') {
		const added = Array.isArray(item.data.added) ? item.data.added : [];
		const removed = Array.isArray(item.data.removed)
			? item.data.removed
			: [];
		if (added.length && removed.length) {
			return sprintf(
				__('Tags updated: added %1$s, removed %2$s', 'doublescale'),
				added.join(', '),
				removed.join(', ')
			);
		}
		if (added.length) {
			return sprintf(
				__('Tags added: %s', 'doublescale'),
				added.join(', ')
			);
		}
		if (removed.length) {
			return sprintf(
				__('Tags removed: %s', 'doublescale'),
				removed.join(', ')
			);
		}
		return __('Tags updated', 'doublescale');
	}
	const from = item.data.from ?? null;
	const to = item.data.to ?? null;
	const label = key.replace(/_/g, ' ');
	if (from !== null && to !== null) {
		return `${label}: ${String(from)} → ${String(to)}`;
	}
	return label;
};

const AvatarInitial: FC<{ name: string }> = ({ name }) => (
	<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#458DC7] text-xs font-semibold text-white">
		{name.charAt(0).toUpperCase() || '?'}
	</div>
);

const ConversationBubble: FC<{
	item: ConversationItem;
	customerName?: string;
}> = ({ item, customerName }) => {
	if (item.kind === 'event') {
		return (
			<div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
				<span className="h-px flex-1 bg-border" />
				<span className="italic">{eventDescription(item)}</span>
				<span className="h-px flex-1 bg-border" />
			</div>
		);
	}

	const isNote = item.kind === 'note';
	const isAgent = !!item.user;
	const authorLabel = item.user
		? item.user.display_name
		: customerName || __('Customer', 'doublescale');
	const time = formatMessageTime(item.created_at);

	const bubbleContent = (
		<>
			<div
				className="prose prose-sm max-w-none text-[#09090B]"
				/* eslint-disable-next-line react/no-danger -- sanitized at write time via wp_kses_post */
				dangerouslySetInnerHTML={{
					__html:
						typeof item.data.content === 'string'
							? item.data.content
							: '',
				}}
			/>
			{!isNote && item.cc && item.cc.length > 0 && (
				<div className="mt-2 text-xs text-muted-foreground">
					<span className="font-medium">
						{__('Cc:', 'doublescale')}
					</span>{' '}
					{item.cc.join(', ')}
				</div>
			)}
			<AttachmentList attachments={item.attachments} />
			<p className="mt-1 text-right text-xs text-[#667085]">{time}</p>
		</>
	);

	if (isNote) {
		return (
			<div className="flex justify-start gap-2 ">
				<AvatarInitial name={authorLabel} />
				<div className="max-w-[75%] bg-[#FFF4ED] p-3 rounded-lg rounded-t-none">
					<div className="mb-1 flex flex-wrap items-center gap-2">
						<p className="text-xs font-semibold text-[#09090B]">
							{authorLabel}
						</p>
						<span className="inline-flex items-center rounded-md bg-[#FAEADF] px-2 py-1 text-xs font-medium text-[#CB5301]">
							{__('Internal note', 'doublescale')}
						</span>
					</div>
					<div className="">{bubbleContent}</div>
				</div>
			</div>
		);
	}

	if (isAgent) {
		return (
			<div className="flex justify-start gap-2">
				<AvatarInitial name={authorLabel} />
				<div className="max-w-[75%] bg-[#F7F8FA] p-3 rounded-lg rounded-t-none">
					<p className="mb-1 text-xs font-semibold text-[#09090B]">
						{authorLabel}
					</p>
					<div className="">{bubbleContent}</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex justify-end">
			<div className="max-w-[75%] bg-[#F7F8FA] p-3 rounded-lg rounded-t-none">
				<div className="">
					<p className="mb-1 text-right text-xs font-medium text-[#667085]">
						{authorLabel}
					</p>
					{bubbleContent}
				</div>
			</div>
		</div>
	);
};

const OverviewEditButton: FC<{
	onClick: () => void;
	label: string;
}> = ({ onClick, label }) => (
	<button
		type="button"
		className="flex shrink-0 items-center justify-center rounded-full bg-[#E8E2FB] p-1 text-brandPrimary hover:bg-brandPrimary/15"
		onClick={onClick}
		aria-label={label}
	>
		<EditHeaderIcon color="#3A3A99" />
	</button>
);

export const TicketDetailModal: FC<TicketDetailModalProps> = ({
	ticketId,
	visible,
	onClose,
	onUpdate,
	onDeleted,
	removePortal = false,
	navigate,
}) => {
	const {
		data: ticket,
		loading: ticketLoading,
		refetch: refetchTicket,
	} = useTicket(visible ? ticketId : null);
	const { data: conversation, refetch: refetchConversation } =
		useConversation(visible ? ticketId : null);
	const { data: assignableAgents } = useAssignableAgents();
	const { data: mailboxes } = useMailboxes();
	const { limits: attachmentLimits } = useAttachmentLimits();
	const canManageAllTickets = useCapabilities().canManageAllTickets();

	const [showView, setShowView] = useState<'overview' | 'custom'>('overview');
	const [editingField, setEditingField] = useState<OverviewField>(null);
	const [tempTitle, setTempTitle] = useState('');
	const [tab, setTab] = useState<'reply' | 'note'>('reply');
	const [content, setContent] = useState('');
	const [cc, setCc] = useState<string[]>([]);
	const [showCc, setShowCc] = useState(false);
	const [sending, setSending] = useState(false);
	const [uploading, setUploading] = useState(false);
	const aiConfigured = ConfigAPI.isAiConfigured();
	const [aiPanelOpen, setAiPanelOpen] = useState(false);
	const [aiInstruction, setAiInstruction] = useState('');
	const [aiDrafting, setAiDrafting] = useState(false);
	const [aiError, setAiError] = useState<string | null>(null);
	const [pendingAttachments, setPendingAttachments] = useState<
		PendingAttachment[]
	>([]);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [pendingItems, setPendingItems] = useState<ConversationItem[]>([]);
	const [deleting, setDeleting] = useState(false);
	const [tagNames, setTagNames] = useState<Record<number, string>>({});

	useEffect(() => {
		if (!visible) {
			setShowView('overview');
			setEditingField(null);
			setTab('reply');
			setContent('');
			setCc([]);
			setShowCc(false);
			setFeedback(null);
			setPendingItems([]);
		}
	}, [visible]);

	useEffect(() => {
		apiFetch<{ data?: Array<{ id: number; name: string }> }>({
			path: '/doublescale/v1/tags?per_page=100',
		})
			.then((res) => {
				const map: Record<number, string> = {};
				(Array.isArray(res?.data) ? res.data : []).forEach((t) => {
					map[t.id] = t.name;
				});
				setTagNames(map);
			})
			.catch(() => setTagNames({}));
	}, []);

	const refresh = () => {
		refetchTicket();
		refetchConversation();
		onUpdate?.();
	};

	const handleSaveTitle = async () => {
		if (!ticketId || !tempTitle.trim()) {
			setEditingField(null);
			return;
		}
		await updateTicket(ticketId, { title: tempTitle.trim() });
		setEditingField(null);
		refresh();
	};

	const handleDraftWithAI = async () => {
		if (!ticketId) return;
		setAiDrafting(true);
		setAiError(null);
		try {
			const response = (await apiFetch({
				path: '/doublescale/v1/ai/draft-ticket-reply',
				method: 'POST',
				data: {
					ticket_id: ticketId,
					instruction: aiInstruction.trim(),
					tone: 'professional',
				},
			})) as { success: boolean; text: string };
			if (response.text) {
				setContent(response.text);
				setTab('reply');
				setAiPanelOpen(false);
				setAiInstruction('');
			}
		} catch (err) {
			setAiError(
				(err as { message?: string })?.message ||
					__(
						'Failed to draft a reply. Please try again.',
						'doublescale'
					)
			);
		} finally {
			setAiDrafting(false);
		}
	};

	const handleSend = async () => {
		if (!ticketId || !htmlEditorHasMeaningfulContent(content)) {
			setFeedback(__('Please type something first.', 'doublescale'));
			return;
		}
		setSending(true);
		setFeedback(null);
		const replyCc = tab === 'reply' && cc.length > 0 ? cc : undefined;
		const optimistic: ConversationItem = {
			id: -Date.now(),
			kind: tab,
			type: tab === 'reply' ? 'support_reply' : 'support_note',
			contact_id: null,
			user_id: null,
			data: {
				content,
				source: 'web',
				...(replyCc ? { cc: replyCc } : {}),
			},
			cc: replyCc,
			created_at: new Date()
				.toISOString()
				.replace('T', ' ')
				.split('.')[0],
			updated_at: null,
			user: null,
		};
		setPendingItems((prev) => [...prev, optimistic]);
		const draftContent = content;
		const draftCc = cc;
		const sentAttachments = pendingAttachments;
		const attachmentHashes = pendingAttachments.map((a) => a.file_hash);
		setContent('');
		setCc([]);
		setShowCc(false);
		setPendingAttachments([]);

		try {
			const payload = {
				content: draftContent,
				attachment_hashes:
					attachmentHashes.length > 0 ? attachmentHashes : undefined,
				...(replyCc ? { cc: replyCc } : {}),
			};
			if (tab === 'reply') {
				await addReply(ticketId, payload);
			} else {
				await addNote(ticketId, payload);
			}
			refresh();
			revokePendingPreviews(sentAttachments);
			setPendingItems((prev) =>
				prev.filter((p) => p.id !== optimistic.id)
			);
		} catch (err) {
			setFeedback(
				(err as { message?: string })?.message ?? 'Send failed'
			);
			setPendingItems((prev) =>
				prev.filter((p) => p.id !== optimistic.id)
			);
			setContent(draftContent);
			if (draftCc.length > 0) {
				setCc(draftCc);
				setShowCc(true);
			}
			setPendingAttachments(sentAttachments);
		} finally {
			setSending(false);
		}
	};

	const handleAttachmentSelect = async (file: File) => {
		if (!ticketId) return;
		setUploading(true);
		setFeedback(null);
		try {
			const result = await uploadAttachment(
				ticketId,
				file,
				pendingAttachments.length
			);
			setPendingAttachments((prev) => [
				...prev,
				toPendingAttachment(result, file),
			]);
		} catch (err) {
			setFeedback(
				(err as { message?: string })?.message ?? 'Upload failed'
			);
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async () => {
		if (!ticketId) return;
		// eslint-disable-next-line no-alert
		if (
			!confirm(
				__('Delete this ticket? This cannot be undone.', 'doublescale')
			)
		) {
			return;
		}
		setDeleting(true);
		try {
			await deleteTicket(ticketId);
			onDeleted?.();
			onClose();
		} catch (err) {
			setFeedback(
				(err as { message?: string })?.message ?? 'Delete failed'
			);
			setDeleting(false);
		}
	};

	const handleStatusChange = async (status: TicketStatus) => {
		if (!ticketId) return;
		await updateTicket(ticketId, { status });
		setEditingField(null);
		refresh();
	};

	const handlePriorityChange = async (priority: TicketPriority) => {
		if (!ticketId) return;
		await updateTicket(ticketId, { priority });
		setEditingField(null);
		refresh();
	};

	const handleAssigneeChange = async (rawValue: string) => {
		if (!ticketId) return;
		const agent_user_id = rawValue === '' ? null : Number(rawValue);
		await updateTicket(ticketId, { agent_user_id });
		setEditingField(null);
		refresh();
	};

	const handleMailboxChange = async (rawValue: string) => {
		if (!ticketId) return;
		const mailbox_id = rawValue === '' ? null : Number(rawValue);
		await updateTicket(ticketId, { mailbox_id });
		setEditingField(null);
		refresh();
	};

	const handleTagsChange = async (tagIds: number[]) => {
		if (!ticketId) return;
		await updateTicket(ticketId, { tag_ids: tagIds });
		setEditingField(null);
		refresh();
	};

	const customerName =
		[ticket?.contact?.first_name, ticket?.contact?.last_name]
			.filter(Boolean)
			.join(' ')
			.trim() ||
		ticket?.contact?.email ||
		__('Customer', 'doublescale');

	const tagDisplay =
		(ticket?.tag_ids ?? [])
			.map((id) => tagNames[id])
			.filter(Boolean)
			.join(', ') || __('None', 'doublescale');

	const customFieldsPanel = ticket
		? (applyFilters(
				'doublescale_support_ticket_detail_custom_fields',
				null,
				{
					ticketId: ticket.id,
					ticket,
					onSaved: refresh,
				}
			) as ReactNode)
		: null;

	return (
		<Dialog
			open={visible}
			modal={false}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				removePortal={removePortal}
				className="doublescale-support-ticket-detail z-[150200] flex h-screen max-h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-[#F7F8FA]  p-0 shadow-none [&>button]:text-muted-foreground [&>button]:hover:bg-muted/60"
				style={{
					paddingTop: 0,
					paddingLeft: 0,
					paddingRight: 0,
					paddingBottom: 0,
				}}
			>
				<DialogHeader className="shrink-0  bg-white pb-0 shadow-[inset_0_-1px_0_0_rgba(15,23,42,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
					<DialogTitle className="sr-only">
						{ticket?.title || __('Ticket details', 'doublescale')}
					</DialogTitle>
					<div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 ">
						<nav
							className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground"
							aria-label={__('Breadcrumb', 'doublescale')}
						>
							{navigate ? (
								<button
									type="button"
									onClick={() =>
										navigate(getToLink('support'))
									}
									className="-mx-2 rounded-md px-2 py-1 text-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
								>
									{__('Helpdesk (Inbox)', 'doublescale')}
								</button>
							) : (
								<span className="px-2 py-1 text-foreground">
									{__('Helpdesk (Inbox)', 'doublescale')}
								</span>
							)}
							<ChevronRight
								className="h-3.5 w-3.5 shrink-0 text-foreground"
								aria-hidden
							/>
							<span className="rounded-md bg-muted/50 px-2.5 py-1 text-base tracking-tight text-muted-foreground">
								{__('Ticket Details', 'doublescale')}
							</span>
						</nav>
					</div>
				</DialogHeader>

				{!ticketId ? (
					<div className="flex flex-1 items-center justify-center p-6 text-muted-foreground">
						{__('No ticket selected.', 'doublescale')}
					</div>
				) : ticketLoading || !ticket ? (
					<div className="mx-auto flex min-h-0 w-full max-w-[1680px] flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
						<div className="h-40 animate-pulse rounded-[20px] bg-white/70" />
						<div className="h-96 animate-pulse rounded-xl bg-white/70" />
					</div>
				) : (
					<div className="mx-auto flex min-h-0 w-full max-w-[1680px] flex-1 flex-col p-4 sm:p-6">
						<div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch">
							{/* Left: ticket summary */}
							<div className="w-full shrink-0 sm:px-0 lg:h-full lg:min-h-0 lg:w-[min(100%,500px)] lg:max-w-[500px]">
								<div
									className={`deal-detail-summary-card ${CARD_SHADOW_CLASS} flex h-full min-h-0 w-full flex-col rounded-[20px] border border-border/35 bg-[#fff] p-6 text-card-foreground lg:min-h-[min(70vh,560px)]`}
									style={{ boxShadow: CARD_SHADOW }}
								>
									<div className="flex items-start justify-between gap-3 pb-6 ">
										<div className="min-w-0">
											{editingField === 'title' ? (
												<Input
													value={tempTitle}
													onChange={(e) =>
														setTempTitle(
															e.target.value
														)
													}
													className="h-10 border border-border text-base"
													autoFocus
													onBlur={handleSaveTitle}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															handleSaveTitle();
														}
														if (
															e.key === 'Escape'
														) {
															setEditingField(
																null
															);
														}
													}}
												/>
											) : (
												<div className="flex items-center gap-2">
													<p className="break-words text-2xl font-semibold leading-9 tracking-tight text-foreground">
														#{ticket.id} /{' '}
														{ticket.title}
													</p>
													<OverviewEditButton
														label={__(
															'Edit title',
															'doublescale'
														)}
														onClick={() => {
															setTempTitle(
																ticket.title
															);
															setEditingField(
																'title'
															);
														}}
													/>
												</div>
											)}
											<div className="mt-2 flex items-center gap-2 text-base leading-7 text-muted-foreground">
												{/* <Calendar className="h-4 w-4 shrink-0" />
												 */}
												<DealCalenderIcon />
												{formatTicketDate(
													ticket.created_at
												)}
											</div>
										</div>
										{canManageAllTickets &&
											editingField !== 'title' && (
												<button
													type="button"
													className="flex shrink-0 items-center justify-center rounded-md border border-destructive p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
													onClick={handleDelete}
													disabled={deleting}
													aria-label={__(
														'Delete ticket',
														'doublescale'
													)}
												>
													<TrashIcon
														width={24}
														height={24}
													/>
												</button>
											)}
									</div>

									<div className="py-6 border-y border-border flex justify-between items-center ">
										<p className="text-base leading-7 text-muted-foreground">
											{__('Customer', 'doublescale')}
										</p>
										{ticket.contact ? (
											<div className=" flex items-center gap-2 text-base leading-7 font-semibold text-foreground">
												<EmailIcon />
												<span className="truncate">
													{customerName !==
													ticket.contact.email
														? ` ${ticket.contact.email}`
														: ticket.contact.email}
												</span>
											</div>
										) : (
											<p className="mt-1 text-base font-semibold text-muted-foreground">
												#{ticket.contact_id}
											</p>
										)}
									</div>

									<div className="mt-6 flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
										<div className="rounded-lg border border-border bg-[#fff] p-4">
											<Tabs
												value={showView}
												onValueChange={(v) =>
													setShowView(
														v as
															| 'overview'
															| 'custom'
													)
												}
												className="w-full"
											>
												<TabsList className="mb-5 grid h-auto w-full grid-cols-2 gap-0 rounded-none border-0 border-b border-border bg-transparent p-0">
													<TabsTrigger
														value="overview"
														className="flex w-full justify-center rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 pb-3 pt-1 text-sm font-medium leading-6 text-muted-foreground shadow-none ring-offset-0 transition-colors hover:text-foreground focus-visible:ring-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
													>
														{__(
															'Overview',
															'doublescale'
														)}
													</TabsTrigger>
													<TabsTrigger
														value="custom"
														className="flex w-full justify-center rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 pb-3 pt-1 text-sm font-medium leading-6 text-muted-foreground shadow-none ring-offset-0 transition-colors hover:text-foreground focus-visible:ring-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
													>
														{__(
															'Custom Fields',
															'doublescale'
														)}
													</TabsTrigger>
												</TabsList>

												<TabsContent
													value="overview"
													className="mt-0 space-y-5 focus-visible:outline-none focus-visible:ring-0"
												>
													{/* Mailbox */}
													<div className="flex items-center justify-between gap-3">
														<div className="min-w-0 flex-1">
															<p className="text-base leading-7 text-muted-foreground">
																{__(
																	'Mailbox',
																	'doublescale'
																)}
															</p>
															{editingField ===
															'mailbox' ? (
																<Select
																	value={
																		ticket.mailbox_id
																			? String(
																					ticket.mailbox_id
																				)
																			: undefined
																	}
																	onValueChange={
																		handleMailboxChange
																	}
																>
																	<SelectTrigger className="mt-1 h-10 w-full border border-border">
																		<SelectValue
																			placeholder={__(
																				'Select mailbox',
																				'doublescale'
																			)}
																		/>
																	</SelectTrigger>
																	<SelectContent>
																		{mailboxes.map(
																			(
																				mailbox
																			) => (
																				<SelectItem
																					key={
																						mailbox.id
																					}
																					value={String(
																						mailbox.id
																					)}
																				>
																					{mailbox.name ||
																						mailbox.slug}
																				</SelectItem>
																			)
																		)}
																	</SelectContent>
																</Select>
															) : (
																<p className="text-base font-semibold leading-7 text-foreground">
																	{ticket
																		.mailbox
																		?.name ||
																		ticket
																			.mailbox
																			?.slug ||
																		__(
																			'None',
																			'doublescale'
																		)}
																</p>
															)}
														</div>
														{editingField !==
															'mailbox' && (
															<OverviewEditButton
																label={__(
																	'Edit mailbox',
																	'doublescale'
																)}
																onClick={() =>
																	setEditingField(
																		'mailbox'
																	)
																}
															/>
														)}
													</div>

													{/* Assigned to */}
													<div className="flex items-center justify-between gap-3">
														<div className="min-w-0 flex-1">
															<p className="text-base leading-7 text-muted-foreground">
																{__(
																	'Assigned to',
																	'doublescale'
																)}
															</p>
															{editingField ===
															'assignee' ? (
																<Select
																	value={
																		ticket.agent_user_id
																			? String(
																					ticket.agent_user_id
																				)
																			: 'unassigned'
																	}
																	onValueChange={(
																		v
																	) =>
																		handleAssigneeChange(
																			v ===
																				'unassigned'
																				? ''
																				: v
																		)
																	}
																>
																	<SelectTrigger className="mt-1 h-10 w-full border border-border">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="unassigned">
																			{__(
																				'Unassigned',
																				'doublescale'
																			)}
																		</SelectItem>
																		{ticket.agent &&
																			!assignableAgents.some(
																				(
																					a
																				) =>
																					a.id ===
																					ticket
																						.agent
																						?.id
																			) && (
																				<SelectItem
																					value={String(
																						ticket
																							.agent
																							.id
																					)}
																				>
																					{
																						ticket
																							.agent
																							.display_name
																					}
																				</SelectItem>
																			)}
																		{assignableAgents.map(
																			(
																				agent
																			) => (
																				<SelectItem
																					key={
																						agent.id
																					}
																					value={String(
																						agent.id
																					)}
																				>
																					{
																						agent.display_name
																					}
																				</SelectItem>
																			)
																		)}
																	</SelectContent>
																</Select>
															) : (
																<p className="text-base font-semibold leading-7 text-foreground">
																	{ticket
																		.agent
																		?.display_name ||
																		__(
																			'Unassigned',
																			'doublescale'
																		)}
																</p>
															)}
														</div>
														{editingField !==
															'assignee' && (
															<OverviewEditButton
																label={__(
																	'Edit assignee',
																	'doublescale'
																)}
																onClick={() =>
																	setEditingField(
																		'assignee'
																	)
																}
															/>
														)}
													</div>

													{/* Tags */}
													<div className="flex items-start justify-between gap-3">
														<div className="min-w-0 flex-1">
															<p className="text-base leading-7 text-muted-foreground">
																{__(
																	'Tags',
																	'doublescale'
																)}
															</p>
															{editingField ===
															'tags' ? (
																<div className="mt-1">
																	<TagField
																		value={
																			ticket.tag_ids ??
																			[]
																		}
																		onChange={
																			handleTagsChange
																		}
																	/>
																</div>
															) : (
																<p className="text-base font-semibold leading-7 text-foreground">
																	{tagDisplay}
																</p>
															)}
														</div>
														{editingField !==
															'tags' && (
															<OverviewEditButton
																label={__(
																	'Edit tags',
																	'doublescale'
																)}
																onClick={() =>
																	setEditingField(
																		'tags'
																	)
																}
															/>
														)}
													</div>

													{/* Status */}
													<div className="flex items-center justify-between gap-3">
														<div className="min-w-0 flex-1">
															<p className="text-base leading-7 text-muted-foreground">
																{__(
																	'Status',
																	'doublescale'
																)}
															</p>
															{editingField ===
															'status' ? (
																<Select
																	value={
																		ticket.status
																	}
																	onValueChange={(
																		v
																	) =>
																		handleStatusChange(
																			v as TicketStatus
																		)
																	}
																>
																	<SelectTrigger className="mt-1 h-10 w-full border-2 border-primary/60">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		{TICKET_STATUSES.map(
																			(
																				s
																			) => (
																				<SelectItem
																					key={
																						s
																					}
																					value={
																						s
																					}
																				>
																					{
																						s
																					}
																				</SelectItem>
																			)
																		)}
																	</SelectContent>
																</Select>
															) : (
																<div className="mt-1">
																	<StatusPill
																		status={
																			ticket.status
																		}
																	/>
																</div>
															)}
														</div>
														{editingField !==
															'status' && (
															<OverviewEditButton
																label={__(
																	'Edit status',
																	'doublescale'
																)}
																onClick={() =>
																	setEditingField(
																		'status'
																	)
																}
															/>
														)}
													</div>

													{/* Priority */}
													<div className="flex items-center justify-between gap-3">
														<div className="min-w-0 flex-1">
															<p className="text-base leading-7 text-muted-foreground">
																{__(
																	'Priority',
																	'doublescale'
																)}
															</p>
															{editingField ===
															'priority' ? (
																<Select
																	value={
																		ticket.priority
																	}
																	onValueChange={(
																		v
																	) =>
																		handlePriorityChange(
																			v as TicketPriority
																		)
																	}
																>
																	<SelectTrigger className="mt-1 h-10 w-full border border-border">
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		{TICKET_PRIORITIES.map(
																			(
																				p
																			) => (
																				<SelectItem
																					key={
																						p
																					}
																					value={
																						p
																					}
																				>
																					{
																						p
																					}
																				</SelectItem>
																			)
																		)}
																	</SelectContent>
																</Select>
															) : (
																<div className="mt-1">
																	<PriorityPill
																		priority={
																			ticket.priority
																		}
																	/>
																</div>
															)}
														</div>
														{editingField !==
															'priority' && (
															<OverviewEditButton
																label={__(
																	'Edit priority',
																	'doublescale'
																)}
																onClick={() =>
																	setEditingField(
																		'priority'
																	)
																}
															/>
														)}
													</div>

													{ticket.cc_recipients &&
														ticket.cc_recipients
															.length > 0 && (
															<div>
																<p className="text-base leading-7 text-muted-foreground">
																	{__(
																		'CC on this ticket',
																		'doublescale'
																	)}
																</p>
																<div className="mt-1 flex flex-wrap gap-2">
																	{ticket.cc_recipients.map(
																		(
																			addr
																		) => (
																			<Badge
																				key={
																					addr
																				}
																				variant="secondary"
																			>
																				{
																					addr
																				}
																			</Badge>
																		)
																	)}
																</div>
															</div>
														)}
												</TabsContent>

												<TabsContent
													value="custom"
													className="mt-0 focus-visible:outline-none focus-visible:ring-0"
												>
													{customFieldsPanel || (
														<p className="text-sm text-muted-foreground">
															{__(
																'No custom fields configured.',
																'doublescale'
															)}
														</p>
													)}
												</TabsContent>
											</Tabs>
										</div>
									</div>
								</div>
							</div>

							{/* Right: conversation + composer */}
							<div className="w-full min-w-0 lg:h-full lg:min-h-0 lg:flex-1">
								<div
									className={`flex h-full min-h-0 w-full flex-col rounded-xl bg-[#fff] ring-1 ring-black/[0.03] ${CARD_SHADOW_CLASS}`}
									style={{ boxShadow: CARD_SHADOW }}
								>
									<div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
										{conversation?.data.map((item) => (
											<ConversationBubble
												key={item.id}
												item={item}
												customerName={customerName}
											/>
										))}
										{pendingItems.map((item) => (
											<div
												key={item.id}
												className="opacity-60 transition-opacity"
											>
												<ConversationBubble
													item={item}
													customerName={customerName}
												/>
											</div>
										))}
									</div>

									<div className=" p-4">
										<div className="rounded-lg border border-border bg-[#F7F8FA]">
											<div className="flex border-b border-border">
												<button
													type="button"
													className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
														tab === 'reply'
															? 'border-b-2 border-primary text-primary'
															: 'text-muted-foreground hover:text-foreground'
													}`}
													onClick={() =>
														setTab('reply')
													}
												>
													<CommentIcon
														width={20}
														height={20}
														color={
															tab === 'reply'
																? TAB_ICON_ACTIVE
																: TAB_ICON_INACTIVE
														}
													/>
													{__('Reply', 'doublescale')}
												</button>
												<button
													type="button"
													className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
														tab === 'note'
															? 'border-b-2 border-primary text-primary'
															: 'text-muted-foreground hover:text-foreground'
													}`}
													onClick={() =>
														setTab('note')
													}
												>
													<NoteAddIcon
														width={20}
														height={20}
														color={
															tab === 'note'
																? TAB_ICON_ACTIVE
																: TAB_ICON_INACTIVE
														}
													/>
													{__(
														'Internal note',
														'doublescale'
													)}
												</button>
											</div>
											<div className="p-4">
												<p className="mb-2 text-sm text-foreground">
													{__(
														'Message',
														'doublescale'
													)}
													<span className="text-destructive">
														{' '}
														*
													</span>
												</p>
												<div className="ticket-detail-reply-composer [&_.editor-inner]:min-h-[40px] [&_.editor-input]:min-h-[40px]">
													<SupportRichText
														message={content}
														onChange={setContent}
														placeholder={
															tab === 'reply'
																? __(
																		'Write a reply visible to the customer',
																		'doublescale'
																	)
																: __(
																		'Write a note visible only to your team',
																		'doublescale'
																	)
														}
													/>
												</div>
												{tab === 'reply' &&
													aiConfigured && (
														<div className="mt-3 rounded border border-border bg-violet-50/60 p-3">
															<div className="flex items-center justify-between gap-2">
																<button
																	type="button"
																	onClick={
																		handleDraftWithAI
																	}
																	disabled={
																		aiDrafting
																	}
																	className="inline-flex items-center gap-2 rounded bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
																>
																	{aiDrafting ? (
																		<Loader2
																			width={
																				14
																			}
																			height={
																				14
																			}
																			className="animate-spin"
																		/>
																	) : (
																		<Sparkles
																			width={
																				14
																			}
																			height={
																				14
																			}
																		/>
																	)}
																	{aiDrafting
																		? __(
																				'Drafting…',
																				'doublescale'
																			)
																		: __(
																				'Draft with AI',
																				'doublescale'
																			)}
																</button>
																<button
																	type="button"
																	onClick={() =>
																		setAiPanelOpen(
																			(
																				v
																			) =>
																				!v
																		)
																	}
																	className="text-xs font-medium text-violet-700 hover:underline"
																>
																	{aiPanelOpen
																		? __(
																				'Hide instruction',
																				'doublescale'
																			)
																		: __(
																				'Add instruction',
																				'doublescale'
																			)}
																</button>
															</div>
															{aiPanelOpen && (
																<input
																	type="text"
																	value={
																		aiInstruction
																	}
																	onChange={(
																		e
																	) =>
																		setAiInstruction(
																			e
																				.target
																				.value
																		)
																	}
																	placeholder={__(
																		'Optional: steer the reply (e.g. "offer a 10% discount")',
																		'doublescale'
																	)}
																	className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
																/>
															)}
															{aiError && (
																<div className="mt-2 text-sm text-red-600">
																	{aiError}
																</div>
															)}
														</div>
													)}
												<AttachmentUploader
													pending={pendingAttachments}
													uploading={uploading}
													onSelect={
														handleAttachmentSelect
													}
													onRemove={(hash) =>
														setPendingAttachments(
															(prev) =>
																removePendingByHash(
																	prev,
																	hash
																)
														)
													}
													disabled={sending}
													maxFileCount={
														attachmentLimits?.max_file_count
													}
													maxFileSizeBytes={
														attachmentLimits?.max_file_size_bytes
													}
													onValidationError={
														setFeedback
													}
												/>
												{feedback && (
													<div className="mt-2 text-sm text-destructive">
														{feedback}
													</div>
												)}
												{tab === 'reply' && showCc && (
													<div className="mt-4">
														<p className="mb-2 text-sm text-foreground">
															{__(
																'CC recipients',
																'doublescale'
															)}
															<span className="text-destructive">
																{' '}
																*
															</span>
														</p>
														<CcRecipientsInput
															value={cc}
															onChange={setCc}
															disabled={sending}
															placeholder={__(
																'Add CC email',
																'doublescale'
															)}
														/>
													</div>
												)}
												<div className="mt-3 flex items-center justify-between gap-3">
													{tab === 'reply' ? (
														showCc ? (
															<button
																type="button"
																className="text-sm font-medium text-destructive hover:underline"
																onClick={() =>
																	setShowCc(
																		false
																	)
																}
															>
																{__(
																	'Hide CC →',
																	'doublescale'
																)}
															</button>
														) : (
															<button
																type="button"
																className="text-sm font-medium text-primary hover:underline"
																onClick={() =>
																	setShowCc(
																		true
																	)
																}
															>
																{__(
																	'Apply CC →',
																	'doublescale'
																)}
															</button>
														)
													) : (
														<span />
													)}
													<button
														type="button"
														onClick={handleSend}
														disabled={
															sending ||
															!htmlEditorHasMeaningfulContent(
																content
															)
														}
														className={`inline-flex shrink-0 items-center gap-2 rounded-md p-2 text-sm font-medium text-white disabled:opacity-50 ${
															tab === 'reply'
																? 'bg-primary hover:bg-primary/90'
																: 'bg-[#3A3A99] hover:bg-[#3A3A99]/90'
														}`}
													>

                                                        <ReplyIcon/>

													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default TicketDetailModal;
