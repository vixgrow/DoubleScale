/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, ExternalLink, Download } from 'lucide-react';
import React, { useEffect, useState } from 'react';
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
	CopyIcon,
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
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
import { Input } from '@/components/ui/input';

interface AutomationNameCellProps {
	automation: Automation;
	onRename: (automation: Automation, name: string) => Promise<void>;
	isRenaming: boolean;
}

const AutomationNameCell: React.FC<AutomationNameCellProps> = ({
	automation,
	onRename,
	isRenaming,
}) => {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(automation.name);

	useEffect(() => {
		if (!editing) {
			setDraft(automation.name);
		}
	}, [automation.name, automation.id, editing]);

	const commit = async () => {
		const trimmed = draft.trim();
		if (!trimmed) {
			setDraft(automation.name);
			setEditing(false);
			return;
		}
		if (trimmed === automation.name) {
			setEditing(false);
			return;
		}
		try {
			await onRename(automation, trimmed);
			setEditing(false);
		} catch {
			// Stay in edit mode; list shows the error notice.
		}
	};

	const warnings = getAutomationWarnings(automation);
	const triggerWarnings = warnings.filter((w) => w.type === 'trigger');

	return (
		<div className="flex items-center gap-2 min-w-0 max-w-md">
			{editing ? (
				<Input
					className="h-8 text-sm"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={() => {
						void commit();
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							(e.target as HTMLInputElement).blur();
						}
						if (e.key === 'Escape') {
							setDraft(automation.name);
							setEditing(false);
						}
					}}
					autoFocus
					disabled={isRenaming}
					aria-label={__('Automation name', 'doublescale')}
					onClick={(e) => e.stopPropagation()}
				/>
			) : (
				<>
					<button
						type="button"
						className="text-left font-medium text-primary hover:underline truncate min-w-0"
						onClick={(e) => {
							e.stopPropagation();
							setDraft(automation.name);
							setEditing(true);
						}}
						title={__('Click to rename', 'doublescale')}
					>
						{automation.name}
					</button>
					<NavLink
						to={`automations/${automation.id}`}
						className="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded"
						title={__('Open automation', 'doublescale')}
						onClick={(e) => e.stopPropagation()}
					>
						<ExternalLink className="h-3.5 w-3.5" />
					</NavLink>
				</>
			)}
			{triggerWarnings.length > 0 && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-xs">
							<div className="space-y-2">
								{triggerWarnings.map((warning, index) => (
									<div key={index}>
										{warning.plugin_label && (
											<p className="font-semibold">
												{warning.plugin_label}
											</p>
										)}
										<p className="text-xs">
											{warning.message}
										</p>
									</div>
								))}
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);
};

interface AutomationColumnsProps {
	onStatusChange: (automation: Automation, newStatus: string) => void;
	updatingAutomationId: number | null;
	renamingAutomationId: number | null;
	onRenameAutomation: (automation: Automation, name: string) => Promise<void>;
	navigate: (to: string) => void;
	onDelete: (id: number) => void;
	onDuplicate: (id: number) => void;
	duplicatingAutomationId: number | null;
	onExport: (automation: Automation) => void;
}

export const getAutomationColumns = ({
	onStatusChange,
	updatingAutomationId,
	renamingAutomationId,
	onRenameAutomation,
	navigate,
	onDelete,
	onDuplicate,
	duplicatingAutomationId,
	onExport,
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
			cell: ({ row }) => (
				<AutomationNameCell
					automation={row.original}
					onRename={onRenameAutomation}
					isRenaming={renamingAutomationId === row.original.id}
				/>
			),
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
					className={`inline-flex items-center text-xs font-medium rounded-full border py-0.5 px-2.5 ${
						row.original.status === 'active'
							? 'bg-emerald-50 text-emerald-700 border-emerald-200'
							: 'bg-muted/50 text-muted-foreground border-border'
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
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 text-muted-foreground hover:text-foreground focus-visible:ring-0"
								>
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
									onClick={() => onDuplicate(automation.id)}
									disabled={duplicatingAutomationId === automation.id}
								>
									<CopyIcon />
									{__('Duplicate', 'doublescale')}
								</DropdownMenuItem>
								{isProActive() && (
									<DropdownMenuItem
										onClick={() => onExport(automation)}
									>
										<Download />
										{__('Export', 'doublescale')}
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onClick={() => onDelete(automation.id)}
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
		},
	];
};
