/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import { UserService } from '../../../../../services/user-service';


import SearchIcon from '@quillcrm/components/icons/search';


import {  FiltersIcon } from '@quillcrm/components';


import { AdvancedFiltersDialog } from '@quillcrm/components/advancedFilterDialog/AdvancedFilterDialog';
import { Filters, Pipeline } from '../../types';

interface PipelineFiltersProps {
	pipelines: Pipeline[];
	selectedPipelineId: number | null;
	onPipelineChange: (pipelineId: number) => void;
	filters: Filters;
	onFiltersChange: (filters: Filters) => void;
}

export const PipelineFilters: React.FC<PipelineFiltersProps> = ({
	pipelines,
	selectedPipelineId,
	onPipelineChange,
	filters,
	onFiltersChange,
}) => {
	const [isFilterExpanded, setIsFilterExpanded] = useState(false);

	const priorities = useMemo(() => {
		return ConfigAPI.getDealPriorities();
	}, []);

	const [owners, setOwners] = useState<any[]>([]);
	const [ownersLoading, setOwnersLoading] = useState(false);

	useEffect(() => {
		setOwnersLoading(true);
		UserService.getUsersForSelect().then((owners) => {
			setOwners(owners);
			setOwnersLoading(false);
		});
	}, []);

	const handleFilterChange = (key: keyof Filters, value: any) => {
		onFiltersChange({
			...filters,
			[key]: value,
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
		filters.priority !== null;

	return (
		<div className="pipeline-filters mr-2 mb-6 px-4 py-5 border border-[#DEE1E6] rounded-[8px] bg-[#fff] overflow-hidden">
			{/* Main Filter Bar */}
			<div className="filter-bar w-full flex  gap-4">
				{/* Search */}
				<div className="search-input relative w-full flex-1">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
						<SearchIcon className="w-5 h-5" />
					</span>

					<input
						type="text"
						placeholder={__('Search deals...', 'quillcrm')}
						value={filters.search}
						onChange={(e) =>
							handleFilterChange('search', e.target.value)
						}
						className="w-full h-10 !pl-10  border-none !border !border-[#E1E3EA] rounded-[6px] placeholder:text-[#A1A5B7] placeholder:tex-[13.975px] focus:outline-none"
					/>
				</div>

				<div className="filter-main flex items-end justify-end gap-3 ml-auto">
					{/* Quick Status Filter */}
					
					<div className="filter-actions flex items-center">
						{/* Toggle Advanced Filters */}
						<button
							className=" rounded-[7px] flex justify-center items-center text-[#3B82F6] font-semibold leading-6 bg-[#C6DFF3] py-[10px] px-4"
							onClick={() => {
								setIsFilterExpanded(!isFilterExpanded);
							}}
						>
							<FiltersIcon />
							{__('Filters', 'quillcrm')}
							{hasActiveFilters && (
								<span className="filter-badge">
									{
										[
											filters.search && 'search',
											filters.ownerId && 'owner',
											(filters.expectedCloseDateRange?.from ||
												filters.expectedCloseDateRange?.to) &&
												'expectedClose',
											(filters.createdDateRange?.from ||
												filters.createdDateRange?.to) &&
												'created',
											(filters.valueRange?.min !== null ||
												filters.valueRange?.max !== null) &&
												'value',
											filters.priority !== null &&
												'priority',
										].filter(Boolean).length
									}
								</span>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Advanced Filters */}
			{isFilterExpanded && (
				<AdvancedFiltersDialog
					open={isFilterExpanded}
					onOpenChange={setIsFilterExpanded}
					filters={filters}
					onFiltersChange={onFiltersChange}
					pipelines={pipelines}
					selectedPipelineId={selectedPipelineId}
					onPipelineChange={onPipelineChange}
					owners={owners}
					ownersLoading={ownersLoading}
					priorities={priorities}
				/>
			)}
		</div>
	);
};
