/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Select, Input, DatePicker, Button, Space } from 'antd';
import { Search, Filter, X, Plus } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import { UserService } from '../../../../../services/user-service';

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
	priority: string | null;
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
			priority: null,
		});
	};

	const hasActiveFilters =
		filters.search ||
		filters.ownerId ||
		filters.dateRange.from ||
		filters.dateRange.to ||
		filters.status !== 'open' ||
		filters.priority !== null;

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
										filters.priority !== null && 'priority',
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
									loading={ownersLoading}
									notFoundContent={
										ownersLoading
											? __(
													'Loading owners...',
													'quillcrm'
												)
											: __('No owners found', 'quillcrm')
									}
								>
									{Object.values(owners).map((owner) => (
										<Option
											key={owner.value}
											value={owner.value}
										>
											{owner.label}
										</Option>
									))}
								</Select>
							</div>

							{/* Priority Filter */}
							<div className="filter-item">
								<label>{__('Priority', 'quillcrm')}</label>
								<Select
									placeholder={__(
										'All priorities',
										'quillcrm'
									)}
									value={filters.priority}
									onChange={(value) =>
										handleFilterChange('priority', value)
									}
									style={{ width: 200 }}
									allowClear
								>
									{Object.keys(priorities).map((key) => (
										<Option key={key} value={key}>
											{priorities[key].label}
										</Option>
									))}
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
