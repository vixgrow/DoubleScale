/**
 * Shared calendar foundation — the presentational month grid + event chip, the
 * kind/status color map, the civil-date helpers, and the range/fetch hook. Imported
 * by both the customer portal calendar (`src/renderer/portal`) and the admin/staff
 * calendar (`src/client/pages/calendar`) via `@doublescale/shared/calendar`.
 *
 * Navigation and the data source are injected by the consumer (see `onSelect` on
 * the grid/chip and `fetcher` on {@link useCalendar}), so nothing here is tied to a
 * single bundle's router or API client.
 */

export * from './types';
export * from './colors';
export * from './dates';
export { default as EventChip } from './event-chip';
export type { EventChipProps } from './event-chip';
export { default as MonthGrid } from './month-grid';
export type { MonthGridProps } from './month-grid';
export { useCalendar } from './use-calendar';
export type {
	CalendarFetcher,
	CalendarGrid,
	UseCalendarResult,
} from './use-calendar';
