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
import type { DealsResponse } from '@quillcrm/client';
import { Button } from '@quillcrm/components/ui/button';
import { TimeAgoCell, ViewIcon } from '@quillcrm/components';

interface ColumnsProps {
	onView: (deal: DealsResponse) => void;
}

type DealStage =
	| 'qualified'
	| 'proposal'
	| 'negotiation'
	| 'lead'
	| 'lost'
	| 'won';

const getStageStyles = (stage: DealStage) => {
	const styles = {
		qualified: 'text-[#660FF1] bg-[#F5EFFF] border-[#660FF1]',
		proposal: 'text-[#A67D0A] bg-[#FAF3DF] border-[#A67D0A]',
		negotiation: 'text-[#CB5301] bg-[#FAEADF] border-[#CB5301]',
		lead: 'text-secondary bg-[#E3EEFF99] border-secondary',
		lost: 'text-destructive bg-[#FBE8E8] border-destructive',
		won: 'text-[#16A34A] bg-[#E4FAEC] border-[#16A34A]',
	};
	return styles[stage] || 'text-gray-600 bg-gray-100 border-gray-600';
};

export function getColumns({ onView }: ColumnsProps) {
	const columns: ColumnDef<DealsResponse>[] = [
		{
			accessorKey: 'deal_name',
			header: __('Deal Name', 'quillcrm'),
			cell: ({ row }) => {
				const dealName = (row.original as any).deal_name;
				return dealName || __('N/A', 'quillcrm');
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
			accessorKey: 'deal_value',
			header: __('Deal Value', 'quillcrm'),
			cell: ({ row }) => {
				const value = (row.original as any).deal_value;
				if (!value) {
					return __('N/A', 'quillcrm');
				}
				// Format as currency
				return new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
				}).format(value);
			},
		},
		{
			accessorKey: 'stage',
			header: __('Current Stage', 'quillcrm'),
			cell: ({ row }) => {
				const stage = (row.original as any).stage as DealStage;
				const stageStyles = getStageStyles(stage);

				return (
					<div className="flex items-center gap-2">
						<span
							className={`border rounded-md px-2 py-1 capitalize ${stageStyles}`}
						>
							{stage || __('N/A', 'quillcrm')}
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
