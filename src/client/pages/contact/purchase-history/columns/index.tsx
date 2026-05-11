/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';
/**
 * External dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
/**
 * Internal dependencies
 */
import type { Order, EddOrder, SurecartOrder } from '@doublescale/client';
import { Button } from '@doublescale/components/ui/button';
import { ViewIcon } from '@doublescale/components';

/**
 * Format date to "Month Day, Year" format
 */
const formatDate = (dateString: string | null | undefined): string => {
	if (!dateString) return '';
	try {
		// Parse the date string and format it
		const date = new Date(dateString);

		// Check if date is valid
		if (isNaN(date.getTime())) {
			return '';
		}
		// Format using dateI18n with the Date object
		return dateI18n('F j, Y', date);
	} catch (error) {
		return '';
	}
};

export function getWooColumns() {
	const columns: ColumnDef<Order>[] = [
		{
			accessorKey: 'id',
			header: __('Order ID', 'doublescale'),
			cell: ({ row }) => row.original.id,
		},
		{
			accessorKey: 'date',
			header: __('Date', 'doublescale'),
			cell: ({ row }) => formatDate(row.original.date),
		},
		{
			accessorKey: 'total',
			header: __('Total', 'doublescale'),
			cell: ({ row }) =>
				`${Number(row.original.total_amount).toFixed(2)} ${row.original.currency}`,
		},
		{
			accessorKey: 'status',
			header: __('Status', 'doublescale'),
			cell: ({ row }) => {
				const status = row.original.status.toLowerCase();
				const statusStyles: Record<string, string> = {
					completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
					processing: 'bg-blue-50 text-blue-700 border-blue-200',
					'on hold': 'bg-amber-50 text-amber-700 border-amber-200',
					pending: 'bg-amber-50 text-amber-700 border-amber-200',
					refunded: 'bg-primary/5 text-primary border-primary/20',
					failed: 'bg-destructive/5 text-destructive border-destructive/20',
					cancelled: 'bg-destructive/5 text-destructive border-destructive/20',
				};

				return (
					<span
						className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${statusStyles[status] || ''}`}
					>
						{row.original.status}
					</span>
				);
			},
		},

		{
			accessorKey: 'actions',
			header: __('Actions', 'doublescale'),
			cell: ({ row }) => (
				<Button
					size="sm"
					className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() => window.open(row.original.url, '_blank')}
				>
					<ViewIcon />
					{__('View', 'doublescale')}
				</Button>
			),
		},
	];

	return columns;
}

export function getEddColumns() {
	const columns: ColumnDef<EddOrder>[] = [
		{
			accessorKey: 'id',
			header: __('Order ID', 'doublescale'),
			cell: ({ row }) => row.original.id,
		},
		{
			accessorKey: 'date',
			header: __('Date', 'doublescale'),
			cell: ({ row }) =>
				formatDate(
					row.original.date_completed || row.original.date_created
				),
		},
		{
			accessorKey: 'status',
			header: __('Status', 'doublescale'),
			cell: ({ row }) => {
				const status = row.original.status.toLowerCase();
				const statusStyles: Record<string, string> = {
					completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
					pending: 'bg-amber-50 text-amber-700 border-amber-200',
					refunded: 'bg-primary/5 text-primary border-primary/20',
					revoked: 'bg-destructive/5 text-destructive border-destructive/20',
					failed: 'bg-destructive/5 text-destructive border-destructive/20',
					abandoned: 'bg-muted/50 text-muted-foreground border-border',
				};

				return (
					<span
						className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${statusStyles[status] || ''}`}
					>
						{row.original.status}
					</span>
				);
			},
		},
		{
			accessorKey: 'total',
			header: __('Total', 'doublescale'),
			cell: ({ row }) => `${Number(row.original.total).toFixed(2)} ${row.original.currency}`,
		},
		{
			accessorKey: 'actions',
			header: __('Actions', 'doublescale'),
			cell: ({ row }) => (
				<Button
					size="sm"
					className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() => window.open(row.original.url, '_blank')}
				>
					<ViewIcon />
					{__('View', 'doublescale')}
				</Button>
			),
		},
	];

	return columns;
}

export function getSurecartColumns() {
	const columns: ColumnDef<SurecartOrder>[] = [
		{
			accessorKey: 'number',
			header: __('Order #', 'doublescale'),
			cell: ({ row }) => `#${row.original.number}`,
		},
		{
			accessorKey: 'date',
			header: __('Date', 'doublescale'),
			cell: ({ row }) => formatDate(row.original.date),
		},
		{
			accessorKey: 'order_type',
			header: __('Type', 'doublescale'),
			cell: ({ row }) => row.original.order_type,
		},
		{
			accessorKey: 'status',
			header: __('Status', 'doublescale'),
			cell: ({ row }) => {
				const status = row.original.status.toLowerCase();
				const statusStyles: Record<string, string> = {
					paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
					pending: 'bg-amber-50 text-amber-700 border-amber-200',
					refunded: 'bg-primary/5 text-primary border-primary/20',
					canceled: 'bg-destructive/5 text-destructive border-destructive/20',
				};

				return (
					<span
						className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${statusStyles[status] || ''}`}
					>
						{row.original.status}
					</span>
				);
			},
		},
		{
			accessorKey: 'total_amount',
			header: __('Total', 'doublescale'),
			cell: ({ row }) =>
				`${row.original.total_amount.toFixed(2)} ${row.original.currency}`,
		},
		{
			accessorKey: 'actions',
			header: __('Actions', 'doublescale'),
			cell: ({ row }) => (
				<Button
					size="sm"
					className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() => window.open(row.original.url, '_blank')}
				>
					<ViewIcon />
					{__('View', 'doublescale')}
				</Button>
			),
		},
	];

	return columns;
}
