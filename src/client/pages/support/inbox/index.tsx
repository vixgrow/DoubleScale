/**
 * Support inbox — paginated ticket list with status / priority / search filters.
 *
 * Mirrors the table-driven shape used by Contacts and Booking. Row click routes
 * to `support/ticket/{id}`. Filters are URL-less for now (component state) —
 * deep-linkable filter state can come in a follow-up.
 */

import React, {
	useState,
	useEffect,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { Plus, Inbox as InboxEmptyIcon, AlertTriangle } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	useTickets,
	useMailboxes,
	useAssignableAgents,
	updateTicket,
	deleteTicket,
	addReply,
} from '@/hooks/support';
import { StatusPill, PriorityPill } from '@/components/support';
import type { Ticket, TicketFilters } from '@/types/support';
import NewTicketModal from './new-ticket-modal';
import SupportInboxFilterDialog from './filter-dialog';
import SupportInboxBulkActionSelect from './bulk-action-select';
import {
	AssignAgentModal,
	AssignMailboxModal,
	AssignTagsModal,
	BulkReplyModal,
} from './bulk-action-modals';
import { SearchIcon } from '@doublescale/components';

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
	const { data: mailboxes, loading: mailboxesLoading } = useMailboxes();
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
		runBulk(
			async () => {
				await Promise.all(
					selectedIdList.map((id) =>
						updateTicket(id, { status: 'closed' })
					)
				);
			},
			__('Selected tickets closed.', 'doublescale')
		);
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

		runBulk(
			async () => {
				await Promise.all(selectedIdList.map((id) => deleteTicket(id)));
			},
			__('Selected tickets deleted.', 'doublescale')
		);
	};

	const handleBulkAssignAgent = async (agentUserId: number | null) => {
		await runBulk(
			async () => {
				await Promise.all(
					selectedIdList.map((id) =>
						updateTicket(id, { agent_user_id: agentUserId })
					)
				);
			},
			__('Agent assigned.', 'doublescale')
		);
	};

	const handleBulkAssignMailbox = async (mailboxId: number) => {
		await runBulk(
			async () => {
				await Promise.all(
					selectedIdList.map((id) =>
						updateTicket(id, { mailbox_id: mailboxId })
					)
				);
			},
			__('Tickets moved.', 'doublescale')
		);
	};

	const handleBulkAssignTags = async (tagIds: number[]) => {
		await runBulk(
			async () => {
				await Promise.all(
					selectedIdList.map((id) => {
						const ticket = ticketsById.get(id);
						const existing = ticket?.tag_ids ?? [];
						const merged = Array.from(
							new Set([...existing, ...tagIds])
						);
						return updateTicket(id, { tag_ids: merged });
					})
				);
			},
			__('Tags applied.', 'doublescale')
		);
	};

	const handleBulkReply = async (content: string) => {
		await runBulk(
			async () => {
				await Promise.all(
					selectedIdList.map((id) => addReply(id, content))
				);
			},
			__('Replies sent.', 'doublescale')
		);
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
		<div className="doublescale-support-inbox min-w-0 ">
			{!mailboxesLoading && hasNoMailboxes && (
				<Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						{__(
							'No support mailbox is configured. New tickets can’t be opened until you add one.',
							'doublescale'
						)}{' '}
						<button
							type="button"
							onClick={() =>
								navigate(getToLink('support/mailboxes'))
							}
							className="font-medium underline underline-offset-2 hover:no-underline"
						>
							{__('Add a mailbox', 'doublescale')}
						</button>
					</AlertDescription>
				</Alert>
			)}

			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
						{__(' Inbox', 'doublescale')}
					</h1>
				</div>
				<div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">
					{/* <Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						aria-label={__('Refresh', 'doublescale')}
						className="flex-1 sm:flex-none"
					>
						<RefreshCw className="shrink-0" />
							{__('Refresh', 'doublescale')}
					</Button> */}
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
							aria-label={__('New ticket', 'doublescale')}
							className="flex-1 sm:flex-none"
						>
							<Plus className="shrink-0" />
							{__('Create New Ticket', 'doublescale')}
						</Button>
					)}
				</div>
			</div>

			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
					{error}
				</div>
			)}

			<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden rounded-xl p-6 bg-white  shadow-[0px_4px_20px_0px_rgba(59,130,246,0.14)]">
				<div className="flex flex-col gap-3   sm:flex-row sm:items-center sm:justify-between">
					<div className="search-input relative min-w-0 shrink-0 md:flex-1 md:max-w-xl">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center">
							<SearchIcon className="w-4 h-4" />
						</span>
						<Input
							id="ds-support-search"
							type="search"
							placeholder={__('Title contains…', 'doublescale')}
							className="w-full h-9 !pl-9 !border !border-border !rounded-lg bg-[#F7F8FA] text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brandPrimary/20 focus:border-brandPrimary transition-colors"
							defaultValue={filters.search ?? ''}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									updateFilter({
										search: (e.target as HTMLInputElement)
											.value,
									});
								}
							}}
						/>
					</div>
					<div className="flex w-full shrink-0 flex-col gap-6 sm:w-auto sm:flex-row sm:items-center">
						<SupportInboxBulkActionSelect
							selectedCount={selectedCount}
							disabled={bulkBusy}
							canDelete={canManageAllTickets}
							onReply={() => setBulkModal('reply')}
							onAssignAgent={() => setBulkModal('agent')}
							onAssignMailbox={() => setBulkModal('mailbox')}
							onAssignTags={() => setBulkModal('tags')}
							onClose={handleBulkClose}
							onDelete={handleBulkDelete}
						/>
						<SupportInboxFilterDialog
							filters={{
								status: filters.status,
								priority: filters.priority,
								mailbox_id: filters.mailbox_id,
								tag_id: filters.tag_id,
							}}
							mailboxes={mailboxes}
							tags={tags}
							onApply={updateFilter}
						/>
					</div>
				</div>
				<div className="overflow-x-auto rounded-lg border border-border">
					<table className="w-full min-w-[56rem] border-collapse text-sm">
						<thead>
							<tr className="border-b border-border bg-white text-left text-xs font-medium uppercase tracking-wide text-gray-500">
								<th className="w-10 px-4 py-3">
									<Checkbox
										checked={
											allPageSelected
												? true
												: somePageSelected
													? 'indeterminate'
													: false
										}
										onCheckedChange={toggleSelectAll}
										disabled={
											loading ||
											pageTicketIds.length === 0
										}
										aria-label={__(
											'Select all on this page',
											'doublescale'
										)}
									/>
								</th>
								<th className="min-w-[12rem] px-4 py-3">
									{__('Title', 'doublescale')}
								</th>
								<th className="min-w-[8rem] px-4 py-3">
									{__('Customer', 'doublescale')}
								</th>
								<th className="min-w-[7rem] whitespace-nowrap px-4 py-3">
									{__('Mailbox', 'doublescale')}
								</th>
								<th className="min-w-[8rem] px-4 py-3">
									{__('Assigned to', 'doublescale')}
								</th>
								<th className="whitespace-nowrap px-4 py-3">
									{__('Status', 'doublescale')}
								</th>
								<th className="whitespace-nowrap px-4 py-3">
									{__('Priority', 'doublescale')}
								</th>
								<th className="whitespace-nowrap px-4 py-3">
									{__('Replies', 'doublescale')}
								</th>
								<th className="min-w-[9rem] whitespace-nowrap px-4 py-3">
									{__('Updated', 'doublescale')}
								</th>
							</tr>
						</thead>
						<tbody>
							{loading && (
								<tr className=" bg-white">
									<td
										colSpan={9}
										className="px-4 py-8 text-center text-gray-500"
									>
										{__('Loading tickets…', 'doublescale')}
									</td>
								</tr>
							)}
							{!loading && data?.data.length === 0 && (
								<tr className=" bg-white">
									<td
										colSpan={9}
										className="px-4 py-16 text-center"
									>
										<div className="flex flex-col items-center gap-3">
											<InboxEmptyIcon
												width={48}
												height={48}
												className="text-gray-300"
											/>
											{hasNoTickets ? (
												<>
													<div className="text-base font-medium text-gray-700">
														{__(
															'No tickets yet',
															'doublescale'
														)}
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
															onClick={() =>
																setShowNewModal(
																	true
																)
															}
														>
															<Plus />
															{__(
																'Open the first ticket',
																'doublescale'
															)}
														</Button>
													)}
												</>
											) : (
												<>
													<div className="text-base font-medium text-gray-700">
														{__(
															'No tickets match these filters',
															'doublescale'
														)}
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
										className={`cursor-pointer border-b border-border odd:bg-[#F7F8FA] even:bg-white hover:bg-[#EFF1F4] ${
											selectedIds.has(ticket.id)
												? '!bg-blue-50/60 hover:!bg-blue-50/60'
												: ''
										}`}
										onClick={() =>
											navigate(
												getToLink(
													`support/ticket/${ticket.id}`
												)
											)
										}
									>
										<td
											className="px-4 py-3"
											onClick={(e) => e.stopPropagation()}
										>
											<Checkbox
												checked={selectedIds.has(
													ticket.id
												)}
												onCheckedChange={() =>
													toggleSelect(ticket.id)
												}
												aria-label={__(
													'Select ticket',
													'doublescale'
												)}
											/>
										</td>
										<td className="max-w-[20rem] truncate px-4 py-3 font-medium text-gray-900">
											{ticket.title}
										</td>
										<td className="min-w-[8rem] px-4 py-3 text-gray-700">
											{contactName(ticket)}
										</td>
										<td className="whitespace-nowrap px-4 py-3 text-gray-600">
											{ticket.mailbox?.name ||
												ticket.mailbox?.slug ||
												'—'}
										</td>
										<td className="min-w-[8rem] px-4 py-3 text-gray-700">
											{ticket.agent?.display_name || (
												<span className="text-gray-400">
													{__(
														'Unassigned',
														'doublescale'
													)}
												</span>
											)}
										</td>
										<td className="whitespace-nowrap px-4 py-3">
											<StatusPill
												status={ticket.status}
											/>
										</td>
										<td className="whitespace-nowrap px-4 py-3">
											<PriorityPill
												priority={ticket.priority}
											/>
										</td>
										<td className="whitespace-nowrap px-4 py-3 text-gray-600">
											{ticket.response_count}
										</td>
										<td className="whitespace-nowrap px-4 py-3 text-gray-500">
											{formatDate(ticket.updated_at)}
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
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
				<div className="mt-4 overflow-x-auto rounded border bg-white shadow-sm">
					<DataTablePagination table={serverSideTable} />
				</div>
			)}
		</div>
	);
};

export default SupportInbox;
