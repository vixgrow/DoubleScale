/**
 * Proposals list table columns.
 */

import { __ } from '@wordpress/i18n';
import { ColumnDef } from '@tanstack/react-table';

import { getToLink } from '@doublescale/navigation';
import { FallbackCell } from '@doublescale/components';
import { DocumentRowActions, ProposalStatusPill } from '@/components/sales';
import type { Proposal } from '@/types/sales';

const formatMoney = (value: number, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

const contactName = (proposal: Proposal): string => {
	if (proposal.to_name) {
		return proposal.to_name;
	}
	const c = proposal.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

export interface ProposalColumnProps {
	navigate: (path: string) => void;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	canEdit: (proposal: Proposal) => boolean;
	onDuplicate: (proposal: Proposal) => void;
	onConvert: (proposal: Proposal) => void;
	onMarkAccepted: (proposal: Proposal) => void;
	onSend: (proposal: Proposal) => void;
	onDownloadPdf: (proposal: Proposal) => void;
	/** Id of the row with a request in flight, if any. */
	busyId: number | null;
	/** Whether the direct send action is available for this document. */
	canSend: (proposal: Proposal) => boolean;
}

export const getProposalColumns = ({
	navigate,
	onEdit,
	onDelete,
	canEdit,
	onDuplicate,
	onConvert,
	onMarkAccepted,
	onSend,
	onDownloadPdf,
	busyId,
	canSend,
}: ProposalColumnProps): ColumnDef<Proposal>[] => [
	{
		accessorKey: 'proposal_number',
		header: () => __('Proposal #', 'doublescale'),
		cell: ({ row }) => (
			<button
				type="button"
				className="cursor-pointer text-left font-medium hover:underline"
				onClick={() => navigate(getToLink(`sales/proposals/${row.original.id}`))}
			>
				{row.original.proposal_number}
			</button>
		),
	},
	{
		accessorKey: 'subject',
		header: () => __('Subject', 'doublescale'),
		cell: ({ row }) => <FallbackCell value={row.original.subject || '—'} />,
	},
	{
		id: 'to',
		header: () => __('To', 'doublescale'),
		cell: ({ row }) => <FallbackCell value={contactName(row.original)} />,
	},
	{
		accessorKey: 'status',
		header: () => __('Status', 'doublescale'),
		cell: ({ row }) => (
			<ProposalStatusPill
				status={row.original.status}
				expired={row.original.is_expired}
			/>
		),
	},
	{
		accessorKey: 'total',
		header: () => __('Total', 'doublescale'),
		cell: ({ row }) =>
			formatMoney(row.original.total, row.original.currency),
	},
	{
		accessorKey: 'date',
		header: () => __('Date', 'doublescale'),
		cell: ({ row }) => <FallbackCell value={row.original.date || '—'} />,
	},
	{
		accessorKey: 'open_till',
		header: () => __('Open Till', 'doublescale'),
		cell: ({ row }) => <FallbackCell value={row.original.open_till || '—'} />,
	},
	{
		id: 'actions',
		header: () => (
			<div className="text-center">{__('Actions', 'doublescale')}</div>
		),
		cell: ({ row }) => {
			const proposal = row.original;
			// Same rule as the detail page: a declined or already-converted
			// proposal has nothing left to convert.
			const showConvert =
				proposal.status !== 'declined' && !proposal.invoice_id;
			const showMarkAccepted =
				proposal.status !== 'accepted' && proposal.status !== 'declined';

			return (
				<DocumentRowActions
					busy={busyId === proposal.id}
					onView={() =>
						navigate(getToLink(`sales/proposals/${proposal.id}`))
					}
					onEdit={
						canEdit(proposal) ? () => onEdit(proposal.id) : undefined
					}
					onDuplicate={() => onDuplicate(proposal)}
					onViewInvoice={
						proposal.invoice_id
							? () =>
									navigate(
										getToLink(
											`sales/invoices/${proposal.invoice_id}`
										)
									)
							: undefined
					}
					onConvert={showConvert ? () => onConvert(proposal) : undefined}
					onMarkAccepted={
						showMarkAccepted
							? () => onMarkAccepted(proposal)
							: undefined
					}
					onSend={canSend(proposal) ? () => onSend(proposal) : undefined}
					onDownloadPdf={() => onDownloadPdf(proposal)}
					onDelete={() => onDelete(proposal.id)}
				/>
			);
		},
	},
];
