/**
 * Support inbox — paginated ticket list with status / priority / search filters.
 *
 * Mirrors the table-driven shape used by Contacts and Booking. Row click routes
 * to `support/ticket/{id}`. Filters are URL-less for now (component state) —
 * deep-linkable filter state can come in a follow-up.
 */

import React, { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { Plus, RefreshCw, Inbox as InboxEmptyIcon } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import DataTablePagination from '@/components/ui/data-table-pagination';
import {
	useTickets,
	useMailboxes,
	useAssignableAgents,
	updateTicket,
	deleteTicket,
	addReply,
} from '@/hooks/support';
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
import BulkActionBar from './bulk-action-bar';
import {
	AssignAgentModal,
	AssignMailboxModal,
	AssignTagsModal,
	BulkReplyModal,
} from './bulk-action-modals';

type BulkModal = 'reply' | 'agent' | 'mailbox' | 'tags' | null;

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
	const { createNotice } = useDispatch('doublescale/core');
	const [filters, setFilters] = useState<TicketFilters>({
		per_page: 20,
		page: 1,
		sort_by: 'updated_at',
		sort_order: 'desc',
	});
	const { data, loading, error, refetch } = useTickets(filters);
	const { data: mailboxes } = useMailboxes();
	const { data: assignableAgents } = useAssignableAgents();
	const [showNewModal, setShowNewModal] = useState(false);
	const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [bulkModal, setBulkModal] = useState<BulkModal>(null);
	const [bulkBusy, setBulkBusy] = useState(false);
	const canManageAllTickets = useCapabilities().canManageAllTickets();
	const filterKey = JSON.stringify(filters);
	const page = filters.page ?? 1;
	const perPage = filters.per_page ?? 20;
	const totalRecords = data?.meta.total ?? 0;

	const setPage = useCallback((nextPage: number) => {
		setFilters((prev) => ({ ...prev, page: nextPage }));
	}, []);

	const setPerPage = useCallback((nextPerPage: number) => {
		setFilters((prev) => ({ ...prev, per_page: nextPerPage, page: 1 }));
	}, []);

	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	const ticketsById = useMemo(() => {
		const map = new Map<number, Ticket>();
		data?.data.forEach((ticket) => {
			map.set(ticket.id, ticket);
		});
		return map;
	}, [data?.data]);

	const pageTicketIds = data?.data.map((ticket) => ticket.id) ?? [];
	const selectedCount = selectedIds.size;
	const allPageSelected =
		pageTicketIds.length > 0 &&
		pageTicketIds.every((id) => selectedIds.has(id));
	const somePageSelected =
		pageTicketIds.some((id) => selectedIds.has(id)) && !allPageSelected;

	useEffect(() => {
		setSelectedIds(new Set());
	}, [filterKey, data?.meta.current_page]);

	useEffect(() => {
		apiFetch<{ data?: Array<{ id: number; name: string }> }>({
			path: '/doublescale/v1/tags?per_page=100',
		})
			.then((res) => {
				setTags(Array.isArray(res?.data) ? res.data : []);
			})
			.catch(() => {
				setTags([]);
			});
	}, []);

	const updateFilter = (patch: Partial<TicketFilters>) => {
		setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
	};

	const toggleSelectAll = () => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (allPageSelected) {
				pageTicketIds.forEach((id) => next.delete(id));
			} else {
				pageTicketIds.forEach((id) => next.add(id));
			}
			return next;
		});
	};

	const toggleSelect = (ticketId: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(ticketId)) {
				next.delete(ticketId);
			} else {
				next.add(ticketId);
			}
			return next;
		});
	};

	const selectedIdList = useMemo(
		() => Array.from(selectedIds),
		[selectedIds]
	);

	const runBulk = async (
		action: () => Promise<void>,
		successMessage: string
	) => {
		setBulkBusy(true);
		try {
			await action();
			createNotice({ type: 'success', message: successMessage });
			setSelectedIds(new Set());
			refetch();
		} catch (err: unknown) {
			const message =
				err instanceof Error && err.message
					? err.message
					: __('Bulk action failed.', 'doublescale');
			createNotice({ type: 'error', message });
		} finally {
			setBulkBusy(false);
		}
	};

	const handleBulkClose = () => {
		runBulk(async () => {
			await Promise.all(
				selectedIdList.map((id) =>
					updateTicket(id, { status: 'closed' })
				)
			);
		}, __('Selected tickets closed.', 'doublescale'));
	};

	const handleBulkDelete = () => {
		if (
			!window.confirm(
				selectedCount === 1
					? __('Delete the selected ticket?', 'doublescale')
					: sprintf(
							/* translators: %d: number of selected tickets */
							__(
								'Delete %d selected tickets? This cannot be undone.',
								'doublescale'
							),
							selectedCount
					  )
			)
		) {
			return;
		}

		runBulk(async () => {
			await Promise.all(selectedIdList.map((id) => deleteTicket(id)));
		}, __('Selected tickets deleted.', 'doublescale'));
	};

	const handleBulkAssignAgent = async (agentUserId: number | null) => {
		await runBulk(async () => {
			await Promise.all(
				selectedIdList.map((id) =>
					updateTicket(id, { agent_user_id: agentUserId })
				)
			);
		}, __('Agent assigned.', 'doublescale'));
	};

	const handleBulkAssignMailbox = async (mailboxId: number) => {
		await runBulk(async () => {
			await Promise.all(
				selectedIdList.map((id) =>
					updateTicket(id, { mailbox_id: mailboxId })
				)
			);
		}, __('Tickets moved.', 'doublescale'));
	};

	const handleBulkAssignTags = async (tagIds: number[]) => {
		await runBulk(async () => {
			await Promise.all(
				selectedIdList.map((id) => {
					const ticket = ticketsById.get(id);
					const existing = ticket?.tag_ids ?? [];
					const merged = Array.from(new Set([...existing, ...tagIds]));
					return updateTicket(id, { tag_ids: merged });
				})
			);
		}, __('Tags applied.', 'doublescale'));
	};

	const handleBulkReply = async (content: string) => {
		await runBulk(async () => {
			await Promise.all(
				selectedIdList.map((id) => addReply(id, content))
			);
		}, __('Replies sent.', 'doublescale'));
	};

	const hasNoMailboxes = mailboxes.length === 0;
	const hasNoTickets =
		!loading &&
		data?.data.length === 0 &&
		!filters.search &&
		!filters.status &&
		!filters.priority &&
		!filters.mailbox_id &&
		!filters.tag_id;

	return (
		<div className="doublescale-support-inbox p-6">
			<BulkActionBar
				selectedCount={selectedCount}
				onReply={() => setBulkModal('reply')}
				onAssignAgent={() => setBulkModal('agent')}
				onAssignMailbox={() => setBulkModal('mailbox')}
				onAssignTags={() => setBulkModal('tags')}
				onClose={handleBulkClose}
				onDelete={handleBulkDelete}
				onClear={() => setSelectedIds(new Set())}
				busy={bulkBusy}
				canDelete={canManageAllTickets}
			/>

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
					<Label
						htmlFor="ds-support-search"
						className="block text-xs font-medium text-gray-700 mb-1"
					>
						{__('Search', 'doublescale')}
					</Label>
					<Input
						id="ds-support-search"
						type="search"
						placeholder={__('Title contains…', 'doublescale')}
						className="w-64"
						defaultValue={filters.search ?? ''}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								updateFilter({ search: (e.target as HTMLInputElement).value });
							}
						}}
					/>
				</div>
				<div>
					<Label
						htmlFor="ds-support-status"
						className="block text-xs font-medium text-gray-700 mb-1"
					>
						{__('Status', 'doublescale')}
					</Label>
					<Select
						value={filters.status ?? 'all'}
						onValueChange={(v) =>
							updateFilter({ status: v === 'all' ? undefined : v })
						}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder={__('All', 'doublescale')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{__('All', 'doublescale')}</SelectItem>
							{TICKET_STATUSES.map((s) => (
								<SelectItem key={s} value={s}>
									{s}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label
						htmlFor="ds-support-priority"
						className="block text-xs font-medium text-gray-700 mb-1"
					>
						{__('Priority', 'doublescale')}
					</Label>
					<Select
						value={filters.priority ?? 'all'}
						onValueChange={(v) =>
							updateFilter({
								priority: v === 'all' ? undefined : (v as TicketPriority),
							})
						}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder={__('All', 'doublescale')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{__('All', 'doublescale')}</SelectItem>
							{TICKET_PRIORITIES.map((p) => (
								<SelectItem key={p} value={p}>
									{p}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label
						htmlFor="ds-support-mailbox"
						className="block text-xs font-medium text-gray-700 mb-1"
					>
						{__('Mailbox', 'doublescale')}
					</Label>
					<Select
						value={filters.mailbox_id != null ? String(filters.mailbox_id) : 'all'}
						onValueChange={(v) =>
							updateFilter({
								mailbox_id: v === 'all' ? undefined : Number(v),
							})
						}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder={__('All', 'doublescale')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{__('All', 'doublescale')}</SelectItem>
							{mailboxes.map((m) => (
								<SelectItem key={m.id} value={String(m.id)}>
									{m.name || m.slug}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label
						htmlFor="ds-support-tag"
						className="block text-xs font-medium text-gray-700 mb-1"
					>
						{__('Tag', 'doublescale')}
					</Label>
					<Select
						value={filters.tag_id != null ? String(filters.tag_id) : 'all'}
						onValueChange={(v) =>
							updateFilter({
								tag_id: v === 'all' ? undefined : Number(v),
							})
						}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder={__('All', 'doublescale')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{__('All', 'doublescale')}</SelectItem>
							{tags.map((tag) => (
								<SelectItem key={tag.id} value={String(tag.id)}>
									{tag.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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
							<th className="w-10 px-4 py-2">
								<Checkbox
									checked={
										allPageSelected
											? true
											: somePageSelected
											  ? 'indeterminate'
											  : false
									}
									onCheckedChange={toggleSelectAll}
									disabled={loading || pageTicketIds.length === 0}
									aria-label={__('Select all on this page', 'doublescale')}
								/>
							</th>
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
								<td colSpan={9} className="px-4 py-8 text-center text-gray-500">
									{__('Loading tickets…', 'doublescale')}
								</td>
							</tr>
						)}
						{!loading && data?.data.length === 0 && (
							<tr>
								<td colSpan={9} className="px-4 py-16 text-center">
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
									className={`border-t hover:bg-gray-50 cursor-pointer ${
										selectedIds.has(ticket.id) ? 'bg-blue-50/60' : ''
									}`}
									onClick={() =>
										navigate(getToLink(`support/ticket/${ticket.id}`))
									}
								>
									<td
										className="px-4 py-3"
										onClick={(e) => e.stopPropagation()}
									>
										<Checkbox
											checked={selectedIds.has(ticket.id)}
											onCheckedChange={() => toggleSelect(ticket.id)}
											aria-label={__(
												'Select ticket',
												'doublescale'
											)}
										/>
									</td>
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

			{bulkModal === 'reply' && (
				<BulkReplyModal
					selectedCount={selectedCount}
					onClose={() => setBulkModal(null)}
					onSubmit={handleBulkReply}
				/>
			)}
			{bulkModal === 'agent' && (
				<AssignAgentModal
					selectedCount={selectedCount}
					agents={assignableAgents}
					onClose={() => setBulkModal(null)}
					onSubmit={handleBulkAssignAgent}
				/>
			)}
			{bulkModal === 'mailbox' && (
				<AssignMailboxModal
					selectedCount={selectedCount}
					mailboxes={mailboxes}
					onClose={() => setBulkModal(null)}
					onSubmit={handleBulkAssignMailbox}
				/>
			)}
			{bulkModal === 'tags' && (
				<AssignTagsModal
					selectedCount={selectedCount}
					onClose={() => setBulkModal(null)}
					onSubmit={handleBulkAssignTags}
				/>
			)}

			{data && totalRecords > 0 && (
				<div className="mt-4 bg-white rounded shadow-sm border">
					<DataTablePagination table={serverSideTable} />
				</div>
			)}
		</div>
	);
};

export default SupportInbox;
