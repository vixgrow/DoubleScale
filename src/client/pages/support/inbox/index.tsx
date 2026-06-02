/**
 * Support inbox — paginated ticket list with status / priority / search filters.
 *
 * Mirrors the table-driven shape used by Contacts and Booking. Row click routes
 * to `support/ticket/{id}`. Filters are URL-less for now (component state) —
 * deep-linkable filter state can come in a follow-up.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Plus, RefreshCw, Inbox as InboxEmptyIcon } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { Button } from '@/components/ui/button';
import { useTickets, useMailboxes } from '@/hooks/support';
import {
	StatusPill,
	PriorityPill,
} from '@/components/support';
import {
	TICKET_STATUSES,
	TICKET_PRIORITIES,
	type TicketPriority,
} from '@/constants/support';
import type { Ticket, TicketFilters } from '@/types/support';
import NewTicketModal from './new-ticket-modal';

const formatDate = (raw: string | null): string => {
	if (!raw) {
		return '—';
	}
	try {
		return new Date(raw + 'Z').toLocaleString();
	} catch {
		return raw;
	}
};

const contactName = (ticket: Ticket): string => {
	const c = ticket.contact;
	if (!c) {
		return `#${ticket.contact_id}`;
	}
	const first = c.first_name || '';
	const last = c.last_name || '';
	const full = `${first} ${last}`.trim();
	return full || c.email;
};

const SupportInbox: React.FC = () => {
	const navigate = useNavigate();
	const [filters, setFilters] = useState<TicketFilters>({
		per_page: 20,
		page: 1,
		sort_by: 'updated_at',
		sort_order: 'desc',
	});
	const { data, loading, error, refetch } = useTickets(filters);
	const { data: mailboxes } = useMailboxes();
	const [showNewModal, setShowNewModal] = useState(false);
	const canManageAllTickets = useCapabilities().canManageAllTickets();

	const updateFilter = (patch: Partial<TicketFilters>) => {
		setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
	};

	const hasNoMailboxes = mailboxes.length === 0;
	const hasNoTickets = !loading && data?.data.length === 0 && !filters.search && !filters.status && !filters.priority && !filters.mailbox_id;

	return (
		<div className="doublescale-support-inbox p-6">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-gray-900">
						{__('Support Inbox', 'doublescale')}
					</h1>
					<p className="text-sm text-gray-600 mt-1">
						{__(
							'Tickets across every mailbox, sorted by most recent activity.',
							'doublescale'
						)}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => refetch()}>
						<RefreshCw />
						{__('Refresh', 'doublescale')}
					</Button>
					{canManageAllTickets && (
						<Button
							size="sm"
							onClick={() => setShowNewModal(true)}
							disabled={hasNoMailboxes}
							title={
								hasNoMailboxes
									? __(
											'Create a mailbox before opening tickets.',
											'doublescale'
									  )
									: undefined
							}
						>
							<Plus />
							{__('New ticket', 'doublescale')}
						</Button>
					)}
				</div>
			</div>

			{/* Filter row */}
			<div className="mb-4 flex flex-wrap gap-3 items-end">
				<div>
					<label
						htmlFor="ds-support-search"
						className="block text-xs font-medium text-gray-700 mb-1"
					>
						{__('Search', 'doublescale')}
					</label>
					<input
						id="ds-support-search"
						type="search"
						placeholder={__('Title contains…', 'doublescale')}
						className="border rounded px-2 py-1.5 text-sm w-64"
						defaultValue={filters.search ?? ''}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								updateFilter({ search: (e.target as HTMLInputElement).value });
							}
						}}
					/>
				</div>
				<div>
					<label
						htmlFor="ds-support-status"
						className="block text-xs font-medium text-gray-700 mb-1"
					>
						{__('Status', 'doublescale')}
					</label>
					<select
						id="ds-support-status"
						className="border rounded px-2 py-1.5 text-sm"
						value={filters.status ?? ''}
						onChange={(e) =>
							updateFilter({ status: e.target.value || undefined })
						}
					>
						<option value="">{__('All', 'doublescale')}</option>
						{TICKET_STATUSES.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor="ds-support-priority"
						className="block text-xs font-medium text-gray-700 mb-1"
					>
						{__('Priority', 'doublescale')}
					</label>
					<select
						id="ds-support-priority"
						className="border rounded px-2 py-1.5 text-sm"
						value={filters.priority ?? ''}
						onChange={(e) =>
							updateFilter({
								priority: (e.target.value as TicketPriority) || undefined,
							})
						}
					>
						<option value="">{__('All', 'doublescale')}</option>
						{TICKET_PRIORITIES.map((p) => (
							<option key={p} value={p}>
								{p}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor="ds-support-mailbox"
						className="block text-xs font-medium text-gray-700 mb-1"
					>
						{__('Mailbox', 'doublescale')}
					</label>
					<select
						id="ds-support-mailbox"
						className="border rounded px-2 py-1.5 text-sm"
						value={filters.mailbox_id ?? ''}
						onChange={(e) =>
							updateFilter({
								mailbox_id: e.target.value ? Number(e.target.value) : undefined,
							})
						}
					>
						<option value="">{__('All', 'doublescale')}</option>
						{mailboxes.map((m) => (
							<option key={m.id} value={m.id}>
								{m.name || m.slug}
							</option>
						))}
					</select>
				</div>
			</div>

			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
					{error}
				</div>
			)}

			<div className="bg-white rounded shadow-sm border overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-gray-50">
						<tr className="text-left text-xs uppercase tracking-wide text-gray-500">
							<th className="px-4 py-2">{__('Title', 'doublescale')}</th>
							<th className="px-4 py-2">{__('Customer', 'doublescale')}</th>
							<th className="px-4 py-2">{__('Mailbox', 'doublescale')}</th>
							<th className="px-4 py-2">{__('Assigned to', 'doublescale')}</th>
							<th className="px-4 py-2">{__('Status', 'doublescale')}</th>
							<th className="px-4 py-2">{__('Priority', 'doublescale')}</th>
							<th className="px-4 py-2">{__('Replies', 'doublescale')}</th>
							<th className="px-4 py-2">{__('Updated', 'doublescale')}</th>
						</tr>
					</thead>
					<tbody>
						{loading && (
							<tr>
								<td colSpan={8} className="px-4 py-8 text-center text-gray-500">
									{__('Loading tickets…', 'doublescale')}
								</td>
							</tr>
						)}
						{!loading && data?.data.length === 0 && (
							<tr>
								<td colSpan={8} className="px-4 py-16 text-center">
									<div className="flex flex-col items-center gap-3">
										<InboxEmptyIcon
											width={48}
											height={48}
											className="text-gray-300"
										/>
										{hasNoTickets ? (
											<>
												<div className="text-base font-medium text-gray-700">
													{__('No tickets yet', 'doublescale')}
												</div>
												<div className="text-sm text-gray-500 max-w-md">
													{hasNoMailboxes
														? __(
																'Create a mailbox first, then open a ticket or wait for one to come in via the public portal.',
																'doublescale'
														  )
														: __(
																'When customers submit through the portal or email, their tickets will appear here.',
																'doublescale'
														  )}
												</div>
												{!hasNoMailboxes && (
													<Button
														size="sm"
														onClick={() => setShowNewModal(true)}
													>
														<Plus />
														{__('Open the first ticket', 'doublescale')}
													</Button>
												)}
											</>
										) : (
											<>
												<div className="text-base font-medium text-gray-700">
													{__('No tickets match these filters', 'doublescale')}
												</div>
												<div className="text-sm text-gray-500">
													{__(
														'Try clearing the search or status filters.',
														'doublescale'
													)}
												</div>
											</>
										)}
									</div>
								</td>
							</tr>
						)}
						{!loading &&
							data?.data.map((ticket) => (
								<tr
									key={ticket.id}
									className="border-t hover:bg-gray-50 cursor-pointer"
									onClick={() =>
										navigate(getToLink(`support/ticket/${ticket.id}`))
									}
								>
									<td className="px-4 py-3 font-medium text-gray-900 max-w-md truncate">
										{ticket.title}
									</td>
									<td className="px-4 py-3 text-gray-700">
										{contactName(ticket)}
									</td>
									<td className="px-4 py-3 text-gray-600">
										{ticket.mailbox?.name || ticket.mailbox?.slug || '—'}
									</td>
									<td className="px-4 py-3 text-gray-700">
										{ticket.agent?.display_name || (
											<span className="text-gray-400">
												{__('Unassigned', 'doublescale')}
											</span>
										)}
									</td>
									<td className="px-4 py-3">
										<StatusPill status={ticket.status} />
									</td>
									<td className="px-4 py-3">
										<PriorityPill priority={ticket.priority} />
									</td>
									<td className="px-4 py-3 text-gray-600">
										{ticket.response_count}
									</td>
									<td className="px-4 py-3 text-gray-500">
										{formatDate(ticket.updated_at)}
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>

			{showNewModal && (
				<NewTicketModal
					mailboxes={mailboxes}
					onClose={() => setShowNewModal(false)}
					onCreated={(ticketId) => {
						setShowNewModal(false);
						navigate(getToLink(`support/ticket/${ticketId}`));
					}}
				/>
			)}

			{/* Pagination */}
			{data && data.meta.last_page > 1 && (
				<div className="mt-4 flex items-center justify-between text-sm">
					<div className="text-gray-600">
						{__('Page', 'doublescale')} {data.meta.current_page}{' '}
						{__('of', 'doublescale')} {data.meta.last_page} ·{' '}
						{data.meta.total} {__('tickets', 'doublescale')}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							disabled={data.meta.current_page <= 1}
							onClick={() =>
								setFilters((prev) => ({
									...prev,
									page: (prev.page ?? 1) - 1,
								}))
							}
							className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-40"
						>
							{__('Previous', 'doublescale')}
						</button>
						<button
							type="button"
							disabled={data.meta.current_page >= data.meta.last_page}
							onClick={() =>
								setFilters((prev) => ({
									...prev,
									page: (prev.page ?? 1) + 1,
								}))
							}
							className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-40"
						>
							{__('Next', 'doublescale')}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default SupportInbox;
