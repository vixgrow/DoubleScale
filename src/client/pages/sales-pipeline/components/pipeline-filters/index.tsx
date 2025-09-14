/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Select, Input, DatePicker, Button, Space } from 'antd';
import { Search, Filter, X, Plus } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Pipeline {
	id: number;
	name: string;
	description: string;
}

interface Filters {
	search: string;
	ownerId: number | null;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	status: 'open' | 'won' | 'lost' | 'all';
}

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

	const handleFilterChange = (key: keyof Filters, value: any) => {
		onFiltersChange({
			...filters,
			[key]: value,
		});
	};

	const handleDateRangeChange = (dates: any) => {
		handleFilterChange('dateRange', {
			from: dates?.[0]?.toDate() || null,
			to: dates?.[1]?.toDate() || null,
		});
	};

	const clearFilters = () => {
		onFiltersChange({
			search: '',
			ownerId: null,
			dateRange: { from: null, to: null },
			status: 'open',
		});
	};

	const hasActiveFilters =
		filters.search ||
		filters.ownerId ||
		filters.dateRange.from ||
		filters.dateRange.to ||
		filters.status !== 'open';

	return (
		<div className="pipeline-filters">
			{/* Main Filter Bar */}
			<div className="filter-bar">
				<div className="filter-main">
					{/* Pipeline Selector */}
					<div className="pipeline-selector">
						<Select
							placeholder={__('Select a pipeline', 'quillcrm')}
							value={selectedPipelineId}
							onChange={onPipelineChange}
							style={{ width: 250 }}
							size="large"
						>
							{pipelines.map((pipeline) => (
								<Option key={pipeline.id} value={pipeline.id}>
									{pipeline.name}
								</Option>
							))}
						</Select>
					</div>

					{/* Search */}
					<div className="search-input">
						<Input
							placeholder={__('Search deals...', 'quillcrm')}
							prefix={<Search size={16} />}
							value={filters.search}
							onChange={(e) =>
								handleFilterChange('search', e.target.value)
							}
							size="large"
							allowClear
						/>
					</div>

					{/* Quick Status Filter */}
					<div className="status-filter">
						<Select
							value={filters.status}
							onChange={(value) =>
								handleFilterChange('status', value)
							}
							size="large"
							style={{ width: 120 }}
						>
							<Option value="all">{__('All', 'quillcrm')}</Option>
							<Option value="open">
								{__('Open', 'quillcrm')}
							</Option>
							<Option value="won">{__('Won', 'quillcrm')}</Option>
							<Option value="lost">
								{__('Lost', 'quillcrm')}
							</Option>
						</Select>
					</div>
				</div>

				<div className="filter-actions">
					{/* Toggle Advanced Filters */}
					<Button
						type={isFilterExpanded ? 'primary' : 'default'}
						icon={<Filter size={16} />}
						onClick={() => setIsFilterExpanded(!isFilterExpanded)}
						size="large"
					>
						{__('Filters', 'quillcrm')}
						{hasActiveFilters && (
							<span className="filter-badge">
								{
									[
										filters.search && 'search',
										filters.ownerId && 'owner',
										(filters.dateRange.from ||
											filters.dateRange.to) &&
											'date',
										filters.status !== 'open' && 'status',
									].filter(Boolean).length
								}
							</span>
						)}
					</Button>

					{/* Clear Filters */}
					{hasActiveFilters && (
						<Button
							icon={<X size={16} />}
							onClick={clearFilters}
							title={__('Clear all filters', 'quillcrm')}
							size="large"
						>
							{__('Clear', 'quillcrm')}
						</Button>
					)}
				</div>
			</div>

			{/* Advanced Filters */}
			{isFilterExpanded && (
				<div className="advanced-filters">
					<div className="filter-row">
						<Space size="large" wrap>
							{/* Owner Filter */}
							<div className="filter-item">
								<label>{__('Deal Owner', 'quillcrm')}</label>
								<Select
									placeholder={__('All owners', 'quillcrm')}
									value={filters.ownerId}
									onChange={(value) =>
										handleFilterChange('ownerId', value)
									}
									style={{ width: 200 }}
									allowClear
								>
									{/* TODO: Load from API */}
									<Option value={1}>John Doe</Option>
									<Option value={2}>Jane Smith</Option>
								</Select>
							</div>

							{/* Date Range Filter */}
							<div className="filter-item">
								<label>
									{__('Expected Close Date', 'quillcrm')}
								</label>
								<RangePicker
									value={
										filters.dateRange.from &&
										filters.dateRange.to
											? [
													filters.dateRange.from,
													filters.dateRange.to,
												]
											: null
									}
									onChange={handleDateRangeChange}
									style={{ width: 240 }}
								/>
							</div>

							{/* Value Range Filter */}
							<div className="filter-item">
								<label>
									{__('Deal Value Range', 'quillcrm')}
								</label>
								<Space.Compact style={{ width: 200 }}>
									<Input
										style={{ width: '50%' }}
										placeholder={__('Min', 'quillcrm')}
									/>
									<Input
										style={{ width: '50%' }}
										placeholder={__('Max', 'quillcrm')}
									/>
								</Space.Compact>
							</div>
						</Space>
					</div>
				</div>
			)}
		</div>
	);
};
