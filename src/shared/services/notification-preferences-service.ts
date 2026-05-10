/**
 * Notification Preferences Service
 *
 * API client for notification preferences endpoints.
 */

import apiFetch from '@wordpress/api-fetch';

export interface ChannelPreferences {
	bell: boolean;
	email: boolean;
	browser: boolean;
	push: boolean;
}

export interface SubcategoryPreferences {
	bell: boolean;
	email: boolean;
	browser: boolean;
	push: boolean;
}

export interface NotificationPreferences {
	channels: ChannelPreferences;
	subcategories: Record<string, SubcategoryPreferences>;
}

export interface SubcategoryInfo {
	label: string;
	description: string;
}

export interface CategoryInfo {
	label: string;
	description: string;
	has_subcategories?: boolean;
	subcategories_count?: number;
	push_supported?: boolean;
	push_excluded_subcategories?: string[];
}

export interface CategoriesResponse {
	[key: string]: CategoryInfo;
}

export interface SubcategoriesResponse {
	[key: string]: SubcategoryInfo;
}

export async function getDefaults(): Promise<NotificationPreferences> {
	return apiFetch<NotificationPreferences>({
		path: '/doublescale/v1/notification-preferences/defaults',
		method: 'GET',
	});
}

export async function getPreferences(): Promise<NotificationPreferences> {
	return apiFetch<NotificationPreferences>({
		path: '/doublescale/v1/notification-preferences',
		method: 'GET',
	});
}

export async function updatePreferences(
	preferences: NotificationPreferences
): Promise<NotificationPreferences> {
	return apiFetch<NotificationPreferences>({
		path: '/doublescale/v1/notification-preferences',
		method: 'POST',
		data: preferences,
	});
}

export async function getCategories(): Promise<CategoriesResponse> {
	return apiFetch<CategoriesResponse>({
		path: '/doublescale/v1/notification-preferences/categories',
		method: 'GET',
	});
}

export async function getSubcategories(
	category: string
): Promise<SubcategoriesResponse> {
	return apiFetch<SubcategoriesResponse>({
		path: `/doublescale/v1/notification-preferences/subcategories/${category}`,
		method: 'GET',
	});
}
