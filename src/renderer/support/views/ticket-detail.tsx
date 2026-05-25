/**
 * Portal: ticket detail view + reply composer.
 *
 * The customer sees their own ticket: status pill, conversation thread
 * (their messages right-aligned via the `is_self` marker the REST shape
 * adds), and a reply textarea. Sending a reply re-opens a closed ticket
 * on the server side — the portal just reflects that by re-fetching.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusPill, PriorityPill } from '@/components/support';

import { addPortalReply, usePortalConversation, usePortalTicket } from '../api';
import type { PortalConfig, PortalConversationItem } from '../types';

interface Props {
	ticketId: number;
	config: PortalConfig;
	onBack: () => void;
}

const TicketDetail = ({ ticketId, onBack }: Props) => {
	const ticket = usePortalTicket(ticketId);
	const conv = usePortalConversation(ticketId);
	const [draft, setDraft] = useState('');
	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);

	const handleSend = async () => {
		const content = draft.trim();
		if (!content) {
			return;
		}
		setSending(true);
		setSendError(null);
		try {
			await addPortalReply(ticketId, content);
			setDraft('');
			conv.refetch();
			ticket.refetch();
		} catch (e) {
			const msg = e instanceof Error ? e.message : __('Reply failed.', 'doublescale');
			setSendError(msg);
		} finally {
			setSending(false);
		}
	};

	if (ticket.loading) {
		return (
			<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<p className="text-sm text-muted-foreground">
					{__('Loading ticket…', 'doublescale')}
				</p>
			</div>
		);
	}

	if (ticket.error || !ticket.data) {
		return (
			<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
				<Button variant="outline" size="sm" onClick={onBack}>
					<ArrowLeft width={14} height={14} className="mr-1" />
					{__('Back', 'doublescale')}
				</Button>
				<div className="mt-4 rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					{ticket.error || __('Ticket not found.', 'doublescale')}
				</div>
			</div>
		);
	}

	const t = ticket.data;
	const isClosed = t.status === 'closed' || t.status === 'resolved';

	return (
		<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
			<header className="mb-6">
				<Button variant="outline" size="sm" onClick={onBack}>
					<ArrowLeft width={14} height={14} className="mr-1" />
					{__('Back to tickets', 'doublescale')}
				</Button>
				<h2 className="m-0 mt-4 text-2xl font-semibold">{t.title}</h2>
				<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
					<span>#{t.id}</span>
					<StatusPill status={t.status} />
					<PriorityPill priority={t.priority} />
				</div>
			</header>

			<section className="mb-6">
				<h3 className="m-0 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
					{__('Conversation', 'doublescale')}
				</h3>

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
					<ul className="space-y-3">
						{conv.data.data.map((item) => (
							<ConversationBubble key={item.id} item={item} />
						))}
					</ul>
				)}
			</section>

			{isClosed && (
				<p className="mb-3 rounded border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
					{__(
						'This ticket is closed. Sending a reply will re-open it.',
						'doublescale'
					)}
				</p>
			)}

			<section>
				<label
					htmlFor="doublescale-portal-reply"
					className="m-0 mb-2 block text-sm font-semibold"
				>
					{__('Add a reply', 'doublescale')}
				</label>
				<textarea
					id="doublescale-portal-reply"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					rows={5}
					placeholder={__(
						'Type your reply here…',
						'doublescale'
					)}
					className="block w-full rounded-md border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
				{sendError && (
					<p className="mt-2 text-sm text-destructive">{sendError}</p>
				)}
				<div className="mt-3 flex justify-end">
					<Button
						onClick={handleSend}
						disabled={sending || !draft.trim()}
					>
						<Send width={14} height={14} className="mr-1" />
						{sending
							? __('Sending…', 'doublescale')
							: __('Send reply', 'doublescale')}
					</Button>
				</div>
			</section>
		</div>
	);
};

const ConversationBubble = ({ item }: { item: PortalConversationItem }) => {
	const isSelf = item.is_self === true;
	const isEvent = item.kind === 'event';
	const content = typeof item.data?.content === 'string' ? item.data.content : '';

	if (isEvent) {
		return (
			<li className="text-center text-xs text-muted-foreground">
				<span>{describeEvent(item)}</span>
				<span className="ml-2">{formatDate(item.created_at)}</span>
			</li>
		);
	}

	return (
		<li className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
			<div
				className={`max-w-[85%] rounded-lg border p-3 text-sm ${
					isSelf
						? 'border-primary/20 bg-primary/5'
						: 'border-border bg-background'
				}`}
			>
				<div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
					<span className="font-medium">
						{isSelf
							? __('You', 'doublescale')
							: item.user?.display_name ||
								__('Support team', 'doublescale')}
					</span>
					<span>{formatDate(item.created_at)}</span>
				</div>
				<div className="whitespace-pre-wrap text-foreground">{content}</div>
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

const formatDate = (input: string | null): string => {
	if (!input) {
		return '';
	}
	try {
		return new Date(input).toLocaleString();
	} catch {
		return input;
	}
};

export default TicketDetail;
