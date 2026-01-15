/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { DateRangePicker } from '@quillcrm/components/ui/date-range-picker';

interface ActivitiesFiltersProps {
	filters: {
		activity_type: string;
		sort_by: string;
		sort_order: string;
		date_from?: string;
		date_to?: string;
	};
	onDateChange: (from: string, to: string) => void;
}

const ActivitiesFilters: React.FC<ActivitiesFiltersProps> = ({
	filters,
	onDateChange,
}) => {
	return (
		<div>
			<DateRangePicker
				value={{
					from: filters.date_from
						? new Date(filters.date_from)
						: null,
					to: filters.date_to ? new Date(filters.date_to) : null,
				}}
				onChange={(range) => {
					onDateChange(
						range?.from?.toISOString() || '',
						range?.to?.toISOString() || ''
					);
				}}
				placeholder={__('Date Range', 'quillcrm')}
				className="w-[206px] h-11 shadow-none rounded-[8px] border border-[#DEE1E6] text-[#777777] bg-white font-normal text-base tracking-[-.5px]"
			/>
		</div>
	);
};

export default ActivitiesFilters;
