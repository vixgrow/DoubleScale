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
import { Campaign, CampaignStatus } from '../../types';
import { Checkbox } from '@/components/ui/checkbox';
import { CAMPAIGN_STATUS_COLORS } from './constants';
import { Badge } from '@/components/ui/badge';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
	CopyIcon,
	DeleteIcon,
	FallbackCell,
	FormattedDateCell,
	SettingsOutlinedIcon,
	SortedHeaderCell,
	TimeAgoCell,
	ViewOutlinedIcon,
} from '@/components';
import { getToLink } from '@quillcrm/navigation';

// Add interface for column props
interface ColumnProps {
	onDelete: (id: number) => void;
	duplicate: (id: number) => void;
	navigate: (path: string) => void;
}

export const campaignColumns = ({
	onDelete,
	duplicate,
	navigate,
}: ColumnProps): ColumnDef<Campaign>[] => [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && 'indeterminate')
				}
				onCheckedChange={(value) =>
					table.toggleAllPageRowsSelected(!!value)
				}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),

		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			SortedHeaderCell({
				column,
				header: __('Campaign Name', 'quillcrm'),
			}),
	},
	{
		accessorKey: 'status',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Status', 'quillcrm') }),
		cell: ({ row }) => {
			const status = row.getValue('status') as CampaignStatus;
			const colorClasses =
				CAMPAIGN_STATUS_COLORS[status] ||
				'bg-muted text-muted-foreground';

			return (
				<Badge
					className={`${colorClasses} rounded-[88px] w-full max-w-24 text-center px-0 justify-center py-1.5`}
					variant="borderTransparent"
				>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'broadcast',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Broadcast', 'quillcrm') }),
		cell: ({ row }) => <FallbackCell value={row.getValue('broadcast')} />,
	},
	{
		accessorKey: 'created_at',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Created At', 'quillcrm') }),
		cell: ({ row }) => <TimeAgoCell value={row.getValue('created_at')} />,
	},
	{
		accessorKey: 'updated_at',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Updated At', 'quillcrm') }),
		cell: ({ row }) => (
			<FormattedDateCell value={row.getValue('updated_at')} />
		),
	},
	{
		accessorKey: 'recipients',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Recipients', 'quillcrm') }),
		cell: ({ row }) => <FallbackCell value={row.getValue('recipients')} />,
	},
	{
		accessorKey: 'open_rate',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Open Rate', 'quillcrm') }),
		cell: ({ row }) => <FallbackCell value={row.getValue('open_rate')} />,
	},
	{
		accessorKey: 'actions',
		header: () => (
			<div className="text-center">{__('Actions', 'quillcrm')}</div>
		),
		cell: ({ row }) => {
			const campaign = row.original;
			return (
				<div className="text-center">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="h-8 w-8 p-0 focus-visible:border-none focus-visible:outline-none focus-visible:box-shadow-none focus-visible:ring-0"
							>
								<SettingsOutlinedIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									navigate(
										getToLink(`campaigns/${campaign.id}`)
									);
								}}
							>
								<ViewOutlinedIcon />
								{__('Overview', 'quillcrm')}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => duplicate(campaign.id)}
							>
								<CopyIcon />
								{__('Duplicate', 'quillcrm')}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onDelete(campaign.id)}
								className="text-red-500 hover:text-red-500 focus:text-red-500"
							>
								<DeleteIcon />
								{__('Delete', 'quillcrm')}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		},
	},
];
