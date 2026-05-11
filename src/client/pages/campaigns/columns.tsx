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
	RepeatIcon,
	SettingsOutlinedIcon,
	SortedHeaderCell,
	ThreeDotsIcon,
	TimeAgoCell,
	ViewOutlinedIcon,
} from '@doublescale/components';
import { getToLink } from '@doublescale/navigation';
import EditHeaderIcon from '@/components/icons/edit-header';
import { Play, Pause } from 'lucide-react';

// Add interface for column props
interface ColumnProps {
	onDelete: (id: number) => void;
	duplicate: (id: number) => void;
	navigate: (path: string) => void;
	onStatusChange?: (id: number, status: 'active' | 'draft') => void;
}

// Common columns used across all campaign types
const getCommonColumns = ({
	onDelete,
	duplicate,
	navigate,
	onStatusChange,
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
				header: __('Campaign Name', 'doublescale'),
			}),
		cell: ({ row }) => {
			const campaign = row.original;
			const name = row.getValue('name') as string;
			const status = campaign.status;
			const isAutomated = campaign.settings?.automated || false;

			let targetTab: string;
			if (status === CAMPAIGN_STATUS.DRAFT) {
				const currentStep = campaign.settings?.current_step;
				targetTab = currentStep || (isAutomated ? 'trigger' : 'template');
			} else if (status === CAMPAIGN_STATUS.SCHEDULED) {
				targetTab = 'view';
			} else {
				targetTab = 'overview';
			}

			return (
				<button
					onClick={() => {
						navigate(
							getToLink(`campaigns/${campaign.id}/${targetTab}`)
						);
					}}
					className="text-left hover:underline cursor-pointer"
				>
					{name}
				</button>
			);
		},
	};

	const statusColumn: ColumnDef<Campaign> = {
		accessorKey: 'status',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Status', 'doublescale') }),
		cell: ({ row }) => {
			const status = row.getValue('status') as CampaignStatus;
			const colorClasses =
				CAMPAIGN_STATUS_COLORS[status] ||
				'bg-muted text-muted-foreground';

			return (
				<span
					className={`${colorClasses} inline-flex items-center text-xs font-medium rounded-lg w-fit text-center px-2 py-1`}
				>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</span>
			);
		},
	};

	const broadcastColumn: ColumnDef<Campaign> = {
		accessorKey: 'execute_at',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Broadcast', 'doublescale') }),
		cell: ({ row }) => <TimeAgoCell value={row.getValue('execute_at')} />,
	};

	const createdAtColumn: ColumnDef<Campaign> = {
		accessorKey: 'created_at',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Created At', 'doublescale') }),
		cell: ({ row }) => <TimeAgoCell value={row.getValue('created_at')} />,
	};

	const updatedAtColumn: ColumnDef<Campaign> = {
		accessorKey: 'updated_at',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Updated At', 'doublescale') }),
		cell: ({ row }) => (
			<FormattedDateCell value={row.getValue('updated_at')} />
		),
	};

	const actionsColumn: ColumnDef<Campaign> = {
		accessorKey: 'actions',
		header: () => (
			<div className="text-center">{__('Actions', 'doublescale')}</div>
		),
		cell: ({ row }) => {
			const campaign = row.original;
			const isAutomated = campaign.settings?.automated || false;
			const canEdit =
				campaign.status === 'draft' ||
				(isAutomated && campaign.status === 'active');

			return (
				<div className="text-center">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="secondary"
								className="w-8 h-8 p-0 !rounded"
							>
								<ThreeDotsIcon width={32} height={32} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									navigate(
										getToLink(
											`campaigns/${campaign.id}/overview`
										)
									);
								}}
							>
								<ViewOutlinedIcon />
								{__('Overview', 'doublescale')}
							</DropdownMenuItem>
							{canEdit && (
								<DropdownMenuItem
									onClick={() => {
										const targetTab = isAutomated
											? 'trigger'
											: (campaign.settings?.current_step || 'template');
										navigate(
											getToLink(`campaigns/${campaign.id}/${targetTab}`)
										);
									}}
								>
									<EditHeaderIcon />
									{__('Edit', 'doublescale')}
								</DropdownMenuItem>
							)}
							{isAutomated && campaign.status === 'draft' && onStatusChange && (
								<DropdownMenuItem
									onClick={() => onStatusChange(campaign.id, 'active')}
								>
									<Play className="w-4 h-4" />
									{__('Activate', 'doublescale')}
								</DropdownMenuItem>
							)}
							{isAutomated && campaign.status === 'active' && onStatusChange && (
								<DropdownMenuItem
									onClick={() => onStatusChange(campaign.id, 'draft')}
								>
									<Pause className="w-4 h-4" />
									{__('Deactivate', 'doublescale')}
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								onClick={() => duplicate(campaign.id)}
							>
								<CopyIcon />
								{__('Duplicate', 'doublescale')}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onDelete(campaign.id)}
								className="text-destructive hover:text-destructive focus:text-destructive"
							>
								<DeleteIcon />
								{__('Delete', 'doublescale')}
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
	onStatusChange,
}: ColumnProps): ColumnDef<Campaign>[] => {
	const {
		selectColumn,
		nameColumn,
		statusColumn,
		broadcastColumn,
		createdAtColumn,
		updatedAtColumn,
		actionsColumn,
	} = getCommonColumns({ onDelete, duplicate, navigate, onStatusChange });

	const typeColumn: ColumnDef<Campaign> = {
		accessorKey: 'type',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Type', 'doublescale') }),
		cell: ({ row }) => {
			const campaign = row.original;
			const isAbTest = campaign.settings?.ab_test || false;
			const isAutomated = campaign.settings?.automated || false;

			const getTypeInfo = () => {
				if (isAutomated) {
					return {
						icon: <RepeatIcon width={24} height={24} />,
						iconClass: 'text-[#CB5301]',
						label: __('Automated Campaign', 'doublescale'),
					};
				}
				if (isAbTest) {
					return {
						icon: <ABSplitIcon />,
						iconClass: 'text-secondary',
						label: __('A/B Split Campaign', 'doublescale'),
					};
				}
				return {
					icon: <ProcessingEmailsIcon width={24} height={24} />,
					iconClass: 'text-[#0D9DFC]',
					label: __('Standard Campaign', 'doublescale'),
				};
			};

			const typeInfo = getTypeInfo();

			return (
				<div className="flex items-center gap-2">
					<div className={typeInfo.iconClass}>
						{typeInfo.icon}
					</div>
					<span>{typeInfo.label}</span>
				</div>
			);
		},
	};

	const openRateColumn: ColumnDef<Campaign> = {
		accessorKey: 'open_rate',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Open Rate', 'doublescale') }),
		cell: ({ row }) => <FallbackCell value={row.getValue('open_rate')} />,
	};

	const recipientsColumn: ColumnDef<Campaign> = {
		accessorKey: 'contacts_count',
		header: ({ column }) =>
			SortedHeaderCell({ column, header: __('Recipients', 'doublescale') }),
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
	onStatusChange,
}: ColumnProps): ColumnDef<Campaign>[] => {
	const {
		selectColumn,
		nameColumn,
		statusColumn,
		broadcastColumn,
		createdAtColumn,
		updatedAtColumn,
		actionsColumn,
	} = getCommonColumns({ onDelete, duplicate, navigate, onStatusChange });

	const deliveryRateColumn: ColumnDef<Campaign> = {
		accessorKey: 'delivery_rate',
		header: ({ column }) =>
			SortedHeaderCell({
				column,
				header: __('Delivery Rate', 'doublescale'),
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
