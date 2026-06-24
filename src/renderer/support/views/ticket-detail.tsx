/**
 * Portal: ticket detail view + reply composer.
 */

import { useState } from '@wordpress/element';
import type { FC } from 'react';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Circle, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import SupportRichText from '@/components/editor/support-rich-text';
import { htmlEditorHasMeaningfulContent } from '@/components/editor/utils';
import { PRIORITY_LABELS } from '@/constants/support';
import type { TicketPriority } from '@/constants/support';

import {
	addPortalReply,
	uploadPortalAttachment,
	usePortalConversation,
	usePortalTicket,
} from '../api';
import {
	AttachmentUploader,
	AttachmentList,
	toPendingAttachment,
	revokePendingPreviews,
	removePendingByHash,
	type PendingAttachment,
} from '@/components/support';
import type { PortalConfig, PortalConversationItem } from '../types';

interface Props {
	ticketId: number;
	config: PortalConfig;
	onBack: () => void;
	variant?: 'standalone' | 'pane';
	showMobileBack?: boolean;
}

const TicketDetail = ({
	ticketId,
	config,
	onBack,
	variant = 'standalone',
	showMobileBack = false,
}: Props) => {
	const isPane = variant === 'pane';
	const limits = config.attachment_limits;
	const ticket = usePortalTicket(ticketId);
	const conv = usePortalConversation(ticketId);
	const [draft, setDraft] = useState('');
	const [sending, setSending] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [pendingAttachments, setPendingAttachments] = useState<
		PendingAttachment[]
	>([]);
	const [sendError, setSendError] = useState<string | null>(null);

	const handleSend = async () => {
		if (!htmlEditorHasMeaningfulContent(draft)) {
			return;
		}
		setSending(true);
		setSendError(null);
		try {
			const hashes = pendingAttachments.map((a) => a.file_hash);
			await addPortalReply(
				ticketId,
				draft,
				hashes.length > 0 ? hashes : undefined
			);
			setDraft('');
			revokePendingPreviews(pendingAttachments);
			setPendingAttachments([]);
			conv.refetch();
			ticket.refetch();
		} catch (e) {
			const msg =
				e instanceof Error ? e.message : __('Reply failed.', 'doublescale');
			setSendError(msg);
		} finally {
			setSending(false);
		}
	};

	if (ticket.loading) {
		return (
			<div className={isPane ? 'support-portal-ticket-detail' : shellClass(false)}>
				<p className="p-5 text-sm text-muted-foreground">
					{__('Loading ticket…', 'doublescale')}
				</p>
			</div>
		);
	}

	if (ticket.error || !ticket.data) {
		return (
			<div className={isPane ? 'support-portal-ticket-detail' : shellClass(false)}>
				{!isPane && (
					<Button variant="outline" size="sm" onClick={onBack}>
						<ArrowLeft width={14} height={14} className="mr-1" />
						{__('Back', 'doublescale')}
					</Button>
				)}
				<div className="mt-4 rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					{ticket.error || __('Ticket not found.', 'doublescale')}
				</div>
			</div>
		);
	}

	const t = ticket.data;
	const isClosed = t.status === 'closed' || t.status === 'resolved';

	return (
		<div
			className={
				isPane
					? 'support-portal-ticket-detail'
					: 'support-portal-ticket-detail rounded-xl border border-border bg-card p-6 shadow-sm'
			}
		>
			<header className="support-portal-ticket-detail__header border-b border-border bg-[#F7F8FA] px-5 py-4">
				{isPane && showMobileBack && (
					<Button
						variant="outline"
						size="sm"
						className="mb-3 lg:hidden"
						onClick={onBack}
					>
						<ArrowLeft width={14} height={14} className="mr-1" />
						{__('Back to tickets', 'doublescale')}
					</Button>
				)}
				{!isPane && (
					<Button variant="outline" size="sm" onClick={onBack}>
						<ArrowLeft width={14} height={14} className="mr-1" />
						{__('Back to tickets', 'doublescale')}
					</Button>
				)}
				<div
					className={`flex flex-wrap items-start justify-between gap-3 ${!isPane ? 'mt-4' : ''}`}
				>
					<div className="min-w-0 flex-1">
						<p className="m-0 text-xs font-medium text-[#667085]">
							ID:#{t.id}
						</p>
						<h2 className="m-0 mt-1 text-base font-semibold leading-snug text-[#09090B]">
							{t.title}
						</h2>
					</div>
					<TicketHeaderBadges priority={t.priority} />
				</div>
			</header>

			<section className="support-portal-ticket-detail__conversation support-portal-conversation-scroll px-5 py-4">
				{conv.loading && (
					<p className="text-sm text-muted-foreground">
						{__('Loading…', 'doublescale')}
					</p>
				)}

				{!conv.loading && conv.data && conv.data.data.length === 0 && (
					<p className="text-sm text-muted-foreground">
						{__('No messages yet.', 'doublescale')}
					</p>
				)}

				{!conv.loading && conv.data && conv.data.data.length > 0 && (
					<ul className="space-y-4">
						{conv.data.data.map((item) => (
							<ConversationBubble
								key={item.id}
								item={item}
								customerName={
									config.user.display_name ||
									config.user.email ||
									__('You', 'doublescale')
								}
							/>
						))}
					</ul>
				)}
			</section>

			<section className="support-portal-ticket-detail__composer px-5 py-4">
				{isClosed && (
					<p className="mb-3 rounded border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
						{__(
							'This ticket is closed. Sending a reply will re-open it.',
							'doublescale'
						)}
					</p>
				)}
				<p className="mb-2 text-sm text-foreground">
					{__('Message', 'doublescale')}
					<span className="text-destructive"> *</span>
				</p>
				<div className="overflow-hidden rounded-lg border border-border bg-white [&_.editor-inner]:min-h-[80px] [&_.editor-input]:min-h-[80px]">
					<SupportRichText
						message={draft}
						onChange={setDraft}
						placeholder={__(
							'Write your reply here…',
							'doublescale'
						)}
					/>
				</div>
				{sendError && (
					<p className="mt-2 text-sm text-destructive">{sendError}</p>
				)}
				<div className="mt-3 flex items-end justify-between gap-3">
					<AttachmentUploader
						pending={pendingAttachments}
						uploading={uploading}
						disabled={sending}
						maxFileCount={limits?.max_file_count}
						maxFileSizeBytes={limits?.max_file_size_bytes}
						onValidationError={setSendError}
						onSelect={async (file) => {
							setUploading(true);
							try {
								const result = await uploadPortalAttachment(
									ticketId,
									file,
									pendingAttachments.length
								);
								setPendingAttachments((prev) => [
									...prev,
									toPendingAttachment(result, file),
								]);
							} catch (e) {
								setSendError(
									e instanceof Error
										? e.message
										: __('Upload failed.', 'doublescale')
								);
							} finally {
								setUploading(false);
							}
						}}
						onRemove={(hash) =>
							setPendingAttachments((prev) =>
								removePendingByHash(prev, hash)
							)
						}
					/>
					<Button
						onClick={handleSend}
						disabled={sending || !htmlEditorHasMeaningfulContent(draft)}
						className="h-10 w-10 shrink-0 rounded-lg bg-[#2D3282] p-0 hover:bg-[#2D3282]/90"
						aria-label={__('Send reply', 'doublescale')}
					>
						<Send width={16} height={16} className="text-white" />
					</Button>
				</div>
			</section>
		</div>
	);
};

const shellClass = (isPane: boolean) =>
	isPane
		? 'h-full min-h-0'
		: 'rounded-xl border border-border bg-card p-6 shadow-sm';

const PRIORITY_BADGE: Record<
	TicketPriority,
	{ className: string; show: boolean }
> = {
	urgent: {
		show: true,
		className: 'bg-[#FEE2E2] text-[#DC2626]',
	},
	high: {
		show: true,
		className: 'bg-[#FAEADF] text-[#CB5301]',
	},
	normal: {
		show: false,
		className: 'bg-[#EFF6FF] text-[#2563EB]',
	},
	low: {
		show: false,
		className: 'bg-[#ECFDF3] text-[#16A34A]',
	},
};

const PRIORITY_ROW_ICON: Record<TicketPriority, string> = {
	normal: 'text-[#0D9DFC]',
	low: 'text-[#16A34A]',
	high: 'text-[#CB5301]',
	urgent: 'text-[#DC2626]',
};

const TicketHeaderBadges: FC<{ priority: TicketPriority }> = ({ priority }) => {
	const priorityBadge = PRIORITY_BADGE[priority] ?? PRIORITY_BADGE.normal;
	const circleLabel = priorityBadge.show
		? PRIORITY_LABELS.normal
		: PRIORITY_LABELS[priority];

	return (
		<div className="flex shrink-0 flex-wrap items-center gap-3">
			{priorityBadge.show && (
				<span
					className={`rounded-md px-2 py-0.5 text-xs font-semibold ${priorityBadge.className}`}
				>
					{PRIORITY_LABELS[priority]}
				</span>
			)}
			<span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#09090B]">
				<Circle
					width={14}
					height={14}
					className={
						priorityBadge.show
							? PRIORITY_ROW_ICON.normal
							: (PRIORITY_ROW_ICON[priority] ?? PRIORITY_ROW_ICON.normal)
					}
				/>
				{circleLabel}
			</span>
		</div>
	);
};

const AvatarInitial: FC<{ name: string }> = ({ name }) => (
	<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#458DC7] text-xs font-semibold text-white">
		{name.charAt(0).toUpperCase() || '?'}
	</div>
);

const ConversationBubble = ({
	item,
	customerName,
}: {
	item: PortalConversationItem;
	customerName: string;
}) => {
	const isSelf = item.is_self === true;
	const isEvent = item.kind === 'event';
	const content =
		typeof item.data?.content === 'string' ? item.data.content : '';
	const authorLabel = isSelf
		? customerName
		: item.user?.display_name || __('Support team', 'doublescale');
	const time = formatMessageTime(item.created_at);

	if (isEvent) {
		return (
			<li className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground">
				<span className="h-px flex-1 bg-border" />
				<span className="italic">{describeEvent(item)}</span>
				<span className="h-px flex-1 bg-border" />
			</li>
		);
	}

	if (isSelf) {
		return (
			<li className="flex flex-col items-end">
				<p className="mb-1 max-w-[78%] text-right text-xs font-semibold text-[#09090B]">
					{authorLabel}
				</p>
				<div className="max-w-[78%] rounded-lg bg-[#EBEEF2] px-4 py-3">
					<div
						className="prose prose-sm max-w-none text-[#09090B]"
						dangerouslySetInnerHTML={{ __html: content }}
					/>
					<AttachmentList
						attachments={item.attachments}
						accentClassName="text-primary"
					/>
					<p className="mt-1 text-right text-xs text-[#667085]">{time}</p>
				</div>
			</li>
		);
	}

	return (
		<li className="flex justify-start gap-2.5">
			<AvatarInitial name={authorLabel} />
			<div className="max-w-[78%] min-w-0">
				<p className="mb-1 text-xs font-semibold text-[#09090B]">
					{authorLabel}
				</p>
				<div className="rounded-lg border border-border/80 bg-white px-4 py-3">
					<div
						className="prose prose-sm max-w-none text-[#09090B]"
						dangerouslySetInnerHTML={{ __html: content }}
					/>
					<AttachmentList
						attachments={item.attachments}
						accentClassName="text-primary"
					/>
					<p className="mt-1 text-right text-xs text-[#667085]">{time}</p>
				</div>
			</div>
		</li>
	);
};

const describeEvent = (item: PortalConversationItem): string => {
	const key =
		typeof item.data?.event_key === 'string' ? item.data.event_key : item.type;
	switch (key) {
		case 'ticket_status_changed':
			return __('Status updated', 'doublescale');
		case 'ticket_priority_changed':
			return __('Priority updated', 'doublescale');
		case 'ticket_assigned':
			return __('Assigned to an agent', 'doublescale');
		case 'ticket_unassigned':
			return __('Unassigned', 'doublescale');
		default:
			return __('Update', 'doublescale');
	}
};

const formatMessageTime = (input: string | null): string => {
	if (!input) {
		return '';
	}
	try {
		return new Date(input).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return input;
	}
};

export default TicketDetail;
