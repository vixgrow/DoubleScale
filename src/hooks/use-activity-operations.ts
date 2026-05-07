/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * API Error interface
 */
interface ApiError {
	message?: string;
	code?: string;
	data?: {
		status?: number;
		[key: string]: any;
	};
}

/**
 * Extract and standardize error message
 */
const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
	if (error && typeof error === 'object' && 'message' in error) {
		return (error as ApiError).message || fallbackMessage;
	}

	if (typeof error === 'string') {
		return error;
	}

	return fallbackMessage;
};

/**
 * Log error and return error message for UI display
 */
const handleApiError = (
	operation: string,
	error: unknown,
	fallbackMessage: string
): string => {
	console.error(`Failed to ${operation}:`, error);
	return getErrorMessage(error, fallbackMessage);
};

/**
 * Entity type values for activities
 * Matches Activity_Association_Model constants:
 * - 1 = Deal
 * - 2 = Campaign
 */
export type EntityTypeValue = 1 | 2;

interface ActivityOperationsReturn {
	addNote: (entityId: number, entityType: EntityTypeValue, note: string) => Promise<any>;
	logCall: (entityId: number, entityType: EntityTypeValue, callData: any) => Promise<any>;
	logEmail: (entityId: number, entityType: EntityTypeValue, emailData: any) => Promise<any>;
	scheduleMeeting: (entityId: number, entityType: EntityTypeValue, meetingData: any) => Promise<any>;
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
	 * Add note to entity (deal, campaign, etc.)
	 */
	const addNote = useCallback(async (entityId: number, entityType: EntityTypeValue, note: string) => {
		try {
			const response = await apiFetch({
				path: '/doublescale/v1/activities/notes',
				method: 'POST',
				data: {
					entity_id: entityId,
					entity_type: entityType,
					content: note,
				},
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'add note',
				error,
				__('Failed to add note. Please try again.', 'doublescale')
			);
			throw new Error(errorMessage);
		}
	}, []);

	/**
	 * Log call activity
	 */
	const logCall = useCallback(async (entityId: number, entityType: EntityTypeValue, callData: any) => {
		try {
			const response = await apiFetch({
				path: '/doublescale/v1/activities/calls',
				method: 'POST',
				data: {
					entity_id: entityId,
					entity_type: entityType,
					call_data: callData,
				},
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'log call',
				error,
				__('Failed to log call. Please try again.', 'doublescale')
			);
			throw new Error(errorMessage);
		}
	}, []);

	/**
	 * Log email activity
	 */
	const logEmail = useCallback(async (entityId: number, entityType: EntityTypeValue, emailData: any) => {
		try {
			const response = await apiFetch({
				path: '/doublescale/v1/activities/emails',
				method: 'POST',
				data: {
					entity_id: entityId,
					entity_type: entityType,
					email_data: emailData,
				},
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'log email',
				error,
				__('Failed to log email. Please try again.', 'doublescale')
			);
			throw new Error(errorMessage);
		}
	}, []);

	/**
	 * Schedule meeting activity
	 */
	const scheduleMeeting = useCallback(
		async (entityId: number, entityType: EntityTypeValue, meetingData: any) => {
			try {
				const response = await apiFetch({
					path: '/doublescale/v1/activities/meetings',
					method: 'POST',
					data: {
						entity_id: entityId,
						entity_type: entityType,
						meeting_data: meetingData,
					},
				});
				return response;
			} catch (error) {
				const errorMessage = handleApiError(
					'schedule meeting',
					error,
					__('Failed to schedule meeting. Please try again.', 'doublescale')
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
				// Modals pass raw data: string for note, objects for others
				const requestData: any = {};

				switch (activityType) {
					case 'note':
						requestData.content = data;
						break;
					case 'email_sent':
						requestData.email_data = data;
						break;
					case 'call_logged':
						requestData.call_data = data;
						break;
					case 'meeting_scheduled':
						requestData.meeting_data = data;
						break;
					default:
						throw new Error('Invalid activity type for update');
				}

				const response = await apiFetch({
					path: `/doublescale/v1/activities/${activityId}`,
					method: 'PATCH',
					data: requestData,
				});
				return response;
			} catch (error) {
				const errorMessage = handleApiError(
					'update activity',
					error,
					__('Failed to update activity. Please try again.', 'doublescale')
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
				path: `/doublescale/v1/activities/${activityId}`,
				method: 'DELETE',
			});
		} catch (error) {
			const errorMessage = handleApiError(
				'delete activity',
				error,
				__('Failed to delete activity. Please try again.', 'doublescale')
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
					path: `/doublescale/v1/activities/${activityId}/comments`,
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
					__('Failed to add comment. Please try again.', 'doublescale')
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
					path: `/doublescale/v1/comments/${commentId}`,
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
					__('Failed to update comment. Please try again.', 'doublescale')
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
				path: `/doublescale/v1/comments/${commentId}`,
				method: 'DELETE',
			});
		} catch (error) {
			const errorMessage = handleApiError(
				'delete comment',
				error,
				__('Failed to delete comment. Please try again.', 'doublescale')
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
				path: `/doublescale/v1/activities/${activityId}/comments`,
				method: 'GET',
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'fetch comments',
				error,
				__('Failed to load comments. Please try again.', 'doublescale')
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
				path: `/doublescale/v1/activities/statistics?${queryParams.toString()}`,
				method: 'GET',
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'fetch activity statistics',
				error,
				__('Failed to load statistics. Please try again.', 'doublescale')
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
