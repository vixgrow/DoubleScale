import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { format, isValid, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

export interface NativeDatePickerProps {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	/** Gray label before the value (e.g. "From", "To") — matches availability range fields. */
	prefix?: string;
	disabled?: boolean;
	/** ISO date (YYYY-MM-DD) — earliest selectable day. */
	min?: string;
	/** ISO date (YYYY-MM-DD) — latest selectable day. */
	max?: string;
	className?: string;
	triggerClassName?: string;
	displayFormat?: 'long' | 'short';
	variant?: 'ghost' | 'outline';
}

function parseValue(value: string | undefined): Date | undefined {
	if (!value?.trim()) {
		return undefined;
	}
	const parsed = parseISO(value);
	return isValid(parsed) ? parsed : undefined;
}

function formatDisplay(
	date: Date | undefined,
	displayFormat: 'long' | 'short'
): string {
	if (!date) {
		return '';
	}
	return displayFormat === 'short'
		? format(date, 'MM/dd/yyyy')
		: format(date, 'PPP');
}

/**
 * Date picker styled like the plugin's Input/Select triggers with the
 * plugin's shadcn Calendar. Calendar is positioned absolute below the
 * trigger (not fixed+viewport) so it stays anchored inside Radix Dialog,
 * which uses transform and breaks fixed viewport coordinates.
 */
export function NativeDatePicker({
	value,
	onChange,
	placeholder,
	prefix,
	disabled = false,
	min,
	max,
	className,
	triggerClassName,
	displayFormat = 'long',
	variant = 'outline',
}: NativeDatePickerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);

	const parsed = parseValue(value);
	const display = formatDisplay(parsed, displayFormat);
	const emptyLabel = placeholder || __('Pick a date', 'doublescale');

	const minDate = parseValue(min);
	const maxDate = parseValue(max);

	const isDayDisabled = (date: Date): boolean => {
		const ymd = format(date, 'yyyy-MM-dd');
		const dayStart = parseISO(ymd);
		if (minDate && dayStart < minDate) return true;
		if (maxDate && dayStart > maxDate) return true;
		return false;
	};

	useEffect(() => {
		if (!open) {
			return;
		}

		const handleOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (
				containerRef.current?.contains(target) ||
				menuRef.current?.contains(target)
			) {
				return;
			}
			setOpen(false);
		};
		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false);
			}
		};

		document.addEventListener('mousedown', handleOutside);
		document.addEventListener('keydown', handleKey);

		return () => {
			document.removeEventListener('mousedown', handleOutside);
			document.removeEventListener('keydown', handleKey);
		};
	}, [open]);

	return (
		<div
			ref={containerRef}
			className={cn('relative z-0 min-w-0', open && 'z-[1]', className)}
		>
			<button
				type="button"
				disabled={disabled}
				onClick={() => !disabled && setOpen((prev) => !prev)}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-label={
					display
						? prefix
							? `${prefix} ${display}`
							: display
						: emptyLabel
				}
				className={cn(
					'flex w-full items-center gap-2 text-left text-sm font-normal transition-colors',
					'focus:outline-none focus:ring-2 focus:ring-brandPrimary/20',
					'disabled:cursor-not-allowed disabled:opacity-50',
					variant === 'outline' && [
						'h-[48px] rounded-lg border border-input bg-white px-3',
						'focus:border-brandPrimary',
					],
					variant === 'ghost' && [
						'h-10 rounded-md bg-transparent px-2 hover:bg-accent/40',
					],
					triggerClassName
				)}
			>
				<CalendarIcon className="h-4 w-4 shrink-0 text-[#9BA7B7]" />
				{prefix ? (
					<>
						<span className="shrink-0 text-[#9BA7B7]">
							{prefix}
						</span>
						<span className="truncate text-[#3F4254]">
							{display || emptyLabel}
						</span>
					</>
				) : (
					<span
						className={cn(
							'truncate',
							display ? 'text-[#09090B]' : 'text-[#71717A]'
						)}
					>
						{display || emptyLabel}
					</span>
				)}
			</button>
			{open && (
				<div
					ref={menuRef}
					role="dialog"
					aria-label={emptyLabel}
					className={cn(
						'absolute left-0 top-full z-[170000] mt-1',
						'rounded-md border bg-popover p-0 text-popover-foreground shadow-md',
						'pointer-events-auto'
					)}
				>
					<Calendar
						mode="single"
						selected={parsed}
						defaultMonth={parsed}
						onSelect={(date) => {
							if (!date) return;
							onChange(format(date, 'yyyy-MM-dd'));
							setOpen(false);
						}}
						disabled={isDayDisabled}
						initialFocus
					/>
				</div>
			)}
		</div>
	);
}
