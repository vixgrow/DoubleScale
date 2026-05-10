import { useState, useEffect, useCallback } from 'react';
import {
	getDefaults,
	getPreferences,
	updatePreferences,
	getCategories,
	getSubcategories,
	NotificationPreferences,
	CategoriesResponse,
	SubcategoriesResponse,
} from '@doublescale/services/notification-preferences-service';

const FALLBACK_PREFERENCES: NotificationPreferences = {
	channels: {
		bell: true,
		email: false,
		browser: true,
		push: true,
	},
	subcategories: {},
};

interface UseNotificationPreferencesReturn {
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
	preferences: NotificationPreferences;
	categories: CategoriesResponse;
	subcategories: Record<string, SubcategoriesResponse>;
	updateChannel: (channel: 'bell' | 'email' | 'browser' | 'push', enabled: boolean) => void;
	updateSubcategory: (
		subcategory: string,
		channel: 'bell' | 'email' | 'browser' | 'push',
		enabled: boolean
	) => void;
	savePreferences: () => Promise<void>;
	resetToDefaults: () => void;
	hasChanges: boolean;
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [preferences, setPreferences] =
		useState<NotificationPreferences>(FALLBACK_PREFERENCES);
	const [originalPreferences, setOriginalPreferences] =
		useState<NotificationPreferences>(FALLBACK_PREFERENCES);
	const [defaultPreferences, setDefaultPreferences] =
		useState<NotificationPreferences>(FALLBACK_PREFERENCES);
	const [categories, setCategories] = useState<CategoriesResponse>({});
	const [subcategories, setSubcategories] = useState<
		Record<string, SubcategoriesResponse>
	>({});

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const [prefs, defaults, cats] = await Promise.all([
					getPreferences(),
					getDefaults(),
					getCategories(),
				]);

				setPreferences(prefs);
				setOriginalPreferences(prefs);
				setDefaultPreferences(defaults);
				setCategories(cats);

				const categoriesWithSubs = Object.entries(cats).filter(
					([_, info]) => info.has_subcategories
				);

				if (categoriesWithSubs.length > 0) {
					const subData: Record<string, SubcategoriesResponse> = {};
					await Promise.all(
						categoriesWithSubs.map(async ([key, _]) => {
							subData[key] = await getSubcategories(key);
						})
					);
					setSubcategories(subData);
				}
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: 'Failed to load preferences'
				);
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, []);

	const updateChannel = useCallback(
		(channel: 'bell' | 'email' | 'browser' | 'push', enabled: boolean) => {
			setPreferences((prev) => ({
				...prev,
				channels: {
					...prev.channels,
					[channel]: enabled,
				},
			}));
		},
		[]
	);

	const updateSubcategory = useCallback(
		(
			subcategory: string,
			channel: 'bell' | 'email' | 'browser' | 'push',
			enabled: boolean
		) => {
			setPreferences((prev) => ({
				...prev,
				subcategories: {
					...prev.subcategories,
					[subcategory]: {
						...(prev.subcategories[subcategory] || {
							bell: true,
							email: true,
							browser: true,
							push: true,
						}),
						[channel]: enabled,
					},
				},
			}));
		},
		[]
	);

	const savePreferences = useCallback(async () => {
		try {
			setIsSaving(true);
			setError(null);

			const updated = await updatePreferences(preferences);
			setPreferences(updated);
			setOriginalPreferences(updated);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to save preferences'
			);
			throw err;
		} finally {
			setIsSaving(false);
		}
	}, [preferences]);

	const resetToDefaults = useCallback(() => {
		setPreferences(defaultPreferences);
	}, [defaultPreferences]);

	const hasChanges =
		JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

	return {
		isLoading,
		isSaving,
		error,
		preferences,
		categories,
		subcategories,
		updateChannel,
		updateSubcategory,
		savePreferences,
		resetToDefaults,
		hasChanges,
	};
}
