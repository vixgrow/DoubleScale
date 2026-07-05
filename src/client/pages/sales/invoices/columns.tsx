/**
 * Invoices list table columns.
 */

import { __ } from '@wordpress/i18n';
import { ColumnDef } from '@tanstack/react-table';

import { getToLink } from '@doublescale/navigation';
import { DeleteIcon, EditHeaderIcon, FallbackCell, ViewIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { InvoiceStatusPill } from '@/components/sales';
import type { Invoice } from '@/types/sales';

const formatTableAmount = (value: number, currency = 'USD') => {
	const amount = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
	const suffix =
		currency === 'USD'
			? 'US$'
			: currency === 'EUR'
				? 'EUR'
				: currency === 'GBP'
					? 'GBP'
					: currency;
	return `${amount} ${suffix}`;
};

const contactName = (invoice: Invoice): string => {
	const c = invoice.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

export interface InvoiceColumnProps {
	navigate: (path: string) => void;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	canEdit: (invoice: Invoice) => boolean;
}

export const getInvoiceColumns = ({
	navigate,
	onEdit,
	onDelete,
	canEdit,
}: InvoiceColumnProps): ColumnDef<Invoice>[] => [
	{
		accessorKey: 'invoice_number',
		header: () => __('Invoice #', 'doublescale'),
		cell: ({ row }) => (
			<button
				type="button"
				className="cursor-pointer text-left font-medium hover:underline"
				onClick={() =>
					navigate(getToLink(`sales/invoices/${row.original.id}`))
				}
			>
				{row.original.invoice_number}
			</button>
		),
	},
	{
		id: 'customer',
		header: () => __('Customer', 'doublescale'),
		cell: ({ row }) => <FallbackCell value={contactName(row.original)} />,
	},
	{
		accessorKey: 'total',
		header: () => __('Amount', 'doublescale'),
		cell: ({ row }) =>
			formatTableAmount(row.original.total, row.original.currency),
	},
	{
		accessorKey: 'status',
		header: () => __('Status', 'doublescale'),
		cell: ({ row }) => <InvoiceStatusPill status={row.original.status} />,
	},
	{
		accessorKey: 'invoice_date',
		header: () => __('Date', 'doublescale'),
		cell: ({ row }) => (
			<FallbackCell value={row.original.invoice_date || '—'} />
		),
	},
	{
		accessorKey: 'due_date',
		header: () => __('Due Date', 'doublescale'),
		cell: ({ row }) => <FallbackCell value={row.original.due_date || '—'} />,
	},
	{
		id: 'actions',
		header: () => (
			<div className="text-center">{__('Actions', 'doublescale')}</div>
		),
		cell: ({ row }) => {
			const invoice = row.original;

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
							navigate(getToLink(`sales/invoices/${invoice.id}`))
						}
					>
						<ViewIcon />
					</Button>
					{canEdit(invoice) ? (
						<Button
							variant="ghost"
							size="icon"
							aria-label={__('Edit', 'doublescale')}
							onClick={() => onEdit(invoice.id)}
						>
							<EditHeaderIcon color="#0D9DFC" />
						</Button>
					) : null}
					<Button
						variant="ghost"
						size="icon"
						className="text-destructive"
						aria-label={__('Delete', 'doublescale')}
						onClick={() => onDelete(invoice.id)}
					>
						<DeleteIcon />
					</Button>
				</div>
			);
		},
	},
];
