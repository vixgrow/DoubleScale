/**
 * Dashboard — portal home with analytics overview, embedded calendar, and
 * recent activity timeline.
 */

import { __, sprintf } from '@wordpress/i18n';
import { Link } from 'react-router-dom';

import {
	AppliedCreditIcon,
	CalendarIcon,
	DealsIcon,
	GradientActivitiesIcon,
	GradientContractsIcon,
	HelpdeskIcon,
	InvoicesIcon,
	ProjectsIcon,
	ProposalsIcon,
} from '@doublescale/components';
import { MessageStatsCard } from '@doublescale/components';

import { fetchTimeline, useAsync } from '../../api';
import type { PortalSummaryCard, PortalTimelineItem } from '../../types';
import { formatDate } from '../../shared/format';
import { ChevronRightIcon, SectionIcon } from '../../shared/icons';
import {
	ErrorState,
	PORTAL_DASHBOARD_PANEL,
	PORTAL_DASHBOARD_TILE,
	Spinner,
	StatusBadge,
} from '../../shared/ui';
import type { ReactNode } from 'react';
import CalendarPanel from './calendar-panel';

const CARD_ORDER = [
	'outstanding_balance',
	'active_projects',
	'open_tickets',
	'upcoming_bookings',
] as const;

const CARD_META: Record<
	string,
	{
		icon: ReactNode;
		iconBgClass: string;
		iconColor: string;
	}
> = {
	outstanding_balance: {
		icon: <DealsIcon width={32} height={32} />,
		iconBgClass: 'bg-[#CB5301]',
		iconColor: 'text-white',
	},
	active_projects: {
		icon: <ProjectsIcon width={32} height={32} />,
		iconBgClass: 'bg-[#0D9DFC]',
		iconColor: 'text-white',
	},
	open_tickets: {
		icon: <HelpdeskIcon width={32} height={32} />,
		iconBgClass: 'bg-[#FFD242]',
		iconColor: 'text-[#29292E]',
	},
	upcoming_bookings: {
		icon: <CalendarIcon width={32} height={32} />,
		iconBgClass: 'bg-[#262666]',
		iconColor: 'text-white',
	},
};

const orderSummaryCards = (cards: PortalSummaryCard[]): PortalSummaryCard[] => {
	const ordered = CARD_ORDER.map((key) =>
		cards.find((c) => c.key === key)
	).filter((c): c is PortalSummaryCard => !!c);
	const rest = cards.filter(
		(c) => !CARD_ORDER.includes(c.key as (typeof CARD_ORDER)[number])
	);
	return [...ordered, ...rest];
};

const AnalyticsStatCard = ({ card }: { card: PortalSummaryCard }) => {
	const meta = CARD_META[card.key] || {
		icon: <SectionIcon icon="home" className="h-5 w-5" />,
		iconBgClass: 'bg-primary/10',
		iconColor: 'text-primary',
	};

	const content = (
		<MessageStatsCard
			icon={meta.icon}
			value={card.value}
			label={card.label}
			iconBgClass={meta.iconBgClass}
			iconColor={meta.iconColor}
			className={`h-full border-0 ${PORTAL_DASHBOARD_TILE}`}
		/>
	);

	if (card.route) {
		return (
			<Link
				to={`/${card.route}`}
				className="block h-full transition-transform hover:-translate-y-0.5"
			>
				{content}
			</Link>
		);
	}

	return content;
};

const timelineCopy = (item: PortalTimelineItem): string => {
	if (item.kind === 'booking') {
		const name = item.title || __('Booking', 'doublescale');
		switch (item.type) {
			case 'booking_cancelled':
				return sprintf(
					__('Booking cancelled: %s', 'doublescale'),
					name
				);
			case 'booking_completed':
				return sprintf(__('Attended: %s', 'doublescale'), name);
			case 'booking_pending':
				return sprintf(__('Booking pending: %s', 'doublescale'), name);
			default:
				return sprintf(__('Booked: %s', 'doublescale'), name);
		}
	}
	if (item.kind === 'document') {
		const name = item.title || __('Document', 'doublescale');
		switch (item.type) {
			case 'invoice_paid':
				return sprintf(__('Invoice paid: %s', 'doublescale'), name);
			case 'invoice_sent':
				return sprintf(__('Invoice: %s', 'doublescale'), name);
			case 'proposal_accepted':
				return sprintf(
					__('Proposal accepted: %s', 'doublescale'),
					name
				);
			case 'proposal_declined':
				return sprintf(
					__('Proposal declined: %s', 'doublescale'),
					name
				);
			case 'credit_note_sent':
				return sprintf(__('Credit note: %s', 'doublescale'), name);
			default:
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

const timelineTarget = (item: PortalTimelineItem): string | null => {
	if (item.kind === 'booking' && item.booking_id) {
		return `/bookings/${item.booking_id}`;
	}
	if (item.kind === 'document') {
		if (item.document_type === 'credit_note' && item.hash) {
			return `/documents/credit-note/${item.hash}`;
		}
		return '/documents';
	}
	if (item.type === 'support_reply' && item.ticket_id) {
		return `/tickets/${item.ticket_id}`;
	}
	return null;
};

const TIMELINE_ICON_SIZE = 24;

const timelineActivityIcon = (item: PortalTimelineItem): ReactNode => {
	if (item.kind === 'booking') {
		return (
			<CalendarIcon width={TIMELINE_ICON_SIZE} height={TIMELINE_ICON_SIZE} />
		);
	}

	if (item.type === 'support_reply') {
		return (
			<HelpdeskIcon width={TIMELINE_ICON_SIZE} height={TIMELINE_ICON_SIZE} />
		);
	}

	if (item.type.includes('project')) {
		return (
			<ProjectsIcon width={TIMELINE_ICON_SIZE} height={TIMELINE_ICON_SIZE} />
		);
	}

	if (item.kind === 'document') {
		const docType =
			item.document_type ||
			(item.type.startsWith('invoice')
				? 'invoice'
				: item.type.startsWith('proposal')
					? 'proposal'
					: item.type.startsWith('credit_note')
						? 'credit_note'
						: item.type.startsWith('contract')
							? 'contract'
							: undefined);

		switch (docType) {
			case 'invoice':
				return (
					<InvoicesIcon
						width={TIMELINE_ICON_SIZE}
						height={TIMELINE_ICON_SIZE}
					/>
				);
			case 'proposal':
				return (
					<ProposalsIcon
						width={TIMELINE_ICON_SIZE}
						height={TIMELINE_ICON_SIZE}
					/>
				);
			case 'contract':
				return (
					<GradientContractsIcon
						width={TIMELINE_ICON_SIZE}
						height={TIMELINE_ICON_SIZE}
					/>
				);
			case 'credit_note':
				return (
					<AppliedCreditIcon
						width={TIMELINE_ICON_SIZE}
						height={TIMELINE_ICON_SIZE}
						color="currentColor"
					/>
				);
			default:
				break;
		}
	}

	return (
		<GradientActivitiesIcon
			width={TIMELINE_ICON_SIZE}
			height={TIMELINE_ICON_SIZE}
		/>
	);
};

const showAcceptedBadge = (item: PortalTimelineItem): boolean =>
	item.kind === 'document' && item.type === 'proposal_accepted';

const TimelineRow = ({ item }: { item: PortalTimelineItem }) => {
	const target = timelineTarget(item);

	const body = (
		<div className={`flex items-start gap-3 p-3 ${PORTAL_DASHBOARD_TILE}`}>
			<span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEEEFF] text-primary">
				{timelineActivityIcon(item)}
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium text-foreground">
					{timelineCopy(item)}
				</p>
				{item.date && (
					<div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
						<CalendarIcon width={18} height={18} />
						<span>{formatDate(item.date, item.timezone)}</span>
					</div>
				)}
			</div>
			{showAcceptedBadge(item) && <StatusBadge status="accepted" />}
			{target && (
				<ChevronRightIcon className="mt-2 h-4 w-4 shrink-0 self-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
			)}
		</div>
	);

	if (target) {
		return (
			<li>
				<Link to={target} className="group block">
					{body}
				</Link>
			</li>
		);
	}

	return <li>{body}</li>;
};

const RecentActivityEmpty = () => (
	<div
		className={`flex flex-col items-center justify-center py-12 text-center ${PORTAL_DASHBOARD_TILE}`}
	>
		<span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEEEFF]">
			<GradientActivitiesIcon width={40} height={40} />
		</span>
		<p className="text-sm font-medium text-foreground">
			{__('No recent activity yet', 'doublescale')}
		</p>
	</div>
);

const Dashboard = ({ summary }: { summary: PortalSummaryCard[] }) => {
	const { data, loading, error } = useAsync(() => fetchTimeline(1, 15), []);
	const items = data?.data || [];
	const cards = orderSummaryCards(summary);

	return (
		<section className="space-y-6">
			<h1 className="text-xl font-bold text-foreground">
				{__('Dashboard', 'doublescale')}
			</h1>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
				<div className="space-y-6">
					{cards.length > 0 && (
						<div className={PORTAL_DASHBOARD_PANEL}>
							<h2 className="mb-4 text-base font-semibold text-foreground">
								{__('Analytics Overview', 'doublescale')}
							</h2>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{cards.map((card) => (
									<AnalyticsStatCard
										key={card.key}
										card={card}
									/>
								))}
							</div>
						</div>
					)}

					<div className={PORTAL_DASHBOARD_PANEL}>
						<CalendarPanel />
					</div>
				</div>

				<aside className={PORTAL_DASHBOARD_PANEL}>
					<div className="mb-4">
						<h2 className="text-base font-semibold text-foreground">
							{__('Recent activity', 'doublescale')}
						</h2>
					</div>

					{loading && <Spinner />}
					{!loading && error && <ErrorState message={error} />}
					{!loading && !error && items.length === 0 && (
						<RecentActivityEmpty />
					)}
					{!loading && !error && items.length > 0 && (
						<ul className="space-y-3">
							{items.map((item) => (
								<TimelineRow
									key={`${item.kind}-${item.id}`}
									item={item}
								/>
							))}
						</ul>
					)}
				</aside>
			</div>
		</section>
	);
};

export default Dashboard;
