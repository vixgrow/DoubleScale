/**
 * Guest ticket view — hash-based access without login.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusPill, PriorityPill } from '@/components/support';

import {
	addPublicReply,
	usePublicConversation,
	usePublicTicket,
} from '../public-api';
import type { PortalConversationItem } from '../types';

interface Props {
	hash: string;
}

const GuestTicket = ({ hash }: Props) => {
	const ticket = usePublicTicket(hash);
	const conv = usePublicConversation(hash);
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
			await addPublicReply(hash, content);
			setDraft('');
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
				<div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					{ticket.error || __('Ticket not found.', 'doublescale')}
				</div>
			</div>
		);
	}

	const t = ticket.data;

	return (
		<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
			<header className="mb-6">
				<h2 className="m-0 text-2xl font-semibold">{t.title}</h2>
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
				{!conv.loading && conv.data && conv.data.data.length > 0 && (
					<ul className="space-y-3">
						{conv.data.data.map((item) => (
							<ConversationBubble
								key={item.id}
								item={item}
								customerName={t.customer?.display_name || ''}
							/>
						))}
					</ul>
				)}
			</section>

			<section>
				<label
					htmlFor="doublescale-guest-reply"
					className="m-0 mb-2 block text-sm font-semibold"
				>
					{__('Add a reply', 'doublescale')}
				</label>
				<textarea
					id="doublescale-guest-reply"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					rows={5}
					className="block w-full rounded-md border border-input bg-background p-3 text-sm"
				/>
				{sendError && (
					<p className="mt-2 text-sm text-destructive">{sendError}</p>
				)}
				<div className="mt-3 flex justify-end">
					<Button onClick={handleSend} disabled={sending || !draft.trim()}>
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

const ConversationBubble = ({
	item,
	customerName,
}: {
	item: PortalConversationItem;
	customerName: string;
}) => {
	const content =
		typeof item.data?.content === 'string' ? item.data.content : '';
	const isCustomer = item.is_customer === true || item.is_self === true;

	return (
		<li
			className={`rounded-lg border p-3 text-sm ${
				isCustomer
					? 'border-primary/20 bg-primary/5'
					: 'border-border bg-background'
			}`}
		>
			<div className="mb-1 text-xs text-muted-foreground">
				{isCustomer
					? customerName || __('You', 'doublescale')
					: item.user?.display_name ||
						__('Support team', 'doublescale')}
			</div>
			<div
				className="prose prose-sm max-w-none"
				dangerouslySetInnerHTML={{ __html: content }}
			/>
			{item.attachments && item.attachments.length > 0 && (
				<ul className="mt-2 space-y-1">
					{item.attachments.map((att) => (
						<li key={att.url}>
							<a
								href={att.url}
								className="text-blue-600 hover:underline"
								target="_blank"
								rel="noopener noreferrer"
							>
								{att.file_name}
							</a>
						</li>
					))}
				</ul>
			)}
		</li>
	);
};

export default GuestTicket;
