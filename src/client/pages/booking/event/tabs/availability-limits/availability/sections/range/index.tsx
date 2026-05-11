/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { format, parseISO, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { AvailabilityRange } from '@/types/booking';

import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { RadioCard } from '@/components/booking';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

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

const parseDate = (dateString: string | undefined): Date | undefined => {
	if (!dateString) return undefined;
	try {
		return parseISO(dateString);
	} catch {
		return undefined;
	}
};

const RangeSection: React.FC<RangeSectionProps> = ({
	range,
	onRangeTypeChange,
	onDaysChange,
	onDateRangeChange,
}) => {
	const startDate = parseDate(range.start_date);
	const endDate = parseDate(range.end_date);

	const today = startOfDay(new Date());

	const disabledBeforeToday = (date: Date) => date < today;

	const disabledBeforeStart = (date: Date) => {
		if (date < today) return true;
		return startDate ? date < startDate : false;
	};

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
				<div className="flex gap-5 mt-4">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="w-full h-[48px] justify-start font-normal rounded-lg"
							>
								<CalendarIcon className="mr-2 h-4 w-4 text-[#9BA7B7]" />
								<span className="text-[#9BA7B7] pr-2">
									{__('From', 'doublescale')}
								</span>
								{startDate
									? format(startDate, 'MM/dd/yyyy')
									: __('Start Date', 'doublescale')}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={startDate}
								onSelect={(date) => {
									if (date) {
										onDateRangeChange(
											formatDateString(date),
											range.end_date ?? ''
										);
									}
								}}
								disabled={disabledBeforeToday}
								initialFocus
							/>
						</PopoverContent>
					</Popover>

					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="w-full h-[48px] justify-start font-normal rounded-lg"
							>
								<CalendarIcon className="mr-2 h-4 w-4 text-[#9BA7B7]" />
								<span className="text-[#9BA7B7] pr-2">
									{__('To', 'doublescale')}
								</span>
								{endDate
									? format(endDate, 'MM/dd/yyyy')
									: __('End Date', 'doublescale')}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={endDate}
								onSelect={(date) => {
									if (date) {
										onDateRangeChange(
											range.start_date ?? '',
											formatDateString(date)
										);
									}
								}}
								disabled={disabledBeforeStart}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
				</div>
			)}
		</div>
	);
};

export default RangeSection;
