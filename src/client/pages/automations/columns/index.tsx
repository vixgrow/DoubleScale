/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
/**
 * internal dependencies
 */
import type { Automation } from '@doublescale/client';
import {
	SortIcon,
	TimeAgoCell,
	SettingsOutlinedIcon,
	ThreeDotsIcon,
	DeleteIcon,
} from '@doublescale/components';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@doublescale/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { NavLink, getToLink } from '@doublescale/navigation';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@doublescale/components/ui/dropdown-menu';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { getAutomationWarnings } from '@doublescale/utils';

interface AutomationColumnsProps {
	onStatusChange: (automation: Automation, newStatus: string) => void;
	updatingAutomationId: number | null;
	navigate: (to: string) => void;
	onDelete: (id: number) => void;
}

export const getAutomationColumns = ({
	onStatusChange,
	updatingAutomationId,
	navigate,
	onDelete,
}: AutomationColumnsProps): ColumnDef<Automation>[] => {
	const selectionColumn: ColumnDef<Automation> = {
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
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

	return [
		selectionColumn,
		{
			accessorKey: 'name',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Title', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => {
				const warnings = getAutomationWarnings(row.original);
				const triggerWarnings = warnings.filter(
					(w) => w.type === 'trigger'
				);

				return (
					<div className="flex items-center gap-2">
						<NavLink to={`automations/${row.original.id}`}>
							{row.original.name}
						</NavLink>
						{triggerWarnings.length > 0 && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<AlertTriangle className="h-4 w-4 text-orange-500" />
									</TooltipTrigger>
									<TooltipContent
										side="right"
										className="max-w-xs"
									>
										<div className="space-y-2">
											{triggerWarnings.map(
												(warning, index) => (
													<div key={index}>
														{warning.plugin_label && (
															<p className="font-semibold">
																{
																	warning.plugin_label
																}
															</p>
														)}
														<p className="text-xs">
															{warning.message}
														</p>
													</div>
												)
											)}
										</div>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'trigger',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Trigger', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => row.original.trigger,
		},
		{
			accessorKey: 'created_at',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Created At', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<TimeAgoCell value={row.getValue('created_at')} />
			),
		},
		{
			accessorKey: 'status',
			header: ({ column }) => (
				<div
					className="flex items-center gap-1"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === 'asc')
					}
				>
					{__('Status', 'doublescale')}
					<SortIcon />
				</div>
			),
			cell: ({ row }) => (
				<span
					className={`px-3 py-1 border rounded text-sm font-normal ${
						row.original.status === 'active'
							? 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]'
							: 'bg-[#F8F8F8] text-gray-500 border-gray-500'
					}`}
				>
					{row.original.status === 'active' ? 'Published' : 'Draft'}
				</span>
			),
		},
		{
			accessorKey: 'toggle_status',
			header: () => __('Pause/Run', 'doublescale'),
			cell: ({ row }) => {
				const isUpdating = updatingAutomationId === row.original.id;
				return (
					<Switch
						checked={row.original.status === 'active'}
						disabled={isUpdating}
						onCheckedChange={(checked) => {
							const newStatus = checked ? 'active' : 'inactive';
							onStatusChange(row.original, newStatus);
						}}
					/>
				);
			},
			enableSorting: false,
		},
		{
			accessorKey: 'actions',
			header: () => __('Actions', 'doublescale'),
			cell: ({ row }) => {
				const automation = row.original;
				return (
					<div className="text-start">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button className="h-6 w-6 bg-accent text-[#1E2125] rounded-lg p-0 hover:bg-accent focus-visible:border-none focus-visible:outline-none focus-visible:box-shadow-none focus-visible:ring-0">
									<ThreeDotsIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => {
										navigate(
											getToLink(
												`automations/${automation.id}`
											)
										);
									}}
								>
									<SettingsOutlinedIcon />
									{__('Setup', 'doublescale')}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => onDelete(automation.id)}
									className="text-red-500 hover:text-red-500 focus:text-red-500"
								>
									<DeleteIcon />
									{__('Delete', 'doublescale')}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];
};
