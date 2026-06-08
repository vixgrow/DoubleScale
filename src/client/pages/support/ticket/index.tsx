/**
 * Support ticket detail — conversation thread + reply / note composer.
 *
 * Layout: header card (status, priority, assignee, mailbox) + chronological
 * conversation thread + composer at the bottom with a tab switcher between
 * "Reply" (customer-visible) and "Note" (internal only).
 */

import React, { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { Trash2 } from 'lucide-react';

import { useNavigate, getToLink, useParams } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { Button } from '@/components/ui/button';
import {
	useTicket,
	useConversation,
	useAssignableAgents,
	useMailboxes,
	addReply,
	addNote,
	updateTicket,
	deleteTicket,
	uploadAttachment,
} from '@/hooks/support';
import {
	StatusPill,
	PriorityPill,
	NoteIcon,
	ReplyIcon,
	ConversationIcon,
	AttachmentUploader,
	toPendingAttachment,
	type PendingAttachment,
} from '@/components/support';
import { TagField } from '@doublescale/components';
import {
	TICKET_STATUSES,
	TICKET_PRIORITIES,
	type TicketPriority,
	type TicketStatus,
} from '@/constants/support';
import type { ConversationAttachment, ConversationItem } from '@/types/support';

const formatDate = (raw: string | null): string => {
	if (!raw) {
		return '';
	}
	try {
		return new Date(raw + 'Z').toLocaleString();
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
				/* translators: 1: comma-separated added tag names, 2: comma-separated removed tag names. */
				__(
					'Tags updated: added %1$s, removed %2$s',
					'doublescale'
				),
				added.join(', '),
				removed.join(', ')
			);
		}
		if (added.length) {
			return sprintf(
				/* translators: %s: comma-separated tag names. */
				__('Tags added: %s', 'doublescale'),
				added.join(', ')
			);
		}
		if (removed.length) {
			return sprintf(
				/* translators: %s: comma-separated tag names. */
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

const AttachmentLinks: React.FC<{ attachments?: ConversationAttachment[] }> = ({
	attachments,
}) => {
	if (!attachments?.length) {
		return null;
	}
	return (
		<ul className="mt-2 space-y-1">
			{attachments.map((att) => (
				<li key={att.url}>
					<a
						href={att.url}
						className="text-sm text-blue-600 hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						{att.file_name}
					</a>
				</li>
			))}
		</ul>
	);
};

const ConversationBubble: React.FC<{
	item: ConversationItem;
	customerName?: string;
}> = ({ item, customerName }) => {
	if (item.kind === 'event') {
		return (
			<div className="flex items-center gap-2 text-xs text-gray-500 py-2 px-3">
				<span className="h-px flex-1 bg-gray-200" />
				<span className="italic">{eventDescription(item)}</span>
				<span className="h-px flex-1 bg-gray-200" />
			</div>
		);
	}

	const isNote = item.kind === 'note';
	// Agent replies carry a `user`; customer (email/portal) replies don't, so
	// fall back to the ticket's contact name instead of a generic "Customer".
	const authorLabel = item.user
		? item.user.display_name
		: customerName || __('Customer', 'doublescale');

	return (
		<div
			className={`rounded-lg border p-4 ${
				isNote
					? 'bg-yellow-50 border-yellow-200'
					: 'bg-white border-gray-200'
			}`}
		>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-gray-900">
						{authorLabel}
					</span>
					{isNote && (
						<span className="inline-flex items-center gap-1 text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
							<NoteIcon width={10} height={10} />
							{__('Internal', 'doublescale')}
						</span>
					)}
				</div>
				<span className="text-xs text-gray-500">
					{formatDate(item.created_at)}
				</span>
			</div>
			<div
				className="prose prose-sm max-w-none text-gray-800"
				/* eslint-disable-next-line react/no-danger -- WP REST already sanitizes via wp_kses_post; we trust the structured content field. */
				dangerouslySetInnerHTML={{
					__html:
						typeof item.data.content === 'string'
							? item.data.content
							: '',
				}}
			/>
			<AttachmentLinks attachments={item.attachments} />
		</div>
	);
};

const SupportTicketDetail: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams<{ id: string }>();
	const ticketId = params.id ? Number(params.id) : null;

	const {
		data: ticket,
		loading: ticketLoading,
		refetch: refetchTicket,
	} = useTicket(ticketId);
	const { data: conversation, refetch: refetchConversation } =
		useConversation(ticketId);
	const { data: assignableAgents } = useAssignableAgents();
	const { data: mailboxes } = useMailboxes();
	const canManageAllTickets = useCapabilities().canManageAllTickets();

	const [tab, setTab] = useState<'reply' | 'note'>('reply');
	const [content, setContent] = useState('');
	const [sending, setSending] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [pendingAttachments, setPendingAttachments] = useState<
		PendingAttachment[]
	>([]);
	const [feedback, setFeedback] = useState<string | null>(null);
	// Optimistic queue: items appended client-side BEFORE the server confirms.
	// On refetch the real activity replaces these. Negative ids guarantee they
	// won't collide with real activity row ids.
	const [pendingItems, setPendingItems] = useState<ConversationItem[]>([]);
	const [deleting, setDeleting] = useState(false);
	if (!ticketId) {
		return (
			<div className="p-6 text-gray-600">
				{__('No ticket selected.', 'doublescale')}
			</div>
		);
	}

	if (ticketLoading || !ticket) {
		return (
			<div className="p-6 text-gray-600">
				{__('Loading ticket…', 'doublescale')}
			</div>
		);
	}

	// All conversation replies on a support ticket belong to its single contact,
	// so customer-authored (user-less) replies are labelled with this name.
	const customerName =
		[ticket.contact?.first_name, ticket.contact?.last_name]
			.filter(Boolean)
			.join(' ')
			.trim() ||
		ticket.contact?.email ||
		__('Customer', 'doublescale');

	const handleSend = async () => {
		if (!content.trim()) {
			setFeedback(__('Please type something first.', 'doublescale'));
			return;
		}
		setSending(true);
		setFeedback(null);

		const optimistic: ConversationItem = {
			id: -Date.now(), // negative + millisecond-unique, guaranteed not to collide
			kind: tab,
			type: tab === 'reply' ? 'support_reply' : 'support_note',
			contact_id: null,
			user_id: null,
			data: { content, source: 'web' },
			created_at: new Date()
				.toISOString()
				.replace('T', ' ')
				.split('.')[0],
			updated_at: null,
			user: null,
		};
		setPendingItems((prev) => [...prev, optimistic]);
		const draftContent = content;
		const attachmentHashes = pendingAttachments.map((a) => a.file_hash);
		setContent('');
		setPendingAttachments([]);

		try {
			const payload = {
				content: draftContent,
				attachment_hashes:
					attachmentHashes.length > 0 ? attachmentHashes : undefined,
			};
			if (tab === 'reply') {
				await addReply(ticketId, payload);
			} else {
				await addNote(ticketId, payload);
			}
			// Real activity arrives via refetch — clear the placeholder.
			refetchConversation();
			refetchTicket();
			setPendingItems((prev) =>
				prev.filter((p) => p.id !== optimistic.id)
			);
		} catch (err) {
			const msg = (err as { message?: string })?.message ?? 'Send failed';
			setFeedback(msg);
			// Roll back the optimistic insertion and restore the draft.
			setPendingItems((prev) =>
				prev.filter((p) => p.id !== optimistic.id)
			);
			setContent(draftContent);
			setPendingAttachments(
				attachmentHashes.map((hash, i) => ({
					file_hash: hash,
					file_name: pendingAttachments[i]?.file_name || hash,
				}))
			);
		} finally {
			setSending(false);
		}
	};

	const handleAttachmentSelect = async (file: File) => {
		setUploading(true);
		setFeedback(null);
		try {
			const result = await uploadAttachment(ticketId, file);
			setPendingAttachments((prev) => [
				...prev,
				toPendingAttachment(result),
			]);
		} catch (err) {
			const msg =
				(err as { message?: string })?.message ?? 'Upload failed';
			setFeedback(msg);
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async () => {
		// Native confirm intentionally — the SPA doesn't have a confirm-dialog
		// primitive in shared/ui yet, and this matches what Booking uses for
		// destructive calendar deletes.
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
			navigate(getToLink('support'));
		} catch (err) {
			const msg =
				(err as { message?: string })?.message ?? 'Delete failed';
			setFeedback(msg);
			setDeleting(false);
		}
	};

	const handleStatusChange = async (status: TicketStatus) => {
		await updateTicket(ticketId, { status });
		refetchTicket();
		refetchConversation();
	};

	const handlePriorityChange = async (priority: TicketPriority) => {
		await updateTicket(ticketId, { priority });
		refetchTicket();
		refetchConversation();
	};

	const handleAssigneeChange = async (rawValue: string) => {
		const agent_user_id = rawValue === '' ? null : Number(rawValue);
		await updateTicket(ticketId, { agent_user_id });
		refetchTicket();
		refetchConversation();
	};

	const handleMailboxChange = async (rawValue: string) => {
		const mailbox_id = rawValue === '' ? null : Number(rawValue);
		await updateTicket(ticketId, { mailbox_id });
		refetchTicket();
		refetchConversation();
	};

	const handleTagsChange = async (tagIds: number[]) => {
		await updateTicket(ticketId, { tag_ids: tagIds });
		refetchTicket();
		refetchConversation();
	};

	return (
		<div className="doublescale-support-ticket p-6 max-w-5xl">
			<div className="flex items-center justify-between mb-4">
				<button
					type="button"
					className="text-sm text-blue-600 hover:underline"
					onClick={() => navigate(getToLink('support'))}
				>
					&larr; {__('Back to inbox', 'doublescale')}
				</button>
				{canManageAllTickets && (
					<Button
						variant="destructive"
						size="sm"
						onClick={handleDelete}
						disabled={deleting}
					>
						<Trash2 />
						{deleting
							? __('Deleting…', 'doublescale')
							: __('Delete ticket', 'doublescale')}
					</Button>
				)}
			</div>

			{/* Ticket header */}
			<div className="bg-white rounded shadow-sm border p-5 mb-6">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-xl font-semibold text-gray-900 mb-1">
							{ticket.title}
						</h1>
						<div className="text-sm text-gray-500">
							{__('Ticket', 'doublescale')} #{ticket.id} ·{' '}
							{__('Opened', 'doublescale')}{' '}
							{formatDate(ticket.created_at)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<StatusPill status={ticket.status} />
						<PriorityPill priority={ticket.priority} />
					</div>
				</div>

				<div className="grid grid-cols-3 gap-4 mt-4 text-sm">
					<div>
						<div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
							{__('Customer', 'doublescale')}
						</div>
						<div className="text-gray-900">
							{ticket.contact ? (
								<>
									<div>
										{ticket.contact.first_name}{' '}
										{ticket.contact.last_name}
									</div>
									<div className="text-gray-500">
										{ticket.contact.email}
									</div>
								</>
							) : (
								<span className="text-gray-500">
									#{ticket.contact_id}
								</span>
							)}
						</div>
					</div>
					<div>
						<div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
							{__('Mailbox', 'doublescale')}
						</div>
						<div className="text-gray-900">
							<select
								value={ticket.mailbox_id ?? ''}
								onChange={(e) => handleMailboxChange(e.target.value)}
								className="border rounded px-2 py-1 text-sm w-full max-w-[12rem]"
							>
								{mailboxes.map((mailbox) => (
									<option key={mailbox.id} value={mailbox.id}>
										{mailbox.name || mailbox.slug}
									</option>
								))}
							</select>
						</div>
					</div>
					<div>
						<div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
							{__('Assigned to', 'doublescale')}
						</div>
						<div className="text-gray-900">
							<select
								value={ticket.agent_user_id ?? ''}
								onChange={(e) => handleAssigneeChange(e.target.value)}
								className="border rounded px-2 py-1 text-sm w-full max-w-[12rem]"
							>
								<option value="">
									{__('Unassigned', 'doublescale')}
								</option>
								{/* Keep the current assignee selectable even if it's
								    not in the assignable list (e.g. a manager-only
								    user the API didn't return for an agent). */}
								{ticket.agent &&
									!assignableAgents.some(
										(a) => a.id === ticket.agent?.id
									) && (
										<option value={ticket.agent.id}>
											{ticket.agent.display_name}
										</option>
									)}
								{assignableAgents.map((agent) => (
									<option key={agent.id} value={agent.id}>
										{agent.display_name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className="mt-4">
					<div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
						{__('Tags', 'doublescale')}
					</div>
					<TagField
						value={ticket.tag_ids ?? []}
						onChange={handleTagsChange}
					/>
				</div>

				{/* Quick actions row */}
				<div className="mt-4 flex gap-3 items-center text-sm">
					<label className="flex items-center gap-1">
						<span className="text-gray-600">
							{__('Status:', 'doublescale')}
						</span>
						<select
							value={ticket.status}
							onChange={(e) =>
								handleStatusChange(
									e.target.value as TicketStatus
								)
							}
							className="border rounded px-2 py-1"
						>
							{TICKET_STATUSES.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</label>
					<label className="flex items-center gap-1">
						<span className="text-gray-600">
							{__('Priority:', 'doublescale')}
						</span>
						<select
							value={ticket.priority}
							onChange={(e) =>
								handlePriorityChange(
									e.target.value as TicketPriority
								)
							}
							className="border rounded px-2 py-1"
						>
							{TICKET_PRIORITIES.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
					</label>
				</div>

				{
					applyFilters(
						'doublescale_support_ticket_detail_custom_fields',
						null,
						{
							ticketId,
							ticket,
							onSaved: () => {
								refetchTicket();
							},
						}
					) as React.ReactNode
				}
			</div>

			{/* Conversation thread */}
			<div className="mb-6">
				<div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
					<ConversationIcon width={16} height={16} />
					{__('Conversation', 'doublescale')}
					{conversation && (
						<span className="text-gray-400 font-normal">
							({conversation.meta.total})
						</span>
					)}
				</div>
				<div className="space-y-3">
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
							<ConversationBubble item={item} />
						</div>
					))}
				</div>
			</div>

			{/* Composer */}
			<div className="bg-white rounded shadow-sm border">
				<div className="flex border-b">
					<button
						type="button"
						className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
							tab === 'reply'
								? 'border-b-2 border-blue-600 text-blue-700'
								: 'text-gray-600 hover:text-gray-900'
						}`}
						onClick={() => setTab('reply')}
					>
						<ReplyIcon width={14} height={14} />
						{__('Reply', 'doublescale')}
					</button>
					<button
						type="button"
						className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
							tab === 'note'
								? 'border-b-2 border-yellow-500 text-yellow-800 bg-yellow-50'
								: 'text-gray-600 hover:text-gray-900'
						}`}
						onClick={() => setTab('note')}
					>
						<NoteIcon width={14} height={14} />
						{__('Internal note', 'doublescale')}
					</button>
				</div>
				<div className="p-4">
					<textarea
						className="w-full border rounded p-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder={
							tab === 'reply'
								? __(
										'Write a reply visible to the customer…',
										'doublescale'
									)
								: __(
										'Write a note visible only to your team…',
										'doublescale'
									)
						}
						value={content}
						onChange={(e) => setContent(e.target.value)}
					/>
					<AttachmentUploader
						pending={pendingAttachments}
						uploading={uploading}
						onSelect={handleAttachmentSelect}
						onRemove={(hash) =>
							setPendingAttachments((prev) =>
								prev.filter((p) => p.file_hash !== hash)
							)
						}
						disabled={sending}
					/>
					{feedback && (
						<div className="mt-2 text-sm text-red-600">
							{feedback}
						</div>
					)}
					<div className="mt-3 flex justify-end">
						<button
							type="button"
							onClick={handleSend}
							disabled={sending || !content.trim()}
							className={`px-4 py-2 text-sm font-medium text-white rounded ${
								tab === 'reply'
									? 'bg-blue-600 hover:bg-blue-700'
									: 'bg-yellow-600 hover:bg-yellow-700'
							} disabled:opacity-50`}
						>
							{sending
								? __('Sending…', 'doublescale')
								: tab === 'reply'
									? __('Send reply', 'doublescale')
									: __('Add note', 'doublescale')}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SupportTicketDetail;
