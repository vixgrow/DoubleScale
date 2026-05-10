/**
 * Notification Service
 *
 * Centralized service for managing notifications API operations.
 */

import apiFetch from '@wordpress/api-fetch';

export const NOTIFICATIONS_ENDPOINTS = {
	BASE: '/doublescale/v1/notifications',
	COUNT: '/doublescale/v1/notifications/count',
	READ: '/doublescale/v1/notifications/read',
} as const;

export interface Notification {
	id: number;
	user_id: number;
	category: string;
	subcategory: string;
	title: string;
	message: string;
	link?: string | null;
	mobile_link?: string | null;
	is_read: boolean;
	created_at: string;
	created_at_ts: number;
}

export interface NotificationsResponse {
	notifications: Notification[];
	total: number;
	page: number;
	per_page: number;
	total_pages: number;
}

export interface UnreadCountResponse {
	unread_count: number;
}

export interface MarkAsReadResponse {
	success: boolean;
	message: string;
	count?: number;
}

export interface NotificationsParams {
	page?: number;
	per_page?: number;
}

export const NotificationService = {
	async getNotifications(
		params: NotificationsParams = {}
	): Promise<NotificationsResponse> {
		const searchParams = new URLSearchParams();

		if (params.page) {
			searchParams.append('page', String(params.page));
		}
		if (params.per_page) {
			searchParams.append('per_page', String(params.per_page));
		}

		const queryString = searchParams.toString();
		const path = queryString
			? `${NOTIFICATIONS_ENDPOINTS.BASE}?${queryString}`
			: NOTIFICATIONS_ENDPOINTS.BASE;

		return apiFetch({ path }) as Promise<NotificationsResponse>;
	},

	async getUnreadCount(): Promise<UnreadCountResponse> {
		return apiFetch({
			path: NOTIFICATIONS_ENDPOINTS.COUNT,
		}) as Promise<UnreadCountResponse>;
	},

	async markAsRead(id?: number): Promise<MarkAsReadResponse> {
		return apiFetch({
			path: NOTIFICATIONS_ENDPOINTS.READ,
			method: 'POST',
			data: id ? { id } : {},
		}) as Promise<MarkAsReadResponse>;
	},

	async markAllAsRead(): Promise<MarkAsReadResponse> {
		return this.markAsRead();
	},

	async deleteNotification(
		id: number
	): Promise<{ success: boolean; message: string }> {
		return apiFetch({
			path: `${NOTIFICATIONS_ENDPOINTS.BASE}/${id}`,
			method: 'DELETE',
		}) as Promise<{ success: boolean; message: string }>;
	},
};

export default NotificationService;
