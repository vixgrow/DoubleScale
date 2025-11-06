/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Standardized error handler for sales pipeline operations
 */
export interface ApiError {
	message?: string;
	code?: string;
	data?: {
		status?: number;
		[key: string]: any;
	};
}

/**
 * Error info object for UI
 */
export interface ErrorInfo {
	type: number; // e.g. 404, 403, 500, 0 (network)
}

/**
 * Extract and standardize error message
 */
export const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
	if (error && typeof error === 'object' && 'message' in error) {
		return (error as ApiError).message || fallbackMessage;
	}

	if (typeof error === 'string') {
		return error;
	}

	return fallbackMessage;
};

/**
 * Log error and return structured error info for UI display
 */
export const handleApiError = (
	operation: string,
	error: unknown,
	fallbackMessage: string
): ErrorInfo => {
	console.error(` Failed to ${operation}:`, error);

	// Extract status code if available
	const status =
		(error as ApiError)?.data?.status ||
		(error as any)?.status ||
		(error as any)?.code ||
		0;
		
	return { type: Number(status) || 500 };
};

/**
 * Common error messages for sales pipeline operations
 */
export const ERROR_MESSAGES = {
	CREATE_DEAL: __('Failed to create deal. Please try again.', 'quillcrm'),
	UPDATE_DEAL: __('Failed to update deal. Please try again.', 'quillcrm'),
	DELETE_DEAL: __('Failed to delete deal. Please try again.', 'quillcrm'),
	MOVE_DEAL: __('Failed to move deal. Please try again.', 'quillcrm'),
	MARK_WON: __('Failed to mark deal as won. Please try again.', 'quillcrm'),
	MARK_LOST: __('Failed to mark deal as lost. Please try again.', 'quillcrm'),
	REOPEN_DEAL: __('Failed to reopen deal. Please try again.', 'quillcrm'),
	CREATE_STAGE: __('Failed to create stage. Please try again.', 'quillcrm'),
	UPDATE_STAGE: __('Failed to update stage. Please try again.', 'quillcrm'),
	DELETE_STAGE: __('Failed to delete stage. Please try again.', 'quillcrm'),
	REORDER_STAGES: __('Failed to reorder stages. Please try again.', 'quillcrm'),
	LOAD_PIPELINES: __('Failed to load pipelines. Please try again.', 'quillcrm'),
	LOAD_DEALS: __('Failed to load deals. Please try again.', 'quillcrm'),
};
