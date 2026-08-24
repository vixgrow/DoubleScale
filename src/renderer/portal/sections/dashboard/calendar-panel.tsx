/**
 * Calendar panel embedded in the dashboard home — month grid of the contact's
 * dated activity (bookings, invoice due dates, proposal expiries).
 */

import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { endOfMonth, format, startOfMonth } from 'date-fns';
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
import { EmptyState, ErrorState, PORTAL_DASHBOARD_TILE, Spinner } from '../../shared/ui';

interface KindFilter {
	kind: PortalCalendarEventKind;
	label: string;
}

// Mirrors the admin calendar legend order, minus Tasks — tasks are internal
// staff work and are never projected into the portal feed. A kind whose module
// is disabled simply contributes no events, so its chip renders inert rather
// than needing its own gate here.
const KIND_FILTERS: KindFilter[] = [
	{ kind: 'booking', label: __('Bookings', 'doublescale') },
	{ kind: 'deal', label: __('Deals', 'doublescale') },
	{ kind: 'contract', label: __('Contracts', 'doublescale') },
	{ kind: 'invoice', label: __('Invoices', 'doublescale') },
	{ kind: 'proposal', label: __('Proposals', 'doublescale') },
];

const CalendarPanel = () => {
	const navigate = useNavigate();
	const weekStartsOn = normalizeWeekStartsOn(
		getPortalConfig()?.calendarWeekStartsOn
	);
	const { grid, events, loading, error, goPrev, goNext, goToday } =
		useCalendar(fetchCalendar, [], weekStartsOn);

	const [selectedKind, setSelectedKind] =
		useState<PortalCalendarEventKind | null>(null);

	const selectKind = (kind: PortalCalendarEventKind) => {
		setSelectedKind((current) => (current === kind ? null : kind));
	};

	const visibleEvents = useMemo(() => {
		if (!selectedKind) {
			return events;
		}
		return events.filter((e) => e.kind === selectedKind);
	}, [events, selectedKind]);

	const onSelect = (event: CalendarEvent) => {
		if (event.route) {
			navigate(event.route);
		}
	};

	const monthStart = startOfMonth(grid.cursor);
	const monthEnd = endOfMonth(grid.cursor);
	const rangeLabel = `${format(monthStart, 'MMM d, yyyy')} - ${format(monthEnd, 'MMM d, yyyy')}`;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h3 className="text-base font-semibold text-foreground">
					{__('Calendar', 'doublescale')}
				</h3>
				<div className="flex flex-wrap items-center gap-3">
					{KIND_FILTERS.map(({ kind, label }) => {
						const active = selectedKind === kind;
						const tone = kindTone(kind);
						return (
							<button
								key={kind}
								type="button"
								onClick={() => selectKind(kind)}
								aria-pressed={active}
								className={`inline-flex items-center gap-2 rounded-lg border p-2 text-sm font-medium transition-colors ${
									active
										? 'border-[#EEEEFF] bg-[#EEEEFF] text-primary'
										: 'border-border bg-white text-foreground hover:border-primary/30'
								}`}
							>
								<span
									className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`}
									aria-hidden="true"
								/>
								{label}
							</button>
						);
					})}
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold text-foreground">
						{format(grid.cursor, 'MMMM yyyy')}
					</p>
					<p className="text-xs text-muted-foreground">
						{rangeLabel}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<div
						className={`flex items-center overflow-hidden border border-border ${PORTAL_DASHBOARD_TILE} !rounded-lg`}
					>
						<button
							type="button"
							onClick={goPrev}
							aria-label={__('Previous month', 'doublescale')}
							className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-accent"
						>
							<ChevronLeftIcon className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={goNext}
							aria-label={__('Next month', 'doublescale')}
							className="flex h-8 w-8 items-center justify-center border-s border-border text-muted-foreground hover:bg-accent"
						>
							<ChevronRightIcon className="h-4 w-4" />
						</button>
					</div>
					<button
						type="button"
						onClick={goToday}
						className={`px-4 py-1 h-8 text-sm font-medium text-foreground hover:bg-accent border border-primary ${PORTAL_DASHBOARD_TILE} !bg-[#EEEEFF] !rounded-lg`}
					>
						{__('Today', 'doublescale')}
					</button>
				</div>
			</div>

			{loading && <Spinner />}
			{!loading && error && <ErrorState message={error} />}
			{!loading && !error && (
				<>
					<div className={`overflow-hidden ${PORTAL_DASHBOARD_TILE}`}>
						<MonthGrid
							days={grid.days}
							cursor={grid.cursor}
							events={visibleEvents}
							onSelect={onSelect}
							weekStartsOn={grid.weekStartsOn}
						/>
					</div>
					{visibleEvents.length === 0 && (
						<EmptyState
							title={
								selectedKind
									? __(
											'Nothing in this category',
											'doublescale'
										)
									: __('Nothing scheduled', 'doublescale')
							}
							description={__(
								'Your bookings and document due dates will appear here.',
								'doublescale'
							)}
						/>
					)}
				</>
			)}
		</div>
	);
};

export default CalendarPanel;
