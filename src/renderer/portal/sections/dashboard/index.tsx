/**
 * Dashboard — the portal home. Summary cards (from /portal/bootstrap, passed in)
 * + a recent whitelisted activity timeline (from /portal/timeline).
 */

import { __, sprintf } from '@wordpress/i18n';
import { Link } from 'react-router-dom';

import { fetchTimeline, useAsync } from '../../api';
import type { PortalSummaryCard, PortalTimelineItem } from '../../types';
import { formatDate } from '../../shared/format';
import { CalendarIcon, TicketIcon } from '../../shared/icons';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../../shared/ui';

const SummaryCard = ({ card }: { card: PortalSummaryCard }) => {
	const body = (
		<>
			<p className="text-sm text-muted-foreground">{card.label}</p>
			<p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
		</>
	);
	const cls =
		'rounded-xl border border-border bg-card p-4 shadow-sm transition-colors';
	return card.route ? (
		<Link to={`/${card.route}`} className={`${cls} hover:border-primary`}>
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
	if (item.type === 'support_reply') {
		return item.is_self
			? __('You replied to a support ticket', 'doublescale')
			: __('Support replied to your ticket', 'doublescale');
	}
	return item.title || item.type;
};

const TimelineRow = ({ item }: { item: PortalTimelineItem }) => {
	const Icon = item.kind === 'booking' ? CalendarIcon : TicketIcon;
	return (
		<li className="flex items-start gap-3 py-3">
			<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
				<Icon className="w-4 h-4" />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm text-foreground">{timelineCopy(item)}</p>
				<div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
					{item.date && <span>{formatDate(item.date, item.timezone)}</span>}
					{item.kind === 'booking' && item.status && (
						<StatusBadge status={item.status} />
					)}
				</div>
			</div>
		</li>
	);
};

const Dashboard = ({ summary }: { summary: PortalSummaryCard[] }) => {
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
								'Your recent bookings and support replies will appear here.',
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
