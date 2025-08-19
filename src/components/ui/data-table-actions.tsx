/**
 * wordpress depnedencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import { Table } from '@tanstack/react-table';

/**
 * internal dependencies
 */
import {
	ColumnsIcon,
	FiltersIcon,
	BulkActionSelect,
	Filters,
	CustomDialogHeader,
	GradientFilterIcon,
	GradientColumnsIcon,
} from '@quillcrm/components';
import { DataTableConfig } from '@quillcrm/client';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from './date-range-picker';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogClose,
	DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface DataTableActionsProps<TData> {
	table: Table<TData>;
	config: DataTableConfig<TData>;
	activeTab?: string;
	setPage?: (page: number) => void;
}

export function DataTableActions<TData>({
	table,
	config,
	activeTab,
	setPage,
}: DataTableActionsProps<TData>) {
	const [columnVisibility, setColumnVisibility] = useState<
		Record<string, boolean>
	>({});
	const [isColumnsDialogOpen, setIsColumnsDialogOpen] = useState(false);

	// Initialize column visibility state when dialog opens
	const handleDialogOpen = () => {
		const currentVisibility: Record<string, boolean> = {};
		table.getAllColumns().forEach((column) => {
			if (column.getCanHide()) {
				currentVisibility[column.id] = column.getIsVisible();
			}
		});
		setColumnVisibility(currentVisibility);
		setIsColumnsDialogOpen(true);
	};

	// Handle column visibility changes in temporary state
	const handleColumnToggle = (columnId: string, checked: boolean) => {
		setColumnVisibility((prev) => ({
			...prev,
			[columnId]: checked,
		}));
	};

	// Apply changes when submit is clicked
	const handleSubmitColumns = () => {
		Object.entries(columnVisibility).forEach(([columnId, isVisible]) => {
			const column = table.getColumn(columnId);
			if (column) {
				column.toggleVisibility(isVisible);
			}
		});

		// Call config callback if provided
		if (config.manageColumns?.onSubmit) {
			config.manageColumns.onSubmit(columnVisibility);
		}

		setIsColumnsDialogOpen(false);
	};

	return (
		<div className="flex gap-[10px] items-center">
			{config.dateRange?.enabled && (
				<DateRangePicker
					value={config.dateRange?.value}
					onChange={(range) => {
						config.dateRange?.onDateChange(range);
						if (setPage) {
							setPage(1);
						}
					}}
					placeholder={config.dateRange?.placeholder}
				/>
			)}
			{/* Bulk Actions - Always visible when enabled, but disabled when no rows selected */}
			{config.bulkActions?.enabled && (
				<BulkActionSelect
					bulkAction={config.bulkActions?.currentAction}
					setBulkAction={config.bulkActions?.onActionChange}
					selectedRowKeys={
						config.selection?.selectedKeys.map((key) =>
							key.toString()
						) || []
					}
					data={table.getRowModel().rows.map((row) => row.original)}
					doBulkAction={config.bulkActions?.onExecuteAction}
					setSelectedLists={
						config.bulkActions.lists?.onSelectionChange ||
						(() => {})
					}
					setSelectedTags={
						config.bulkActions.tags?.onSelectionChange || (() => {})
					}
					selectedLists={config.bulkActions.lists?.selected || []}
					selectedTags={config.bulkActions.tags?.selected || []}
					activeTab={activeTab}
				/>
			)}

			{/* Advanced Filters Button */}
			{config.filters?.enabled && (
				<Dialog>
					<DialogTrigger asChild>
						<Button
							variant="tertiary"
							className="font-semibold px-4 text-[#3B82F6]"
						>
							<FiltersIcon />
							{__('Advanced Filters', 'quillcrm')}
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[800px]">
						<DialogHeader>
							<DialogTitle>
								<CustomDialogHeader
									title={__('Advanced Filters', 'quillcrm')}
									subtitle={__(
										'Manage your filters for better data insights',
										'quillcrm'
									)}
									icon={<GradientFilterIcon />}
								/>
							</DialogTitle>
						</DialogHeader>
						<Filters
							filters={config.filters?.currentFilters}
							onChange={(filters) => {
								config.filters?.onFiltersChange(filters);
								if (setPage) {
									setPage(1);
								}
							}}
						/>
						<DialogFooter>
							<DialogClose asChild>
								<Button
									onClick={config.filters?.onApplyFilters}
									disabled={config.filters?.isApplying}
									className="w-full"
									variant="gradient"
									size="xl"
								>
									{config.filters?.isApplying
										? __('Applying...', 'quillcrm')
										: __('Apply Filters', 'quillcrm')}
								</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* Manage Columns Dropdown */}
			{config.manageColumns?.enabled && (
				<Dialog
					open={isColumnsDialogOpen}
					onOpenChange={setIsColumnsDialogOpen}
				>
					<DialogTrigger asChild>
						<Button
							className="bg-secondary border-secondary text-white hover:bg-secondary/80 hover:text-primary-foreground"
							onClick={handleDialogOpen}
						>
							<ColumnsIcon />
							{__('Manage Columns', 'quillcrm')}
						</Button>
					</DialogTrigger>

					<DialogContent className="">
						<DialogHeader>
							<DialogTitle>
								<CustomDialogHeader
									title={__('Manage Columns', 'quillcrm')}
									subtitle={__(
										'Select Columns that you want to be added on the Table.',
										'quillcrm'
									)}
									icon={<GradientColumnsIcon />}
								/>
							</DialogTitle>
						</DialogHeader>

						<div className="mt-4 grid grid-cols-3 justify-between gap-x-5 gap-y-4">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => (
									<div
										key={column.id}
										className="flex items-center space-x-2"
									>
										<Checkbox
											id={`col-${column.id}`}
											checked={
												columnVisibility[column.id] ??
												column.getIsVisible()
											}
											onCheckedChange={(value) =>
												handleColumnToggle(
													column.id,
													!!value
												)
											}
										/>
										<label
											htmlFor={`col-${column.id}`}
											className="text-base capitalize text-[#3F4254] font-semibold"
										>
											{column.id.replace(/_/g, ' ')}
										</label>
									</div>
								))}
						</div>

						<DialogFooter className="mt-6">
							<DialogClose asChild>
								<Button
									onClick={handleSubmitColumns}
									className="w-full"
									variant="gradient"
									size="xl"
								>
									{__('Submit', 'quillcrm')}
								</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
