/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useState, useEffect } from 'react';
/**
 * internal dependencies
 */
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover-dialog';
import { OutlinedCalendarIcon } from '@doublescale/components';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
	value: { from: Date | null; to: Date | null };
	onChange: (range: { from: Date | null; to: Date | null }) => void;
	placeholder?: string;
	className?: string;
}

export function DateRangePicker({
	value,
	onChange,
	placeholder,
	className,
}: DateRangePickerProps) {
	const [open, setOpen] = useState(false);
	// Internal state to manage the selection without triggering parent re-renders
	const [internalRange, setInternalRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>(value);

	// Update internal state when the external value changes (e.g., when filters are cleared)
	useEffect(() => {
		setInternalRange(value);
	}, [value]);

	const formatDateRange = () => {
		if (!internalRange.from)
			return placeholder || __('Pick a date range', 'doublescale');

		const fromDate = internalRange.from.toLocaleDateString();
		const toDate = internalRange.to
			? internalRange.to.toLocaleDateString()
			: '';

		if (internalRange.to) {
			return `${fromDate} - ${toDate}`;
		}
		return fromDate;
	};

	const handleDateSelect = (range: any) => {
		// const newRange = range || { from: null, to: null };
		let newRange = { from: range.from, to: range.to };

	     if (newRange.from && newRange.to && newRange.from > newRange.to) {
		newRange = { from: newRange.to, to: newRange.from };
	}


		// Update internal state immediately for UI feedback
		setInternalRange(newRange);

		// Only call onChange (which triggers parent re-render) when:
		// 1. Both dates are selected (complete range, including same-day)
		// 2. Range is cleared (both null)
		const isCompleteRange = newRange.from && newRange.to;
		const isCleared = !newRange.from && !newRange.to;

		if (isCompleteRange || isCleared) {
			onChange(newRange);
			setOpen(false);
		}
	};

	const clearDateRange = () => {
		const clearedRange = { from: null, to: null };
		setInternalRange(clearedRange);
		onChange(clearedRange);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					className={cn(
						'justify-between text-left w-[200px] h-9 rounded-xl px-2 py-[20px] bg-accent hover:bg-accent text-[#A1A5B7] font-semibold',
						className
					)}
				>
					{formatDateRange()}
					<OutlinedCalendarIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-0 max-h-[300px] overflow-y-auto z-[9999]"
				align="start"
				side="bottom"
				sideOffset={5}
			>
				<div className="p-3">
					<Calendar
						mode="range"
						selected={{
							from: internalRange.from ?? undefined,
							to: internalRange.to ?? undefined,
						}}
						onSelect={handleDateSelect}
						numberOfMonths={1}
						autoFocus
					/>
					<div className="flex justify-between mt-3 pt-3 border-t">
						<Button
							variant="outline"
							size="sm"
							onClick={clearDateRange}
						>
							{__('Clear', 'doublescale')}
						</Button>
						<Button size="sm" onClick={() => setOpen(false)}>
							{__('Close', 'doublescale')}
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
