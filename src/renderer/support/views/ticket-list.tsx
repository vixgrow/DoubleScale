/**
 * Portal: ticket list — standalone card or left pane in the split inbox.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { InboxIcon, PriorityPill } from '@/components/support';
import {
	PRIORITY_LABELS,
	STATUS_LABELS,
	TICKET_STATUSES,
} from '@/constants/support';
import type { TicketStatus } from '@/constants/support';
import type { TicketFilters } from '@/types/support';

import { usePortalTickets } from '../api';
import type { PortalConfig, PortalTicket } from '../types';
import { CalendarIcon, GradientTicketsIcon } from '@doublescale/components';

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
			<div className="flex flex-col gap-2 py-4 mx-4 sm:flex-row sm:items-center border-b border-border">
				<div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-muted-foreground">
					<Search width={14} height={14} className="shrink-0" />
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={__('Search by ID, title…', 'doublescale')}
						className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
					/>
				</div>
				<Select
					value={statusFilter}
					onValueChange={(value) =>
						setStatusFilter(value as 'all' | TicketStatus)
					}
				>
					<SelectTrigger
						aria-label={__('Filter by status', 'doublescale')}
						className="h-9 w-auto shrink-0 min-w-[8.5rem] bg-white"
					>
						<SelectValue
							placeholder={__('All Statuses', 'doublescale')}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{__('All Statuses', 'doublescale')}
						</SelectItem>
						{TICKET_STATUSES.map((status) => (
							<SelectItem key={status} value={status}>
								{STATUS_LABELS[status]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className={`min-h-0 flex-1 p-4 ${isPane ? 'overflow-y-auto' : ''}`}>
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
					<ul className="space-y-4">
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

const STATUS_BADGE: Record<TicketStatus, string> = {
	open: 'bg-[#D9E9F3] text-[#0D9DFC]',
	pending: 'bg-[#FAEADF] text-[#CB5301]',
	resolved: 'bg-[#E4FAEC] text-[#008230]',
	closed: 'bg-[#E4FAEC] text-[#008230]',
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
	const showUrgent = ticket.priority === 'urgent';
	const badgeClass = showUrgent
		? 'bg-[#FBE8E8] text-[#C30A0A]'
		: (STATUS_BADGE[ticket.status] ?? 'bg-muted text-muted-foreground');
	const badgeLabel = showUrgent
		? PRIORITY_LABELS.urgent
		: (STATUS_LABELS[ticket.status] ?? ticket.status);

	return (
		<li>
			<button
				type="button"
				onClick={onOpen}
				className={`flex w-full flex-col rounded-xl p-4 text-left transition ${
					selected
						? 'border-l-4 border-l-primary bg-[#EEEEFF]'
						: 'border border-border bg-white hover:border-transparent hover:bg-[#F8F9FF]'
				}`}
			>
				<div className="flex items-center justify-between gap-2">
					<span className="text-sm font-semibold text-foreground">
						ID:#{ticket.id}
					</span>
					<span
						className={`rounded-lg px-2 py-1 text-xs font-semibold ${badgeClass}`}
					>
						{badgeLabel}
					</span>
				</div>

				<p className="m-0 mt-2 truncate text-sm text-foreground">
					{ticket.title}
				</p>

				<div className="my-3 h-px bg-border" />

				<div className="flex items-center justify-between gap-2">
					<PriorityPill priority={ticket.priority} />
					<span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
						<CalendarIcon width={20} height={20} />
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
	<div className="flex flex-col items-center justify-center py-10 text-center">
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
			<Button variant="secondaryDeepBlue" size="sm" onClick={onClearFilter}>
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
