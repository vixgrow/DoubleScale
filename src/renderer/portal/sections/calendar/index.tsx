/**
 * Calendar section — the aggregate month view of the contact's dated activity
 * (bookings, invoice due dates, proposal expiries). Read-only: clicking an event
 * navigates to its in-portal detail route. The "Filter By" control toggles event
 * kinds client-side over the already-fetched window (no refetch).
 *
 * The grid, chips, colors, and range/fetch hook now come from the shared calendar
 * foundation (`@doublescale/shared/calendar`); this section keeps the portal's own
 * `fetchCalendar`, in-portal navigation, and header/filter chrome.
 *
 * Phase 1 ships the Month view only; the header is laid out to grow Week/Day
 * toggles later (see docs/portal-calendar-plan.md §4).
 */

import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import {
	MonthGrid,
	useCalendar,
	normalizeWeekStartsOn,
	kindTone,
	type CalendarEvent,
} from '@doublescale/shared/calendar';
import type { PortalCalendarEventKind } from '../../types';
import { fetchCalendar } from '../../api';
import { getPortalConfig } from '../../config';
import { ChevronLeftIcon, ChevronRightIcon } from '../../shared/icons';
import { EmptyState, ErrorState, Spinner } from '../../shared/ui';

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
	const navigate = useNavigate();
	const weekStartsOn = normalizeWeekStartsOn(
		getPortalConfig()?.calendarWeekStartsOn
	);
	const { grid, events, loading, error, goPrev, goNext, goToday } =
		useCalendar(fetchCalendar, [], weekStartsOn);

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

	const onSelect = (event: CalendarEvent) => {
		if (event.route) {
			navigate(event.route);
		}
	};

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
						const tone = kindTone(kind);
						return (
							<button
								key={kind}
								type="button"
								onClick={() => toggleKind(kind)}
								aria-pressed={active}
								className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
									active
										? 'border-primary bg-primary/10 text-primary'
										: 'border-border text-muted-foreground hover:bg-accent'
								}`}
							>
								<span
									className={`h-2 w-2 shrink-0 rounded-full ${tone.dot} ${
										active ? '' : 'opacity-60'
									}`}
									aria-hidden="true"
								/>
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
						onSelect={onSelect}
						weekStartsOn={grid.weekStartsOn}
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
