/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { format, startOfDay } from 'date-fns';

/**
 * Internal dependencies
 */
import type { AvailabilityRange } from '@/types/booking';

import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { RadioCard } from '@/components/booking';
import { NativeDatePicker } from '@/components/ui/native-date-picker';

interface RangeSectionProps {
	range: AvailabilityRange;
	onRangeTypeChange: (type: 'days' | 'date_range' | 'infinity') => void;
	onDaysChange: (days: number) => void;
	onDateRangeChange: (start_date: string, end_date: string) => void;
}

const formatDateString = (date: Date | undefined): string => {
	if (!date) return '';
	return format(date, 'yyyy-MM-dd');
};

const RangeSection: React.FC<RangeSectionProps> = ({
	range,
	onRangeTypeChange,
	onDaysChange,
	onDateRangeChange,
}) => {
	const today = startOfDay(new Date());

	return (
		<div className="flex flex-col gap-2.5 mt-5">
			<span className="text-[#3F4254] text-base font-semibold">
				{__('Availability Range', 'doublescale')}
				<span className="text-[#71717A] italic text-base font-normal pl-1">
					{__('(Invitees can schedule)', 'doublescale')}
				</span>
			</span>
			<RadioGroup
				value={range.type}
				onValueChange={(value) =>
					onRangeTypeChange(value as 'days' | 'date_range' | 'infinity')
				}
				className="flex gap-1"
			>
				<RadioCard
					value="days"
					checked={range.type === 'days'}
					className="flex-1 border rounded-lg py-4 px-3 text-[#3F4254] font-semibold"
				>
					{__('Within Future Days', 'doublescale')}
				</RadioCard>
				<RadioCard
					value="date_range"
					checked={range.type === 'date_range'}
					className="flex-1 border rounded-lg py-4 px-3 text-[#3F4254] font-semibold"
				>
					{__('Within a Date Range', 'doublescale')}
				</RadioCard>
				<RadioCard
					value="infinity"
					checked={range.type === 'infinity'}
					className="flex-1 border rounded-lg py-4 px-3 text-[#3F4254] font-semibold"
				>
					{__('Indefinitely into the future', 'doublescale')}
				</RadioCard>
			</RadioGroup>
			{range.type === 'days' && (
				<Input
					type="number"
					value={range.days}
					onChange={(e) => {
						const v = Number(e.target.value);
						if (!isNaN(v)) onDaysChange(v);
					}}
					placeholder={__('Enter number of days', 'doublescale')}
					className="mt-4 rounded-lg h-[48px] flex items-center w-full"
				/>
			)}
			{range.type === 'date_range' && (
				<div className="relative z-0 flex gap-5 mt-4 overflow-visible">
					<NativeDatePicker
						className="w-full"
						variant="outline"
						displayFormat="short"
						prefix={__('From', 'doublescale')}
						placeholder={__('Start Date', 'doublescale')}
						value={range.start_date}
						min={formatDateString(today)}
						max={range.end_date || undefined}
						onChange={(start_date) =>
							onDateRangeChange(start_date, range.end_date ?? '')
						}
					/>
					<NativeDatePicker
						className="w-full"
						variant="outline"
						displayFormat="short"
						prefix={__('To', 'doublescale')}
						placeholder={__('End Date', 'doublescale')}
						value={range.end_date}
						min={range.start_date || formatDateString(today)}
						onChange={(end_date) =>
							onDateRangeChange(range.start_date ?? '', end_date)
						}
					/>
				</div>
			)}
		</div>
	);
};

export default RangeSection;
