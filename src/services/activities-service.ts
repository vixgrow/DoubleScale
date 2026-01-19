/**
 * Activities Service
 *
 * Centralized service for managing activities and timeline API operations.
 * Provides type-safe API calls and consistent data transformation.
 *
 * @since 1.x.0
 * @package QuillCRM
 */

import apiFetch from '@wordpress/api-fetch';

/**
 * API Endpoints
 */
export const ACTIVITIES_ENDPOINTS = {
	/** Activities endpoint - for activity type tabs (Notes, Calls, etc.) */
	ACTIVITIES: '/qc/v1/activities',
	/** Timeline endpoint - for unified timeline (activities + tasks when Pro active) */
	TIMELINE: '/qc/v1/timeline',
} as const;

/**
 * Activity types
 */
export const ACTIVITY_TYPES = {
	NOTE: 'note',
	CALL_LOGGED: 'call_logged',
	EMAIL_SENT: 'email_sent',
	MEETING_SCHEDULED: 'meeting_scheduled',
	CREATED: 'created',
	STAGE_CHANGED: 'stage_changed',
	VALUE_CHANGED: 'value_changed',
	STATUS_CHANGED: 'status_changed',
} as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

/**
 * User interface for activity/task items
 */
export interface ActivityUser {
	id: number;
	display_name: string;
}

/**
 * API response item from /activities or /timeline endpoints
 */
export interface ActivitiesApiItem {
	id: number;
	item_type: 'activity' | 'task';
	activity_type?: string;
	task_type?: string;
	contact_id?: number;
	deal_id?: number;
	title?: string;
	description?: string;
	formatted_message?: string;
	data?: Record<string, unknown>;
	user_id?: number;
	user?: ActivityUser;
	status?: string;
	priority?: string;
	due_date?: string;
	due_time?: string;
	is_editable?: boolean;
	is_system?: boolean;
	created_at: string;
	updated_at?: string;
	comments_count?: number;
}

/**
 * Paginated API response
 */
export interface ActivitiesResponse {
	data: ActivitiesApiItem[];
	meta: {
		total: number;
		per_page: number;
		current_page: number;
		total_pages: number;
		pro_active: boolean;
	};
}

/**
 * Unified timeline item (transformed for UI)
 */
export interface TimelineItem {
	id: string;
	type: 'activity' | 'task';
	activity_id?: number;
	task_id?: number;
	title: string;
	description: string;
	timestamp: string;
	user?: ActivityUser;
	data?: Record<string, unknown>;
	icon_type: string;
	status?: string;
	priority?: string;
	due_date?: string;
	due_time?: string;
	comments_count?: number;
	/** Original activity/task object for editing - flexible type for component use */
	activity?: ActivitiesApiItem | Record<string, unknown>;
}

/**
 * Parameters for timeline/activities requests
 */
export interface TimelineParams {
	contact_id?: number;
	entity_id?: number;
	entity_type?: string | number;
	user_id?: number;
	date_from?: string;
	date_to?: string;
	sort_by?: 'created_at' | 'updated_at';
	sort_order?: 'asc' | 'desc';
	per_page?: number;
	page?: number;
}

/**
 * Parameters for activities requests (extends timeline with activity_type)
 */
export interface ActivitiesParams extends TimelineParams {
	activity_type?: ActivityType | string;
}

/**
 * Transform API item to unified TimelineItem format
 *
 * @param item - Raw API response item
 * @returns Transformed TimelineItem for UI consumption
 */
export function transformApiItemToTimelineItem(
	item: ActivitiesApiItem
): TimelineItem {
	if (item.item_type === 'task') {
		return {
			id: `task-${item.id}`,
			type: 'task',
			task_id: item.id,
			title: item.title || '',
			description: item.description || '',
			timestamp: item.created_at,
			user: item.user,
			data: undefined,
			icon_type: item.task_type || 'task',
			status: item.status,
			priority: item.priority,
			due_date: item.due_date,
			due_time: item.due_time,
			comments_count: 0,
		};
	}

	// Activity item
	return {
		id: `activity-${item.id}`,
		type: 'activity',
		activity_id: item.id,
		title: item.formatted_message || '',
		description: (item.data as Record<string, string>)?.message || '',
		timestamp: item.created_at,
		user: item.user,
		data: item.data,
		icon_type: item.activity_type || 'note',
		comments_count: item.comments_count || 0,
		activity: item,
	};
}

/**
 * Transform array of API items to TimelineItems
 *
 * @param items - Array of raw API response items
 * @returns Array of transformed TimelineItems
 */
export function transformApiItemsToTimeline(
	items: ActivitiesApiItem[]
): TimelineItem[] {
	return items.map(transformApiItemToTimelineItem);
}

/**
 * Build URL search params from object
 */
function buildParams(
	params: Record<string, string | number | undefined>
): URLSearchParams {
	const searchParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			searchParams.append(key, String(value));
		}
	});

	return searchParams;
}

/**
 * Activities Service
 *
 * Provides methods for fetching activities and timeline data
 */
export const ActivitiesService = {
	/**
	 * Get unified timeline (activities + tasks when Pro active)
	 * Use this for "All Activity" views
	 *
	 * @param params - Query parameters
	 * @returns Promise with timeline response
	 */
	async getTimeline(params: TimelineParams = {}): Promise<ActivitiesResponse> {
		const searchParams = buildParams({
			contact_id: params.contact_id,
			entity_id: params.entity_id,
			entity_type: params.entity_type,
			user_id: params.user_id,
			date_from: params.date_from,
			date_to: params.date_to,
			sort_by: params.sort_by,
			sort_order: params.sort_order,
			per_page: params.per_page,
			page: params.page,
		});

		return apiFetch({
			path: `${ACTIVITIES_ENDPOINTS.TIMELINE}?${searchParams.toString()}`,
		}) as Promise<ActivitiesResponse>;
	},

	/**
	 * Get activities filtered by type
	 * Use this for activity type tabs (Notes, Calls, etc.)
	 *
	 * @param params - Query parameters including activity_type
	 * @returns Promise with activities response
	 */
	async getActivities(
		params: ActivitiesParams = {}
	): Promise<ActivitiesResponse> {
		const searchParams = buildParams({
			contact_id: params.contact_id,
			entity_id: params.entity_id,
			entity_type: params.entity_type,
			user_id: params.user_id,
			activity_type: params.activity_type,
			date_from: params.date_from,
			date_to: params.date_to,
			sort_by: params.sort_by,
			sort_order: params.sort_order,
			per_page: params.per_page,
			page: params.page,
		});

		return apiFetch({
			path: `${ACTIVITIES_ENDPOINTS.ACTIVITIES}?${searchParams.toString()}`,
		}) as Promise<ActivitiesResponse>;
	},

	/**
	 * Fetch timeline or activities based on activity type filter
	 *
	 * Automatically selects the correct endpoint:
	 * - With activityType: uses /activities endpoint
	 * - Without activityType: uses /timeline endpoint
	 *
	 * @param params - Query parameters
	 * @param activityType - Optional activity type filter (for tabs)
	 * @returns Promise with response and transformed items
	 */
	async fetch(
		params: TimelineParams,
		activityType?: string
	): Promise<{
		response: ActivitiesResponse;
		items: TimelineItem[];
	}> {
		const response = activityType
			? await this.getActivities({ ...params, activity_type: activityType })
			: await this.getTimeline(params);

		const items = transformApiItemsToTimeline(response.data);

		return { response, items };
	},
};

export default ActivitiesService;
