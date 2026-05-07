// 'use client';

import { useState, useEffect, useMemo } from 'react';
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
			<DialogContent className="w-full max-w-2xl max-h-[80vh] my-2 sm:mx-auto p-6 rounded-[16px] pipline-content">
				<DialogHeader>
					<DialogTitle>
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
				<div className=" flex border flex-col border-[#1E3A8A] rounded-[8px] p-6  gap-6">
					<div className=" w-full grid grid-cols-1 md:grid-cols-2 gap-6 ">
						<div className="flex flex-col gap-2">
							<label className="block mb-1  font-normal text-[#09090B] text-base">
								{__('Deal Owner', 'doublescale')}
							</label>

							<InfiniteScrollSelect
								value={filters.ownerId || undefined}
								onValueChange={(value) =>
									handleFilterChange(
										'ownerId',
										value ? Number(value) : null
									)
								}
								placeholder={__('Select All Owner', 'doublescale')}
								apiEndpoint="/qc/v1/user-management/users/frontend"
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
							<label className="block mb-1 font-normal text-[#09090B] text-base">
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
								<SelectTrigger className=" h-10 !shadow-none rounded-md border border-[#E1E3EA] !text-[#09090B] font-sm text-base tracking-[-.5px]">
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
							<label className="block mb-1 font-normal text-[#09090B] text-base">
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
								className="w-full h-10 !shadow-none rounded-md border border-[#E1E3EA] !text-[#09090B] bg-white !font-normal !text-base tracking-[-.5px]"
							/>
						</div>
						{/* Created Date */}
						<div className="flex flex-col gap-2">
							<label className="block mb-1 font-normal text-[#09090B] text-base">
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
								className="w-full h-10 !shadow-none rounded-md border border-[#E1E3EA] !text-[#09090B] bg-white !font-normal !text-base tracking-[-.5px]"
							/>
						</div>
						{/* Priority */}
						<div className="flex flex-col gap-2">
							<label className="block mb-1 font-normal text-[#09090B] text-base">
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
								<SelectTrigger className=" h-10 rounded-md border border-[#E1E3EA] !text-[#09090B] font-sm text-base tracking-[-.5px]">
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
							<label className="block mb-1 font-normal text-[#09090B] text-base">
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
									className="flex-1 !shadow-none placeholder:text-[#A1A5B7] text-[#09090B] font-sm text-base tracking-[-.5px]"
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
									className="flex-1 !shadow-none placeholder:text-[#A1A5B7] text-[#09090B] font-sm text-base tracking-[-.5px]"
									placeholder={__('Max', 'doublescale')}
								/>
							</div>
						</div>
					</div>
					{/* Clear Filters */}
					<div className=" flex justify-start">
						<Button
							className={`py-2 px-4 rounded-md border hover:bg-white !shadow-none font-sm text-base tracking-[-.5px] ${
								hasActiveFilters
									? '!text-[#E13B3B] !border-[#E13B3B] bg-white' 
									: '!text-[#777] !border-[#777] bg-white'
							}`}
							onClick={clearFilters}
							title={__('Clear all filters', 'doublescale')}
						>
							{__('Clear Filter', 'doublescale')}
						</Button>
					</div>
				</div>
				{/*Apply filter */}
				<div className="my-2">
					<Button
						className=" w-full bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white flex h-12 px-8  gap-1 rounded-md text-base font-normal tracking-tight"
						onClick={() => {
							onFiltersChange(filters);
							// setIsFilterExpanded(false);
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
