/**
 * Knowledge Base admin REST client.
 *
 * The admin SPA talks to the `doublescale/v1` namespace (apiFetch is already
 * root-bootstrapped in wp-admin). Authoring endpoints are gated server-side on
 * `doublescale_manage_knowledgebase`.
 */

import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const BASE = '/doublescale/v1/knowledgebase';

export interface KbArticleSummary {
	id: number;
	title: string;
	slug: string;
	excerpt: string;
	status: 'publish' | 'draft' | 'private';
	menu_order: number;
	members_only: boolean;
	visibility: 'public' | 'members' | 'internal';
	views: number;
	group_id: number;
	reading_time: number;
	author: string;
	modified: string;
	url: string;
}

export interface KbArticleFull extends KbArticleSummary {
	content: string;
	tags: string[];
	group_ids: number[];
	related?: KbArticleSummary[];
}

export interface KbGroup {
	id: number;
	name: string;
	slug: string;
	parent: number;
	count: number;
	color: string;
	order: number;
	visibility: 'public' | 'members' | 'internal';
}

export interface KbSettings {
	public_access: 'public' | 'portal' | 'disabled';
	articles_per_page: number;
	enable_feedback: boolean;
	show_in_portal: boolean;
	default_group: number;
	show_toc: boolean;
	show_related: boolean;
	related_count: number;
	track_contact_views: boolean;
	default_visibility: 'public' | 'members';
	restricted_redirect_url: string;
}

export const listArticles = (params: {
	group?: number;
	search?: string;
	status?: string;
}): Promise<{ data: KbArticleSummary[]; meta: { total: number } }> =>
	apiFetch({ path: addQueryArgs(`${BASE}/articles`, params) });

export const getArticle = (id: number): Promise<KbArticleFull> =>
	apiFetch({ path: `${BASE}/articles/${id}` });

export const createArticle = (
	data: Partial<KbArticleFull> & { group_ids?: number[]; tags?: string[]; members_only?: boolean }
): Promise<KbArticleFull> =>
	apiFetch({ path: `${BASE}/articles`, method: 'POST', data });

export const updateArticle = (
	id: number,
	data: Partial<KbArticleFull> & { group_ids?: number[]; tags?: string[]; members_only?: boolean }
): Promise<KbArticleFull> =>
	apiFetch({ path: `${BASE}/articles/${id}`, method: 'PUT', data });

export const deleteArticle = (id: number): Promise<{ deleted: boolean }> =>
	apiFetch({ path: `${BASE}/articles/${id}`, method: 'DELETE' });

export const duplicateArticle = (id: number): Promise<KbArticleSummary> =>
	apiFetch({ path: `${BASE}/articles/${id}/duplicate`, method: 'POST' });

export const listGroups = (): Promise<{ data: KbGroup[] }> =>
	apiFetch({ path: `${BASE}/groups` });

export const createGroup = (data: Partial<KbGroup>): Promise<KbGroup> =>
	apiFetch({ path: `${BASE}/groups`, method: 'POST', data });

export const updateGroup = (id: number, data: Partial<KbGroup>): Promise<KbGroup> =>
	apiFetch({ path: `${BASE}/groups/${id}`, method: 'PUT', data });

export const deleteGroup = (id: number): Promise<{ deleted: boolean }> =>
	apiFetch({ path: `${BASE}/groups/${id}`, method: 'DELETE' });

export const getSettings = (): Promise<KbSettings> =>
	apiFetch({ path: `${BASE}/settings` });

export const saveSettings = (
	data: Partial<KbSettings>
): Promise<{ success: boolean; settings: KbSettings }> =>
	apiFetch({ path: `${BASE}/settings`, method: 'POST', data });
