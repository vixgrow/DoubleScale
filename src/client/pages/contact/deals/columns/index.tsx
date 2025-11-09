/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
/**
 * Internal dependencies
 */
import type { Deal } from '@/client/pages/sales-pipeline/types';
import { Button } from '@quillcrm/components/ui/button';
import { TimeAgoCell, ViewIcon } from '@quillcrm/components';

interface ColumnsProps {
	onView: (deal: Deal) => void;
}

export function getColumns({ onView }: ColumnsProps) {
	const columns: ColumnDef<Deal>[] = [
		{
			accessorKey: 'title',
			header: __('Deal Name', 'quillcrm'),
			cell: ({ row }) => {
				return row.original.title || __('N/A', 'quillcrm');
			},
		},
		{
			accessorKey: 'expected_close_date',
			header: __('Expected Close Date', 'quillcrm'),
			cell: ({ row }) => (
				<TimeAgoCell value={row.getValue('expected_close_date')} />
			),
		},
		{
			accessorKey: 'value',
			header: __('Deal Value', 'quillcrm'),
			cell: ({ row }) => {
				const value = row.original.value;
				const currency = row.original.currency || 'USD';
				if (!value) {
					return __('N/A', 'quillcrm');
				}
				// Format as currency
				return new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: currency,
				}).format(value);
			},
		},
		{
			accessorKey: 'stage',
			header: __('Current Stage', 'quillcrm'),
			cell: ({ row }) => {
				const stageName = row.original.stage?.name;
				const stageColor = row.original.stage?.color || '#6d78d8';
				
				if (!stageName) {
					return __('N/A', 'quillcrm');
				}

				return (
					<div className="flex items-center gap-2">
						<span
							className="border rounded-md px-2 py-1 capitalize"
							style={{
								borderColor: stageColor,
								color: stageColor,
								backgroundColor: `${stageColor}20`,
							}}
						>
							{stageName}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'actions',
			header: __('Actions', 'quillcrm'),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						className="bg-transparent border-none p-0 shadow-none text-primary hover:bg-transparent hover:text-primary/80"
						onClick={() => onView(row.original)}
					>
						<ViewIcon />
						{__('View', 'quillcrm')}
					</Button>
				</div>
			),
		},
	];

	return columns;
}
