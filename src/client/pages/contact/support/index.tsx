/**
 * Contact "Helpdesk" tab — lists the support tickets opened by this contact.
 *
 * Read-only, contact-scoped view. It reuses the Support module's data layer
 * (`useTickets`) and shared primitives (`StatusPill` / `PriorityPill`); the
 * `contact_id` filter is applied server-side by the support/tickets REST
 * endpoint, so this component only renders. Row click routes to the existing
 * `support/ticket/:id` detail route.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigate, getToLink } from '@doublescale/navigation';
import { HelpdeskIcon, NoData } from '@doublescale/components';
import { useTickets } from '@/hooks/support';
import { StatusPill, PriorityPill } from '@/components/support';
import type { Ticket } from '@/types/support';
import { Button } from '@/components/ui/button';

interface SupportProps {
	contact_id: number;
	navigate?: (path: string) => void;
}

const PER_PAGE = 10;

const formatDate = (raw: string | null): string => {
	if (!raw) {
		return '—';
	}
	try {
		// Stored timestamps are UTC without a zone suffix; append 'Z' so the
		// browser localises them instead of treating them as local time.
		return new Date(raw + 'Z').toLocaleString();
	} catch {
		return raw;
	}
};

const Support: React.FC<SupportProps> = ({ contact_id, navigate: navProp }) => {
	const fallbackNavigate = useNavigate();
	const navigate = navProp ?? fallbackNavigate;
	const [page, setPage] = useState(1);

	const { data, loading, error } = useTickets({
		contact_id,
		per_page: PER_PAGE,
		page,
		sort_by: 'updated_at',
		sort_order: 'desc',
	});

	const tickets = data?.data ?? [];
	const meta = data?.meta;
	const lastPage = meta?.last_page ?? 1;

	const openTicket = (ticket: Ticket) => {
		navigate(getToLink(`support/ticket/${ticket.id}`));
	};

	return (
		<div className="doublescale-contact-helpdesk flex flex-col gap-5">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">
					{__('Helpdesk', 'doublescale')}
				</h2>
				{meta?.total ? (
					<span className="text-sm text-muted-foreground">
						{sprintf(
							/* translators: %d: number of tickets. */
							__('%d ticket(s)', 'doublescale'),
							meta.total
						)}
					</span>
				) : null}
			</div>

			{error && (
				<div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			)}

			{loading ? (
				<div className="py-12 text-center text-sm text-muted-foreground">
					{__('Loading tickets…', 'doublescale')}
				</div>
			) : tickets.length === 0 ? (
				<NoData
					icon={<HelpdeskIcon width={40} height={40} />}
					title={__('No tickets yet', 'doublescale')}
					subtitle={__(
						'This contact has not opened any support tickets. New tickets raised by this contact will show up here.',
						'doublescale'
					)}
				/>
			) : (
				<>
					<div className="overflow-x-auto rounded-lg border border-border">
						<table className="w-full min-w-[44rem] border-collapse text-sm">
							<thead>
								<tr className="border-b border-border bg-white text-left text-xs font-medium uppercase tracking-wide text-gray-500">
									<th className="min-w-[14rem] px-4 py-3">
										{__('Title', 'doublescale')}
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
									<th className="whitespace-nowrap px-4 py-3 text-center">
										{__('Replies', 'doublescale')}
									</th>
									<th className="min-w-[9rem] whitespace-nowrap px-4 py-3">
										{__('Updated', 'doublescale')}
									</th>
								</tr>
							</thead>
							<tbody>
								{tickets.map((ticket) => (
									<tr
										key={ticket.id}
										onClick={() => openTicket(ticket)}
										className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40"
									>
										<td className="px-4 py-3 font-medium text-gray-900">
											{ticket.title ||
												sprintf(
													/* translators: %d: ticket id. */
													__(
														'Ticket #%d',
														'doublescale'
													),
													ticket.id
												)}
										</td>
										<td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
											{ticket.mailbox?.name ?? '—'}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{ticket.agent?.display_name ??
												__('Unassigned', 'doublescale')}
										</td>
										<td className="whitespace-nowrap px-4 py-3">
											<StatusPill status={ticket.status} />
										</td>
										<td className="whitespace-nowrap px-4 py-3">
											<PriorityPill
												priority={ticket.priority}
											/>
										</td>
										<td className="whitespace-nowrap px-4 py-3 text-center text-muted-foreground">
											{ticket.response_count}
										</td>
										<td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
											{formatDate(ticket.updated_at)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{lastPage > 1 && (
						<div className="flex items-center justify-end gap-3">
							<span className="text-sm text-muted-foreground">
								{sprintf(
									/* translators: 1: current page, 2: total pages. */
									__('Page %1$d of %2$d', 'doublescale'),
									page,
									lastPage
								)}
							</span>
							<Button
								variant="secondary"
								size="sm"
								className="bg-white"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								{__('Previous', 'doublescale')}
							</Button>
							<Button
								variant="secondary"
								size="sm"
								className="bg-white"
								disabled={page >= lastPage}
								onClick={() =>
									setPage((p) => Math.min(lastPage, p + 1))
								}
							>
								{__('Next', 'doublescale')}
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default Support;
