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

interface Stage {
	id: number;
	pipeline_id: number;
	name: string;
	color: string;
	sort_order: number;
	win_probability: number;
}

interface CreateStageData {
	name: string;
	color: string;
	win_probability: number;
	position?: number;
}

interface UpdateStageData {
	name?: string;
	color?: string;
	win_probability?: number;
	sort_order?: number;
}

interface StageOperationsReturn {
	createStage: (pipelineId: number, stageData: CreateStageData) => Promise<Stage>;
	updateStage: (pipelineId: number, stageId: number, stageData: UpdateStageData) => Promise<Stage>;
	deleteStage: (pipelineId: number, stageId: number) => Promise<void>;
	reorderStages: (pipelineId: number, stageIds: number[]) => Promise<void>;
}

export const useStageOperations = (): StageOperationsReturn => {
	/**
	 * Create a new stage in a pipeline
	 */
	const createStage = useCallback(async (pipelineId: number, stageData: CreateStageData): Promise<Stage> => {
		try {
			const response = await apiFetch({
				path: `/qc/v1/pipelines/${pipelineId}/stages`,
				method: 'POST',
				data: {
					name: stageData.name,
					color: stageData.color,
					win_probability: stageData.win_probability,
					position: stageData.position,
				},
			});

			return response as Stage;
		} catch (error) {
			const errorMessage = handleApiError('create stage', error, ERROR_MESSAGES.CREATE_STAGE);
			throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
		}
	}, []);

	/**
	 * Update an existing stage
	 */
	const updateStage = useCallback(async (
		pipelineId: number, 
		stageId: number, 
		stageData: UpdateStageData
	): Promise<Stage> => {
		try {
			const response = await apiFetch({
				path: `/qc/v1/pipelines/${pipelineId}/stages/${stageId}`,
				method: 'PATCH',
				data: stageData,
			});

			return response as Stage;
		} catch (error) {
			const errorMessage = handleApiError('update stage', error, ERROR_MESSAGES.UPDATE_STAGE);
			throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
		}
	}, []);

	/**
	 * Delete a stage
	 */
	const deleteStage = useCallback(async (pipelineId: number, stageId: number): Promise<void> => {
		try {
			await apiFetch({
				path: `/qc/v1/pipelines/${pipelineId}/stages/${stageId}`,
				method: 'DELETE',
			});
		} catch (error) {
			const errorMessage = handleApiError('delete stage', error, ERROR_MESSAGES.DELETE_STAGE);
			throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
		}
	}, []);

	/**
	 * Reorder stages within a pipeline
	 */
	const reorderStages = useCallback(async (pipelineId: number, stageIds: number[]): Promise<void> => {
		try {
			// Update each stage's sort_order based on its position in the array
			const updatePromises = stageIds.map((stageId, index) =>
				apiFetch({
					path: `/qc/v1/pipelines/${pipelineId}/stages/${stageId}`,
					method: 'PATCH',
					data: { sort_order: index },
				})
			);

			await Promise.all(updatePromises);
		} catch (error) {
			const errorMessage = handleApiError('reorder stages', error, ERROR_MESSAGES.REORDER_STAGES);
			throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
		}
	}, []);

	return {
		createStage,
		updateStage,
		deleteStage,
		reorderStages,
	};
};