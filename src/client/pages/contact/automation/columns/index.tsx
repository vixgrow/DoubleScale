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
import type { AutomationContact } from '@doublescale/client';
import { Button } from '@doublescale/components/ui/button';
import { TimeAgoCell, ViewIcon } from '@doublescale/components';
import { getTriggerLabel } from '@doublescale/utils';

interface ColumnsProps {
	onViewJourney: (automationContact: AutomationContact) => void;
	onViewAutomation: (automationContact: AutomationContact) => void;
}

export function getColumns({ onViewJourney, onViewAutomation }: ColumnsProps) {
	const columns: ColumnDef<AutomationContact>[] = [
		{
			accessorKey: 'automation',
			header: __('Automation Name', 'doublescale'),
			cell: ({ row }) => {
				// The API loads the automation relationship, but it's not in the type
				const automation = (row.original as any).automation;
				return automation?.name || `#${row.original.automation_id}`;
			},
		},
		{
			accessorKey: 'trigger',
			header: __('Trigger', 'doublescale'),
			cell: ({ row }) => {
				const automation = (row.original as any).automation;
				return getTriggerLabel(automation);
			},
		},
		{
			accessorKey: 'created_at',
			header: __('Created At', 'doublescale'),
			cell: ({ row }) => (
				<TimeAgoCell value={row.getValue('created_at')} />
			),
		},
		{
			accessorKey: 'status',
			header: __('Status', 'doublescale'),
			cell: ({ row }) => {
				const status = row.original.status;
				let statusColor = 'text-muted-foreground bg-muted/50 border-border';

				if (status === 'active' || status === 'completed') {
					statusColor =
						'text-emerald-700 bg-emerald-50 border-emerald-200';
				} else if (status === 'paused' || status === 'pending') {
					statusColor =
						'text-amber-700 bg-amber-50 border-amber-200';
				} else if (status === 'failed' || status === 'cancelled') {
					statusColor =
						'text-destructive bg-destructive/5 border-destructive/20';
				}

				return (
					<div className="flex items-center gap-2">
						<span
							className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 capitalize ${statusColor}`}
						>
							{status || __('N/A', 'doublescale')}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'next_step',
			header: __('Next Step', 'doublescale'),
			cell: ({ row }) => {
				const nextStep = row.original.next_step;
				if (!nextStep) {
					return __('N/A', 'doublescale');
				}
				return (
					<div className="flex flex-col">
						<span className="font-medium">
							{nextStep.action || nextStep.type}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'actions',
			header: __('Actions', 'doublescale'),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						className="text-primary p-0 border-y-0 border-l-0 border-r rounded-none text-sm pr-2 text-left hover:bg-transparent cursor-pointer bg-transparent shadow-none"
						onClick={() => onViewJourney(row.original)}
					>
						<ViewIcon />
						{__('Journey', 'doublescale')}
					</Button>
					<Button
						size="sm"
						className="text-primary p-0 text-sm text-left hover:bg-transparent cursor-pointer bg-transparent shadow-none border-none"
						onClick={() => onViewAutomation(row.original)}
					>
						<ViewIcon />
						{__('Automation', 'doublescale')}
					</Button>
				</div>
			),
		},
	];

	return columns;
}
