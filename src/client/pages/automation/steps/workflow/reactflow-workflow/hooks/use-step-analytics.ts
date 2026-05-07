/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type {
	StepAnalyticsResponse,
	FormattedAnalytics,
} from '../types/analytics';
import { formatAnalyticsForPopup } from '../types/analytics';

interface CachedAnalytics {
	data: FormattedAnalytics;
	timestamp: number;
}

interface UseStepAnalyticsReturn {
	analyticsData: FormattedAnalytics | null;
	isLoading: boolean;
	isVisible: boolean;
	error: string | null;
	fetchAnalytics: (stepId: number, forceRefresh?: boolean) => Promise<void>;
	showAnalytics: () => void;
	hideAnalytics: () => void;
	clearCache: () => void;
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Custom hook for fetching and managing step analytics with caching
 *
 * @returns Analytics state and control functions
 */
export const useStepAnalytics = (): UseStepAnalyticsReturn => {
	const [analyticsData, setAnalyticsData] =
		useState<FormattedAnalytics | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cache, setCache] = useState<Record<number, CachedAnalytics>>({});
	const { createNotice } = useDispatch('doublescale/core');

	const fetchAnalytics = useCallback(
		async (stepId: number, forceRefresh = false) => {
			// Check cache first (unless force refresh)
			if (!forceRefresh && cache[stepId]) {
				const cached = cache[stepId];
				const age = Date.now() - cached.timestamp;

				if (age < CACHE_TTL) {
					// Use cached data
					setAnalyticsData(cached.data);
					setIsVisible(true);
					return;
				}
			}

			setIsLoading(true);
			setError(null);

			try {
				const response = (await apiFetch({
					path: `/doublescale/v1/automation-steps/${stepId}/analytics`,
					method: 'GET',
				})) as StepAnalyticsResponse;

				const formatted = formatAnalyticsForPopup(response);

				// Update cache
				setCache((prev) => ({
					...prev,
					[stepId]: {
						data: formatted,
						timestamp: Date.now(),
					},
				}));

				setAnalyticsData(formatted);
				setIsVisible(true);
			} catch (err) {
				const errorMessage = __(
					'Failed to load analytics. Please try again.',
					'doublescale'
				);
				setError(errorMessage);

				createNotice({
					type: 'error',
					message: errorMessage,
				});

				console.error('Analytics fetch error:', err);
			} finally {
				setIsLoading(false);
			}
		},
		[cache, createNotice]
	);

	const showAnalytics = useCallback(() => {
		setIsVisible(true);
	}, []);

	const hideAnalytics = useCallback(() => {
		setIsVisible(false);
	}, []);

	const clearCache = useCallback(() => {
		setCache({});
	}, []);

	return {
		analyticsData,
		isLoading,
		isVisible,
		error,
		fetchAnalytics,
		showAnalytics,
		hideAnalytics,
		clearCache,
	};
};
