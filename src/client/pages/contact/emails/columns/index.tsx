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
import type { CampaignEmail } from '@quillcrm/client';
import { Button } from '@quillcrm/components/ui/button';
import {
	NotOpenedIcon,
	OpenedIcon,
	ResendIcon,
	TimeAgoCell,
	ViewIcon,
} from '@quillcrm/components';

interface ColumnsProps {
	onViewTemplate: (email: CampaignEmail) => void;
}

export function getColumns({ onViewTemplate }: ColumnsProps) {
	const columns: ColumnDef<CampaignEmail>[] = [
		{
			accessorKey: 'subject',
			header: __('Subject', 'quillcrm'),
			cell: ({ row }) => row.original.template.subject,
		},
		{
			accessorKey: 'sent_at',
			header: __('Sent On', 'quillcrm'),
			cell: ({ row }) => <TimeAgoCell value={row.getValue('sent_at')} />,
		},
		{
			accessorKey: 'clicked',
			header: __('Clicked', 'quillcrm'),
			cell: ({ row }) => {
				const isClicked = row.original.clicked != '0';
				return (
					<div className="flex items-center gap-2">
						<div
							className={
								isClicked
									? 'text-green-600'
									: 'text-destructive'
							}
						>
							{isClicked ? <OpenedIcon /> : <NotOpenedIcon />}
						</div>
						<span>
							{isClicked
								? __('Yes', 'quillcrm')
								: __('No', 'quillcrm')}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'opened',
			header: __('Opened', 'quillcrm'),
			cell: ({ row }) => {
				const isOpened = row.original.opened != '0';
				return (
					<div className="flex items-center gap-2">
						<div
							className={
								isOpened ? 'text-green-600' : 'text-destructive'
							}
						>
							{isOpened ? <OpenedIcon /> : <NotOpenedIcon />}
						</div>
						<span>
							{isOpened
								? __('Yes', 'quillcrm')
								: __('No', 'quillcrm')}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'status',
			header: __('Sent Status', 'quillcrm'),
			cell: ({ row }) => {
				const status = row.original.status;
				const isSent = status === 'sent';
				return (
					<div className="flex items-center gap-2">
						<span
							className={`border rounded-md px-2 py-1 ${
								isSent
									? 'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]'
									: 'text-destructive bg-[#EF444429] border-destructive'
							}`}
						>
							{isSent
								? __('Sent', 'quillcrm')
								: __('Failed', 'quillcrm')}
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
						className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
						onClick={() => onViewTemplate(row.original)}
					>
						<ViewIcon />
						{__('View', 'quillcrm')}
					</Button>
					<Button
						size="sm"
						className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
						onClick={() => onViewTemplate(row.original)}
					>
						<ResendIcon />
						{__('Resend', 'quillcrm')}
					</Button>
				</div>
			),
		},
	];

	return columns;
}
