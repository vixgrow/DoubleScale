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
import type { DataTableConfig } from '@doublescale/client';
import { MailboxIcon, NoData, SearchIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
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
import type { Ticket, TicketFilters } from '@/types/support';
import NewTicketModal from './new-ticket-modal';
import { TicketDetailModal } from './ticket-detail-modal';
import SupportInboxFilterDialog from './filter-dialog';
import SupportInboxBulkActionSelect from './bulk-action-select';
import {
	AssignAgentModal,
	AssignMailboxModal,
	AssignTagsModal,
	BulkReplyModal,
} from './bulk-action-modals';
import { getTicketColumns } from './columns';
import { SupportIcon } from '@doublescale/components/support';

type BulkModal = 'reply' | 'agent' | 'mailbox' | 'tags' | null;

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
	const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
		null
	);
	const [ticketModalVisible, setTicketModalVisible] = useState(false);
	const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [bulkModal, setBulkModal] = useState<BulkModal>(null);
	const [bulkBusy, setBulkBusy] = useState(false);
	const canManageAllTickets = useCapabilities().canManageAllTickets();
	const filterKey = JSON.stringify(filters);
	const page = filters.page ?? 1;
	const perPage = filters.per_page ?? 20;
	const totalRecords = data?.meta.total ?? 0;
	const tickets = data?.data ?? [];

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
		tickets.forEach((ticket) => {
			map.set(ticket.id, ticket);
		});
		return map;
	}, [tickets]);

	const selectedCount = selectedIds.size;

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

	const openTicket = useCallback((ticketId: number) => {
		setSelectedTicketId(ticketId);
		setTicketModalVisible(true);
	}, []);

	const columns = useMemo(
		() => getTicketColumns({ onOpenTicket: openTicket }),
		[openTicket]
	);

	const tableConfig: DataTableConfig<Ticket> = useMemo(
		() => ({
			manageColumns: { enabled: false },
			selection: {
				enabled: true,
				selectedKeys: Array.from(selectedIds),
				onSelectionChange: (keys) => {
					setSelectedIds(new Set(keys.map((key) => Number(key))));
				},
			},
		}),
		[selectedIds]
	);

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
		tickets.length === 0 &&
		!filters.search &&
		!filters.status &&
		!filters.priority &&
		!filters.mailbox_id &&
		!filters.tag_id;
	const isEmpty = !loading && tickets.length === 0;

	return (
		<div className="doublescale-support-inbox min-w-0 ">
			{!mailboxesLoading && hasNoMailboxes && (
				<Alert className="mb-6 flex items-center gap-2 border-amber-200 bg-amber-50 text-amber-800 [&>svg]:static [&>svg]:left-auto [&>svg]:top-auto [&>svg]:shrink-0 [&>svg+div]:translate-y-0 [&>svg~*]:pl-0">
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
					{canManageAllTickets && (
						<Button
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

				{isEmpty ? (
					<NoData
						icon={<SupportIcon width={64} height={64} className='text-primary'/>}
						title={
							hasNoTickets
								? __('No tickets yet', 'doublescale')
								: __(
										'No tickets match these filters',
										'doublescale'
									)
						}
						subtitle={
							hasNoTickets
								? hasNoMailboxes
									? __(
											'Create a mailbox first, then open a ticket or wait for one to come in via the public portal.',
											'doublescale'
										)
									: __(
											'When customers submit through the portal or email, their tickets will appear here.',
											'doublescale'
										)
								: __(
										'Try clearing the search or status filters.',
										'doublescale'
									)
						}
						{...(hasNoTickets &&
						!hasNoMailboxes &&
						canManageAllTickets
							? {
									buttonLabel: __(
										'Open the first ticket',
										'doublescale'
									),
									onClick: () => setShowNewModal(true),
									buttonIcon: <Plus />,
								}
							: {})}
					/>
				) : (
					<>
						<DataTable
							columns={columns}
							data={tickets}
							config={tableConfig}
							showMainActions={false}
							showPagination={false}
							initialPageSize={perPage}
							setPage={setPage}
							loading={loading}
						/>
						{totalRecords > 0 && (
							<DataTablePagination table={serverSideTable} />
						)}
					</>
				)}
			</div>

			{showNewModal && (
				<NewTicketModal
					mailboxes={mailboxes}
					onClose={() => setShowNewModal(false)}
					onCreated={(ticketId) => {
						setShowNewModal(false);
						setSelectedTicketId(ticketId);
						setTicketModalVisible(true);
					}}
				/>
			)}

			<TicketDetailModal
				ticketId={selectedTicketId}
				visible={ticketModalVisible}
				onClose={() => {
					setTicketModalVisible(false);
					setSelectedTicketId(null);
				}}
				onUpdate={refetch}
				onDeleted={refetch}
				removePortal
				navigate={navigate}
			/>

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
		</div>
	);
};

export default SupportInbox;
