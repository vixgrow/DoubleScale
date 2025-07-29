/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import type { Filter as FilterType } from '@quillcrm/client';
import { getFilterBySlug } from '@quillcrm/utils';
import ConfigAPI from '@quillcrm/config';
import type { FiltersGroup } from '@quillcrm/config';
import FilterItem from '../filter';
import { PlusIcon } from '@quillcrm/components';
import './style.scss';

interface FiltersProps {
	filters: FilterType[];
	onChange: (filters: FilterType[]) => void;
}

interface SelectOption {
	value: string;
	label: string;
}

const Filters: React.FC<FiltersProps> = ({ filters, onChange }) => {
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [selectedFilter, setSelectedFilter] = useState<string>('');

	const filtersGroups = ConfigAPI.getFiltersGroups();

	// Memoized options to prevent unnecessary re-renders
	const groupOptions = useMemo<SelectOption[]>(
		() =>
			map(filtersGroups, (group, key) => ({
				value: key,
				label: group.name,
			})),
		[filtersGroups]
	);

	const filterOptions = useMemo<SelectOption[]>(
		() =>
			selectedGroup
				? map(filtersGroups[selectedGroup].filters, (filter, key) => ({
						value: key,
						label: filter.name,
					}))
				: [],
		[filtersGroups, selectedGroup]
	);

	// Memoized select styles to prevent recreation on every render
	const selectStyles = useMemo(
		() => ({
			control: (base: any) => ({
				...base,
				width: '250px',
				height: '48px',
				minHeight: '48px',
				borderColor: '#D3D4D6',
				borderRadius: '6px',
			}),
			indicatorsContainer: (base: any) => ({
				...base,
				height: '48px',
			}),
			valueContainer: (base: any) => ({
				...base,
				height: '48px',
				padding: '0 8px',
			}),
			singleValue: (base: any) => ({
				...base,
				lineHeight: '48px',
			}),
			menu: (base: any) => ({
				...base,
				color: 'black',
			}),
		}),
		[]
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

	const handleGroupChange = useCallback(
		(selectedOption: SelectOption | null) => {
			const value = selectedOption?.value || '';
			setSelectedGroup(value);
			setSelectedFilter('');
		},
		[]
	);

	const handleFilterSelectChange = useCallback(
		(selectedOption: SelectOption | null) => {
			const value = selectedOption?.value || '';
			setSelectedFilter(value);
		},
		[]
	);

	// Helper functions
	const getSelectedGroupOption = () =>
		groupOptions.find((option) => option.value === selectedGroup) || null;

	const getSelectedFilterOption = () =>
		filterOptions.find((option) => option.value === selectedFilter) || null;

	return (
		<div className="filters-container">
			{/* Header with Add Filter */}
			<div className="filters-header">
				<h3 className="filters-title">
					{__('Select Group', 'quillcrm')}
				</h3>

				<Select
					value={getSelectedGroupOption()}
					onChange={handleGroupChange}
					options={groupOptions}
					placeholder={__('Select group', 'quillcrm')}
					isClearable
					styles={selectStyles}
					className="group-select"
					classNamePrefix="react-select"
				/>

				<Select
					value={getSelectedFilterOption()}
					onChange={handleFilterSelectChange}
					options={filterOptions}
					placeholder={__('Select filter', 'quillcrm')}
					isDisabled={!selectedGroup}
					isClearable
					styles={selectStyles}
					className="filter-select"
					classNamePrefix="react-select"
				/>

				<Button
					size="icon"
					onClick={handleAddFilter}
					disabled={!selectedFilter}
					className="add-filter-btn"
				>
					<PlusIcon />
				</Button>
			</div>

			{/* Divider */}
			<div className="filters-divider" />

			{/* Active Filters */}
			<div className="active-filters">
				{filters.length > 0 ? (
					<div className="filters-list">
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
										handleFilterChange(index, key, value)
									}
									onRemove={() => handleRemoveFilter(index)}
								/>
							);
						})}
					</div>
				) : (
					<p className="no-filters-message">
						{__('No filters applied', 'quillcrm')}
					</p>
				)}
			</div>
		</div>
	);
};

export default Filters;
