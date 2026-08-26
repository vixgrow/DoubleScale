/**
 * Client Portal API client.
 *
 * Talks to `/doublescale/v1/portal/*`. Storefront pages don't auto-bootstrap
 * apiFetch (unlike WP admin), so we register the REST root + nonce middleware
 * from the localized config — same approach as the support renderer. (Both
 * registering the same middleware is idempotent: identical root + nonce.)
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

import { getPortalConfig } from './config';
import type {
	PortalBooking,
	PortalBootstrap,
	PortalCalendarResponse,
	PortalDocument,
	PortalPaymentsResponse,
	PortalProject,
	PortalSubscription,
	PortalTimelineResponse,
} from './types';

const config = getPortalConfig();

if (config) {
	apiFetch.use(apiFetch.createRootURLMiddleware(config.rest_root));
	apiFetch.use(apiFetch.createNonceMiddleware(config.nonce));
}

const PORTAL = '/doublescale/v1/portal';

export const formatRestError = (err: unknown): string => {
	const e = err as { message?: string };
	if (typeof e?.message === 'string' && e.message.trim()) {
		return e.message.trim();
	}
	return __('Something went wrong. Please try again.', 'doublescale');
};

export const fetchBootstrap = (): Promise<PortalBootstrap> =>
	apiFetch<PortalBootstrap>({ path: `${PORTAL}/bootstrap` });

export const fetchTimeline = (
	page = 1,
	perPage = 20
): Promise<PortalTimelineResponse> =>
	apiFetch<PortalTimelineResponse>({
		path: addQueryArgs(`${PORTAL}/timeline`, {
			page,
			per_page: perPage,
		}),
	});

export type BookingFilter = 'all' | 'upcoming' | 'past' | 'cancelled';

export const fetchBookings = (
	filter: BookingFilter = 'all'
): Promise<{ data: PortalBooking[] }> =>
	apiFetch<{ data: PortalBooking[] }>({
		path: addQueryArgs(`${PORTAL}/bookings`, { filter }),
	});

export const fetchBooking = (id: number): Promise<PortalBooking> =>
	apiFetch<PortalBooking>({ path: `${PORTAL}/bookings/${id}` });

export const cancelBooking = (
	id: number,
	reason?: string
): Promise<{ message: string; booking: PortalBooking }> =>
	apiFetch<{ message: string; booking: PortalBooking }>({
		path: `${PORTAL}/bookings/${id}/cancel`,
		method: 'POST',
		data: { cancellation_reason: reason || '' },
	});

export const fetchRescheduleUrl = (id: number): Promise<{ url: string }> =>
	apiFetch<{ url: string }>({
		path: `${PORTAL}/bookings/${id}/reschedule-url`,
	});

export const fetchProjects = (): Promise<{ data: PortalProject[] }> =>
	apiFetch<{ data: PortalProject[] }>({ path: `${PORTAL}/projects` });

export const fetchProject = (id: number): Promise<PortalProject> =>
	apiFetch<PortalProject>({ path: `${PORTAL}/projects/${id}` });

export type DocumentFilter =
	| 'all'
	| 'invoice'
	| 'proposal'
	| 'contract'
	| 'credit_note';

export const fetchDocuments = (
	type: DocumentFilter = 'all'
): Promise<{ data: PortalDocument[] }> =>
	apiFetch<{ data: PortalDocument[] }>({
		path: addQueryArgs(`${PORTAL}/documents`, { type }),
	});

export const fetchPayments = (): Promise<PortalPaymentsResponse> =>
	apiFetch<PortalPaymentsResponse>({ path: `${PORTAL}/payments` });

export const fetchSubscriptions = (): Promise<{ data: PortalSubscription[] }> =>
	apiFetch<{ data: PortalSubscription[] }>({
		path: `${PORTAL}/subscriptions`,
	});

export const cancelSubscription = (
	id: number
): Promise<{ message: string; subscription: PortalSubscription }> =>
	apiFetch<{ message: string; subscription: PortalSubscription }>({
		path: `${PORTAL}/subscriptions/${id}/cancel`,
		method: 'POST',
	});

/**
 * Aggregated calendar feed for a date window. `start`/`end` are `YYYY-MM-DD`;
 * the server clamps the span and owns the inclusive end-of-day bound.
 */
export const fetchCalendar = (
	start: string,
	end: string
): Promise<PortalCalendarResponse> =>
	apiFetch<PortalCalendarResponse>({
		path: addQueryArgs(`${PORTAL}/calendar`, { start, end }),
	});

/**
 * Generic data hook for the read endpoints.
 */
export const useAsync = <T>(loader: () => Promise<T>, deps: unknown[]) => {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const run = useCallback(() => {
		setLoading(true);
		setError(null);
		loader()
			.then((res) => setData(res))
			.catch((err) => setError(formatRestError(err)))
			.finally(() => setLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	useEffect(() => {
		run();
	}, [run]);

	return { data, loading, error, refetch: run };
};
