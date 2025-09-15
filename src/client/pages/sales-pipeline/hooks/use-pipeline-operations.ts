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

interface Pipeline {
	id: number;
	name: string;
	description: string;
	sort_order: number;
	stages: Array<{
		id: number;
		pipeline_id: number;
		name: string;
		color: string;
		sort_order: number;
		win_probability: number;
	}>;
	created_at: string;
	updated_at: string;
}

interface CreatePipelineData {
	name: string;
	description?: string;
	stages?: Array<{
		name: string;
		color: string;
		win_probability: number;
	}>;
}

interface UpdatePipelineData {
	name?: string;
	description?: string;
	sort_order?: number;
}

interface PipelineOperationsReturn {
	createPipeline: (pipelineData: CreatePipelineData) => Promise<Pipeline>;
	updatePipeline: (
		pipelineId: number,
		pipelineData: UpdatePipelineData
	) => Promise<Pipeline>;
	deletePipeline: (
		pipelineId: number,
		moveDealsToPipelineId?: number
	) => Promise<void>;
	duplicatePipeline: (
		pipelineId: number,
		newName?: string
	) => Promise<Pipeline>;
	updatePipelineSortOrder: (pipelineIds: number[]) => Promise<void>;
	getPipelineAnalytics: (pipelineId: number, filters?: any) => Promise<any>;
}

export const usePipelineOperations = (): PipelineOperationsReturn => {
	/**
	 * Create a new pipeline
	 */
	const createPipeline = useCallback(
		async (pipelineData: CreatePipelineData): Promise<Pipeline> => {
			try {
				const response = await apiFetch({
					path: '/qc/v1/pipelines',
					method: 'POST',
					data: {
						name: pipelineData.name,
						description: pipelineData.description || '',
						stages: pipelineData.stages || [], // If empty, backend will use defaults
					},
				});

				return response as Pipeline;
			} catch (error) {
				const errorMessage = handleApiError(
					'create pipeline',
					error,
					__(
						'Failed to create pipeline. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	/**
	 * Update an existing pipeline
	 */
	const updatePipeline = useCallback(
		async (
			pipelineId: number,
			pipelineData: UpdatePipelineData
		): Promise<Pipeline> => {
			try {
				const response = await apiFetch({
					path: `/qc/v1/pipelines/${pipelineId}`,
					method: 'PATCH',
					data: pipelineData,
				});

				return response as Pipeline;
			} catch (error) {
				const errorMessage = handleApiError(
					'update pipeline',
					error,
					__(
						'Failed to update pipeline. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	/**
	 * Delete a pipeline
	 */
	const deletePipeline = useCallback(
		async (
			pipelineId: number,
			moveDealsToPipelineId?: number
		): Promise<void> => {
			try {
				const data: any = {};
				if (moveDealsToPipelineId) {
					data.move_deals_to = moveDealsToPipelineId;
				}

				await apiFetch({
					path: `/qc/v1/pipelines/${pipelineId}`,
					method: 'DELETE',
					data,
				});
			} catch (error) {
				const errorMessage = handleApiError(
					'delete pipeline',
					error,
					__(
						'Failed to delete pipeline. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	/**
	 * Duplicate a pipeline
	 */
	const duplicatePipeline = useCallback(
		async (pipelineId: number, newName?: string): Promise<Pipeline> => {
			try {
				const data: any = {};
				if (newName) {
					data.name = newName;
				}

				const response = await apiFetch({
					path: `/qc/v1/pipelines/${pipelineId}/duplicate`,
					method: 'POST',
					data,
				});

				return response as Pipeline;
			} catch (error) {
				const errorMessage = handleApiError(
					'duplicate pipeline',
					error,
					__(
						'Failed to duplicate pipeline. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	/**
	 * Update pipeline sort order
	 */
	const updatePipelineSortOrder = useCallback(
		async (pipelineIds: number[]): Promise<void> => {
			try {
				await apiFetch({
					path: '/qc/v1/pipelines/sort-order',
					method: 'PATCH',
					data: {
						pipeline_ids: pipelineIds,
					},
				});
			} catch (error) {
				const errorMessage = handleApiError(
					'update pipeline order',
					error,
					__(
						'Failed to update pipeline order. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	/**
	 * Get pipeline analytics
	 */
	const getPipelineAnalytics = useCallback(
		async (pipelineId: number, filters: any = {}): Promise<any> => {
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
					path: `/qc/v1/pipelines/${pipelineId}/analytics?${queryParams.toString()}`,
					method: 'GET',
				});

				return response;
			} catch (error) {
				const errorMessage = handleApiError(
					'fetch pipeline analytics',
					error,
					__(
						'Failed to load pipeline analytics. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(errorMessage);
			}
		},
		[]
	);

	return {
		createPipeline,
		updatePipeline,
		deletePipeline,
		duplicatePipeline,
		updatePipelineSortOrder,
		getPipelineAnalytics,
	};
};
