// 'use client';

import { __ } from '@wordpress/i18n';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@doublescale/components/ui/dialog';
import {
	CustomDialogHeader,
	FiltersIcon,
	InfiniteScrollSelect,
} from '@doublescale/components';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@doublescale/components/ui/input';
import { DateRangePicker } from '@doublescale/components/ui/date-range-picker';

interface AdvancedFiltersDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: any;
	onFiltersChange: (filters: any) => void;
	pipelines: any[];
	selectedPipelineId: number | null;
	onPipelineChange: (pipelineId: number) => void;
	priorities: any;
}

export const AdvancedFiltersDialog: React.FC<AdvancedFiltersDialogProps> = ({
	open,
	onOpenChange,
	filters,
	onFiltersChange,
	pipelines,
	selectedPipelineId,
	onPipelineChange,
	priorities,
}) => {
	const handleFilterChange = (key: string, value: any) => {
		onFiltersChange({
			...filters,
			[key]: value,
		});
	};

	const clearFilters = () => {
		onFiltersChange({
			search: '',
			ownerId: null,
			owner: null,
			expectedCloseDateRange: { from: null, to: null },
			createdDateRange: { from: null, to: null },
			valueRange: { min: null, max: null },
			status: 'all',
			priority: null,
		});
	};

	const hasActiveFilters =
		filters.search ||
		filters.ownerId ||
		filters.expectedCloseDateRange?.from ||
		filters.expectedCloseDateRange?.to ||
		filters.createdDateRange?.from ||
		filters.createdDateRange?.to ||
		filters.valueRange?.min !== null ||
		filters.valueRange?.max !== null ||
		filters.priority !== null ||
		filters.status !== 'all';

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!flex !flex-col mx-1 w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] overflow-hidden gap-4 rounded-[16px] p-4 sm:mx-auto sm:w-full sm:p-6 max-sm:!top-4 max-sm:!translate-x-[-50%] max-sm:!translate-y-0">
			<DialogHeader className="shrink-0 items-start text-left">
			 <DialogTitle className="text-left !mb-0">
						<CustomDialogHeader
							title={__('Filter', 'doublescale')}
							subtitle={__(
								'Select Groups of filters about data you want to view.',
								'doublescale'
							)}
							icon={<FiltersIcon />}
						/>
					</DialogTitle>
				</DialogHeader>
				<div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
					<div className="flex flex-col gap-6 rounded-lg border border-[#1E3A8A] p-4 sm:p-6">
					<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
						<div className="flex flex-col gap-2">
							<label className="block mb-1  font-normal text-foreground text-base">
								{__('Deal Owner', 'doublescale')}
							</label>

							<InfiniteScrollSelect
								value={filters.ownerId || undefined}
								selectedItem={filters.owner ?? undefined}
								onValueChange={(value, item) =>
									onFiltersChange({
										...filters,
										ownerId: value ? Number(value) : null,
										owner: value && item ? item : null,
									})
								}
								placeholder={__('Select All Owner', 'doublescale')}
								apiEndpoint="/doublescale/v1/user-management/users/frontend"
								getOptionLabel={(u) => u.display_name || u.name}
								getOptionValue={(u) => u.id}
								dataPath="users"
								searchParamName="search"
								apiParams={{ filter_crm_users: true }}
								perPage={10}
								className="h-10"
							/>
						</div>
						{/* Pipeline Filter */}
						<div className="flex flex-col gap-2">
							<label className="block mb-1 font-normal text-foreground text-base">
								{__('Pipeline', 'doublescale')}
							</label>

							<Select
								value={
									selectedPipelineId
										? String(selectedPipelineId)
										: ''
								}
								onValueChange={(value) =>
									onPipelineChange(Number(value))
								}
							>
								<SelectTrigger className=" h-10 !shadow-none rounded-md border border-[#E1E3EA] !text-foreground font-sm text-base tracking-[-.5px]">
									<SelectValue
										placeholder={__(
											'Select Stage',
											'doublescale'
										)}
									/>
								</SelectTrigger>

								<SelectContent>
									{pipelines.length > 0 ? (
										pipelines.map((pipeline) => (
											<SelectItem
												key={pipeline.id}
												value={String(pipeline.id)}
											>
												{pipeline.name}
											</SelectItem>
										))
									) : (
										<div className="px-3 py-2 text-sm text-gray-500">
											{__(
												'No stages available',
												'doublescale'
											)}
										</div>
									)}
								</SelectContent>
							</Select>
						</div>
						{/* Expected Close Date */}
						<div className="flex flex-col gap-2">
							<label className="block mb-1 font-normal text-foreground text-base">
								{__('Expected Close Date', 'doublescale')}
							</label>
							<DateRangePicker
								value={
									filters.expectedCloseDateRange || {
										from: null,
										to: null,
									}
								}
								onChange={(range) =>
									handleFilterChange(
										'expectedCloseDateRange',
										range
									)
								}
								placeholder="From - To"
								className="w-full h-10 !shadow-none rounded-md border border-[#E1E3EA] !text-foreground bg-white !font-normal !text-base tracking-[-.5px]"
							/>
						</div>
						{/* Created Date */}
						<div className="flex flex-col gap-2">
							<label className="block mb-1 font-normal text-foreground text-base">
								{__('Created Date', 'doublescale')}
							</label>
							<DateRangePicker
								value={
									filters.createdDateRange || {
										from: null,
										to: null,
									}
								}
								onChange={(range) =>
									handleFilterChange(
										'createdDateRange',
										range
									)
								}
								placeholder="From - To"
								className="w-full h-10 !shadow-none rounded-md border border-[#E1E3EA] !text-foreground bg-white !font-normal !text-base tracking-[-.5px]"
							/>
						</div>
						{/* Priority */}
						<div className="flex flex-col gap-2">
							<label className="block mb-1 font-normal text-foreground text-base">
								{__('Priority', 'doublescale')}
							</label>

							<Select
								value={filters.priority || '__all__'}
								onValueChange={(value) =>
									handleFilterChange(
										'priority',
										value === '__all__' ? null : value
									)
								}
							>
								<SelectTrigger className=" h-10 rounded-md border border-[#E1E3EA] !text-foreground font-sm text-base tracking-[-.5px]">
									<SelectValue
										placeholder={__(
											'All priorities',
											'doublescale'
										)}
									/>
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="__all__">
										{__('All priorities', 'doublescale')}
									</SelectItem>
									{Object.keys(priorities).map((key) => (
										<SelectItem key={key} value={key}>
											{priorities[key].label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{/* Deal Value Range */}
						<div className="flex flex-col gap-2">
							<label className="block mb-1 font-normal text-foreground text-base">
								{__('Deal Value Range', 'doublescale')}
							</label>
							<div className=" flex gap-2">
								<Input
									type="number"
									value={
										filters.valueRange?.min !== null
											? filters.valueRange?.min
											: ''
									}
									onChange={(e) =>
										handleFilterChange('valueRange', {
											...filters.valueRange,
											min: e.target.value
												? Number(e.target.value)
												: null,
										})
									}
									className="flex-1 !rounded-md !border-border !shadow-none placeholder:text-[#A1A5B7] text-foreground font-sm text-base tracking-[-.5px]"
									placeholder={__('Min', 'doublescale')}
								/>
								<Input
									type="number"
									value={
										filters.valueRange?.max !== null
											? filters.valueRange?.max
											: ''
									}
									onChange={(e) =>
										handleFilterChange('valueRange', {
											...filters.valueRange,
											max: e.target.value
												? Number(e.target.value)
												: null,
										})
									}
									className="flex-1 !rounded-md !border-border !shadow-none placeholder:text-[#A1A5B7] text-foreground font-sm text-base tracking-[-.5px]"
									placeholder={__('Max', 'doublescale')}
								/>
							</div>
						</div>
					</div>
					{/* Clear Filters */}
					<div className="flex justify-start">
						<Button
							className={`rounded-md border px-4 py-2 !shadow-none text-base tracking-[-.5px] hover:bg-white ${
								hasActiveFilters
									? 'border-[#E13B3B] bg-white !text-[#E13B3B]'
									: 'border-[#777] bg-white !text-muted-foreground'
							}`}
							onClick={clearFilters}
							title={__('Clear all filters', 'doublescale')}
						>
							{__('Clear Filter', 'doublescale')}
						</Button>
					</div>
					</div>
				</div>
				<div className="flex shrink-0 justify-end pt-2">
					<Button
						variant="default"
						onClick={() => {
							onFiltersChange(filters);
							onOpenChange(false);
						}}
						title={__('Apply Filters', 'doublescale')}
					>
						{__('Apply Filters', 'doublescale')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
