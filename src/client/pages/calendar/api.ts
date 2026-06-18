/**
 * Admin/staff calendar API client.
 *
 * Runs inside WP admin, where `apiFetch` is already bootstrapped with the REST root
 * + nonce middleware (unlike the portal renderer, which has to register them). So
 * this is a thin wrapper around the shared `/doublescale/v1/calendar` endpoint.
 */

import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

import type { CalendarFeedResponse } from '@doublescale/shared/calendar';

const CALENDAR = '/doublescale/v1/calendar';

/**
 * Role-scoped calendar feed for a date window. `start`/`end` are `YYYY-MM-DD`; the
 * server clamps the span and owns the inclusive end-of-day bound.
 *
 * `viewUser` is the manager-only "view as assignee" id: `0` (omitted) means the
 * full team view for managers / own records for reps; a positive id scopes to one
 * staffer. The server honors it only for manager-tier viewers, so passing it as a
 * rep is harmless.
 */
export const fetchAdminCalendar = (
	start: string,
	end: string,
	viewUser = 0
): Promise<CalendarFeedResponse> =>
	apiFetch<CalendarFeedResponse>({
		path: addQueryArgs(
			CALENDAR,
			viewUser > 0 ? { start, end, view_user: viewUser } : { start, end }
		),
	});
