/**
 * Booking module page registration.
 *
 * All booking admin pages live under the `booking/*` path namespace. Routes
 * are registered through CRM's `registerAdminPage` (src/navigation/api),
 * which the top-level `<PageLayout>` then mounts as React Router v6 routes.
 *
 * Each page component is lazy-loaded so the booking module's antd-heavy
 * dependency tree is only fetched when an admin actually navigates to a
 * booking route. The `registerAdminPage()` calls run synchronously at
 * import time (required by the navigation registry), but the `component`
 * value rendered via React Router is a lazy thunk wrapped in Suspense.
 */

import React, { useEffect, lazy, Suspense } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { registerAdminPage, useNavigate, getToLink } from '@doublescale/navigation';

const Calendars = lazy(() => import('./calendars'));
const Calendar = lazy(() => import('./calendar'));
const Availability = lazy(() => import('./availability'));
const AvailabilityDetails = lazy(() => import('./availability-details'));
const Bookings = lazy(() => import('./bookings'));
const BookingDetails = lazy(() => import('./booking-details'));
const Event = lazy(() => import('./event'));
const GeneralSettings = lazy(() => import('./global-settings'));

import {
	AvailabilityIcon,
	BookingIcon,
	SettingsIcon,
	UpcomingCalendarIcon,
} from '@/components/booking';

import { Skeleton } from '@/components/ui/skeleton';

const BookingPageSkeleton = () => (
	<div className="p-6 space-y-4">
		<Skeleton className="h-8 w-64" />
		<Skeleton className="h-4 w-96" />
		<div className="grid grid-cols-3 gap-4 mt-6">
			<Skeleton className="h-40" />
			<Skeleton className="h-40" />
			<Skeleton className="h-40" />
		</div>
	</div>
);

/**
 * Wrap each page in a Suspense boundary so lazy chunks show a skeleton
 * while loading.
 */
const wrap = (Page: React.ComponentType): (() => JSX.Element) => {
	return () => {
		useEffect(() => {
			window.document.documentElement.scrollTop = 0;
		}, []);

		return (
			<Suspense fallback={<BookingPageSkeleton />}>
				<div className="doublescale-booking-page-component-wrapper">
					<Page />
				</div>
			</Suspense>
		);
	};
};

/**
 * Booking root route: keeps `/booking` valid by redirecting to the Calendars
 * landing page. Auto-provisioning means a logged-in booking-capable user
 * always has at least one calendar, so the old "getting started" wizard is
 * unnecessary.
 */
const RedirectToCalendars = () => {
	const navigate = useNavigate();
	useEffect(() => {
		navigate(getToLink('booking/calendars'), { replace: true });
	}, [navigate]);
	return null;
};

registerAdminPage('booking-dashboard', {
	path: 'booking',
	component: wrap(RedirectToCalendars),
	label: __('Booking', 'doublescale'),
	icon: <UpcomingCalendarIcon width={24} height={24} />,
	// This route only redirects to `booking/calendars`; the destination
	// sub-routes enforce their own (booking_*) capabilities. Listing
	// unrelated CRM/sales caps here caused the sidebar click to redirect to
	// the dashboard for users with booking caps but no CRM caps.
	requiredCapability: [
		'doublescale_booking_manage_own_calendars',
		'doublescale_booking_read_all_calendars',
		'doublescale_booking_read_own_bookings',
		'doublescale_booking_read_all_bookings',
		'doublescale_booking_read_own_availability',
		'doublescale_booking_read_all_availability',
	],
	requiresModule: 'booking',
});

registerAdminPage('booking-calendars', {
	path: 'booking/calendars',
	component: wrap(Calendars),
	label: __('Calendars', 'doublescale'),
	hidden: true,
	icon: <UpcomingCalendarIcon width={24} height={24} />,
	requiredCapability: [
		'doublescale_booking_manage_own_calendars',
		'doublescale_booking_read_all_calendars',
	],
	requiresModule: 'booking',
});

registerAdminPage('booking-calendar', {
	path: 'booking/calendars/:id',
	component: wrap(Calendar),
	label: __('Calendar', 'doublescale'),
	hidden: true,
	requiredCapability: [
		'doublescale_booking_manage_own_calendars',
		'doublescale_booking_manage_all_calendars',
	],
	requiresModule: 'booking',
});

registerAdminPage('booking-event', {
	path: 'booking/calendars/:id/events/:eventId/:tab?',
	component: wrap(Event),
	label: __('Event', 'doublescale'),
	hidden: true,
	requiredCapability: [
		'doublescale_booking_manage_own_calendars',
		'doublescale_booking_manage_all_calendars',
	],
	requiresModule: 'booking',
});

registerAdminPage('booking-bookings', {
	path: 'booking/bookings',
	component: wrap(Bookings),
	label: __('Bookings', 'doublescale'),
	hidden: true,
	icon: <BookingIcon width={24} height={24} />,
	requiredCapability: [
		'doublescale_booking_read_own_bookings',
		'doublescale_booking_read_all_bookings',
	],
	requiresModule: 'booking',
});

registerAdminPage('booking-booking-details', {
	path: 'booking/bookings/:id/:period?',
	component: wrap(BookingDetails),
	label: __('Booking Details', 'doublescale'),
	hidden: true,
	requiresModule: 'booking',
});

registerAdminPage('booking-availability', {
	path: 'booking/availability',
	component: wrap(Availability),
	label: __('Availability', 'doublescale'),
	hidden: true,
	icon: <AvailabilityIcon width={24} height={24} />,
	requiredCapability: [
		'doublescale_booking_read_own_availability',
		'doublescale_booking_read_all_availability',
	],
	requiresModule: 'booking',
});

registerAdminPage('booking-availability-details', {
	path: 'booking/availability/:id',
	component: wrap(AvailabilityDetails),
	label: __('Availability Details', 'doublescale'),
	hidden: true,
	requiresModule: 'booking',
});

registerAdminPage('booking-settings', {
	path: 'booking/settings',
	component: wrap(GeneralSettings),
	label: __('Booking Settings', 'doublescale'),
	hidden: true,
	icon: <SettingsIcon width={24} height={24} />,
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'booking',
});
