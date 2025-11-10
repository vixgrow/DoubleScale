/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { handleApiError, ERROR_MESSAGES } from '../utils/error-handler';

interface ActivityOperationsReturn {
	addNote: (dealId: number, note: string) => Promise<any>;
	logCall: (dealId: number, callData: any) => Promise<any>;
	logEmail: (dealId: number, emailData: any) => Promise<any>;
	scheduleMeeting: (dealId: number, meetingData: any) => Promise<any>;
	updateActivity: (activityId: number, activityType: string, data: any) => Promise<any>;
	deleteActivity: (activityId: number) => Promise<void>;
	addComment: (activityId: number, content: string) => Promise<any>;
	updateComment: (commentId: number, content: string) => Promise<any>;
	deleteComment: (commentId: number) => Promise<void>;
	getActivityComments: (activityId: number) => Promise<any>;
	getActivityStatistics: (filters?: any) => Promise<any>;
}

export const useActivityOperations = (): ActivityOperationsReturn => {
	/**
	 * Add note to deal
	 */
	const addNote = useCallback(async (dealId: number, note: string) => {
		try {
			const response = await apiFetch({
				path: '/qc/v1/activities/notes',
				method: 'POST',
				data: {
					deal_id: dealId,
					note,
				},
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'add note',
				error,
				__('Failed to add note. Please try again.', 'quillcrm')
			);
			throw new Error(errorMessage);
		}
	}, []);

	/**
	 * Log call activity
	 */
	const logCall = useCallback(async (dealId: number, callData: any) => {
		try {
			const response = await apiFetch({
				path: '/qc/v1/activities/calls',
				method: 'POST',
				data: {
					deal_id: dealId,
					call_data: callData,
				},
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'log call',
				error,
				__('Failed to log call. Please try again.', 'quillcrm')
			);
			throw new Error(errorMessage);
		}
	}, []);

	/**
	 * Log email activity
	 */
	const logEmail = useCallback(async (dealId: number, emailData: any) => {
		try {
			const response = await apiFetch({
				path: '/qc/v1/activities/emails',
				method: 'POST',
				data: {
					deal_id: dealId,
					email_data: emailData,
				},
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'log email',
				error,
				__('Failed to log email. Please try again.', 'quillcrm')
			);
			throw new Error(errorMessage);
		}
	}, []);

	/**
	 * Schedule meeting activity
	 */
	const scheduleMeeting = useCallback(
		async (dealId: number, meetingData: any) => {
			try {
				const response = await apiFetch({
					path: '/qc/v1/activities/meetings',
					method: 'POST',
					data: {
						deal_id: dealId,
						meeting_data: meetingData,
					},
				});
				return response;
			} catch (error) {
				const errorMessage = handleApiError(
					'schedule meeting',
					error,
					__(
						'Failed to schedule meeting. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	/**
	 * Update activity (only for user-created activities)
	 */
	const updateActivity = useCallback(
		async (activityId: number, activityType: string, data: any) => {
			try {
				// Prepare request data based on activity type
				const requestData: any = {};
				
				switch (activityType) {
					case 'note_added':
						requestData.note = data.note || data;
						break;
					case 'email_sent':
						requestData.email_data = data.email_data || data;
						break;
					case 'call_logged':
						requestData.call_data = data.call_data || data;
						break;
					case 'meeting_scheduled':
						requestData.meeting_data = data.meeting_data || data;
						break;
					default:
						throw new Error('Invalid activity type for update');
				}

				const response = await apiFetch({
					path: `/qc/v1/activities/${activityId}`,
					method: 'PATCH',
					data: requestData,
				});
				return response;
			} catch (error) {
				const errorMessage = handleApiError(
					'update activity',
					error,
					__(
						'Failed to update activity. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	/**
	 * Delete activity (only for user-created activities)
	 */
	const deleteActivity = useCallback(async (activityId: number) => {
		try {
			await apiFetch({
				path: `/qc/v1/activities/${activityId}`,
				method: 'DELETE',
			});
		} catch (error) {
			const errorMessage = handleApiError(
				'delete activity',
				error,
				__(
					'Failed to delete activity. Please try again.',
					'quillcrm'
				)
			);
			throw new Error(errorMessage);
		}
	}, []);

	/**
	 * Add comment to activity
	 */
	const addComment = useCallback(
		async (activityId: number, content: string) => {
			try {
				const response = await apiFetch({
					path: `/qc/v1/activities/${activityId}/comments`,
					method: 'POST',
					data: {
						content,
					},
				});
				return response;
			} catch (error) {
				const errorMessage = handleApiError(
					'add comment',
					error,
					__('Failed to add comment. Please try again.', 'quillcrm')
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	/**
	 * Update comment
	 */
	const updateComment = useCallback(
		async (commentId: number, content: string) => {
			try {
				const response = await apiFetch({
					path: `/qc/v1/comments/${commentId}`,
					method: 'PATCH',
					data: {
						content,
					},
				});
				return response;
			} catch (error) {
				const errorMessage = handleApiError(
					'update comment',
					error,
					__(
						'Failed to update comment. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	/**
	 * Delete comment
	 */
	const deleteComment = useCallback(async (commentId: number) => {
		try {
			await apiFetch({
				path: `/qc/v1/comments/${commentId}`,
				method: 'DELETE',
			});
		} catch (error) {
			const errorMessage = handleApiError(
				'delete comment',
				error,
				__('Failed to delete comment. Please try again.', 'quillcrm')
			);
			throw new Error(errorMessage);
		}
	}, []);

	/**
	 * Get activity comments
	 */
	const getActivityComments = useCallback(async (activityId: number) => {
		try {
			const response = await apiFetch({
				path: `/qc/v1/activities/${activityId}/comments`,
				method: 'GET',
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'fetch comments',
				error,
				__('Failed to load comments. Please try again.', 'quillcrm')
			);
			throw new Error(errorMessage);
		}
	}, []);

	/**
	 * Get activity statistics
	 */
	const getActivityStatistics = useCallback(async (filters: any = {}) => {
		try {
			const queryParams = new URLSearchParams();
			Object.keys(filters).forEach((key) => {
				if (
					filters[key] !== null &&
					filters[key] !== undefined &&
					filters[key] !== ''
				) {
					queryParams.append(key, filters[key].toString());
				}
			});

			const response = await apiFetch({
				path: `/qc/v1/activities/statistics?${queryParams.toString()}`,
				method: 'GET',
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'fetch activity statistics',
				error,
				__('Failed to load statistics. Please try again.', 'quillcrm')
			);
			throw new Error(errorMessage);
		}
	}, []);

	return {
		addNote,
		logCall,
		logEmail,
		scheduleMeeting,
		updateActivity,
		deleteActivity,
		addComment,
		updateComment,
		deleteComment,
		getActivityComments,
		getActivityStatistics,
	};
};

