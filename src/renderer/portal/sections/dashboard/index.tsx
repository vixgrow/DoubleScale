/**
 * Dashboard — the portal home. Summary cards (from /portal/bootstrap, passed in)
 * + a recent whitelisted activity timeline (from /portal/timeline).
 */

import { __, sprintf } from '@wordpress/i18n';
import { Link } from 'react-router-dom';

import { fetchTimeline, useAsync } from '../../api';
import type { PortalSummaryCard, PortalTimelineItem } from '../../types';
import { formatDate } from '../../shared/format';
import {
	CalendarIcon,
	ChevronRightIcon,
	DocumentIcon,
	SectionIcon,
	TicketIcon,
} from '../../shared/icons';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../../shared/ui';

/** Pick a portal icon slug from a card's route/key (no icon arrives from PHP). */
const cardIcon = (card: PortalSummaryCard): string => {
	const hint = `${card.route || ''} ${card.key || ''}`.toLowerCase();
	if (hint.includes('book')) {
		return 'calendar';
	}
	if (hint.includes('ticket') || hint.includes('support')) {
		return 'ticket';
	}
	if (
		hint.includes('doc') ||
		hint.includes('invoice') ||
		hint.includes('sale')
	) {
		return 'document';
	}
	return 'home';
};

const SummaryCard = ({ card }: { card: PortalSummaryCard }) => {
	const body = (
		<>
			<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
				<SectionIcon icon={cardIcon(card)} className="h-5 w-5" />
			</span>
			<div className="min-w-0">
				<p className="text-2xl font-bold leading-none text-foreground">
					{card.value}
				</p>
				<p className="mt-1 text-sm leading-snug text-muted-foreground">
					{card.label}
				</p>
			</div>
		</>
	);
	const cls =
		'flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all';
	return card.route ? (
		<Link
			to={`/${card.route}`}
			className={`${cls} hover:border-primary hover:shadow-md`}
		>
			{body}
		</Link>
	) : (
		<div className={cls}>{body}</div>
	);
};

const timelineCopy = (item: PortalTimelineItem): string => {
	if (item.kind === 'booking') {
		const name = item.title || __('Booking', 'doublescale');
		switch (item.type) {
			case 'booking_cancelled':
				// translators: %s is the event name.
				return sprintf(__('Booking cancelled: %s', 'doublescale'), name);
			case 'booking_completed':
				// translators: %s is the event name.
				return sprintf(__('Attended: %s', 'doublescale'), name);
			case 'booking_pending':
				// translators: %s is the event name.
				return sprintf(__('Booking pending: %s', 'doublescale'), name);
			default:
				// translators: %s is the event name.
				return sprintf(__('Booked: %s', 'doublescale'), name);
		}
	}
	if (item.kind === 'document') {
		const name = item.title || __('Document', 'doublescale');
		switch (item.type) {
			case 'invoice_paid':
				// translators: %s is the invoice number.
				return sprintf(__('Invoice paid: %s', 'doublescale'), name);
			case 'invoice_sent':
				// translators: %s is the invoice number.
				return sprintf(__('Invoice: %s', 'doublescale'), name);
			case 'proposal_accepted':
				// translators: %s is the proposal subject.
				return sprintf(__('Proposal accepted: %s', 'doublescale'), name);
			case 'proposal_declined':
				// translators: %s is the proposal subject.
				return sprintf(__('Proposal declined: %s', 'doublescale'), name);
			default:
				// translators: %s is the proposal subject.
				return sprintf(__('Proposal: %s', 'doublescale'), name);
		}
	}
	if (item.type === 'support_reply') {
		return item.is_self
			? __('You replied to a support ticket', 'doublescale')
			: __('Support replied to your ticket', 'doublescale');
	}
	return item.title || item.type;
};

/** Where a timeline row navigates, or null if it isn't actionable. */
const timelineTarget = (item: PortalTimelineItem): string | null => {
	if (item.kind === 'booking' && item.booking_id) {
		return `/bookings/${item.booking_id}`;
	}
	if (item.kind === 'document') {
		// Phase 1 is link-out: the doc itself opens on its public hash page from
		// the Documents list, so the timeline row just lands the customer there.
		return '/documents';
	}
	if (item.type === 'support_reply' && item.ticket_id) {
		return `/tickets/${item.ticket_id}`;
	}
	return null;
};

const timelineIcon = (kind: PortalTimelineItem['kind']) => {
	if (kind === 'booking') {
		return CalendarIcon;
	}
	if (kind === 'document') {
		return DocumentIcon;
	}
	return TicketIcon;
};

const TimelineRow = ({ item }: { item: PortalTimelineItem }) => {
	const Icon = timelineIcon(item.kind);
	const target = timelineTarget(item);

	const body = (
		<>
			<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
				<Icon className="w-4 h-4" />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm text-foreground">{timelineCopy(item)}</p>
				<div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
					{item.date && <span>{formatDate(item.date, item.timezone)}</span>}
					{(item.kind === 'booking' || item.kind === 'document') &&
						item.status && <StatusBadge status={item.status} />}
				</div>
			</div>
			{target && (
				<ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
			)}
		</>
	);

	if (target) {
		return (
			<li>
				<Link
					to={target}
					className="group -mx-4 flex items-start gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-accent"
				>
					{body}
				</Link>
			</li>
		);
	}

	return <li className="flex items-start gap-3 py-3">{body}</li>;
};

const Dashboard = ({ summary }: { summary: PortalSummaryCard[] }) => {
	// "Recent activity" is intentionally a fixed first-page preview (15 rows),
	// NOT an infinite-scroll feed. /portal/timeline does support page/per_page,
	// but nothing requests page 2+, and the server merges at most ~250 rows
	// (200 activities + 50 bookings) before paging — ample for a customer's
	// at-a-glance recent activity. Revisit (add "load more") only if customers
	// need to browse their full history here.
	const { data, loading, error } = useAsync(() => fetchTimeline(1, 15), []);
	const items = data?.data || [];

	return (
		<section className="space-y-6">
			{summary.length > 0 && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{summary.map((card) => (
						<SummaryCard key={card.key} card={card} />
					))}
				</div>
			)}

			<div>
				<h2 className="mb-3 text-lg font-bold">
					{__('Recent activity', 'doublescale')}
				</h2>
				<div className="rounded-xl border border-border bg-card px-4 shadow-sm">
					{loading && <Spinner />}
					{!loading && error && (
						<div className="py-4">
							<ErrorState message={error} />
						</div>
					)}
					{!loading && !error && items.length === 0 && (
						<EmptyState
							title={__('Nothing here yet', 'doublescale')}
							description={__(
								'Your recent bookings, documents, and support replies will appear here.',
								'doublescale'
							)}
						/>
					)}
					{!loading && !error && items.length > 0 && (
						<ul className="divide-y divide-border">
							{items.map((item) => (
								<TimelineRow key={`${item.kind}-${item.id}`} item={item} />
							))}
						</ul>
					)}
				</div>
			</div>
		</section>
	);
};

export default Dashboard;
