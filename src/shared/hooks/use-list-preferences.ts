import { useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import {
	getListPreferences,
	type ListPreferenceKey,
	type ListPreferenceValues,
	updateListPreferences,
} from '@doublescale/services/list-preferences-service';

type PersistenceOptions = {
	enabled?: boolean;
	debounceMs?: number;
};

export function useListPreferencesPersistence(
	listKey: ListPreferenceKey,
	values: Partial<ListPreferenceValues>,
	options: PersistenceOptions = {}
): void {
	const { enabled = true, debounceMs = 400 } = options;
	const isFirstRun = useRef(true);

	const save = useMemo(
		() =>
			debounce(async (payload: Partial<ListPreferenceValues>) => {
				try {
					await updateListPreferences(listKey, payload);
				} catch {
					// Preferences are best-effort; list data still works without them.
				}
			}, debounceMs),
		[listKey, debounceMs]
	);

	useEffect(() => {
		return () => {
			// Flush pending debounced saves when the page unmounts (e.g. SPA tab change)
			// so preferences are not lost before the 400ms debounce fires.
			save.flush();
		};
	}, [save]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		if (isFirstRun.current) {
			isFirstRun.current = false;
			return;
		}

		save(values);
	}, [enabled, save, values]);
}

export function useSavedListPreferences(
	listKey: ListPreferenceKey
): ListPreferenceValues {
	return useMemo(() => getListPreferences(listKey), [listKey]);
}
