/**
 * Payments list table columns.
 */

import { __ } from '@wordpress/i18n';
import { ColumnDef } from '@tanstack/react-table';

import { getToLink } from '@doublescale/navigation';
import { DeleteIcon, FallbackCell, ViewIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { PAYMENT_MODE_LABELS } from '@/constants/sales';
import type { PaymentListItem } from '@/types/sales';

const formatTableAmount = (value: number, currency = 'USD') => {
	const amount = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
	const suffix =
		currency === 'USD'
			? '$'
			: currency === 'EUR'
				? '€'
				: currency === 'GBP'
					? '£'
					: ` ${currency}`;
	return `${amount}${suffix}`;
};

const modeLabel = (mode: string | null): string => {
	if (!mode) {
		return '—';
	}
	return PAYMENT_MODE_LABELS[mode as keyof typeof PAYMENT_MODE_LABELS] ?? mode;
};

const contactName = (payment: PaymentListItem): string => {
	const c = payment.contact;
	if (!c) {
		return '—';
	}
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name || c.email || '—';
};

export interface PaymentColumnProps {
	navigate: (path: string) => void;
	onDelete: (id: number) => void;
	paymentReadOnly: boolean;
}

export const getPaymentColumns = ({
	navigate,
	onDelete,
	paymentReadOnly,
}: PaymentColumnProps): ColumnDef<PaymentListItem>[] => [
	{
		accessorKey: 'id',
		header: () => __('Payment #', 'doublescale'),
		cell: ({ row }) => (
			<button
				type="button"
				className="cursor-pointer text-left font-medium hover:underline"
				onClick={() =>
					navigate(getToLink(`sales/payments/${row.original.id}`))
				}
			>
				{row.original.id}
			</button>
		),
	},
	{
		id: 'invoice_number',
		header: () => __('Invoice #', 'doublescale'),
		cell: ({ row }) => (
			<FallbackCell
				value={
					row.original.invoice?.invoice_number ||
					`#${row.original.invoice_id}`
				}
			/>
		),
	},
	{
		accessorKey: 'payment_mode',
		header: () => __('Payment Mode', 'doublescale'),
		cell: ({ row }) => (
			<FallbackCell value={modeLabel(row.original.payment_mode)} />
		),
	},
	{
		accessorKey: 'transaction_id',
		header: () => __('Transaction ID', 'doublescale'),
		cell: ({ row }) => (
			<FallbackCell value={row.original.transaction_id || '—'} />
		),
	},
	{
		id: 'customer',
		header: () => __('Customer', 'doublescale'),
		cell: ({ row }) => {
			const payment = row.original;
			const name = contactName(payment);

			if (!payment.contact?.id) {
				return <FallbackCell value={name} />;
			}

			return (
				<button
					type="button"
					className="text-left text-sm font-medium text-[#0D9DFC] hover:underline"
					onClick={() =>
						navigate(getToLink(`contacts/${payment.contact!.id}`))
					}
				>
					{name}
				</button>
			);
		},
	},
	{
		accessorKey: 'amount',
		header: () => __('Amount', 'doublescale'),
		cell: ({ row }) =>
			formatTableAmount(
				row.original.amount,
				row.original.invoice?.currency || 'USD'
			),
	},
	{
		id: 'actions',
		header: () => (
			<div className="text-center">{__('Actions', 'doublescale')}</div>
		),
		cell: ({ row }) => {
			const payment = row.original;

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
							navigate(getToLink(`sales/payments/${payment.id}`))
						}
					>
						<ViewIcon />
					</Button>
					{!paymentReadOnly ? (
						<Button
							variant="ghost"
							size="icon"
							className="text-destructive"
							aria-label={__('Delete', 'doublescale')}
							onClick={() => onDelete(payment.id)}
						>
							<DeleteIcon />
						</Button>
					) : null}
				</div>
			);
		},
	},
];
