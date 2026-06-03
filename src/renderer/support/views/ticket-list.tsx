/**
 * Portal: ticket list view.
 *
 * Shows the logged-in customer's tickets in a simple card-stack (not the
 * agent inbox's dense table — this is rendered inside a host page, so a
 * loose card layout reads better at narrow widths).
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Plus, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusPill, PriorityPill, InboxIcon } from '@/components/support';
import { TICKET_STATUSES } from '@/constants/support';
import type { TicketStatus } from '@/constants/support';
import type { TicketFilters } from '@/types/support';

import { usePortalTickets } from '../api';
import type { PortalConfig, PortalTicket } from '../types';

const FILTER_OPTIONS: Array<{ value: 'all' | TicketStatus; label: string }> = [
	{ value: 'all', label: __('All tickets', 'doublescale') },
	...TICKET_STATUSES.map((s) => ({
		value: s,
		label: s.charAt(0).toUpperCase() + s.slice(1),
	})),
];

interface Props {
	config: PortalConfig;
	onOpenTicket: (id: number) => void;
	onCompose: () => void;
}

const TicketList = ({ config, onOpenTicket, onCompose }: Props) => {
	const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');

	const filters: TicketFilters = {
		...(statusFilter === 'all' ? {} : { status: statusFilter }),
		// A shortcode-scoped portal (box_id) shows only that mailbox's tickets.
		...(config.box_id ? { mailbox_id: config.box_id } : {}),
	};
	const { data, loading, error, refetch } = usePortalTickets(filters);

	return (
		<div className="rounded-lg border border-border bg-card p-6 shadow-sm">
			<header className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="m-0 text-2xl font-semibold">
						{__('My support tickets', 'doublescale')}
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{__('Signed in as', 'doublescale')}{' '}
						<strong>{config.user.display_name || config.user.email}</strong>
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={refetch}
						disabled={loading}
					>
						<RotateCcw width={14} height={14} className="mr-1" />
						{__('Refresh', 'doublescale')}
					</Button>
					<Button size="sm" onClick={onCompose}>
						<Plus width={14} height={14} className="mr-1" />
						{__('New ticket', 'doublescale')}
					</Button>
				</div>
			</header>

			<div className="mb-4 flex flex-wrap gap-2">
				{FILTER_OPTIONS.map((opt) => (
					<button
						type="button"
						key={opt.value}
						onClick={() => setStatusFilter(opt.value)}
						className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
							statusFilter === opt.value
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border bg-background text-foreground hover:bg-accent'
						}`}
					>
						{opt.label}
					</button>
				))}
			</div>

			{loading && (
				<p className="text-sm text-muted-foreground">
					{__('Loading…', 'doublescale')}
				</p>
			)}

			{error && (
				<div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{!loading && !error && data && data.data.length === 0 && (
				<EmptyState
					hasFilter={statusFilter !== 'all'}
					onClearFilter={() => setStatusFilter('all')}
					onCompose={onCompose}
				/>
			)}

			{!loading && data && data.data.length > 0 && (
				<ul className="space-y-2">
					{data.data.map((t) => (
						<TicketRow
							key={t.id}
							ticket={t}
							onOpen={() => onOpenTicket(t.id)}
						/>
					))}
				</ul>
			)}
		</div>
	);
};

const TicketRow = ({
	ticket,
	onOpen,
}: {
	ticket: PortalTicket;
	onOpen: () => void;
}) => (
	<li>
		<button
			type="button"
			onClick={onOpen}
			className="flex w-full items-center justify-between gap-4 rounded-md border border-border bg-background p-4 text-left transition hover:border-primary hover:bg-accent/50"
		>
			<div className="min-w-0 flex-1">
				<div className="mb-1 flex items-center gap-2">
					<span className="text-sm font-semibold">#{ticket.id}</span>
					<StatusPill status={ticket.status} />
					<PriorityPill priority={ticket.priority} />
				</div>
				<p className="m-0 truncate text-base font-medium text-foreground">
					{ticket.title}
				</p>
				<p className="m-0 mt-1 text-xs text-muted-foreground">
					{formatDate(ticket.updated_at || ticket.created_at)}
					{ticket.response_count > 0 && (
						<>
							{' · '}
							{ticket.response_count}{' '}
							{ticket.response_count === 1
								? __('reply', 'doublescale')
								: __('replies', 'doublescale')}
						</>
					)}
				</p>
			</div>
		</button>
	</li>
);

const EmptyState = ({
	hasFilter,
	onClearFilter,
	onCompose,
}: {
	hasFilter: boolean;
	onClearFilter: () => void;
	onCompose: () => void;
}) => (
	<div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-background py-12 text-center">
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

const formatDate = (input: string | null): string => {
	if (!input) {
		return '';
	}
	try {
		const date = new Date(input);
		return date.toLocaleString();
	} catch {
		return input;
	}
};

export default TicketList;
