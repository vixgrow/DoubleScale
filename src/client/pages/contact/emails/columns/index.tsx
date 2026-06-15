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
	OpenedIcon,
	ResendIcon,
	TimeAgoCell,
	ViewIcon,
} from '@doublescale/components';
import { ChevronDown, ChevronRight, Reply } from 'lucide-react';
import type { EmailRow } from '@doublescale/utils';
export type { EmailRow };

interface ColumnsProps {
	onViewTemplate: (email: CampaignEmail) => void;
	onToggleExpand?: (emailId: number) => void;
	onReply?: (email: CampaignEmail) => void;
}

export function getColumns({ onViewTemplate, onToggleExpand, onReply }: ColumnsProps) {
	const columns: ColumnDef<EmailRow>[] = [
		{
			accessorKey: 'subject',
			header: __('Subject', 'doublescale'),
			cell: ({ row }) => {
				const email = row.original;
				const isReply = email._isReply;
				const replyCount = email._replyCount || 0;
				const isExpanded = email._isExpanded;

				// Prefer resolved subject (merge tags already replaced by backend)
				const resolvedSubject = email.resolved_subject;
				// Fallback to template subject (for campaign emails)
				const templateSubject = email.template?.subject;
				// Then try activity subject (for individual emails)
				const activitySubject = email.activity?.data?.subject;

				const subject =
					(resolvedSubject && resolvedSubject.trim()) ||
					(templateSubject && templateSubject.trim()) ||
					(activitySubject && activitySubject.trim()) ||
					__('No Subject', 'doublescale');

				if (isReply) {
					return (
						<div className="flex items-center gap-2 pl-8 min-w-0">
							<Reply className="w-3.5 h-3.5 text-muted-foreground shrink-0 scale-x-[-1]" />
							<span className="text-muted-foreground truncate">{subject}</span>
						</div>
					);
				}

				return (
					<div className="flex items-center gap-2">
						{replyCount > 0 && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onToggleExpand?.(email.id);
								}}
								className="shrink-0 p-0.5 rounded hover:bg-muted/50 text-muted-foreground"
							>
								{isExpanded ? (
									<ChevronDown className="w-4 h-4" />
								) : (
									<ChevronRight className="w-4 h-4" />
								)}
							</button>
						)}
						<span>{subject}</span>
						{replyCount > 0 && !isExpanded && (
							<span className="text-xs text-muted-foreground ml-1">
								({replyCount}{' '}
								{replyCount === 1
									? __('reply', 'doublescale')
									: __('replies', 'doublescale')}
								)
							</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'sent_at',
			header: __('Date', 'doublescale'),
			cell: ({ row }) => <TimeAgoCell value={row.original.sent_at || row.original.created_at} />,
		},
		{
			accessorKey: 'clicked',
			header: __('Clicked', 'doublescale'),
			cell: ({ row }) => {
				const isInbound =
					row.original.direction_slug === 'inbound';
				if (isInbound) {
					return (
						<span className="text-muted-foreground">—</span>
					);
				}
				const isClicked = row.original.clicked != '0';
				if (!isClicked) {
					return <span className="text-muted-foreground">—</span>;
				}
				return (
					<div className="flex items-center gap-2">
						<div className="text-emerald-600">
							<OpenedIcon />
						</div>
						{row.original.clicked_at ? (
							<TimeAgoCell value={row.original.clicked_at} />
						) : (
							<span>{__('Yes', 'doublescale')}</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'opened',
			header: __('Opened', 'doublescale'),
			cell: ({ row }) => {
				const isInbound =
					row.original.direction_slug === 'inbound';
				if (isInbound) {
					return (
						<span className="text-muted-foreground">—</span>
					);
				}
				const isOpened = row.original.opened != '0';
				if (!isOpened) {
					return <span className="text-muted-foreground">—</span>;
				}
				return (
					<div className="flex items-center gap-2">
						<div className="text-emerald-600">
							<OpenedIcon />
						</div>
						{row.original.opened_at ? (
							<TimeAgoCell value={row.original.opened_at} />
						) : (
							<span>{__('Yes', 'doublescale')}</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'status',
			header: __('Status', 'doublescale'),
			cell: ({ row }) => {
				const isInbound =
					row.original.direction_slug === 'inbound';
				const statusSlug = row.original.status_slug || 'unknown';

				if (isInbound) {
					return (
						<div className="flex items-center gap-2">
							<span className="inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 text-primary bg-primary/5 border-primary/20">
								{__('Received', 'doublescale')}
							</span>
						</div>
					);
				}

				const isSuccess =
					statusSlug === 'sent' || statusSlug === 'delivered';
				return (
					<div className="flex items-center gap-2">
						<span
							className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${
								isSuccess
									? 'text-emerald-700 bg-emerald-50 border-emerald-200'
									: 'text-destructive bg-destructive/5 border-destructive/20'
							}`}
						>
							{isSuccess
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
			cell: ({ row }) => {
				const isInbound =
					row.original.direction_slug === 'inbound';
				return (
					<div className="flex items-center">
						<Button
							size="sm"
							className="bg-transparent border-y-0 border-l-0 border-r rounded-none shadow-none text-primary hover:bg-transparent hover:text-primary/80"
							onClick={() => onViewTemplate(row.original)}
						>
							<ViewIcon />
							{__('View', 'doublescale')}
						</Button>
					{!isInbound && (
						<Button
							size="sm"
							className="bg-transparent border-0 shadow-none text-primary hover:bg-transparent hover:text-primary/80"
							onClick={() => onViewTemplate(row.original)}
						>
							<ResendIcon />
							{__('Resend', 'doublescale')}
						</Button>
					)}
					{isInbound && (
						<Button
							size="sm"
							className="bg-transparent border-0 shadow-none text-primary hover:bg-transparent hover:text-primary/80"
							onClick={() => onReply?.(row.original)}
						>
							<Reply className="w-4 h-4 scale-x-[-1]" />
							{__('Reply', 'doublescale')}
						</Button>
					)}
					</div>
				);
			},
		},
	];

	return columns;
}
