/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { Filter as FilterType } from '@doublescale/client';
import { getFilterBySlug } from '@doublescale/utils';
import ConfigAPI from '@doublescale/config';
import FilterItem from '../filter';
import { PlusIcon, InfoIcon } from '@doublescale/components';

interface FiltersProps {
	filters: FilterType[];
	onChange: (filters: FilterType[]) => void;
}

const Filters: React.FC<FiltersProps> = ({ filters, onChange }) => {
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [selectedFilter, setSelectedFilter] = useState<string>('');

	const filtersGroups = ConfigAPI.getFiltersGroups();

	// Memoized options to prevent unnecessary re-renders
	const groupOptions = useMemo(
		() =>
			map(filtersGroups, (group, key) => ({
				value: key,
				label: group.name,
			})),
		[filtersGroups]
	);

	const filterOptions = useMemo(
		() =>
			selectedGroup
				? map(filtersGroups[selectedGroup].filters, (filter, key) => ({
						value: key,
						label: filter.name,
					}))
				: [],
		[filtersGroups, selectedGroup]
	);

	// Event handlers
	const handleAddFilter = useCallback(() => {
		if (!selectedGroup || !selectedFilter) return;

		const newFilter: FilterType = {
			group: selectedGroup,
			filter: selectedFilter,
			operator: 'is',
			value: '',
		};

		onChange([...filters, newFilter]);
		setSelectedGroup('');
		setSelectedFilter('');
	}, [selectedGroup, selectedFilter, filters, onChange]);

	const handleRemoveFilter = useCallback(
		(index: number) => {
			const newFilters = [...filters];
			newFilters.splice(index, 1);
			onChange(newFilters);
		},
		[filters, onChange]
	);

	const handleFilterChange = useCallback(
		(index: number, key: string, value: any) => {
			const newFilters = [...filters];
			newFilters[index] = {
				...newFilters[index],
				[key]: value,
			};
			onChange(newFilters);
		},
		[filters, onChange]
	);

	const handleGroupChange = useCallback((value: string) => {
		setSelectedGroup(value);
		setSelectedFilter('');
	}, []);

	const handleFilterSelectChange = useCallback((value: string) => {
		setSelectedFilter(value);
	}, []);

	return (
		<Card>
			<CardContent className="p-5">
				{/* Header with Add Filter */}
				<div className="flex items-center justify-between gap-3 pb-3">
					<h3 className="font-bold text-lg w-[15%]">
						{__('And', 'doublescale')}
					</h3>

					<div className="w-[85%] flex items-center gap-3">
						<Select
							value={selectedGroup}
							onValueChange={handleGroupChange}
						>
							<SelectTrigger className="border-gray-300 focus:border-[#3B82F6] focus:ring-[#3B82F6]">
								<SelectValue
									placeholder={__('Select group', 'doublescale')}
								/>
							</SelectTrigger>
							<SelectContent>
								{groupOptions.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={selectedFilter}
							onValueChange={handleFilterSelectChange}
							disabled={!selectedGroup}
						>
							<SelectTrigger className="border-gray-300 focus:border-[#3B82F6] focus:ring-[#3B82F6] disabled:opacity-50">
								<SelectValue
									placeholder={__(
										'Select filter',
										'doublescale'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{filterOptions.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div
						onClick={handleAddFilter}
						className={`cursor-pointer ${!selectedFilter ? 'opacity-50 cursor-not-allowed' : ''} text-primary`}
					>
						<PlusIcon width={20} height={20} />
					</div>
				</div>

				{/* Divider */}
				<div className="text-primary flex items-center gap-2 font-bold">
					<InfoIcon />
					{__(
						'This add new filter to narrow down your contact based on different prosperities. is required by default',
						'doublescale'
					)}
				</div>

				{/* Active Filters */}
				<div className="space-y-2 py-6">
					{filters.length > 0 ? (
						<div className="space-y-2">
							{filters.map((filter, index) => {
								const filterSettings = getFilterBySlug(
									filter.filter,
									filter.group
								);
								return (
									<FilterItem
										key={`${filter.group}-${filter.filter}-${index}`}
										filterSettings={filterSettings}
										filter={filter}
										onChange={(key, value) =>
											handleFilterChange(
												index,
												key,
												value
											)
										}
										onRemove={() =>
											handleRemoveFilter(index)
										}
									/>
								);
							})}
						</div>
					) : (
						<p className="text-sm text-center text-muted-foreground">
							{__('No filters applied', 'doublescale')}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

export default Filters;
