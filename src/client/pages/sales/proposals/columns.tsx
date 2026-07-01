/**
 * Proposals list table columns.
 */

import { __ } from '@wordpress/i18n';
import { ColumnDef } from '@tanstack/react-table';

import { getToLink } from '@doublescale/navigation';
import { EditHeaderIcon, FallbackCell, ViewIcon, DeleteIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { ProposalStatusPill } from '@/components/sales';
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
	onDelete: (id: number) => void;
	canEdit: (proposal: Proposal) => boolean;
}

export const getProposalColumns = ({
	navigate,
	onDelete,
	canEdit,
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

			return (
				<div
					className="flex items-center justify-center gap-1"
					onClick={(e) => e.stopPropagation()}
				>
					<Button
						variant="ghost"
						size="icon"
						className="text-primary"
						aria-label={__('View', 'doublescale')}
						onClick={() =>
							navigate(
								getToLink(`sales/proposals/${proposal.id}`)
							)
						}
					>
						<ViewIcon />
					</Button>
					{canEdit(proposal) ? (
						<Button
							variant="ghost"
							size="icon"
							aria-label={__('Edit', 'doublescale')}
							onClick={() =>
								navigate(
									getToLink(
										`sales/proposals/${proposal.id}/edit`
									)
								)
							}
						>
							<EditHeaderIcon color="#0D9DFC" />
						</Button>
					) : null}
					<Button
						variant="ghost"
						size="icon"
						className="text-destructive"
						aria-label={__('Delete', 'doublescale')}
						onClick={() => onDelete(proposal.id)}
					>
						<DeleteIcon />
					</Button>
				</div>
			);
		},
	},
];
