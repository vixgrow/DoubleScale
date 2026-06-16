/**
 * Calendar section — the aggregate month view of the contact's dated activity
 * (bookings, invoice due dates, proposal expiries). Read-only: clicking an event
 * navigates to its in-portal detail route. The "Filter By" control toggles event
 * kinds client-side over the already-fetched window (no refetch).
 *
 * Phase 1 ships the Month view only; the header is laid out to grow Week/Day
 * toggles later (see docs/portal-calendar-plan.md §4).
 */

import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { format } from 'date-fns';

import type { PortalCalendarEventKind } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../../shared/icons';
import { EmptyState, ErrorState, Spinner } from '../../shared/ui';
import MonthGrid from './month-grid';
import { useCalendar } from './use-calendar';

interface KindFilter {
	kind: PortalCalendarEventKind;
	label: string;
}

const KIND_FILTERS: KindFilter[] = [
	{ kind: 'booking', label: __( 'Bookings', 'doublescale' ) },
	{ kind: 'invoice', label: __( 'Invoices', 'doublescale' ) },
	{ kind: 'proposal', label: __( 'Proposals', 'doublescale' ) },
];

const Calendar = () => {
	const { grid, events, loading, error, goPrev, goNext, goToday } =
		useCalendar();

	// All kinds visible by default; toggling removes a kind from the view.
	const [hidden, setHidden] = useState<Set<PortalCalendarEventKind>>(
		() => new Set()
	);

	const toggleKind = (kind: PortalCalendarEventKind) => {
		setHidden((prev) => {
			const next = new Set(prev);
			if (next.has(kind)) {
				next.delete(kind);
			} else {
				next.add(kind);
			}
			return next;
		});
	};

	const visibleEvents = useMemo(
		() => events.filter((e) => !hidden.has(e.kind)),
		[events, hidden]
	);

	return (
		<section className="space-y-4">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-lg border border-border">
						<button
							type="button"
							onClick={goPrev}
							aria-label={__( 'Previous month', 'doublescale' )}
							className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-accent"
						>
							<ChevronLeftIcon className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={goNext}
							aria-label={__( 'Next month', 'doublescale' )}
							className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-accent"
						>
							<ChevronRightIcon className="h-4 w-4" />
						</button>
					</div>
					<button
						type="button"
						onClick={goToday}
						className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
					>
						{__( 'Today', 'doublescale' )}
					</button>
				</div>

				<h2 className="text-lg font-bold text-foreground">
					{format(grid.cursor, 'MMMM yyyy')}
				</h2>

				<div className="flex flex-wrap items-center gap-1.5">
					{KIND_FILTERS.map(({ kind, label }) => {
						const active = !hidden.has(kind);
						return (
							<button
								key={kind}
								type="button"
								onClick={() => toggleKind(kind)}
								aria-pressed={active}
								className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
									active
										? 'border-primary bg-primary/10 text-primary'
										: 'border-border text-muted-foreground hover:bg-accent'
								}`}
							>
								{label}
							</button>
						);
					})}
				</div>
			</header>

			{loading && <Spinner />}
			{!loading && error && <ErrorState message={error} />}
			{!loading && !error && (
				<>
					<MonthGrid
						days={grid.days}
						cursor={grid.cursor}
						events={visibleEvents}
					/>
					{events.length === 0 && (
						<EmptyState
							title={__( 'Nothing scheduled', 'doublescale' )}
							description={__(
								'Your bookings and document due dates will appear here.',
								'doublescale'
							)}
						/>
					)}
				</>
			)}
		</section>
	);
};

export default Calendar;
