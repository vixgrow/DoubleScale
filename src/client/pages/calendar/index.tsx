/**
 * Admin / staff Calendar page — a cross-module month view of the logged-in staff
 * member's dated work (bookings, tasks, deals, contracts, invoice due dates,
 * proposal expiries), role-scoped on the server. Read-only in Phase 1: clicking an
 * event navigates to that record's existing admin detail route.
 *
 * The grid/chip/colors and the range+fetch hook are reused from the shared calendar
 * foundation (`@doublescale/shared/calendar`); this page owns the admin chrome —
 * `getToLink` navigation, the kind filter, and the manager-only assignee filter.
 *
 * Visibility is broad (any staff role); the row-level filtering happens server-side
 * in each provider, so an over-broad page gate can't leak another staffer's rows.
 * See docs/admin-calendar-plan.md.
 */

import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
	registerAdminPage,
	useNavigate,
	getToLink,
} from '@doublescale/navigation';
import {
	MonthGrid,
	useCalendar,
	type CalendarEvent,
	type CalendarEventKind,
} from '@doublescale/shared/calendar';
import { CalendarIcon } from '@doublescale/shared/icons';
import { Spinner } from '@/components/ui/spinner';

import { fetchAdminCalendar } from './api';
import {
	ASSIGNEE_ALL,
	isCalendarManager,
	useStafferRoster,
} from './use-assignee-filter';

interface KindFilter {
	kind: CalendarEventKind;
	label: string;
}

const KIND_FILTERS: KindFilter[] = [
	{ kind: 'booking', label: __( 'Bookings', 'doublescale' ) },
	{ kind: 'task', label: __( 'Tasks', 'doublescale' ) },
	{ kind: 'deal', label: __( 'Deals', 'doublescale' ) },
	{ kind: 'contract', label: __( 'Contracts', 'doublescale' ) },
	{ kind: 'invoice', label: __( 'Invoices', 'doublescale' ) },
	{ kind: 'proposal', label: __( 'Proposals', 'doublescale' ) },
];

const CalendarPage = () => {
	const navigate = useNavigate();
	const isManager = useMemo( isCalendarManager, [] );

	// Manager-only "view as assignee": 0 = All / own; >0 = a single staffer.
	const [ viewUser, setViewUser ] = useState< number >( ASSIGNEE_ALL );

	const fetcher = useCallback(
		( start: string, end: string ) =>
			fetchAdminCalendar( start, end, viewUser ),
		[ viewUser ]
	);
	const { grid, events, loading, error, goPrev, goNext, goToday } =
		useCalendar( fetcher, [ viewUser ] );

	// Build the staffer dropdown from the assignees seen while viewing All.
	const staffers = useStafferRoster(
		events,
		isManager && viewUser === ASSIGNEE_ALL
	);

	// All kinds visible by default; toggling removes a kind from the view.
	const [ hidden, setHidden ] = useState< Set< CalendarEventKind > >(
		() => new Set()
	);

	const toggleKind = ( kind: CalendarEventKind ) => {
		setHidden( ( prev ) => {
			const next = new Set( prev );
			if ( next.has( kind ) ) {
				next.delete( kind );
			} else {
				next.add( kind );
			}
			return next;
		} );
	};

	const visibleEvents = useMemo(
		() => events.filter( ( e ) => ! hidden.has( e.kind ) ),
		[ events, hidden ]
	);

	const onSelect = ( event: CalendarEvent ) => {
		if ( event.route ) {
			navigate( getToLink( event.route ) );
		}
	};

	return (
		<div className="doublescale-calendar-page space-y-4 p-6">
			<div className="flex items-center gap-2">
				<CalendarIcon />
				<h1 className="text-xl font-bold text-foreground">
					{ __( 'Calendar', 'doublescale' ) }
				</h1>
			</div>

			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-lg border border-border">
						<button
							type="button"
							onClick={ goPrev }
							aria-label={ __( 'Previous month', 'doublescale' ) }
							className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-accent"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={ goNext }
							aria-label={ __( 'Next month', 'doublescale' ) }
							className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-accent"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
					<button
						type="button"
						onClick={ goToday }
						className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
					>
						{ __( 'Today', 'doublescale' ) }
					</button>

					{ isManager && (
						<select
							value={ viewUser }
							onChange={ ( e ) =>
								setViewUser( Number( e.target.value ) )
							}
							aria-label={ __( 'Filter by assignee', 'doublescale' ) }
							className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground"
						>
							<option value={ ASSIGNEE_ALL }>
								{ __( 'All assignees', 'doublescale' ) }
							</option>
							{ staffers.map( ( s ) => (
								<option key={ s.id } value={ s.id }>
									{ s.name }
								</option>
							) ) }
						</select>
					) }
				</div>

				<h2 className="text-lg font-bold text-foreground">
					{ format( grid.cursor, 'MMMM yyyy' ) }
				</h2>

				<div className="flex flex-wrap items-center gap-1.5">
					{ KIND_FILTERS.map( ( { kind, label } ) => {
						const active = ! hidden.has( kind );
						return (
							<button
								key={ kind }
								type="button"
								onClick={ () => toggleKind( kind ) }
								aria-pressed={ active }
								className={ `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
									active
										? 'border-primary bg-primary/10 text-primary'
										: 'border-border text-muted-foreground hover:bg-accent'
								}` }
							>
								{ label }
							</button>
						);
					} ) }
				</div>
			</header>

			{ loading && (
				<div className="flex justify-center py-12">
					<Spinner className="size-6" />
				</div>
			) }
			{ ! loading && error && (
				<div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
					{ error }
				</div>
			) }
			{ ! loading && ! error && (
				<>
					<MonthGrid
						days={ grid.days }
						cursor={ grid.cursor }
						events={ visibleEvents }
						onSelect={ onSelect }
					/>
					{ events.length === 0 && (
						<p className="py-8 text-center text-sm text-muted-foreground">
							{ __(
								'Nothing scheduled in this range.',
								'doublescale'
							) }
						</p>
					) }
				</>
			) }
		</div>
	);
};

registerAdminPage( 'calendar', {
	path: 'calendar',
	component: CalendarPage,
	label: __( 'Calendar', 'doublescale' ),
	icon: <CalendarIcon />,
	// Cross-module aggregate, so it isn't tied to one requiresModule; content is
	// role-scoped server-side, so the page gate stays broad (any staff role).
	alwaysRegister: true,
} );

export default CalendarPage;
