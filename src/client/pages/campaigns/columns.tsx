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
import { CAMPAIGN_STATUS, Campaign, CampaignStatus } from '../../types';
import { Checkbox } from '@/components/ui/checkbox';
import { CAMPAIGN_STATUS_COLORS } from './constants';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
	ABSplitIcon,
	CopyIcon,
	DeleteIcon,
	FallbackCell,
	FormattedDateCell,
	ProcessingEmailsIcon,
	SettingsOutlinedIcon,
	SortedHeaderCell,
	TimeAgoCell,
	ViewOutlinedIcon,
} from '@quillcrm/components';
import { getToLink } from '@quillcrm/navigation';
import EditHeaderIcon from '@/components/icons/edit-header';

// Add interface for column props
interface ColumnProps {
	onDelete: (id: number) => void;
	duplicate: (id: number) => void;
	navigate: (path: string) => void;
}

// Common columns used across all campaign types
const getCommonColumns = ({
	onDelete,
	duplicate,
	navigate,
}: ColumnProps) => {
	const selectColumn: ColumnDef<Campaign> = {
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
	};

	const nameColumn: ColumnDef<Campaign> = {
		accessorKey: 'name',
		header: ({ column }) =>
			SortedHeaderCell({
				column,
				header: __('Campaign Name', 'quillcrm'),
			}),
	};

	const statusColumn: ColumnDef<Campaign> = {
		accessorKey: 'status',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Status', 'quillcrm') }),
		cell: ({ row }) => {
			const status = row.getValue('status') as CampaignStatus;
			const colorClasses =
				CAMPAIGN_STATUS_COLORS[status] ||
				'bg-muted text-muted-foreground';

			return (
				<div
					className={`${colorClasses} rounded-xl w-fit text-center px-2 py-1 border text-base`}
				>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</div>
			);
		},
	};

	const broadcastColumn: ColumnDef<Campaign> = {
		accessorKey: 'execute_at',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Broadcast', 'quillcrm') }),
		cell: ({ row }) => <TimeAgoCell value={row.getValue('execute_at')} />,
	};

	const createdAtColumn: ColumnDef<Campaign> = {
		accessorKey: 'created_at',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Created At', 'quillcrm') }),
		cell: ({ row }) => <TimeAgoCell value={row.getValue('created_at')} />,
	};

	const updatedAtColumn: ColumnDef<Campaign> = {
		accessorKey: 'updated_at',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Updated At', 'quillcrm') }),
		cell: ({ row }) => (
			<FormattedDateCell value={row.getValue('updated_at')} />
		),
	};

	const actionsColumn: ColumnDef<Campaign> = {
		accessorKey: 'actions',
		header: () => (
			<div className="text-center">{__('Actions', 'quillcrm')}</div>
		),
		cell: ({ row }) => {
			const campaign = row.original;
			const canEdit = campaign.status === 'draft';

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
									const targetTab =
										campaign.status ===
											CAMPAIGN_STATUS.SCHEDULED
											? 'view'
											: 'overview';
									navigate(
										getToLink(
											`campaigns/${campaign.id}/${targetTab}`
										)
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
							{canEdit && (
								<DropdownMenuItem
									onClick={() => {
										navigate(
											getToLink(`campaigns/${campaign.id}/template`)
										);
									}}
								>
									<EditHeaderIcon/>
									{__('Edit', 'quillcrm')}
								</DropdownMenuItem>
							)}
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
	};

	return {
		selectColumn,
		nameColumn,
		statusColumn,
		broadcastColumn,
		createdAtColumn,
		updatedAtColumn,
		actionsColumn,
	};
};

// Email campaign columns: name, status, broadcast, type, open rate, recipients, created_at, updated_at, actions
export const emailCampaignColumns = ({
	onDelete,
	duplicate,
	navigate,
}: ColumnProps): ColumnDef<Campaign>[] => {
	const {
		selectColumn,
		nameColumn,
		statusColumn,
		broadcastColumn,
		createdAtColumn,
		updatedAtColumn,
		actionsColumn,
	} = getCommonColumns({ onDelete, duplicate, navigate });

	const typeColumn: ColumnDef<Campaign> = {
		accessorKey: 'type',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Type', 'quillcrm') }),
		cell: ({ row }) => {
			const campaign = row.original;
			const isAbTest = campaign.settings?.ab_test || false;

			return (
				<div className="flex items-center gap-2">
					{isAbTest ? (
						<div className="text-secondary">
							<ABSplitIcon />
						</div>
					) : (
						<div className="text-[#660FF1]">
							<ProcessingEmailsIcon width={24} height={24} />
						</div>
					)}
					<span>
						{isAbTest
							? __('A/B Split Campaign', 'quillcrm')
							: __('Standard Campaign', 'quillcrm')}
					</span>
				</div>
			);
		},
	};

	const openRateColumn: ColumnDef<Campaign> = {
		accessorKey: 'open_rate',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Open Rate', 'quillcrm') }),
		cell: ({ row }) => <FallbackCell value={row.getValue('open_rate')} />,
	};

	const recipientsColumn: ColumnDef<Campaign> = {
		accessorKey: 'contacts_count',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Recipients', 'quillcrm') }),
		cell: ({ row }) => <FallbackCell value={row.getValue('contacts_count')} />,
	};

	return [
		selectColumn,
		nameColumn,
		statusColumn,
		broadcastColumn,
		typeColumn,
		openRateColumn,
		recipientsColumn,
		createdAtColumn,
		updatedAtColumn,
		actionsColumn,
	];
};

// SMS/WhatsApp campaign columns: name, status, broadcast, delivered rate, created_at, updated_at, actions
export const smsCampaignColumns = ({
	onDelete,
	duplicate,
	navigate,
}: ColumnProps): ColumnDef<Campaign>[] => {
	const {
		selectColumn,
		nameColumn,
		statusColumn,
		broadcastColumn,
		createdAtColumn,
		updatedAtColumn,
		actionsColumn,
	} = getCommonColumns({ onDelete, duplicate, navigate });

	const deliveryRateColumn: ColumnDef<Campaign> = {
		accessorKey: 'delivery_rate',
		header: ({ column }) =>
			SortedHeaderCell({
				column,
				header: __('Delivery Rate', 'quillcrm'),
			}),
		cell: ({ row }) => (
			<FallbackCell value={row.getValue('delivery_rate')} />
		),
	};

	return [
		selectColumn,
		nameColumn,
		statusColumn,
		broadcastColumn,
		deliveryRateColumn,
		createdAtColumn,
		updatedAtColumn,
		actionsColumn,
	];
};

// Legacy function for backward compatibility
export const campaignColumns = emailCampaignColumns;
