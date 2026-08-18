/**
 * Contracts list table columns.
 */

import { __ } from '@wordpress/i18n';
import { ColumnDef } from '@tanstack/react-table';

import { getToLink } from '@doublescale/navigation';
import { DeleteIcon, EditHeaderIcon, FallbackCell, ViewIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { ContractStatusPill } from '@/components/sales';
import { formatMoney } from '@/constants/currencies';
import type { Contract } from '@/types/sales';

const formatTableAmount = formatMoney;

const formatDisplayDate = (value: string | null): string => {
	if (!value) {
		return '—';
	}
	const [year, month, day] = value.split('-');
	if (!year || !month || !day) {
		return value;
	}
	return `${day}-${month}-${year}`;
};

const contactName = (contract: Contract): string => {
	const c = contract.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

export interface ContractColumnProps {
	navigate: (path: string) => void;
	onDelete: (id: number) => void;
	canEdit: (contract: Contract) => boolean;
}

export const getContractColumns = ({
	navigate,
	onDelete,
	canEdit,
}: ContractColumnProps): ColumnDef<Contract>[] => [
	{
		accessorKey: 'contract_number',
		header: () => __('Contract #', 'doublescale'),
		cell: ({ row }) => (
			<button
				type="button"
				className="cursor-pointer text-left font-medium hover:underline"
				onClick={() => navigate(getToLink(`sales/contracts/${row.original.id}`))}
			>
				{row.original.contract_number}
			</button>
		),
	},
	{
		accessorKey: 'subject',
		header: () => __('Subject', 'doublescale'),
		cell: ({ row }) => <FallbackCell value={row.original.subject || '—'} />,
	},
	{
		accessorKey: 'status',
		header: () => __('Status', 'doublescale'),
		cell: ({ row }) => (
			<ContractStatusPill
				status={row.original.status}
				expired={row.original.is_expired}
				aboutToExpire={row.original.is_about_to_expire}
			/>
		),
	},
	{
		id: 'customer',
		header: () => __('Customer', 'doublescale'),
		cell: ({ row }) => <FallbackCell value={contactName(row.original)} />,
	},
	{
		accessorKey: 'contract_value',
		header: () => __('Value', 'doublescale'),
		cell: ({ row }) =>
			formatTableAmount(row.original.contract_value, row.original.currency),
	},
	{
		accessorKey: 'start_date',
		header: () => __('Start', 'doublescale'),
		cell: ({ row }) => (
			<FallbackCell value={formatDisplayDate(row.original.start_date)} />
		),
	},
	{
		accessorKey: 'end_date',
		header: () => __('End', 'doublescale'),
		cell: ({ row }) => (
			<FallbackCell value={formatDisplayDate(row.original.end_date)} />
		),
	},
	{
		id: 'type',
		header: () => __('Type', 'doublescale'),
		cell: ({ row }) => (
			<FallbackCell value={row.original.contract_type?.name || '—'} />
		),
	},
	{
		id: 'actions',
		header: () => (
			<div className="text-center">{__('Actions', 'doublescale')}</div>
		),
		cell: ({ row }) => {
			const contract = row.original;

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
							navigate(getToLink(`sales/contracts/${contract.id}`))
						}
					>
						<ViewIcon />
					</Button>
					{canEdit(contract) ? (
						<Button
							variant="ghost"
							size="icon"
							aria-label={__('Edit', 'doublescale')}
							onClick={() =>
								navigate(
									getToLink(`sales/contracts/${contract.id}/edit`)
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
						onClick={() => onDelete(contract.id)}
					>
						<DeleteIcon />
					</Button>
				</div>
			);
		},
	},
];
