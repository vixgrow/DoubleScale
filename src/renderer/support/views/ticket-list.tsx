/**
 * Portal: ticket list — standalone card or left pane in the split inbox.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Calendar, Circle, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InboxIcon } from '@/components/support';
import {
	PRIORITY_LABELS,
	TICKET_STATUSES,
} from '@/constants/support';
import type { TicketPriority, TicketStatus } from '@/constants/support';
import type { TicketFilters } from '@/types/support';

import { usePortalTickets } from '../api';
import type { PortalConfig, PortalTicket } from '../types';

interface Props {
	config: PortalConfig;
	onOpenTicket: (id: number) => void;
	onCompose: () => void;
	selectedTicketId?: number | null;
	variant?: 'standalone' | 'pane';
	onTicketsLoaded?: (ids: number[]) => void;
}

const TicketList = ({
	config,
	onOpenTicket,
	onCompose,
	selectedTicketId = null,
	variant = 'standalone',
	onTicketsLoaded,
}: Props) => {
	const isPane = variant === 'pane';
	const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
	const [query, setQuery] = useState('');

	const filters: TicketFilters = {
		...(config.box_id ? { mailbox_id: config.box_id } : {}),
	};
	const { data, loading, error } = usePortalTickets(filters);
	const rows = data?.data ?? [];

	useEffect(() => {
		onTicketsLoaded?.(rows.map((t) => t.id));
	}, [rows, onTicketsLoaded]);

	const normalizedQuery = query.trim().toLowerCase();
	const searchedRows = useMemo(() => {
		if (!normalizedQuery) {
			return rows;
		}
		return rows.filter(
			(t) =>
				String(t.id).includes(normalizedQuery) ||
				t.title.toLowerCase().includes(normalizedQuery)
		);
	}, [rows, normalizedQuery]);

	const visibleRows = useMemo(() => {
		if (statusFilter === 'all') {
			return searchedRows;
		}
		return searchedRows.filter((t) => t.status === statusFilter);
	}, [searchedRows, statusFilter]);

	const statusCounts = useMemo(() => {
		const counts: Record<'all' | TicketStatus, number> = {
			all: searchedRows.length,
			open: 0,
			pending: 0,
			resolved: 0,
			closed: 0,
		};
		for (const row of searchedRows) {
			counts[row.status] += 1;
		}
		return counts;
	}, [searchedRows]);

	const filterOptions: Array<{ value: 'all' | TicketStatus; label: string }> =
		[
			{
				value: 'all',
				label: `${__('All', 'doublescale')} (${statusCounts.all})`,
			},
			...TICKET_STATUSES.map((s) => ({
				value: s,
				label: `${s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s]})`,
			})),
		];

	const listHeader = !isPane ? (
		<header className="mb-4 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 className="m-0 text-2xl font-semibold">
					{__('My support tickets', 'doublescale')}
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					{__('Signed in as', 'doublescale')}{' '}
					<strong>{config.user.display_name || config.user.email}</strong>
				</p>
			</div>
			<Button size="sm" onClick={onCompose}>
				<Plus width={14} height={14} className="mr-1" />
				{__('New ticket', 'doublescale')}
			</Button>
		</header>
	) : null;

	const listBody = (
		<>
			<div className="px-4 pt-4">
				<div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-muted-foreground">
					<Search width={14} height={14} />
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={__('Search by ID, title…', 'doublescale')}
						className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
					/>
				</div>
			</div>

			<div className="flex flex-wrap gap-2 px-4 py-3">
				{filterOptions.map((opt) => (
					<button
						type="button"
						key={opt.value}
						onClick={() => setStatusFilter(opt.value)}
						className={`rounded-md px-3 py-1 text-xs font-medium transition ${
							statusFilter === opt.value
								? 'bg-[#EEF0FF] text-[#2D3282]'
								: 'bg-white border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
						}`}
					>
						{opt.label}
					</button>
				))}
			</div>

			<div className={`min-h-0 flex-1 px-3 pb-4 ${isPane ? 'overflow-y-auto' : ''}`}>
				{loading && (
					<p className="px-1 text-sm text-muted-foreground">
						{__('Loading…', 'doublescale')}
					</p>
				)}

				{error && (
					<div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
						{error}
					</div>
				)}

				{!loading && !error && visibleRows.length === 0 && (
					<EmptyState
						hasFilter={statusFilter !== 'all' || normalizedQuery.length > 0}
						onClearFilter={() => {
							setStatusFilter('all');
							setQuery('');
						}}
						onCompose={onCompose}
					/>
				)}

				{!loading && visibleRows.length > 0 && (
					<ul className="space-y-3">
						{visibleRows.map((t) => (
							<TicketRow
								key={t.id}
								ticket={t}
								onOpen={() => onOpenTicket(t.id)}
								selected={selectedTicketId === t.id}
							/>
						))}
					</ul>
				)}
			</div>
		</>
	);

	if (isPane) {
		return (
			<div className="flex h-full min-h-0 flex-col">{listBody}</div>
		);
	}

	return (
		<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
			{listHeader}
			{listBody}
		</div>
	);
};

const PRIORITY_BADGE: Record<
	TicketPriority,
	{ className: string }
> = {
	urgent: {

		className: 'bg-[#FEE2E2] text-[#DC2626]',
	},
	high: {

		className: 'bg-[#FAEADF] text-[#CB5301]',
	},
	normal: {

		className: 'bg-[#EFF6FF] text-[#2563EB]',
	},
	low: {

		className: 'bg-[#ECFDF3] text-[#16A34A]',
	},
};

const PRIORITY_ROW_ICON: Record<TicketPriority, string> = {
	normal: 'text-[#0D9DFC]',
	low: 'text-[#16A34A]',
	high: 'text-[#CB5301]',
	urgent: 'text-[#DC2626]',
};

const TicketRow = ({
	ticket,
	onOpen,
	selected = false,
}: {
	ticket: PortalTicket;
	onOpen: () => void;
	selected?: boolean;
}) => {
	const priorityBadge = PRIORITY_BADGE[ticket.priority] ?? PRIORITY_BADGE.normal;

	return (
		<li>
			<button
				type="button"
				onClick={onOpen}
				className={`flex w-full flex-col rounded-xl border p-3.5 text-left transition ${
					selected
						? 'border-[#C7D2FE] border-l-4 border-l-[#2D3282] bg-[#EEF0FF]'
						: 'border-border bg-white hover:border-[#C7D2FE] hover:bg-[#F8F9FF]'
				}`}
			>
				<div className="flex items-center justify-between gap-2">
					<span className="text-sm font-semibold text-foreground">
						ID:#{ticket.id}
					</span>

						<span
							className={`rounded-md px-2 py-0.5 text-xs font-semibold ${priorityBadge.className}`}
						>
							{PRIORITY_LABELS[ticket.priority]}
						</span>

				</div>

				<p className="m-0 mt-2 truncate text-sm text-foreground">
					{ticket.title}
				</p>

				<div className="my-3 h-px bg-border" />

				<div className="flex items-center justify-between gap-2">
					<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
						<Circle
							width={14}
							height={14}
							className={
								PRIORITY_ROW_ICON[ticket.priority] ?? 'text-[#0D9DFC]'
							}
						/>
						{PRIORITY_LABELS[ticket.priority]}
					</span>
					<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
						<Calendar width={12} height={12} />
						{formatListDate(ticket.updated_at || ticket.created_at)}
					</span>
				</div>
			</button>
		</li>
	);
};

const EmptyState = ({
	hasFilter,
	onClearFilter,
	onCompose,
}: {
	hasFilter: boolean;
	onClearFilter: () => void;
	onCompose: () => void;
}) => (
	<div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-background py-10 text-center">
		<InboxIcon width={32} height={32} className="mb-3 text-muted-foreground" />
		<p className="m-0 mb-1 text-base font-medium">
			{hasFilter
				? __('No tickets match this filter', 'doublescale')
				: __('No tickets yet', 'doublescale')}
		</p>
		<p className="m-0 mb-4 text-sm text-muted-foreground">
			{hasFilter
				? __('Try clearing the filter to see all your tickets.', 'doublescale')
				: __('Submit your first ticket and our team will get back to you.', 'doublescale')}
		</p>
		{hasFilter ? (
			<Button variant="outline" size="sm" onClick={onClearFilter}>
				{__('Show all tickets', 'doublescale')}
			</Button>
		) : (
			<Button size="sm" onClick={onCompose}>
				<Plus width={14} height={14} className="mr-1" />
				{__('Open a ticket', 'doublescale')}
			</Button>
		)}
	</div>
);

const formatListDate = (input: string | null): string => {
	if (!input) {
		return '';
	}
	try {
		return new Date(input).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	} catch {
		return input;
	}
};

export default TicketList;
