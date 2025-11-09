// import React, { useMemo, useCallback } from 'react';
// import { __ } from '@wordpress/i18n';
// import dayjs from 'dayjs';
// import {
// 	ReportFilters as ReportFiltersType,
// 	FilterOptions,
// } from '../../hooks/useReportFilters';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from '@/components/ui/select';
// import FiltersIcon from '@/components/icons/filters';
// import { FilterSelect } from './components/FilterSelect';
// import {
// 	usePredefinedPeriod,
// 	getPredefinedDateRange,
// } from './hooks/usePredefinedPeriod';
// import { SOURCE_OPTIONS } from '../../config/types/config-data';
// import { DateRangePopup } from '@/client/pages/analytics-and-reports/components/DateRangePopup';

// // Constants
// const STATUS_OPTIONS = [
// 	{ value: 'open', label: __('Open', 'quillcrm') },
// 	{ value: 'won', label: __('Won', 'quillcrm') },
// 	{ value: 'lost', label: __('Lost', 'quillcrm') },
// ] as const;

// const PREDEFINED_DATE_RANGE_OPTIONS = [
// 	{ value: 'today', label: __('Today', 'quillcrm') },
// 	{ value: 'this_week', label: __('This Week', 'quillcrm') },
// 	{ value: 'this_month', label: __('This Month', 'quillcrm') },
// 	{ value: 'this_quarter', label: __('This Quarter', 'quillcrm') },
// 	{ value: 'ytd', label: __('YTD', 'quillcrm') },
// 	{ value: 'last_week', label: __('Last Week', 'quillcrm') },
// 	{ value: 'last_month', label: __('Last Month', 'quillcrm') },
// 	{ value: 'last_quarter', label: __('Last Quarter', 'quillcrm') },
// 	{ value: 'custom_date_range', label: __('Custom Date Range', 'quillcrm') },
// ] as const;

// // PredefinedDateRangeFilter component
// interface PredefinedDateRangeFilterProps {
// 	selectedPeriod: string;
// 	onPeriodChange: (value: string) => void;
// }

// const PredefinedDateRangeFilter: React.FC<PredefinedDateRangeFilterProps> = ({
// 	selectedPeriod,
// 	onPeriodChange,
// }) => (
// 	<div>
// 		<label className="block text-sm font-medium mb-1">
// 			{__('Quick Date Range', 'quillcrm')}
// 		</label>
// 		<Select value={selectedPeriod} onValueChange={onPeriodChange}>
// 			<SelectTrigger className="w-48">
// 				<SelectValue placeholder={__('Select Period', 'quillcrm')} />
// 			</SelectTrigger>
// 			<SelectContent>
// 				{PREDEFINED_DATE_RANGE_OPTIONS.map((option) => (
// 					<SelectItem key={option.value} value={option.value}>
// 						{option.label}
// 					</SelectItem>
// 				))}
// 			</SelectContent>
// 		</Select>
// 	</div>
// );

// // CustomDateRangeFilter component
// interface CustomDateRangeFilterProps {
// 	value: { from: Date | null; to: Date | null };
// 	onChange: (range: { from: Date | null; to: Date | null }) => void;
// }

// const CustomDateRangeFilter: React.FC<CustomDateRangeFilterProps> = ({
// 	value,
// 	onChange,
// }) => (
// 	<div>
// 		<label className="block text-sm font-medium mb-1">
// 			{__('Custom Date Range', 'quillcrm')}
// 		</label>
// 		{/* <DateRangePicker value={value} onChange={onChange} className="w-60" /> */}
// 		<DateRangePopup value={value} onChange={onChange} className="w-60" />
// 	</div>
// );

// // StatusFilter component
// interface StatusFilterProps {
// 	value: string | undefined;
// 	onChange: (value: string) => void;
// }

// const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange }) => (
// 	<div>
// 		<label className="block text-sm font-medium mb-1">
// 			{__('Status', 'quillcrm')}
// 		</label>
// 		<Select value={value} onValueChange={onChange}>
// 			<SelectTrigger className="w-30">
// 				<SelectValue placeholder={__('Select Status', 'quillcrm')} />
// 			</SelectTrigger>
// 			<SelectContent>
// 				{STATUS_OPTIONS.map((status) => (
// 					<SelectItem key={status.value} value={status.value}>
// 						{status.label}
// 					</SelectItem>
// 				))}
// 			</SelectContent>
// 		</Select>
// 	</div>
// );

// // SourceFilter component
// interface SourceFilterProps {
// 	value: string | undefined;
// 	onChange: (value: string) => void;
// }

// const SourceFilter: React.FC<SourceFilterProps> = ({ value, onChange }) => (
// 	<div>
// 		<label className="block text-sm font-medium mb-1">
// 			{__('Deal Source', 'quillcrm')}
// 		</label>
// 		<Select value={value} onValueChange={onChange}>
// 			<SelectTrigger className="w-40">
// 				<SelectValue placeholder={__('Select Source', 'quillcrm')} />
// 			</SelectTrigger>
// 			<SelectContent>
// 				{SOURCE_OPTIONS.map((source) => (
// 					<SelectItem key={source.value} value={source.value}>
// 						{source.label}
// 					</SelectItem>
// 				))}
// 			</SelectContent>
// 		</Select>
// 	</div>
// );

// // ActionButtons component
// interface ActionButtonsProps {
// 	onClear: () => void;
// 	onApply: () => void;
// }

// const ActionButtons: React.FC<ActionButtonsProps> = ({ onClear, onApply }) => (
// 	<div>
// 		<label className="block text-sm font-medium mb-1">
// 			{__('Actions', 'quillcrm')}
// 		</label>
// 		<div className="flex gap-2">
// 			<Button onClick={onClear} variant="outline">
// 				{__('Clear', 'quillcrm')}
// 			</Button>
// 			<Button onClick={onApply} variant="default">
// 				{__('Apply', 'quillcrm')}
// 			</Button>
// 		</div>
// 	</div>
// );

// // Main ReportFilters interfaces
// interface ReportFiltersProps {
// 	// Filter state
// 	filters: ReportFiltersType;
// 	setFilters: (filters: ReportFiltersType) => void;
// 	filterOptions: FilterOptions;
// 	showFilters: boolean;
// 	setShowFilters: (show: boolean) => void;
// 	clearFilters: () => void;
// 	applyFilters: () => void;

// 	// Configuration for which filters to show
// 	title?: string;
// 	showDateRange?: boolean;
// 	showPredefinedDateRange?: boolean;
// 	showOwner?: boolean;
// 	showOwnerDefault?: boolean;
// 	selectedOwnerId?: number | null;
// 	showPipeline?: boolean;
// 	showStatus?: boolean;
// 	showContact?: boolean;
// 	showSource?: boolean;

// 	// Optional styling
// 	style?: React.CSSProperties;
// 	className?: string;
// }

// const ReportFilters: React.FC<ReportFiltersProps> = ({
// 	filters,
// 	setFilters,
// 	filterOptions,
// 	showFilters,
// 	setShowFilters,
// 	clearFilters,
// 	applyFilters,
// 	title = __('Filters', 'quillcrm'),
// 	showDateRange = true,
// 	showPredefinedDateRange = true,
// 	showOwner = true,
// 	showOwnerDefault = false,
// 	selectedOwnerId = null,
// 	showPipeline = true,
// 	showStatus = true,
// 	showContact = true,
// 	showSource = true,
// 	style,
// 	className,
// }) => {
// 	const { selectedPeriod, setSelectedPeriod } = usePredefinedPeriod(
// 		filters.dateRange
// 	);

// 	// Memoized handlers
// 	const handlePredefinedDateChange = useCallback(
// 		(value: string) => {
// 			setSelectedPeriod(value);
// 			const dateRange = getPredefinedDateRange(value);
// 			if (dateRange) {
// 				setFilters({
// 					...filters,
// 					dateRange,
// 				});
// 			} else if (value === 'custom_date_range') {
// 				// Don't clear the date range when switching to custom
// 				// The user will set it via the custom date picker
// 			}
// 		},
// 		[filters, setFilters, setSelectedPeriod]
// 	);

// 	const handleCustomDateChange = useCallback(
// 		(range: { from: Date | null; to: Date | null }) => {
// 			const newDateRange: [dayjs.Dayjs, dayjs.Dayjs] | null =
// 				range.from && range.to
// 					? [dayjs(range.from), dayjs(range.to)]
// 					: null;

// 			setFilters({
// 				...filters,
// 				dateRange: newDateRange,
// 			});

// 			// When user manually sets a custom date, update the selected period
// 			if (newDateRange) {
// 				setSelectedPeriod('custom_date_range');
// 			}
// 		},
// 		[filters, setFilters, setSelectedPeriod]
// 	);

// 	const handleClearFilters = useCallback(() => {
// 		setSelectedPeriod('');
// 		clearFilters();
// 	}, [clearFilters, setSelectedPeriod]);

// 	// Memoized filter handlers
// 	const handleOwnerChange = useCallback(
// 		(value: string) => {
// 			setFilters({
// 				...filters,
// 				ownerId: value ? parseInt(value) : null,
// 			});
// 		},
// 		[filters, setFilters]
// 	);

// 	const handlePipelineChange = useCallback(
// 		(value: string) => {
// 			setFilters({
// 				...filters,
// 				pipelineId: value ? parseInt(value) : null,
// 			});
// 		},
// 		[filters, setFilters]
// 	);

// 	const handleStatusChange = useCallback(
// 		(value: string) => {
// 			setFilters({
// 				...filters,
// 				status: value,
// 			});
// 		},
// 		[filters, setFilters]
// 	);

// 	const handleContactChange = useCallback(
// 		(value: string) => {
// 			setFilters({
// 				...filters,
// 				contactId: value ? parseInt(value) : null,
// 			});
// 		},
// 		[filters, setFilters]
// 	);

// 	const handleSourceChange = useCallback(
// 		(value: string) => {
// 			setFilters({
// 				...filters,
// 				source: value,
// 			});
// 		},
// 		[filters, setFilters]
// 	);

// 	// Memoized date range value
// 	const dateRangeValue = useMemo(
// 		() =>
// 			filters.dateRange
// 				? {
// 						from: filters.dateRange[0]?.toDate() || null,
// 						to: filters.dateRange[1]?.toDate() || null,
// 					}
// 				: { from: null, to: null },
// 		[filters.dateRange]
// 	);

// 	return (
// 		<Card style={{ marginBottom: 20, ...style }} className={className}>
// 			<CardContent className="p-4">
// 				<div
// 					className="flex justify-between items-center"
// 					style={{ marginBottom: showFilters ? 16 : 0 }}
// 				>
// 					<h3 className="text-lg font-semibold leading-none tracking-tight m-0">
// 						{title}
// 					</h3>
// 					<Button
// 						onClick={() => setShowFilters(!showFilters)}
// 						variant={showFilters ? 'default' : 'outline'}
// 						className="flex  items-center gap-2 bg-[#C6DFF3] hover:bg-[#C6DFF3] !border-0 rounded-[7px] py-[10px] px-4 text-[#458DC7] text-base font-semibold leading-[24px] font-[Inter] "
// 					>
// 						<FiltersIcon />
// 						{__('Filter', 'quillcrm')}
// 					</Button>
// 				</div>

// 				{showFilters && (
// 					<div className="border-t border-gray-200 pt-4">
// 						<div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// 							{/* Predefined Date Range Filter */}
// 							{/* {showPredefinedDateRange && (
// 								<PredefinedDateRangeFilter
// 									selectedPeriod={selectedPeriod}
// 									onPeriodChange={handlePredefinedDateChange}
// 								/>
// 							)} */}

// 							{/* Custom Date Range Filter */}
// 							{showDateRange && (
// 								<CustomDateRangeFilter
// 									value={dateRangeValue}
// 									onChange={handleCustomDateChange}
// 								/>
// 							)}

// 							{/* Owner Filter */}
// 							{showOwner && (
// 								<FilterSelect
// 									label={__('Owner', 'quillcrm')}
// 									value={filters.ownerId?.toString()}
// 									defaultValue={
// 										showOwnerDefault
// 											? selectedOwnerId?.toString()
// 											: undefined
// 									}
// 									placeholder={__('Select Owner', 'quillcrm')}
// 									onChange={handleOwnerChange}
// 									options={filterOptions.owners || []}
// 								/>
// 							)}

// 							{/* Pipeline Filter */}
// 							{showPipeline && (
// 								<FilterSelect
// 									label={__('Pipeline', 'quillcrm')}
// 									value={filters.pipelineId?.toString()}
// 									placeholder={__(
// 										'Select Pipeline',
// 										'quillcrm'
// 									)}
// 									onChange={handlePipelineChange}
// 									options={filterOptions.pipelines || []}
// 								/>
// 							)}

// 							{/* Status Filter */}
// 							{showStatus && (
// 								<StatusFilter
// 									value={filters.status ?? undefined}
// 									onChange={handleStatusChange}
// 								/>
// 							)}

// 							{/* Contact Filter */}
// 							{showContact && (
// 								<FilterSelect
// 									label={__('Contact', 'quillcrm')}
// 									value={filters.contactId?.toString()}
// 									placeholder={__(
// 										'Select Contact',
// 										'quillcrm'
// 									)}
// 									onChange={handleContactChange}
// 									options={filterOptions.contacts || []}
// 									renderOptionText={(contact) =>
// 										`${contact.first_name} ${contact.last_name}`
// 									}
// 								/>
// 							)}

// 							{/* Source Filter */}
// 							{showSource && (
// 								<SourceFilter
// 									value={filters.source ?? undefined}
// 									onChange={handleSourceChange}
// 								/>
// 							)}
// 							</div>

// 							{/* Action Buttons */}
// 							<ActionButtons
// 								onClear={handleClearFilters}
// 								onApply={applyFilters}
// 							/>
						
// 					</div>
// 				)}
// 			</CardContent>
// 		</Card>
// 	);
// };

// export default ReportFilters;

import React, { useMemo, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import dayjs from 'dayjs';
import {
	ReportFilters as ReportFiltersType,
	FilterOptions,
} from '../../hooks/useReportFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import FiltersIcon from '@/components/icons/filters';
import { X } from 'lucide-react';
import { FilterSelect } from './components/FilterSelect';
import {
	usePredefinedPeriod,
	getPredefinedDateRange,
} from './hooks/usePredefinedPeriod';
import { SOURCE_OPTIONS } from '../../config/types/config-data';
import { DateRangePopup } from '@/client/pages/analytics-and-reports/components/DateRangePopup';

// Constants
const STATUS_OPTIONS = [
	{ value: 'open', label: __('Open', 'quillcrm') },
	{ value: 'won', label: __('Won', 'quillcrm') },
	{ value: 'lost', label: __('Lost', 'quillcrm') },
] as const;

const PREDEFINED_DATE_RANGE_OPTIONS = [
	{ value: 'today', label: __('Today', 'quillcrm') },
	{ value: 'this_week', label: __('This Week', 'quillcrm') },
	{ value: 'this_month', label: __('This Month', 'quillcrm') },
	{ value: 'this_quarter', label: __('This Quarter', 'quillcrm') },
	{ value: 'ytd', label: __('YTD', 'quillcrm') },
	{ value: 'last_week', label: __('Last Week', 'quillcrm') },
	{ value: 'last_month', label: __('Last Month', 'quillcrm') },
	{ value: 'last_quarter', label: __('Last Quarter', 'quillcrm') },
	{ value: 'custom_date_range', label: __('Custom Date Range', 'quillcrm') },
] as const;

// PredefinedDateRangeFilter component
interface PredefinedDateRangeFilterProps {
	selectedPeriod: string;
	onPeriodChange: (value: string) => void;
}

const PredefinedDateRangeFilter: React.FC<PredefinedDateRangeFilterProps> = ({
	selectedPeriod,
	onPeriodChange,
}) => (
	<div className="flex flex-col gap-1 w-full">
		<label className="text-sm font-medium text-[#09090B]">
			{__('Quick Date Range', 'quillcrm')}
		</label>
		<Select value={selectedPeriod} onValueChange={onPeriodChange}>
			<SelectTrigger className="w-full h-10">
				<SelectValue placeholder={__('Select Period', 'quillcrm')} />
			</SelectTrigger>
			<SelectContent>
				{PREDEFINED_DATE_RANGE_OPTIONS.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	</div>
);

// CustomDateRangeFilter component
interface CustomDateRangeFilterProps {
	value: { from: Date | null; to: Date | null };
	onChange: (range: { from: Date | null; to: Date | null }) => void;
}

const CustomDateRangeFilter: React.FC<CustomDateRangeFilterProps> = ({
	value,
	onChange,
}) => (
	<div className="flex flex-col gap-1 w-full">
		<label className="text-sm font-medium text-[#09090B]">
			{__('Quick Date Range', 'quillcrm')}
		</label>
		<DateRangePopup  value={value} onChange={onChange} className="w-full" />
	</div>
);

// StatusFilter component
interface StatusFilterProps {
	value: string | undefined;
	onChange: (value: string) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange }) => (
	<div className="flex flex-col gap-1 w-full">
		<label className="text-sm font-medium text-[#09090B]">
			{__('Status', 'quillcrm')}
		</label>
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="text-sm text-[#09090B] font-[Manrope] w-full h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px] py-[5px] px-4">
				<SelectValue placeholder={__('Select Status', 'quillcrm')} />
			</SelectTrigger>
			<SelectContent>
				{STATUS_OPTIONS.map((status) => (
					<SelectItem key={status.value} value={status.value}>
						{status.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	</div>
);

// SourceFilter component
interface SourceFilterProps {
	value: string | undefined;
	onChange: (value: string) => void;
}

const SourceFilter: React.FC<SourceFilterProps> = ({ value, onChange }) => (
	<div className="flex flex-col gap-1 w-full">
		<label className="text-sm font-medium text-[#09090B]">
			{__('Deal Source', 'quillcrm')}
		</label>
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-full h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px] py-[5px] px-4">
				<SelectValue placeholder={__('Select Source', 'quillcrm')} />
			</SelectTrigger>
			<SelectContent>
				{SOURCE_OPTIONS.map((source) => (
					<SelectItem key={source.value} value={source.value}>
						{source.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	</div>
);

// ActionButtons component
interface ActionButtonsProps {
	onClear: () => void;
	onApply: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onClear, onApply }) => (
	<div className="flex items-end justify-end gap-2 col-span-full mt-2">
		<Button 
			onClick={onClear} 
			variant="outline"
			className="p-3 text-base font-semibold h-12 bg-transparent border border-[#E13B3B] text-[#E13B3B]  rounded-[8px]"
		>
			{__('Clear', 'quillcrm')}
		</Button>
		<Button 
			onClick={onApply} 
			className="p-3 text-base font-semibold h-12 bg-[#1E3A8A] text-white  rounded-[8px]"
		>
			{__('Apply', 'quillcrm')}
		</Button>
	</div>
);

// Main ReportFilters interfaces
interface ReportFiltersProps {
	// Filter state
	filters: ReportFiltersType;
	setFilters: (filters: ReportFiltersType) => void;
	filterOptions: FilterOptions;
	showFilters: boolean;
	setShowFilters: (show: boolean) => void;
	clearFilters: () => void;
	applyFilters: () => void;

	// Configuration for which filters to show
	title?: string;
	showDateRange?: boolean;
	showPredefinedDateRange?: boolean;
	showOwner?: boolean;
	showOwnerDefault?: boolean;
	selectedOwnerId?: number | null;
	showPipeline?: boolean;
	showStatus?: boolean;
	showContact?: boolean;
	showSource?: boolean;

	// Optional styling
	style?: React.CSSProperties;
	className?: string;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
	filters,
	setFilters,
	filterOptions,
	showFilters,
	setShowFilters,
	clearFilters,
	applyFilters,
	title = __('Filters', 'quillcrm'),
	showDateRange = true,
	showPredefinedDateRange = true,
	showOwner = true,
	showOwnerDefault = false,
	selectedOwnerId = null,
	showPipeline = true,
	showStatus = true,
	showContact = true,
	showSource = true,
	style,
	className,
}) => {
	const { selectedPeriod, setSelectedPeriod } = usePredefinedPeriod(
		filters.dateRange
	);

	// Memoized handlers
	const handlePredefinedDateChange = useCallback(
		(value: string) => {
			setSelectedPeriod(value);
			const dateRange = getPredefinedDateRange(value);
			if (dateRange) {
				setFilters({
					...filters,
					dateRange,
				});
			} else if (value === 'custom_date_range') {
				// Don't clear the date range when switching to custom
				// The user will set it via the custom date picker
			}
		},
		[filters, setFilters, setSelectedPeriod]
	);

	const handleCustomDateChange = useCallback(
		(range: { from: Date | null; to: Date | null }) => {
			const newDateRange: [dayjs.Dayjs, dayjs.Dayjs] | null =
				range.from && range.to
					? [dayjs(range.from), dayjs(range.to)]
					: null;

			setFilters({
				...filters,
				dateRange: newDateRange,
			});

			// When user manually sets a custom date, update the selected period
			if (newDateRange) {
				setSelectedPeriod('custom_date_range');
			}
		},
		[filters, setFilters, setSelectedPeriod]
	);

	const handleClearFilters = useCallback(() => {
		setSelectedPeriod('');
		clearFilters();
	}, [clearFilters, setSelectedPeriod]);

	// Memoized filter handlers
	const handleOwnerChange = useCallback(
		(value: string) => {
			setFilters({
				...filters,
				ownerId: value ? parseInt(value) : null,
			});
		},
		[filters, setFilters]
	);

	const handlePipelineChange = useCallback(
		(value: string) => {
			setFilters({
				...filters,
				pipelineId: value ? parseInt(value) : null,
			});
		},
		[filters, setFilters]
	);

	const handleStatusChange = useCallback(
		(value: string) => {
			setFilters({
				...filters,
				status: value,
			});
		},
		[filters, setFilters]
	);

	const handleContactChange = useCallback(
		(value: string) => {
			setFilters({
				...filters,
				contactId: value ? parseInt(value) : null,
			});
		},
		[filters, setFilters]
	);

	const handleSourceChange = useCallback(
		(value: string) => {
			setFilters({
				...filters,
				source: value,
			});
		},
		[filters, setFilters]
	);

	// Memoized date range value
	const dateRangeValue = useMemo(
		() =>
			filters.dateRange
				? {
						from: filters.dateRange[0]?.toDate() || null,
						to: filters.dateRange[1]?.toDate() || null,
					}
				: { from: null, to: null },
		[filters.dateRange]
	);

	return (
		<Card style={{ marginBottom: 20, ...style }} className=' !shadow-none border border-[#DEE1E6] bg-[#F8F8F8] rounded-[8px] p-4'>
			<CardContent className="p-4">
				<div
					className="flex justify-between items-center"
					style={{ marginBottom: showFilters ? 16 : 0 }}
				>
					<h3 className="text-2xl text-[#09090B] font-medium leading-normal tracking-[-1] m-0">
						{title}
					</h3>
					<Button
						onClick={() => setShowFilters(!showFilters)}
						className={`flex items-center gap-2 !border-0 rounded-[7px] py-[10px] px-4 text-base font-semibold leading-[24px] font-[Inter] h-10 ${
							showFilters 
								? 'bg-[#FEE2E2] hover:bg-[#FEE2E2] text-[#E13B3B]' 
								: 'bg-[#C6DFF3] hover:bg-[#C6DFF3] text-[#458DC7]'
						}`}
					>
						{showFilters ? (
							<>
								<X className="w-4 h-4" />
								{__('Close', 'quillcrm')}
							</>
						) : (
							<>
								<FiltersIcon />
								{__('Filter', 'quillcrm')}
							</>
						)}
					</Button>
				</div>

				{showFilters && (
					<div className="border-t border-gray-200 pt-4 mt-4">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{/* Custom Date Range Filter */}
							{showDateRange && (
								<CustomDateRangeFilter
									value={dateRangeValue}
									onChange={handleCustomDateChange}
									
								/>
							)}

							{/* Pipeline Filter */}
							{showPipeline && (
								<div className="w-full">
									<FilterSelect
										label={__('Pipeline', 'quillcrm')}
										value={filters.pipelineId?.toString()}
										placeholder={__('Select Pipeline', 'quillcrm')}
										onChange={handlePipelineChange}
										options={filterOptions.pipelines || []}
										className='w-full  h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px] py-[5px] px-4'
									/>
								</div>
							)}

							{/* Owner Filter */}
							{showOwner && (
								<div className="w-full">
									<FilterSelect
										label={__('Owner', 'quillcrm')}
										value={filters.ownerId?.toString()}
										defaultValue={
											showOwnerDefault
												? selectedOwnerId?.toString()
												: undefined
										}
										placeholder={__('Select Owner', 'quillcrm')}
										onChange={handleOwnerChange}
										options={filterOptions.owners || []}
										className=' w-full h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px] py-[5px] px-4'
									/>
								</div>
							)}

							{/* Source Filter */}
							{showSource && (
								<SourceFilter
									value={filters.source ?? undefined}
									onChange={handleSourceChange}
								/>
							)}

							{/* Contact Filter */}
							{showContact && (
								<div className="w-full">
									<FilterSelect
										label={__('Contact', 'quillcrm')}
										value={filters.contactId?.toString()}
										placeholder={__('Select Contact', 'quillcrm')}
										onChange={handleContactChange}
										options={filterOptions.contacts || []}
										renderOptionText={(contact) =>
											`${contact.first_name} ${contact.last_name}`
										
										}
										className='w-full h-12 bg-[#FFF] border border-[#DEE1E6] rounded-[8px] py-[5px] px-4'
									/>
								</div>
							)}

							{/* Status Filter */}
							{showStatus && (
								<StatusFilter
									value={filters.status ?? undefined}
									onChange={handleStatusChange}
								/>
							)}

							{/* Action Buttons */}
							<ActionButtons
								onClear={handleClearFilters}
								onApply={applyFilters}
							/>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default ReportFilters;