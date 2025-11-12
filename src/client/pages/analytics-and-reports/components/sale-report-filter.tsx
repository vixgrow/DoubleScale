import React, { useMemo, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import dayjs from 'dayjs';
// import {
// 	ReportFilters as ReportFiltersType,
// 	FilterOptions,
// } from '../../hooks/useReportFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import FiltersIcon from '@/components/icons/filters';

import { DateRangePopup } from './DateRangePopup';
import { FilterOptions ,ReportFilters as ReportFiltersType, } from '@quillcrm/hooks/useReportFilters';
import { usePredefinedPeriod } from '@quillcrm/components/reports/hooks/usePredefinedPeriod';




// CustomDateRangeFilter component
interface CustomDateRangeFilterProps {
	value: { from: Date | null; to: Date | null };
	onChange: (range: { from: Date | null; to: Date | null }) => void;
}

const CustomDateRangeFilter: React.FC<CustomDateRangeFilterProps> = ({
	value,
	onChange,
}) => (
	<div>
		<label className="block text-base font-normal mb-1 text-[#09090B] font-[Manrope]">
			{__('Quick Date Range', 'quillcrm')}
		</label>
		<DateRangePopup position='right' value={value} onChange={onChange} className="w-60" />
	</div>
);



// Main ReportFilters interfaces
interface SaleReportFiltersProps {
	// Filter state
	filters: ReportFiltersType;
	setFilters: (filters: ReportFiltersType) => void;
	filterOptions: FilterOptions;
	clearFilters: () => void;
	applyFilters: () => void;

	// Configuration for which filters to show
	title?: string;
	showDateRange?: boolean;
	showPredefinedDateRange?: boolean;


	// Optional styling
	style?: React.CSSProperties;
	className?: string;
}

const SaleReportFilter: React.FC<SaleReportFiltersProps> = ({
	filters,
	setFilters,
	title = __('Filters', 'quillcrm'),
	showDateRange = true,
	style,
	className,
}) => {
	const { selectedPeriod, setSelectedPeriod } = usePredefinedPeriod(
		filters.dateRange
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
		
						<div className="flex flex-wrap gap-4">
							{/* Custom Date Range Filter */}
							{showDateRange && (
								<CustomDateRangeFilter
									value={dateRangeValue}
									onChange={handleCustomDateChange}
								/>
							)}
							
						</div>
	);
};

export default SaleReportFilter;
