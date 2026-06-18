/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useState, useEffect, useMemo } from 'react';
/**
 * internal dependencies
 */
import { ChevronDownIcon, CalendarDays, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover-dialog';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
	value: { from: Date | null; to: Date | null };
	onChange: (range: { from: Date | null; to: Date | null }) => void;
	placeholder?: string;
	className?: string;
}

interface Preset {
	label: string;
	getRange: () => { from: Date; to: Date };
}

const formatShort = (date: Date) =>
	date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

const SM_BREAKPOINT = 640;

function useIsSmallScreen() {
	const [isSmallScreen, setIsSmallScreen] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${SM_BREAKPOINT - 1}px)`);
		const onChange = () => setIsSmallScreen(mql.matches);
		mql.addEventListener('change', onChange);
		setIsSmallScreen(mql.matches);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	return isSmallScreen;
}

export function DateRangePicker({
	value,
	onChange,
	placeholder,
	className,
}: DateRangePickerProps) {
	const [open, setOpen] = useState(false);
	const [internalRange, setInternalRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>(value);

	useEffect(() => {
		setInternalRange(value);
	}, [value]);

	const presets = useMemo<Preset[]>(
		() => [
			{
				label: __('Today', 'doublescale'),
				getRange: () => {
					const t = new Date();
					return { from: t, to: t };
				},
			},
			{
				label: __('Yesterday', 'doublescale'),
				getRange: () => {
					const t = new Date();
					t.setDate(t.getDate() - 1);
					return { from: t, to: t };
				},
			},
			{
				label: __('Last 7 days', 'doublescale'),
				getRange: () => {
					const to = new Date();
					const from = new Date();
					from.setDate(from.getDate() - 6);
					return { from, to };
				},
			},
			{
				label: __('Last 30 days', 'doublescale'),
				getRange: () => {
					const to = new Date();
					const from = new Date();
					from.setDate(from.getDate() - 29);
					return { from, to };
				},
			},
			{
				label: __('This month', 'doublescale'),
				getRange: () => {
					const now = new Date();
					const from = new Date(now.getFullYear(), now.getMonth(), 1);
					return { from, to: now };
				},
			},
			{
				label: __('Last month', 'doublescale'),
				getRange: () => {
					const now = new Date();
					const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
					const to = new Date(now.getFullYear(), now.getMonth(), 0);
					return { from, to };
				},
			},
		],
		[]
	);

	const formatTriggerLabel = () => {
		if (!internalRange.from)
			return placeholder || __('Date Range', 'doublescale');

		if (internalRange.to) {
			const sameDay =
				internalRange.from.toDateString() ===
				internalRange.to.toDateString();
			return sameDay
				? formatShort(internalRange.from)
				: `${formatShort(internalRange.from)} – ${formatShort(internalRange.to)}`;
		}
		return formatShort(internalRange.from);
	};

	const handleDateSelect = (range: any) => {
		let newRange = {
			from: range?.from ?? null,
			to: range?.to ?? null,
		};

		if (newRange.from && newRange.to && newRange.from > newRange.to) {
			newRange = { from: newRange.to, to: newRange.from };
		}

		setInternalRange(newRange);

		// react-day-picker v9 fires the first click in mode="range" as
		// { from: X, to: X }. Treating that as a complete same-day range
		// (and auto-closing) would make picking an actual range impossible.
		// Only auto-close on a distinct two-day range or when cleared.
		const isDistinctRange =
			newRange.from &&
			newRange.to &&
			newRange.from.getTime() !== newRange.to.getTime();
		const isCleared = !newRange.from && !newRange.to;

		if (isDistinctRange || isCleared) {
			onChange(newRange);
			setOpen(false);
		}
	};

	const applyDateRange = () => {
		onChange(internalRange);
		setOpen(false);
	};

	const clearDateRange = () => {
		const clearedRange = { from: null, to: null };
		setInternalRange(clearedRange);
		onChange(clearedRange);
		setOpen(false);
	};

	const applyPreset = (preset: Preset) => {
		const range = preset.getRange();
		setInternalRange(range);
		onChange(range);
		setOpen(false);
	};

	const hasSelection = Boolean(internalRange.from);
	const isSmallScreen = useIsSmallScreen();
	const numberOfMonths = isSmallScreen ? 1 : 2;

	return (
		<Popover open={open} onOpenChange={setOpen} modal={false}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						// Base layout — fixed width so selection does not resize the trigger
						'group relative h-10 w-[220px] max-w-[220px] shrink-0 justify-start gap-2.5 overflow-hidden rounded-lg pl-2 pr-3 text-sm font-medium transition-all duration-150 max-sm:w-full max-sm:max-w-full lg:w-[10.5rem] lg:max-w-[10.5rem] lg:gap-1.5 lg:px-2 xl:w-[220px] xl:max-w-[220px] xl:gap-2.5 xl:px-3',
						// Empty state
						!hasSelection &&
							'border-input bg-white text-muted-foreground shadow-sm hover:border-brandPrimary/40 hover:bg-brandPrimary/[0.02]',
						// Filled state — subtle brand-tinted background so it reads as "active"
						hasSelection &&
							'border-brandPrimary/25 bg-brandPrimary/[0.04] text-foreground shadow-sm hover:border-brandPrimary/60 hover:bg-brandPrimary/[0.08]',
						// Open state (Radix sets data-state="open" on the trigger)
						'data-[state=open]:border-brandPrimary data-[state=open]:bg-brandPrimary/[0.08] data-[state=open]:ring-2 data-[state=open]:ring-brandPrimary/20',
						// Focus ring
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandPrimary/30 focus-visible:ring-offset-1',
						className
					)}
				>
					{/* Icon chip */}
					<span
						className={cn(
							'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-colors',
							hasSelection
								? 'bg-brandPrimary text-white shadow-sm'
								: 'bg-brandPrimary/10 text-brandPrimary group-hover:bg-brandPrimary/15'
						)}
					>
						<CalendarDays className="!h-3.5 !w-3.5" />
					</span>

					{/* Label */}
					<span className="flex min-w-0 flex-1 flex-col items-start overflow-hidden text-left">
						{hasSelection && (
							<span className="w-full truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 leading-none">
								{__('Date range', 'doublescale')}
							</span>
						)}
						<span className="w-full truncate text-sm font-medium leading-tight">
							{formatTriggerLabel()}
						</span>
					</span>

					{/* Right-side affordance: clear (if filled) or chevron */}
					{hasSelection ? (
						<span
							role="button"
							tabIndex={-1}
							aria-label={__('Clear date range', 'doublescale')}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								clearDateRange();
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
				className="z-[9999] flex max-h-[min(85dvh,640px)] w-auto flex-col overflow-y-auto rounded-xl border border-border bg-white p-0 shadow-xl max-sm:max-w-[calc(100vw-2rem)]"
				align="start"
				side="bottom"
				sideOffset={8}
			>
				<div className="flex flex-col sm:flex-row">
					{/* Quick-preset rail */}
					<div className="flex w-full flex-col gap-1 border-b border-border bg-muted/30 p-3 sm:w-[160px] sm:border-b-0 sm:border-r">
						<p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
							{__('Quick select', 'doublescale')}
						</p>
						{presets.map((preset) => (
							<button
								key={preset.label}
								type="button"
								onClick={() => applyPreset(preset)}
								className="rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-brandPrimary/10 hover:text-brandPrimary"
							>
								{preset.label}
							</button>
						))}
					</div>

					{/* Calendar + footer */}
					<div className="flex flex-col">
						<div className="pointer-events-auto p-3">
							<Calendar
								mode="range"
								selected={{
									from: internalRange.from ?? undefined,
									to: internalRange.to ?? undefined,
								}}
								onSelect={handleDateSelect}
								numberOfMonths={numberOfMonths}
								pagedNavigation={numberOfMonths > 1}
								autoFocus
							/>
						</div>

						<div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3">
							<div className="text-xs text-muted-foreground">
								{hasSelection
									? formatTriggerLabel()
									: __('No date selected', 'doublescale')}
							</div>
							<div className="flex gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={clearDateRange}
									disabled={!hasSelection}
								>
									{__('Clear', 'doublescale')}
								</Button>
								<Button
									size="sm"
									onClick={applyDateRange}
									disabled={!internalRange.from}
								>
									{__('Apply', 'doublescale')}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
