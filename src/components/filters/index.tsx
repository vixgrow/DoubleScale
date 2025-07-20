/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';
/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import type { Filter as FilterType } from '@quillcrm/client';
import { getFilterBySlug } from '@quillcrm/utils';
import ConfigAPI from '@quillcrm/config';
import type { FiltersGroup } from '@quillcrm/config';
import FilterItem from '../filter';
import {
	PlusIcon,
} from '@quillcrm/components';

interface FiltersProps {
	filters: FilterType[];
	onChange: (filters: FilterType[]) => void;
}

const Filters: React.FC<FiltersProps> = ({
	filters,
	onChange,
}) => {
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [selectedFilter, setSelectedFilter] = useState<string>('');
	const filtersGroups = ConfigAPI.getFiltersGroups();

	const handleAddFilter = () => {
		if (!selectedGroup || !selectedFilter) return;

		const newFilters = [...filters];
		newFilters.push({
			group: selectedGroup,
			filter: selectedFilter,
			operator: 'is',
			value: '',
		});
		onChange(newFilters);
		setSelectedGroup('');
		setSelectedFilter('');
	};

	const handleRemoveFilter = (index: number) => {
		const newFilters = [...filters];
		newFilters.splice(index, 1);
		onChange(newFilters);
	};

	const handleFilterChange = (index: number, key: string, value: any) => {
		const newFilters = [...filters];
		newFilters[index] = {
			...newFilters[index],
			[key]: value,
		};
		onChange(newFilters);
	};

	return (
		<div
			className="space-y-3 mt-4"
			style={{
				borderWidth: '1px',
				borderStyle: 'solid',
				borderImage: 'linear-gradient(to right, #1E3A8A, #3B82F6) 1',
				borderRadius: '0.5rem',
			}}
		>
			{/* Header with Add Filter */}
			<div className="flex items-center gap-3 justify-center py-6">
				<h3 className="text-sm font-bold text-[#3B82F6]">
					{__('Select Group', 'quillcrm')}
				</h3>
				<Select
					value={selectedGroup}
					onValueChange={(value) => {
						setSelectedGroup(value);
						setSelectedFilter('');
					}}
				>
					<SelectTrigger className="w-[250px] h-[48px] border-[#D3D4D6]">
						<SelectValue
							placeholder={__('Select group', 'quillcrm')}
						/>
					</SelectTrigger>
					<SelectContent>
						{map(filtersGroups, (group, key) => (
							<SelectItem key={key} value={key}>
								{group.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={selectedFilter}
					onValueChange={setSelectedFilter}
					disabled={!selectedGroup}
				>
					<SelectTrigger className="w-[250px] h-[48px] border-[#D3D4D6]">
						<SelectValue
							placeholder={__('Select filter', 'quillcrm')}
						/>
					</SelectTrigger>
					<SelectContent>
						{selectedGroup &&
							map(
								filtersGroups[selectedGroup].filters,
								(filter, key) => (
									<SelectItem key={key} value={key}>
										{filter.name}
									</SelectItem>
								)
							)}
					</SelectContent>
				</Select>

				<Button
					size="icon"
					onClick={handleAddFilter}
					disabled={!selectedFilter}
					className="bg-secondary"
				>
					<PlusIcon />
				</Button>
			</div>

			{/* Divider */}
			<div
				style={{
					borderTopWidth: '2px',
					borderTopStyle: 'dashed',
					borderImage:
						'linear-gradient(to right, #1E3A8A, #3B82F6) 1',
				}}
			></div>

			{/* Active Filters */}
			<div className="space-y-2 py-6">
				{filters.length > 0 ? (
					<div className="space-y-2">
						{map(filters, (filter: FilterType, index) => {
							const filterSettings = getFilterBySlug(
								filter.filter,
								filter.group
							);
							return (
								<FilterItem
									key={index}
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
					<p className="text-sm text-center text-muted-foreground">
						{__('No filters applied', 'quillcrm')}
					</p>
				)}
			</div>
		</div>
	);
};

export default Filters;
