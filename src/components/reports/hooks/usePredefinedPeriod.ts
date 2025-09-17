import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';

// Constants
export const PREDEFINED_PERIODS = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'ytd', label: 'YTD' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_quarter', label: 'Last Quarter' },
] as const;

// Helper function to get quarter start and end
const getQuarterRange = (date: dayjs.Dayjs): [dayjs.Dayjs, dayjs.Dayjs] => {
    const quarter = Math.floor(date.month() / 3);
    const startMonth = quarter * 3;
    const quarterStart = date.month(startMonth).startOf('month');
    const quarterEnd = quarterStart.add(2, 'month').endOf('month');
    return [quarterStart, quarterEnd];
};

// Helper function to get predefined date ranges
export const getPredefinedDateRange = (
    period: string
): [dayjs.Dayjs, dayjs.Dayjs] | null => {
    const now = dayjs();

    switch (period) {
        case 'today':
            return [now.startOf('day'), now.endOf('day')];
        case 'this_week':
            return [now.startOf('week'), now.endOf('week')];
        case 'this_month':
            return [now.startOf('month'), now.endOf('month')];
        case 'this_quarter':
            return getQuarterRange(now);
        case 'ytd':
            return [now.startOf('year'), now];
        case 'last_week':
            const lastWeek = now.subtract(1, 'week');
            return [lastWeek.startOf('week'), lastWeek.endOf('week')];
        case 'last_month':
            const lastMonth = now.subtract(1, 'month');
            return [lastMonth.startOf('month'), lastMonth.endOf('month')];
        case 'last_quarter':
            const lastQuarterDate = now.subtract(3, 'month');
            return getQuarterRange(lastQuarterDate);
        default:
            return null;
    }
};

// Custom hook for predefined period logic
export const usePredefinedPeriod = (
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
) => {
    const getMatchingPeriod = useCallback(
        (dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null): string => {
            if (!dateRange || !dateRange[0] || !dateRange[1]) return '';

            for (const period of PREDEFINED_PERIODS) {
                const predefinedRange = getPredefinedDateRange(period.value);
                if (predefinedRange) {
                    const [start, end] = predefinedRange;
                    if (
                        dateRange[0].isSame(start, 'day') &&
                        dateRange[1].isSame(end, 'day')
                    ) {
                        return period.value;
                    }
                }
            }
            return '';
        },
        []
    );

    const [selectedPeriod, setSelectedPeriod] = useState<string>('');

    useEffect(() => {
        const matchingPeriod = getMatchingPeriod(dateRange);
        setSelectedPeriod(matchingPeriod);
    }, [dateRange, getMatchingPeriod]);

    return { selectedPeriod, setSelectedPeriod };
};
