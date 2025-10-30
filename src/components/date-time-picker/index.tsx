'use client';

import * as React from 'react';
import { OutlinedCalendarIcon } from '@quillcrm/components';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover-dialog';

interface DateTimePickerProps {
	value?: string | Date | null;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	outputFormat?: 'iso' | 'display';
}

function formatDateTime(date: Date | undefined) {
	if (!date) return '';
	return date.toLocaleString('en-US', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	});
}

function parseDate(value: string | Date | null | undefined): Date | undefined {
	if (!value) return undefined;
	if (value instanceof Date && !isNaN(value.getTime())) return value;
	if (typeof value === 'string') {
		const d = new Date(value);
		return isNaN(d.getTime()) ? undefined : d;
	}
	return undefined;
}

export function DateTimePicker({
	value,
	onChange,
	placeholder = 'Select date & time',
	disabled = false,
	className,
	outputFormat = 'iso',
}: DateTimePickerProps) {
	const [open, setOpen] = React.useState(false);
	const [showCalendar, setShowCalendar] = React.useState(true);
	const initialDate = React.useMemo(() => parseDate(value), [value]);
	const [date, setDate] = React.useState<Date | undefined>(initialDate || new Date());

	const [tempDate, setTempDate] = React.useState<Date | undefined>(date);

	// الوقت
	const [hours, setHours] = React.useState(() => {
		const d = initialDate || new Date();
		let h = d.getHours();
		return h > 12 ? h - 12 : h || 12;
	});
	const [minutes, setMinutes] = React.useState(() => {
		const d = initialDate || new Date();
		return d.getMinutes();
	});
	const [ampm, setAmPm] = React.useState(() => {
		const d = initialDate || new Date();
		return d.getHours() >= 12 ? 'PM' : 'AM';
	});

	const formatValue = (d: Date) => {
		let h = hours % 12 + (ampm === 'PM' ? 12 : 0);
		const updated = new Date(d);
		updated.setHours(h, minutes);
		return outputFormat === 'iso'
			? updated.toISOString()
			: formatDateTime(updated);
	};

	const handleDateSelect = (selected: Date | undefined) => {
		if (!selected) return;
		setTempDate(selected);
	};

	const handleTimeChange = (part: 'h' | 'm', val: string) => {
		let n = Number(val);
		if (part === 'h') {
			if (n >= 1 && n <= 12) setHours(n);
		} else {
			if (n >= 0 && n <= 59) setMinutes(n);
		}
	};

	const handleAmPmClick = (val: 'AM' | 'PM') => {
		setAmPm(val);
	};

	const handleDone = () => {
		if (!tempDate) return;
		setDate(tempDate);
		onChange(formatValue(tempDate));
		setOpen(false);
	};

	const handleCancel = () => {
		setTempDate(date);
		setOpen(false);
	};

	return (
		<div className={cn('relative flex flex-col gap-2', className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="px-3 h-12 bg-white hover:bg-white text-[#09090B] border border-[#DEE1E6] flex flex-row-reverse justify-between items-center"
					>
						<OutlinedCalendarIcon />
						<span>{date ? formatDateTime(date) : placeholder}</span>
					</Button>
				</PopoverTrigger>

				<PopoverContent
					className="w-auto p-4 flex flex-col gap-3 shadow-lg border-none"
					align="end"
					sideOffset={10}
				>
					<Calendar
						mode="single"
						selected={tempDate}
						onSelect={handleDateSelect}
						month={tempDate}
						onMonthChange={setTempDate}
						disabled={disabled}
						className=" [&_[data-selected-single=true]]:!bg-[#458DC7] [&_[data-selected-single=true]]:!text-white [&_[data-selected-single=true]]:rounded-full"
					/>

					<div className="flex justify-center pt-3 border-t">
						<div className="flex items-center gap-1 border h-10 border-[#DEE1E6] rounded-l-[8px]">
							<input
								type="number"
								value={hours.toString().padStart(2, '0')}
								min={1}
								max={12}
								onChange={(e) => handleTimeChange('h', e.target.value)}
								className=" w-12 text-center text-sm text-[#09090B] font-medium !outline-none focus:!outline-none !border-0 focus:border-0"
							/>
							<span className="text-sm">:</span>
							<input
								type="number"
								value={minutes.toString().padStart(2, '0')}
								min={0}
								max={59}
								onChange={(e) => handleTimeChange('m', e.target.value)}
								className=" w-12 text-center text-sm text-[#09090B] font-medium !outline-none focus:!outline-none !border-0 focus:border-0"
							/>
						</div>

						<div className="flex flex-col h-10 w-14 border border-[#DEE1E6] rounded-r-[8px] overflow-hidden">
							<button
								type="button"
								onClick={() => handleAmPmClick('AM')}
								className={cn(
									'w-full h-full text-xs font-medium',
									ampm === 'AM'
										? 'bg-[#458DC7] text-white'
										: 'bg-white text-[#09090B]'
								)}
							>
								AM
							</button>
							<button
								type="button"
								onClick={() => handleAmPmClick('PM')}
								className={cn(
									'w-full h-full text-xs font-medium',
									ampm === 'PM'
										? 'bg-[#458DC7] text-white'
										: 'bg-white text-[#09090B]'
								)}
							>
								PM
							</button>
						</div>
					</div>

					
				</PopoverContent>
			</Popover>
		</div>
	);
}
