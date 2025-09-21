/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Info, Trash2, Plus } from 'lucide-react';
import type { Filter as FilterType } from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
import './style.scss';

interface FiltersProps {
	filters: FilterType[];
	onChange: (filters: FilterType[]) => void;
}

interface FilterGroup {
	id: string;
	type: 'and' | 'or';
	filters: FilterType[];
}

interface FilterField {
	label: string;
	value: string;
}

const Filters: React.FC<FiltersProps> = ({ filters, onChange }) => {
	// Filter groups (AND/OR)
	const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
		{ id: 'and-group', type: 'and', filters: [] },
		{ id: 'or-group', type: 'or', filters: [] },
	]);

	// Temporary filter selection state (for the selection dropdowns)
	const [selectedGroupField, setSelectedGroupField] =
		useState<string>('contact');
	const [selectedFilter, setSelectedFilter] = useState<string>('');

	// Get filter groups configuration
	const filtersGroups = ConfigAPI.getFiltersGroups();

	// Initialize filters from props
	useEffect(() => {
		if (filters.length > 0 && filterGroups[0].filters.length === 0) {
			setFilterGroups([
				{ ...filterGroups[0], filters: [...filters] },
				{ ...filterGroups[1], filters: [] },
			]);
		}
	}, [filters, filterGroups]);

	// Get available filter fields based on the selected group
	const getFilterFields = (groupSlug: string): FilterField[] => {
		if (!filtersGroups[groupSlug]?.filters) return [];

		return Object.entries(filtersGroups[groupSlug].filters).map(
			([key, filter]: [string, any]) => ({
				value: key,
				label: filter.name || key,
			})
		);
	};

	// Get filter options (possible operators)
	const getFilterOperators = (): FilterField[] => {
		return [
			{ value: 'is', label: __('Is', 'quillcrm') },
			{ value: 'is_not', label: __('Is not', 'quillcrm') },
			{ value: 'includes', label: __('Includes', 'quillcrm') },
			{ value: 'not_includes', label: __('Not includes', 'quillcrm') },
		];
	};

	// Event handlers
	const handleAddFilter = useCallback(
		(groupId: string) => {
			if (!selectedGroupField || !selectedFilter) return;

			const groupIndex = filterGroups.findIndex((g) => g.id === groupId);
			if (groupIndex === -1) return;

			const newFilter: FilterType = {
				group: selectedGroupField,
				filter: selectedFilter,
				operator: 'includes',
				value: '',
			};

			const updatedGroups = [...filterGroups];
			updatedGroups[groupIndex] = {
				...updatedGroups[groupIndex],
				filters: [...updatedGroups[groupIndex].filters, newFilter],
			};

			setFilterGroups(updatedGroups);
			onChange(updatedGroups.flatMap((g) => g.filters));

			// Reset selection after adding
			setSelectedFilter('');
		},
		[filterGroups, onChange, selectedGroupField, selectedFilter]
	);

	const handleRemoveFilter = useCallback(
		(groupId: string, filterIndex: number) => {
			const groupIndex = filterGroups.findIndex((g) => g.id === groupId);
			if (groupIndex === -1) return;

			const updatedGroups = [...filterGroups];
			updatedGroups[groupIndex].filters = updatedGroups[
				groupIndex
			].filters.filter((_, i) => i !== filterIndex);

			setFilterGroups(updatedGroups);
			onChange(updatedGroups.flatMap((g) => g.filters));
		},
		[filterGroups, onChange]
	);

	const handleFilterChange = useCallback(
		(
			groupId: string,
			filterIndex: number,
			key: keyof FilterType,
			value: any
		) => {
			const groupIndex = filterGroups.findIndex((g) => g.id === groupId);
			if (groupIndex === -1) return;

			const updatedGroups = [...filterGroups];
			updatedGroups[groupIndex].filters[filterIndex] = {
				...updatedGroups[groupIndex].filters[filterIndex],
				[key]: value,
			};

			setFilterGroups(updatedGroups);
			onChange(updatedGroups.flatMap((g) => g.filters));
		},
		[filterGroups, onChange]
	);

	const handleClearFilters = useCallback(() => {
		const emptyGroups = filterGroups.map((g) => ({ ...g, filters: [] }));
		setFilterGroups(emptyGroups);
		onChange([]);
	}, [filterGroups, onChange]);

	return (
		<div className="filters-container">
			{/* Header */}
			<h3 className="text-lg font-semibold">
				{__('Select Custom Contacts By Advanced Filters', 'quillcrm')}
			</h3>
			<p className="text-sm text-muted-foreground mb-6">
				{__(
					'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.',
					'quillcrm'
				)}
			</p>

			{/* Filter Groups */}
			{filterGroups.map((group) => (
				<div
					key={group.id}
					className="mb-6 border rounded-md shadow-sm"
				>
					{/* Group Header with Dropdowns */}
					<div className="p-4 border-b">
						<div className="flex items-center justify-between mb-2">
							<div className="font-medium">
								{group.type === 'and'
									? __('And', 'quillcrm')
									: __('Or', 'quillcrm')}
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="text-blue-500"
								onClick={() => handleAddFilter(group.id)}
								disabled={
									!selectedGroupField || !selectedFilter
								}
							>
								<Plus className="h-5 w-5" />
							</Button>
						</div>

						<div className="flex gap-2">
							{/* Group Field Selector */}
							<Select
								value={selectedGroupField}
								onValueChange={setSelectedGroupField}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue
										placeholder={__('Contact', 'quillcrm')}
									/>
								</SelectTrigger>
								<SelectContent>
									{Object.entries(filtersGroups).map(
										([key, g]: [string, any]) => (
											<SelectItem key={key} value={key}>
												{g.name}
											</SelectItem>
										)
									)}
								</SelectContent>
							</Select>

							{/* Filter Field Selector */}
							<Select
								value={selectedFilter}
								onValueChange={setSelectedFilter}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue
										placeholder={__(
											'General Properties',
											'quillcrm'
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{getFilterFields(selectedGroupField).map(
										(field) => (
											<SelectItem
												key={field.value}
												value={field.value}
											>
												{field.label}
											</SelectItem>
										)
									)}
								</SelectContent>
							</Select>
						</div>

						{/* Info Message */}
						{group.filters.length === 0 && group.type === 'and' && (
							<div className="flex items-center text-xs text-blue-600 mt-2">
								<Info className="h-3 w-3 mr-1" />
								<span>
									{__(
										'This Add New Filter To Narrow Down Your Contact Based On Different Prosperities. Is Required By Default',
										'quillcrm'
									)}
								</span>
							</div>
						)}
					</div>

					{/* Active Filters */}
					<div className="p-4 space-y-3">
						{group.filters.map((filter, filterIndex) => (
							<div
								key={`${group.id}-${filter.filter}-${filterIndex}`}
								className="flex items-center gap-2"
							>
								{/* Field Label */}
								<div className="w-24 text-sm">
									{filterIndex === 0 && group.type === 'and'
										? __('City', 'quillcrm')
										: filterIndex === 1 &&
											  group.type === 'and'
											? __('Last Name', 'quillcrm')
											: group.type === 'or'
												? __('Lists', 'quillcrm')
												: filtersGroups[filter.group]
														?.filters[filter.filter]
														?.name || filter.filter}
								</div>

								{/* Operator */}
								<div className="w-[180px]">
									<Select
										value={filter.operator}
										onValueChange={(value) =>
											handleFilterChange(
												group.id,
												filterIndex,
												'operator',
												value
											)
										}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={__(
													'Includes',
													'quillcrm'
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{getFilterOperators().map((op) => (
												<SelectItem
													key={op.value}
													value={op.value}
												>
													{op.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Value Input */}
								<div className="flex-1">
									<input
										type="text"
										value={filter.value || ''}
										onChange={(e) =>
											handleFilterChange(
												group.id,
												filterIndex,
												'value',
												e.target.value
											)
										}
										placeholder={
											group.type === 'and' &&
											filterIndex === 0
												? 'New York'
												: group.type === 'and' &&
													  filterIndex === 1
													? 'David'
													: group.type === 'or'
														? 'Campaign1'
														: ''
										}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									/>
								</div>

								{/* Delete Button */}
								<Button
									variant="ghost"
									size="icon"
									onClick={() =>
										handleRemoveFilter(
											group.id,
											filterIndex
										)
									}
									className="text-red-500"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				</div>
			))}

			{/* Action buttons */}
			<div className="flex gap-3 mt-6">
				<Button className="bg-blue-700 hover:bg-blue-800">
					{__('Filter', 'quillcrm')}
				</Button>
				<Button variant="outline" onClick={handleClearFilters}>
					{__('Clear Filters', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default Filters;
