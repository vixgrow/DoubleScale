/**
 * Support inbox table columns.
 */

import { __ } from '@wordpress/i18n';
import { ColumnDef } from '@tanstack/react-table';

import { Checkbox } from '@/components/ui/checkbox';
import { StatusPill, PriorityPill } from '@/components/support';
import type { Ticket } from '@/types/support';

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

export interface TicketColumnProps {
	onOpenTicket: (ticketId: number) => void;
}

export const getTicketColumns = ({
	onOpenTicket,
}: TicketColumnProps): ColumnDef<Ticket>[] => [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && 'indeterminate')
				}
				onCheckedChange={(value) =>
					table.toggleAllPageRowsSelected(!!value)
				}
				aria-label={__('Select all on this page', 'doublescale')}
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label={__('Select ticket', 'doublescale')}
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'title',
		header: () => __('Title', 'doublescale'),
		cell: ({ row }) => (
			<button
				type="button"
				className="max-w-[20rem] cursor-pointer truncate text-left font-medium text-gray-900 hover:underline"
				onClick={() => onOpenTicket(row.original.id)}
			>
				{row.original.title}
			</button>
		),
	},
	{
		id: 'customer',
		header: () => __('Customer', 'doublescale'),
		cell: ({ row }) => (
			<span className="text-gray-700">{contactName(row.original)}</span>
		),
	},
	{
		id: 'mailbox',
		header: () => __('Mailbox', 'doublescale'),
		cell: ({ row }) => (
			<span className="whitespace-nowrap text-gray-600">
				{row.original.mailbox?.name ||
					row.original.mailbox?.slug ||
					'—'}
			</span>
		),
	},
	{
		id: 'assigned_to',
		header: () => __('Assigned to', 'doublescale'),
		cell: ({ row }) =>
			row.original.agent?.display_name ? (
				<span className="text-gray-700">
					{row.original.agent.display_name}
				</span>
			) : (
				<span className="text-gray-400">
					{__('Unassigned', 'doublescale')}
				</span>
			),
	},
	{
		accessorKey: 'status',
		header: () => __('Status', 'doublescale'),
		cell: ({ row }) => <StatusPill status={row.original.status} />,
	},
	{
		accessorKey: 'priority',
		header: () => __('Priority', 'doublescale'),
		cell: ({ row }) => <PriorityPill priority={row.original.priority} />,
	},
	{
		accessorKey: 'response_count',
		header: () => __('Replies', 'doublescale'),
		cell: ({ row }) => (
			<span className="whitespace-nowrap text-gray-600">
				{row.original.response_count}
			</span>
		),
	},
	{
		accessorKey: 'updated_at',
		header: () => __('Updated', 'doublescale'),
		cell: ({ row }) => (
			<span className="whitespace-nowrap text-gray-500">
				{formatDate(row.original.updated_at)}
			</span>
		),
	},
];
