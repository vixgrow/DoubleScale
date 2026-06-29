/**
 * Per-user list table preferences (columns, filters, pagination).
 */

import apiFetch from '@wordpress/api-fetch';
import type { Filter } from '@doublescale/client';

export type ListPreferenceKey =
	| 'contacts'
	| 'lists'
	| 'tags'
	| 'automations'
	| 'email_sequences'
	| 'email_campaigns'
	| 'sms_campaigns'
	| 'forms';

export type SerializedDateRange = {
	from: string | null;
	to: string | null;
};

export type CampaignFiltersPreference = {
	status: string;
	type: string;
	createDate: SerializedDateRange;
	updatedAt: SerializedDateRange;
};

export type ListPreferenceValues = {
	per_page?: number;
	column_visibility?: Record<string, boolean>;
	show_filters?: boolean;
	filters?: Filter[];
	keyword?: string;
	date_range?: SerializedDateRange;
	campaign_filters?: CampaignFiltersPreference;
};

export type ListPreferencesMap = Partial<
	Record<ListPreferenceKey, ListPreferenceValues>
>;

function getConfigListPreferences(): ListPreferencesMap {
	return (
		(typeof window !== 'undefined'
			? window.doublescaleConfig?.listPreferences
			: undefined) ?? {}
	);
}

export function getListPreferences(
	listKey: ListPreferenceKey
): ListPreferenceValues {
	const saved = getConfigListPreferences()[listKey];
	return saved && typeof saved === 'object' ? { ...saved } : {};
}

export function parseSavedDateRange(
	saved?: SerializedDateRange | null
): { from: Date | null; to: Date | null } {
	const fromValue = saved?.from;
	const toValue = saved?.to;

	return {
		from:
			fromValue && !Number.isNaN(Date.parse(fromValue))
				? new Date(fromValue)
				: null,
		to:
			toValue && !Number.isNaN(Date.parse(toValue))
				? new Date(toValue)
				: null,
	};
}

export function serializeDateRange(range: {
	from: Date | null;
	to: Date | null;
}): SerializedDateRange {
	return {
		from: range.from ? range.from.toISOString() : null,
		to: range.to ? range.to.toISOString() : null,
	};
}

export function parseSavedCampaignFilters(saved?: CampaignFiltersPreference | null): {
	status: string;
	type: string;
	createDate: { from: Date | null; to: Date | null };
	updatedAt: { from: Date | null; to: Date | null };
} {
	return {
		status: saved?.status ?? 'all',
		type: saved?.type ?? 'all',
		createDate: parseSavedDateRange(saved?.createDate),
		updatedAt: parseSavedDateRange(saved?.updatedAt),
	};
}

export function serializeCampaignFilters(
	filters: {
		status: string;
		type: string;
		createDate: { from: Date | null; to: Date | null };
		updatedAt: { from: Date | null; to: Date | null };
	}
): CampaignFiltersPreference {
	return {
		status: filters.status,
		type: filters.type,
		createDate: serializeDateRange(filters.createDate),
		updatedAt: serializeDateRange(filters.updatedAt),
	};
}

function patchConfigListPreferences(
	listKey: ListPreferenceKey,
	values: ListPreferenceValues
): void {
	if (typeof window === 'undefined' || !window.doublescaleConfig) {
		return;
	}

	const current = getConfigListPreferences();
	window.doublescaleConfig.listPreferences = {
		...current,
		[listKey]: {
			...(current[listKey] ?? {}),
			...values,
		},
	};

	if (listKey === 'contacts' && values.column_visibility) {
		window.doublescaleConfig.contactsListPreferences = {
			column_visibility: values.column_visibility,
		};
	}
}

export async function updateListPreferences(
	listKey: ListPreferenceKey,
	values: Partial<ListPreferenceValues>
): Promise<ListPreferenceValues> {
	const response = await apiFetch<ListPreferenceValues>({
		path: `/doublescale/v1/list-preferences/${listKey}`,
		method: 'PUT',
		data: values,
	});

	patchConfigListPreferences(listKey, response);
	return response;
}
