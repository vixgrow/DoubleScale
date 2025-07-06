/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState } from 'react';
import { CalendarIcon } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
	startDate: Date | null;
	endDate: Date | null;
	onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
	placeholder?: string;
	className?: string;
}

export function DateRangePicker({
	startDate,
	endDate,
	onDateRangeChange,
	placeholder = 'Select date range',
	className,
}: DateRangePickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
	const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);

	const handleApply = () => {
		onDateRangeChange(tempStartDate, tempEndDate);
		setIsOpen(false);
	};

	const handleClear = () => {
		setTempStartDate(null);
		setTempEndDate(null);
		onDateRangeChange(null, null);
		setIsOpen(false);
	};

	const formatDateRange = () => {
		if (startDate && endDate) {
			return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
		}
		if (startDate) {
			return `From ${format(startDate, 'MMM d, yyyy')}`;
		}
		if (endDate) {
			return `Until ${format(endDate, 'MMM d, yyyy')}`;
		}
		return placeholder;
	};

	const handleStartDateSelect = (date: Date | undefined) => {
		setTempStartDate(date || null);
		if (date && tempEndDate && date > tempEndDate) {
			setTempEndDate(null);
		}
	};

	const handleEndDateSelect = (date: Date | undefined) => {
		setTempEndDate(date || null);
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						'w-auto justify-start text-left font-normal',
						!startDate && !endDate && 'text-muted-foreground',
						className
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{formatDateRange()}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="p-4">
					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium">
								{__('Start Date', 'quillcrm')}
							</label>
							<Calendar
								mode="single"
								selected={tempStartDate || undefined}
								onSelect={handleStartDateSelect}
								disabled={(date) =>
									date > new Date() || (tempEndDate ? date > tempEndDate : false)
								}
								initialFocus
							/>
						</div>
						<div>
							<label className="text-sm font-medium">
								{__('End Date', 'quillcrm')}
							</label>
							<Calendar
								mode="single"
								selected={tempEndDate || undefined}
								onSelect={handleEndDateSelect}
								disabled={(date) =>
									date > new Date() || (tempStartDate ? date < tempStartDate : false)
								}
							/>
						</div>
					</div>
					<div className="flex justify-between mt-4 pt-4 border-t">
						<Button variant="outline" onClick={handleClear}>
							{__('Clear', 'quillcrm')}
						</Button>
						<Button onClick={handleApply}>
							{__('Apply', 'quillcrm')}
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}