/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useState } from 'react';
/**
 * internal dependencies
 */
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, OutlinedCalendarIcon } from '@quillcrm/components';

interface DateRangePickerProps {
	value: { from: Date | null; to: Date | null };
	onChange: (range: { from: Date | null; to: Date | null }) => void;
	placeholder?: string;
}

export function DateRangePicker({
	value,
	onChange,
	placeholder,
}: DateRangePickerProps) {
	const [open, setOpen] = useState(false);

	const formatDateRange = () => {
		if (!value.from)
			return placeholder || __('Pick a date range', 'quillcrm');

		const fromDate = value.from.toLocaleDateString();
		const toDate = value.to ? value.to.toLocaleDateString() : '';

		if (value.to) {
			return `${fromDate} - ${toDate}`;
		}
		return fromDate;
	};

	const handleDateSelect = (range: any) => {
		onChange(range || { from: null, to: null });
		if (range?.from && range?.to) {
			setOpen(false);
		}
	};

	const clearDateRange = () => {
		onChange({ from: null, to: null });
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button className="justify-between text-left w-[200px] h-9 rounded-xl px-2 py-[20px] bg-accent border-none hover:bg-accent text-[#A1A5B7] font-semibold ">
					{formatDateRange()}
					<OutlinedCalendarIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="p-3">
					<Calendar
						mode="range"
						selected={{
							from: value.from ?? undefined,
							to: value.to ?? undefined,
						}}
						onSelect={handleDateSelect}
						numberOfMonths={1}
						initialFocus
					/>
					<div className="flex justify-between mt-3 pt-3 border-t">
						<Button
							variant="outline"
							size="sm"
							onClick={clearDateRange}
						>
							{__('Clear', 'quillcrm')}
						</Button>
						<Button size="sm" onClick={() => setOpen(false)}>
							{__('Close', 'quillcrm')}
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
