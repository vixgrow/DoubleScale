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

interface UseStepAnalyticsReturn {
	analyticsData: FormattedAnalytics | null;
	isLoading: boolean;
	isVisible: boolean;
	error: string | null;
	fetchAnalytics: (stepId: number) => Promise<void>;
	showAnalytics: () => void;
	hideAnalytics: () => void;
}

/**
 * Custom hook for fetching and managing step analytics
 *
 * @returns Analytics state and control functions
 */
export const useStepAnalytics = (): UseStepAnalyticsReturn => {
	const [analyticsData, setAnalyticsData] =
		useState<FormattedAnalytics | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchAnalytics = useCallback(
		async (stepId: number) => {
			setIsLoading(true);
			setError(null);

			try {
				const response = (await apiFetch({
					path: `/qc/v1/automation-steps/${stepId}/analytics`,
					method: 'GET',
				})) as StepAnalyticsResponse;

				const formatted = formatAnalyticsForPopup(response);
				setAnalyticsData(formatted);
				setIsVisible(true);
			} catch (err) {
				const errorMessage = __(
					'Failed to load analytics. Please try again.',
					'quillcrm'
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
		[createNotice]
	);

	const showAnalytics = useCallback(() => {
		setIsVisible(true);
	}, []);

	const hideAnalytics = useCallback(() => {
		setIsVisible(false);
	}, []);

	return {
		analyticsData,
		isLoading,
		isVisible,
		error,
		fetchAnalytics,
		showAnalytics,
		hideAnalytics,
	};
};
