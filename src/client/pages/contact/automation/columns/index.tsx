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
import type { AutomationContact } from '@quillcrm/client';
import { Button } from '@quillcrm/components/ui/button';
import { TimeAgoCell, ViewIcon } from '@quillcrm/components';
import { getTriggerLabel } from '../../../../../utils';

interface ColumnsProps {
	onViewJourney: (automationContact: AutomationContact) => void;
	onViewAutomation: (automationContact: AutomationContact) => void;
}

export function getColumns({ onViewJourney, onViewAutomation }: ColumnsProps) {
	const columns: ColumnDef<AutomationContact>[] = [
		{
			accessorKey: 'automation',
			header: __('Automation Name', 'quillcrm'),
			cell: ({ row }) => {
				// The API loads the automation relationship, but it's not in the type
				const automation = (row.original as any).automation;
				return automation?.name || `#${row.original.automation_id}`;
			},
		},
		{
			accessorKey: 'trigger',
			header: __('Trigger', 'quillcrm'),
			cell: ({ row }) => {
				const automation = (row.original as any).automation;
				return getTriggerLabel(automation);
			},
		},
		{
			accessorKey: 'created_at',
			header: __('Created At', 'quillcrm'),
			cell: ({ row }) => (
				<TimeAgoCell value={row.getValue('created_at')} />
			),
		},
		{
			accessorKey: 'status',
			header: __('Status', 'quillcrm'),
			cell: ({ row }) => {
				const status = row.original.status;
				let statusColor = 'text-gray-600 bg-gray-100 border-gray-600';

				if (status === 'active' || status === 'completed') {
					statusColor =
						'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]';
				} else if (status === 'paused' || status === 'pending') {
					statusColor =
						'text-yellow-600 bg-yellow-50 border-yellow-600';
				} else if (status === 'failed' || status === 'cancelled') {
					statusColor =
						'text-destructive bg-[#EF444429] border-destructive';
				}

				return (
					<div className="flex items-center gap-2">
						<span
							className={`border rounded-md px-2 py-1 capitalize ${statusColor}`}
						>
							{status || __('N/A', 'quillcrm')}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'next_step',
			header: __('Next Step', 'quillcrm'),
			cell: ({ row }) => {
				const nextStep = row.original.next_step;
				if (!nextStep) {
					return __('N/A', 'quillcrm');
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
			header: __('Actions', 'quillcrm'),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						className="text-primary p-0 border-y-0 border-l-0 border-r rounded-none text-sm pr-2 text-left hover:bg-transparent cursor-pointer bg-transparent shadow-none"
						onClick={() => onViewJourney(row.original)}
					>
						<ViewIcon />
						{__('Journey', 'quillcrm')}
					</Button>
					<Button
						size="sm"
						className="text-primary p-0 text-sm text-left hover:bg-transparent cursor-pointer bg-transparent shadow-none border-none"
						onClick={() => onViewAutomation(row.original)}
					>
						<ViewIcon />
						{__('Automation', 'quillcrm')}
					</Button>
				</div>
			),
		},
	];

	return columns;
}
