/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';

interface DateFilterProps {
	interval: string;
	startDate: Date;
	endDate: Date;
	onIntervalChange: (interval: string) => void;
	onChangeFromDate: (date: Date) => void;
	onChangeToDate: (date: Date) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
	interval,
	startDate,
	endDate,
	onIntervalChange,
	onChangeFromDate,
	onChangeToDate,
}) => {
	const intervalOptions = [
		{
			label: __('Today', 'doublescale'),
			value: 'today',
		},
		{
			label: __('Yesterday', 'doublescale'),
			value: 'yesterday',
		},
		{
			label: __('Last 7 days', 'doublescale'),
			value: 'last_7_days',
		},
		{
			label: __('Last 30 days', 'doublescale'),
			value: 'last_30_days',
		},
		{
			label: __('This month', 'doublescale'),
			value: 'this_month',
		},
		{
			label: __('Last month', 'doublescale'),
			value: 'last_month',
		},
		{
			label: __('This year', 'doublescale'),
			value: 'this_year',
		},
		{
			label: __('Last year', 'doublescale'),
			value: 'last_year',
		},
		{
			label: __('Custom', 'doublescale'),
			value: 'custom',
		},
	];

	const handleDateRangeChange = (range: {
		from: Date | null;
		to: Date | null;
	}) => {
		if (range.from) {
			onChangeFromDate(range.from);
		}
		if (range.to) {
			onChangeToDate(range.to);
		}
	};

	return (
		<div className="flex items-end gap-[10px]">
			<div>
				<Select
					value={interval}
					onValueChange={(value) => onIntervalChange(value)}
				>
					<SelectTrigger className="w-full bg-[#FFFFFF80] py-0 px-2">
						<SelectValue placeholder="Select interval" />
					</SelectTrigger>
					<SelectContent>
						{intervalOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			{interval === 'custom' && (
				<DateRangePicker
					value={{
						from: startDate,
						to: endDate,
					}}
					onChange={handleDateRangeChange}
					placeholder={__('Select date range', 'doublescale')}
					className="bg-[#FFFFFF80] text-[#2E2C2F] px-2 py-0 rounded-md"
				/>
			)}
		</div>
	);
};

export default DateFilter;
