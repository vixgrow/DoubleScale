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
import type { Order, EddOrder } from '@quillcrm/client';
import { Button } from '@quillcrm/components/ui/button';
import { ViewIcon } from '@quillcrm/components';

/**
 * Format date to "Month Day, Year" format
 */
const formatDate = (dateString: string | null | undefined): string => {
	if (!dateString) return '';

	try {
		return dateI18n('F j, Y', dateString);
	} catch (error) {
		return '';
	}
};

export function getWooColumns() {
	const columns: ColumnDef<Order>[] = [
		{
			accessorKey: 'id',
			header: __('Order ID', 'quillcrm'),
			cell: ({ row }) => row.original.id,
		},
		{
			accessorKey: 'date',
			header: __('Date', 'quillcrm'),
			cell: ({ row }) => formatDate((row.original as any).date),
		},
		{
			accessorKey: 'total',
			header: __('Total', 'quillcrm'),
			cell: ({ row }) =>
				`${row.original.total_amount} ${row.original.currency}`,
		},
		{
			accessorKey: 'status',
			header: __('Status', 'quillcrm'),
			cell: ({ row }) => {
				const status = row.original.status.toLowerCase();
				const statusStyles: Record<string, string> = {
					completed: 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]',
					pending: 'bg-[#FFF2E2] text-[#A6600B] border-[#A6600B]',
					refunded: 'bg-[#5570F129] text-[#5570F1] border-[#5570F1]',
				};

				return (
					<span
						className={`border rounded-md px-2 py-1 ${statusStyles[status] || ''}`}
					>
						{row.original.status}
					</span>
				);
			},
		},

		{
			accessorKey: 'actions',
			header: __('Actions', 'quillcrm'),
			cell: ({ row }) => (
				<Button
					size="sm"
					className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() => window.open(row.original.url, '_blank')}
				>
					<ViewIcon />
					{__('View', 'quillcrm')}
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
			header: __('Order ID', 'quillcrm'),
			cell: ({ row }) => row.original.id,
		},
		{
			accessorKey: 'date',
			header: __('Date', 'quillcrm'),
			cell: ({ row }) =>
				formatDate(
					row.original.date_completed || row.original.date_created
				),
		},
		{
			accessorKey: 'status',
			header: __('Status', 'quillcrm'),
			cell: ({ row }) => {
				const status = row.original.status.toLowerCase();
				const statusStyles: Record<string, string> = {
					completed: 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]',
					pending: 'bg-[#FFF2E2] text-[#A6600B] border-[#A6600B]',
					refunded: 'bg-[#5570F129] text-[#5570F1] border-[#5570F1]',
				};

				return (
					<span
						className={`border rounded-md px-2 py-1 ${statusStyles[status] || ''}`}
					>
						{row.original.status}
					</span>
				);
			},
		},
		{
			accessorKey: 'total',
			header: __('Total', 'quillcrm'),
			cell: ({ row }) => `${row.original.total} ${row.original.currency}`,
		},
		{
			accessorKey: 'actions',
			header: __('Actions', 'quillcrm'),
			cell: ({ row }) => (
				<Button
					size="sm"
					className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() => window.open(row.original.url, '_blank')}
				>
					<ViewIcon />
					{__('View', 'quillcrm')}
				</Button>
			),
		},
	];

	return columns;
}
