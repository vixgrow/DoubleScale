
'use client';

import * as React from 'react';
import { OutlinedCalendarIcon } from '@doublescale/components';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover-dialog';

interface DateTimePickerProps {
	value?: Date | null;
	onChange: (value: Date) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
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

function parseDate(value: Date | string | null | undefined): Date | undefined {
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
}: DateTimePickerProps) {
	const [open, setOpen] = React.useState(false);
	const initialDate = React.useMemo(() => parseDate(value), [value]);
	const [date, setDate] = React.useState<Date | undefined>(initialDate || new Date());
	const [tempDate, setTempDate] = React.useState<Date | undefined>(date);

	
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

	const handleDone = (e?: React.MouseEvent) => {
		e?.stopPropagation();
		if (!tempDate) return;
		const updated = new Date(tempDate);
		const h = hours % 12 + (ampm === 'PM' ? 12 : 0);
		updated.setHours(h, minutes);
		setDate(updated);
		onChange(updated);
		setOpen(false);
	};

	const handleCancel = (e?: React.MouseEvent) => {
		e?.stopPropagation();
		setTempDate(date);
		setOpen(false);
	};

	return (
		<div className={cn('relative flex w-full min-w-0 flex-col gap-2', className)}>
			<Popover open={open} onOpenChange={(val) => {
				if (!val) return; 
				setOpen(val);
			}}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="flex h-12 w-full min-w-0 flex-row-reverse items-center justify-between overflow-hidden border border-border/60 bg-white px-3 !shadow-none hover:bg-white text-foreground"
					>
						<OutlinedCalendarIcon className="shrink-0" />
						<span className="min-w-0 flex-1 truncate text-left">
							{date ? formatDateTime(date) : placeholder}
						</span>
					</Button>
				</PopoverTrigger>

				<PopoverContent
					onClick={(e) => e.stopPropagation()}
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
						<div className="flex items-center gap-1 border h-10 border-border/60 rounded-l-[8px]">
							<input
								type="number"
								value={hours.toString().padStart(2, '0')}
								min={1}
								max={12}
								onChange={(e) => handleTimeChange('h', e.target.value)}
								className="w-12 text-center text-sm text-foreground font-medium !outline-none focus:!outline-none !border-0 focus:border-0"
							/>
							<span className="text-sm">:</span>
							<input
								type="number"
								value={minutes.toString().padStart(2, '0')}
								min={0}
								max={59}
								onChange={(e) => handleTimeChange('m', e.target.value)}
								className="w-12 text-center text-sm text-foreground font-medium !outline-none focus:!outline-none !border-0 focus:border-0"
							/>
						</div>

						<div className="flex flex-col h-10 w-14 border border-border/60 rounded-r-[8px] overflow-hidden">
							<button
								type="button"
								onClick={() => handleAmPmClick('AM')}
								className={cn(
									'w-full h-full text-xs font-medium',
									ampm === 'AM'
										? 'bg-[#458DC7] text-white'
										: 'bg-white text-foreground'
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
										: 'bg-white text-foreground'
								)}
							>
								PM
							</button>
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-3 border-t">
						<Button 
							variant="outline" 
							onClick={handleCancel}
							type="button"
						>
							Cancel
						</Button>
						<Button 
							onClick={handleDone}
							type="button"
						>
							Done
						</Button>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}