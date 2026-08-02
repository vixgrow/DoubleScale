/**
 * Per-user list table preferences (columns, filters, pagination).
 */

import apiFetch from '@wordpress/api-fetch';

export type ListPreferenceKey =
	| 'contacts'
	| 'lists'
	| 'tags'
	| 'automations'
	| 'email_sequences'
	| 'email_campaigns'
	| 'sms_campaigns'
	| 'forms'
	| 'sales_pipeline'
	| 'tasks';

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

/**
 * Preferences that survive navigation.
 *
 * `filters` and `campaign_filters` are deliberately absent: the server strips
 * them in three separate places (ListPreferencesManager::get_all/get/update)
 * and `sanitize_preferences` has no branch for them, so anything sent under
 * those keys is silently discarded. Declaring them here would advertise a
 * guarantee the backend does not honour.
 */
export type SortPreference = {
	orderby: string;
	order: 'asc' | 'desc';
};

export type ListPreferenceValues = {
	page?: number;
	per_page?: number;
	sort?: SortPreference | null;
	column_visibility?: Record<string, boolean>;
	show_filters?: boolean;
	keyword?: string;
	date_range?: SerializedDateRange;
	view_mode?: 'kanban' | 'table' | 'list';
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

/**
 * Read a saved sort, dropping anything malformed.
 *
 * `allowedColumns` guards against restoring a sort on a column the list no
 * longer offers — the server would reject it and fall back to its default,
 * leaving the header arrow pointing at a column that isn't actually sorted.
 */
export function parseSavedSort(
	saved: SortPreference | null | undefined,
	allowedColumns?: readonly string[]
): SortPreference | null {
	if (!saved || typeof saved.orderby !== 'string') {
		return null;
	}

	if (allowedColumns && !allowedColumns.includes(saved.orderby)) {
		return null;
	}

	return {
		orderby: saved.orderby,
		order: saved.order === 'asc' ? 'asc' : 'desc',
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

/**
 * Apply preferences to the in-memory config without touching the network.
 *
 * List pages seed their state from `getListPreferences` synchronously on mount,
 * so the in-memory config must already be correct by the time a page remounts
 * after SPA navigation. Callers use this to guarantee that regardless of
 * whether a debounced save has been flushed or a PUT is still in flight.
 */
export function primeListPreferences(
	listKey: ListPreferenceKey,
	values: Partial<ListPreferenceValues>
): void {
	patchConfigListPreferences(listKey, values);
}

/**
 * Monotonic write counter per list key.
 *
 * Saves are debounced but not sequenced, so two rapid edits can be in flight at
 * once. Without this guard a slower earlier response could land last and
 * clobber the newer state the user actually wants.
 */
const writeSequence = new Map<ListPreferenceKey, number>();

export async function updateListPreferences(
	listKey: ListPreferenceKey,
	values: Partial<ListPreferenceValues>
): Promise<ListPreferenceValues> {
	// Patch optimistically *before* any network I/O. A page that remounts while
	// the PUT is still in flight reads the config synchronously, so waiting for
	// the response here is what made filters appear to reset on back-navigation.
	patchConfigListPreferences(listKey, values);

	const seq = (writeSequence.get(listKey) ?? 0) + 1;
	writeSequence.set(listKey, seq);

	const response = await apiFetch<ListPreferenceValues>({
		path: `/doublescale/v1/list-preferences/${listKey}`,
		method: 'PUT',
		data: values,
	});

	// Reconcile with what the server actually stored (it may sanitize values),
	// but only if no newer write has started in the meantime.
	if (writeSequence.get(listKey) === seq) {
		patchConfigListPreferences(listKey, response);
	}

	return response;
}
