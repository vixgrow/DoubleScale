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

interface DatePickerProps {
	value?: string | Date | null;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	buttonClassName?: string;
	error?: boolean;
	required?: boolean;
	outputFormat?: 'iso' | 'display'; // 'iso' for YYYY-MM-DD, 'display' for formatted text
	minDate?: Date; // Minimum selectable date (dates before this are disabled)
	maxDate?: Date; // Maximum selectable date (dates after this are disabled)
}

function formatDate(date: Date | undefined) {
	if (!date) {
		return '';
	}

	return date.toLocaleDateString('en-US', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
}

function isValidDate(date: Date | undefined) {
	if (!date) {
		return false;
	}
	return !isNaN(date.getTime());
}

function parseDate(value: string | Date | null | undefined): Date | undefined {
	if (!value) return undefined;

	if (value instanceof Date) {
		return isValidDate(value) ? value : undefined;
	}

	if (typeof value === 'string') {
		const date = new Date(value);
		return isValidDate(date) ? date : undefined;
	}

	return undefined;
}

export function DatePicker({
	value,
	onChange,
	placeholder = 'Select a date',
	disabled = false,
	className,
	outputFormat = 'iso',
	buttonClassName,
	minDate,
	maxDate,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false);

	// Parse the initial value
	const initialDate = React.useMemo(() => parseDate(value), [value]);
	const [date, setDate] = React.useState<Date | undefined>(initialDate);
	const [month, setMonth] = React.useState<Date | undefined>(
		initialDate || new Date()
	);
	const [inputValue, setInputValue] = React.useState(formatDate(initialDate));

	// Update internal state when value prop changes
	React.useEffect(() => {
		const parsedDate = parseDate(value);
		setDate(parsedDate);
		setInputValue(formatDate(parsedDate));
		if (parsedDate) {
			setMonth(parsedDate);
		}
	}, [value]);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		setDate(selectedDate);
		setInputValue(formatDate(selectedDate));
		setOpen(false);

		// Call onChange with the appropriate format
		if (selectedDate) {
			const outputValue = formatDate(selectedDate);
			onChange(outputValue);
		} else {
			onChange('');
		}
	};

	return (
		<div className={cn('relative flex gap-2', className)}>
			<Popover open={open} onOpenChange={(val) => {
				if (!val) return;
				setOpen(val);
			}}>
				<PopoverTrigger asChild>
					<Button
						className={cn(
							'justify-between text-left w-[200px] h-9 rounded-xl px-2 py-[20px] bg-accent hover:bg-accent text-[#A1A5B7] font-semibold',
							buttonClassName
						)}
					>
						{inputValue ? inputValue : placeholder}
						<OutlinedCalendarIcon />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto overflow-hidden p-0"
					align="end"
					alignOffset={-8}
					sideOffset={10}
				>
					<Calendar
						mode="single"
						selected={date}
						captionLayout="dropdown"
						month={month}
						onMonthChange={setMonth}
						onSelect={handleDateSelect}
						disabled={
							minDate || maxDate
								? (checkDate) => {
										// Compare dates only (ignore time component)
										const checkDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
										if (minDate) {
											const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
											if (checkDateOnly < minDateOnly) return true;
										}
										if (maxDate) {
											const maxDateOnly = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
											if (checkDateOnly > maxDateOnly) return true;
										}
										return disabled;
								  }
								: disabled
						}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
