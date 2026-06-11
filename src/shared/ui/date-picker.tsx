'use client';

import * as React from 'react';
import { __ } from '@wordpress/i18n';
import { CalendarDays, ChevronDownIcon, X } from 'lucide-react';
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
	style?: React.CSSProperties;
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
		const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (isoMatch) {
			const date = new Date(
				Number(isoMatch[1]),
				Number(isoMatch[2]) - 1,
				Number(isoMatch[3])
			);
			return isValidDate(date) ? date : undefined;
		}
		const date = new Date(value);
		return isValidDate(date) ? date : undefined;
	}

	return undefined;
}

function formatIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
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
	style,
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

		if (selectedDate) {
			onChange(
				outputFormat === 'iso'
					? formatIsoDate(selectedDate)
					: formatDate(selectedDate)
			);
		} else {
			onChange('');
		}
	};

	return (
		<div className={cn('relative flex gap-2', className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							'group relative h-10 w-[220px] justify-start gap-2.5 rounded-lg pl-2 pr-3 text-sm font-medium transition-all duration-150',
							!inputValue &&
								'border-input bg-white text-muted-foreground shadow-sm hover:border-brandPrimary/40 hover:bg-brandPrimary/[0.02]',
							inputValue &&
								'border-brandPrimary/25 bg-brandPrimary/[0.04] text-foreground shadow-sm hover:border-brandPrimary/60 hover:bg-brandPrimary/[0.08]',
							'data-[state=open]:border-brandPrimary data-[state=open]:bg-brandPrimary/[0.08] data-[state=open]:ring-2 data-[state=open]:ring-brandPrimary/20',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandPrimary/30 focus-visible:ring-offset-1',
							buttonClassName
						)}
						style={style}
					>
						{/* Icon chip */}
						<span
							className={cn(
								'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-colors',
								inputValue
									? 'bg-brandPrimary text-white shadow-sm'
									: 'bg-brandPrimary/10 text-brandPrimary group-hover:bg-brandPrimary/15'
							)}
						>
							<CalendarDays className="!h-3.5 !w-3.5" />
						</span>

						{/* Label */}
						<span className="flex flex-1 flex-col items-start overflow-hidden text-left">
							{inputValue && (
								<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 leading-none">
									{__('Date', 'doublescale')}
								</span>
							)}
							<span className="w-full truncate text-sm font-medium leading-tight">
								{inputValue || placeholder}
							</span>
						</span>

						{/* Right affordance: clear or chevron */}
						{inputValue ? (
							<span
								role="button"
								tabIndex={-1}
								aria-label={__('Clear date', 'doublescale')}
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									handleDateSelect(undefined);
								}}
								className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-brandPrimary/15 hover:text-brandPrimary"
							>
								<X className="!h-3 !w-3" />
							</span>
						) : (
							<ChevronDownIcon className="!h-4 !w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto overflow-hidden rounded-xl border border-border bg-white p-0 shadow-xl"
					align="end"
					alignOffset={-8}
					sideOffset={8}
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
