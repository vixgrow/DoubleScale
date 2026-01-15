/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

interface ActivityOperationsReturn {
	deleteActivity: (activityId: number) => Promise<void>;
}

export const useActivityOperations = (): ActivityOperationsReturn => {
	/**
	 * Delete activity (only for user-created activities)
	 */
	const deleteActivity = useCallback(async (activityId: number) => {
		try {
			await apiFetch({
				path: `/qc/v1/activities/${activityId}`,
				method: 'DELETE',
			});
		} catch (error: any) {
			const errorMessage = error?.message || __('Failed to delete activity. Please try again.', 'quillcrm');
			throw new Error(errorMessage);
		}
	}, []);

	return {
		deleteActivity,
	};
};
