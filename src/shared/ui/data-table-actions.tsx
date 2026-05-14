/**
 * wordpress depnedencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

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
	CustomDialogHeader,
	GradientFilterIcon,
	GradientColumnsIcon,
	DeleteIcon,
} from '@doublescale/components';
import ProAutomationModal from '@doublescale/components/pro-automation-modal';
import { DataTableConfig } from '@doublescale/client';
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
import { CampaignFilters } from '@/components/campaign-filters';
import RulesBuilder from '@/components/rules-builder';
import type { RuleItem } from '@/components/rules-builder';
import { Delete, getFilteredRulesGroups, getInitialRule } from '@/utils';
import { Lock, Trash2 } from 'lucide-react';

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
	const [isCampaignFiltersOpen, setIsCampaignFiltersOpen] = useState(false);
	const [tempCampaignFilters, setTempCampaignFilters] = useState<any>(null);
	const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
	const [tempRules, setTempRules] = useState<Array<Array<RuleItem>>>([]);
	const [showProModal, setShowProModal] = useState(false);

	// Check if Pro is active for conditional sections
	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	// Rules builder setup (non-automation context)
	const rulesGroups = getFilteredRulesGroups(false);

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

	// Initialize temp filters when dialog opens
	const handleCampaignFiltersDialogOpen = () => {
		if (config.campaignFilters) {
			setTempCampaignFilters({ ...config.campaignFilters.filters });
		}
		setIsCampaignFiltersOpen(true);
	};

	// Handle campaign filters - apply and close dialog
	const handleApplyCampaignFilters = () => {
		if (config.campaignFilters && tempCampaignFilters) {
			config.campaignFilters.onFiltersChange(tempCampaignFilters);
		}
		setIsCampaignFiltersOpen(false);
		if (setPage) {
			setPage(1);
		}
	};

	// Handle clear temp filters
	const handleClearTempFilters = () => {
		setTempCampaignFilters({
			status: 'all',
			type: 'all',
			createDate: { from: null, to: null },
			updatedAt: { from: null, to: null },
		});
	};

	// Initialize temp rules when advanced filters dialog opens
	const handleAdvancedFiltersDialogOpen = () => {
		// Check if Pro is active before opening advanced filters
		if (!isProActive) {
			setShowProModal(true);
			return;
		}

		if (config.filters) {
			const currentFilters = config.filters.currentFilters || [];

			// If filters are already a nested array (OR groups -> AND conditions), keep them as-is
			if (
				Array.isArray(currentFilters) &&
				Array.isArray(currentFilters[0])
			) {
				setTempRules(currentFilters as Array<Array<RuleItem>>);
			} else {
				// Fallback: initialize with a single default rule if shape is unknown/legacy
				setTempRules([[getInitialRule(rulesGroups)]]);
			}
		} else {
			// Initialize with default rule if no filters config
			setTempRules([[getInitialRule(rulesGroups)]]);
		}
		setIsAdvancedFiltersOpen(true);
	};

	// Handle advanced filters - apply and close dialog
	const handleApplyAdvancedFilters = () => {
		if (config.filters) {
			// Store rules directly as nested array, no mapping/flattening
			config.filters.onFiltersChange(tempRules as any);
			if (setPage) {
				setPage(1);
			}
		}
		setIsAdvancedFiltersOpen(false);
	};

	return (
		<div className="flex gap-6 items-center">
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
						(() => { })
					}
					setSelectedTags={
						config.bulkActions.tags?.onSelectionChange || (() => { })
					}
					selectedLists={config.bulkActions.lists?.selected || []}
					selectedTags={config.bulkActions.tags?.selected || []}
					activeTab={activeTab}
				/>
			)}

			{/* Campaign Filters Button */}
			{(activeTab === 'email' || activeTab === 'sms') &&
				config.campaignFilters && (
					<Dialog
						open={isCampaignFiltersOpen}
						onOpenChange={(open) => {
							if (open) {
								handleCampaignFiltersDialogOpen();
							} else {
								setIsCampaignFiltersOpen(false);
							}
						}}
					>
						<DialogTrigger asChild>
							<Button
								variant="outline"
								onClick={handleCampaignFiltersDialogOpen}

							>
								<FiltersIcon width={32} height={32} />
								{__('Filters', 'doublescale')}
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[800px]">
							<DialogHeader>
								<DialogTitle>
									<CustomDialogHeader
										title={__('Filter', 'doublescale')}
										subtitle={__(
											'Select Groups of filters about data you want to view.',
											'doublescale'
										)}
										icon={<GradientFilterIcon />}
									/>
								</DialogTitle>
							</DialogHeader>
							{tempCampaignFilters && (
								<CampaignFilters
									filters={tempCampaignFilters}
									onChange={setTempCampaignFilters}
									activeTab={activeTab}
								/>
							)}
							<DialogFooter className="mt-4 flex flex-row flex-wrap items-center justify-end gap-3 sm:space-x-0">
								<Button
									type="button"
									variant="outline"
									onClick={handleClearTempFilters}
									className="h-10 rounded-lg border-destructive text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive"
								>
									<DeleteIcon width={16} height={16} />
									{__('Clear Filters', 'doublescale')}
								</Button>
								<Button
									type="button"
									onClick={handleApplyCampaignFilters}
									variant="default"

								>
									{__('Apply Filters', 'doublescale')}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}

			{/* Advanced Filters Button */}
			{config.filters?.enabled && (
				<>
					<Dialog
						open={isAdvancedFiltersOpen}
						onOpenChange={(open) => {
							if (open) {
								handleAdvancedFiltersDialogOpen();
							} else {
								setIsAdvancedFiltersOpen(false);
							}
						}}
					>
						<DialogTrigger asChild>
							<Button
								variant="outline"
								// className={`font-semibold px-4 text-[#3B82F6] ${!isProActive ? 'relative' : ''
								// 	}`}
								onClick={handleAdvancedFiltersDialogOpen}
							>
								<FiltersIcon />
								{__('Advanced Filters', 'doublescale')}
								{!isProActive && (
									<Lock className="h-4 w-4 text-orange-500 ml-2" />
								)}
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-[1100px] max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>
									<CustomDialogHeader
										title={__(
											'Advanced Filters',
											'doublescale'
										)}
										subtitle={__(
											'Manage your filters for better data insights',
											'doublescale'
										)}
										icon={<GradientFilterIcon />}
									/>
								</DialogTitle>
							</DialogHeader>
							{tempRules.length > 0 && (
								<RulesBuilder
									rules={tempRules}
									onChange={setTempRules}
									rulesGroups={rulesGroups}
								/>
							)}
							<DialogFooter>
								<Button
									onClick={handleApplyAdvancedFilters}
									disabled={config.filters?.isApplying}
									className="w-full"
									variant="outline"

								>
									{config.filters?.isApplying
										? __('Applying...', 'doublescale')
										: __('Apply Filters', 'doublescale')}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* Pro Feature Modal */}
					{showProModal && (
						<ProAutomationModal
							visible={showProModal}

							onClose={() => setShowProModal(false)}
							featureName={__('Advanced Filters', 'doublescale')}
						/>
					)}
				</>
			)}

			{/* Manage Columns Dropdown */}
			{config.manageColumns?.enabled && (
				<Dialog
					open={isColumnsDialogOpen}
					onOpenChange={setIsColumnsDialogOpen}
				>
					<DialogTrigger asChild>
						<Button
							variant="secondaryDeepBlue"
							onClick={handleDialogOpen}
						>
							<ColumnsIcon />
							{__('Manage Columns', 'doublescale')}
						</Button>
					</DialogTrigger>

					<DialogContent className="">
						<DialogHeader>
							<DialogTitle>
								<CustomDialogHeader
									title={__('Manage Columns', 'doublescale')}
									subtitle={__(
										'Select Columns that you want to be added on the Table.',
										'doublescale'
									)}
									icon={<GradientColumnsIcon />}
								/>
							</DialogTitle>
						</DialogHeader>

						<div className="mt-4 grid grid-cols-2 justify-between gap-x-5 gap-y-4">
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
									{__('Submit', 'doublescale')}
								</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
