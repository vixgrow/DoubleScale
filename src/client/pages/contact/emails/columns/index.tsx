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
import type { CampaignEmail } from '@doublescale/client';
import { Button } from '@doublescale/components/ui/button';
import {
	NotOpenedIcon,
	OpenedIcon,
	ResendIcon,
	TimeAgoCell,
	ViewIcon,
} from '@doublescale/components';

interface ColumnsProps {
	onViewTemplate: (email: CampaignEmail) => void;
}

export function getColumns({ onViewTemplate }: ColumnsProps) {
	const columns: ColumnDef<CampaignEmail>[] = [
		{
			accessorKey: 'subject',
			header: __('Subject', 'doublescale'),
			cell: ({ row }) => {
				// Try template subject first (for campaign emails)
				const templateSubject = row.original.template?.subject;
				// Then try activity subject (for individual emails)
				const activitySubject = row.original.activity?.data?.subject;

				// Return the first non-empty value
				return (
					(templateSubject && templateSubject.trim()) ||
					(activitySubject && activitySubject.trim()) ||
					__('No Subject', 'doublescale')
				);
			},
		},
		{
			accessorKey: 'sent_at',
			header: __('Sent On', 'doublescale'),
			cell: ({ row }) => <TimeAgoCell value={row.getValue('sent_at')} />,
		},
		{
			accessorKey: 'clicked',
			header: __('Clicked', 'doublescale'),
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
								? __('Yes', 'doublescale')
								: __('No', 'doublescale')}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'opened',
			header: __('Opened', 'doublescale'),
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
								? __('Yes', 'doublescale')
								: __('No', 'doublescale')}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'status',
			header: __('Sent Status', 'doublescale'),
			cell: ({ row }) => {
				const statusSlug = row.original.status_slug || 'unknown';
				const isSent = statusSlug === 'sent';
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
								? __('Sent', 'doublescale')
								: __('Failed', 'doublescale')}
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
						className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
						onClick={() => onViewTemplate(row.original)}
					>
						<ViewIcon />
						{__('View', 'doublescale')}
					</Button>
					<Button
						size="sm"
						className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
						onClick={() => onViewTemplate(row.original)}
					>
						<ResendIcon />
						{__('Resend', 'doublescale')}
					</Button>
				</div>
			),
		},
	];

	return columns;
}
