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

interface DealOperationsReturn {
	getDeal: (dealId: number, withRelationships?: boolean) => Promise<any>;
	getDealActivities: (
		dealId: number,
		filters?: any,
		perPage?: number,
		page?: number
	) => Promise<any>;
	moveDealToStage: (
		dealId: number,
		stageId: number,
		updateProbability?: boolean
	) => Promise<void>;
	moveDealToPipeline: (
		dealId: number,
		pipelineId: number,
		stageId?: number
	) => Promise<void>;
	updateDeal: (dealId: number, data: Partial<any>) => Promise<void>;
	deleteDeal: (dealId: number) => Promise<void>;
	createDeal: (dealData: any) => Promise<any>;
	bulkUpdateDeals: (dealIds: number[], data: any) => Promise<number>;
}

export const useDealOperations = (): DealOperationsReturn => {
	/**
	 * Get single deal with optional relationships
	 */
	const getDeal = useCallback(
		async (dealId: number, withRelationships: boolean = true) => {
			try {
				const params = withRelationships
					? '?with_relationships=true'
					: '';
				const response = await apiFetch({
					path: `/qc/v1/deals/${dealId}${params}`,
					method: 'GET',
				});
				return response;
			} catch (error) {
				const errorMessage = handleApiError(
					'fetch deal details',
					error,
					__(
						'Failed to load deal details. Please try again.',
						'quillcrm'
					)
				);
				// throw new Error(errorMessage);
				throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
			}
		},
		[]
	);

	/**
	 * Get deal activities with pagination
	 */
	const getDealActivities = useCallback(
		async (
			dealId: number,
			filters: any = {},
			perPage: number = 20,
			page: number = 1
		) => {
			try {
				const queryParams = new URLSearchParams({
					per_page: perPage.toString(),
					page: page.toString(),
					...Object.keys(filters).reduce(
						(acc, key) => {
							if (
								filters[key] !== null &&
								filters[key] !== undefined &&
								filters[key] !== ''
							) {
								acc[key] = filters[key].toString();
							}
							return acc;
						},
						{} as Record<string, string>
					),
				});

				const response = await apiFetch({
					path: `/qc/v1/deals/${dealId}/activities?${queryParams.toString()}`,
					method: 'GET',
				});
				return response;
			} catch (error) {
				const errorMessage = handleApiError(
					'fetch deal activities',
					error,
					__(
						'Failed to load deal activities. Please try again.',
						'quillcrm'
					)
				);
				throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
			}
		},
		[]
	);

	/**
	 * Move deal to a different stage within the same pipeline
	 */
	const moveDealToStage = useCallback(
		async (
			dealId: number,
			stageId: number,
			updateProbability: boolean = false
		) => {
			try {
				const data: any = {
					stage_id: stageId,
				};

				// Include update_probability parameter if specified
				if (updateProbability) {
					data.update_probability = true;
				}

				await apiFetch({
					path: `/qc/v1/deals/${dealId}/move-stage`,
					method: 'PATCH',
					data,
				});
			} catch (error) {
				const errorMessage = handleApiError(
					'move deal to stage',
					error,
					ERROR_MESSAGES.MOVE_DEAL
				);
				// throw new Error(errorMessage);
				throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
			}
		},
		[]
	);

	/**
	 * Move deal to a different pipeline
	 */
	const moveDealToPipeline = useCallback(
		async (dealId: number, pipelineId: number, stageId?: number) => {
			try {
				const data: any = { pipeline_id: pipelineId };
				if (stageId) {
					data.stage_id = stageId;
				}

				await apiFetch({
					path: `/qc/v1/deals/${dealId}/move-pipeline`,
					method: 'PATCH',
					data,
				});
			} catch (error) {
				const errorMessage = handleApiError(
					'move deal to pipeline',
					error,
					ERROR_MESSAGES.MOVE_DEAL
				);
				// throw new Error(errorMessage);
				throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
			}
		},
		[]
	);


	/**
	 * Update deal data
	 */
	const updateDeal = useCallback(
		async (dealId: number, data: Partial<any>) => {
			try {
				await apiFetch({
					path: `/qc/v1/deals/${dealId}`,
					method: 'PATCH',
					data,
				});
			} catch (error) {
				const errorMessage = handleApiError(
					'update deal',
					error,
					ERROR_MESSAGES.UPDATE_DEAL
				);
				throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
			}
		},
		[]
	);

	/**
	 * Delete deal
	 */
	const deleteDeal = useCallback(async (dealId: number) => {
		try {
			await apiFetch({
				path: `/qc/v1/deals/${dealId}`,
				method: 'DELETE',
			});
		} catch (error) {
			const errorMessage = handleApiError(
				'delete deal',
				error,
				ERROR_MESSAGES.DELETE_DEAL
			);
			throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
		}
	}, []);

	/**
	 * Create new deal
	 */
	const createDeal = useCallback(async (dealData: any) => {
		try {
			const response = await apiFetch({
				path: '/qc/v1/deals',
				method: 'POST',
				data: dealData,
			});
			return response;
		} catch (error) {
			const errorMessage = handleApiError(
				'create deal',
				error,
				ERROR_MESSAGES.CREATE_DEAL
			);
			throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
		}
	}, []);

	/**
	 * Bulk update deals
	 */
	const bulkUpdateDeals = useCallback(
		async (dealIds: number[], data: any) => {
			try {
				const response = (await apiFetch({
					path: '/qc/v1/deals/bulk',
					method: 'PATCH',
					data: {
						deal_ids: dealIds,
						data,
					},
				})) as { updated_count: number };

				return response.updated_count;
			} catch (error) {
				const errorMessage = handleApiError(
					'bulk update deals',
					error,
					__('Failed to update deals. Please try again.', 'quillcrm')
				);
				throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
			}
		},
		[]
	);

	return {
		getDeal,
		getDealActivities,
		moveDealToStage,
		moveDealToPipeline,
		updateDeal,
		deleteDeal,
		createDeal,
		bulkUpdateDeals,
	};
};
