/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * Internal dependencies
 */
import { handleApiError, ERROR_MESSAGES } from '../utils/error-handler';
import { Deal, Pipeline, Filters } from '../types';

interface UsePipelineDataReturn {
	pipelines: Pipeline[];
	selectedPipeline: Pipeline | null;
	deals: Deal[];
	loading: boolean;
	error: string | null;
	refreshData: () => Promise<void>;
	updateDealOptimistically: (dealId: number, updates: Partial<Deal>) => void;
	updatePipelineOptimistically: (
		pipelineId: number,
		updates: Partial<Pipeline>
	) => void;
	addPipelineOptimistically: (pipeline: Pipeline) => void;
	removePipelineOptimistically: (pipelineId: number) => void;
	addStageOptimistically: (pipelineId: number, stage: any) => void;
	updateStageOptimistically: (
		pipelineId: number,
		stageId: number,
		updates: any
	) => void;
	removeStageOptimistically: (pipelineId: number, stageId: number) => void;
	reorderStagesOptimistically: (pipelineId: number, newStages: any[]) => void;
}

export const usePipelineData = (
	selectedPipelineId: number | null,
	filters: Filters
): UsePipelineDataReturn => {
	const [pipelines, setPipelines] = useState<Pipeline[]>([]);
	const [deals, setDeals] = useState<Deal[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Get selected pipeline
	const selectedPipeline = useMemo(() => {
		return pipelines.find((p) => p.id === selectedPipelineId) || null;
	}, [pipelines, selectedPipelineId]);

	// Fetch pipelines data
	const fetchPipelines = useCallback(async () => {
		try {
			const response = await apiFetch({
				path: '/qc/v1/pipelines?with_stages=1&with_stats=1',
				method: 'GET',
			});

			// Handle both array and wrapped response
			const pipelinesData = Array.isArray(response)
				? response
				: (response as any)?.data || (response as any)?.items || [];

			setPipelines(pipelinesData);
			setError(null);
		} catch (err) {
			const errorMessage = handleApiError(
				'fetch pipelines',
				err,
				ERROR_MESSAGES.LOAD_PIPELINES
			);
			setError(errorMessage);
		}
	}, []);

	// Fetch deals data with filters
	const fetchDeals = useCallback(async () => {
		if (!selectedPipelineId) {
			setDeals([]);
			return;
		}

		try {
			const params = new URLSearchParams();
			params.append('pipeline_id', selectedPipelineId.toString());

			// Apply filters
			if (filters.status !== 'all') {
				params.append('status', filters.status);
			}

			if (filters.search) {
				params.append('search', filters.search);
			}

			if (filters.ownerId) {
				params.append('owner_id', filters.ownerId.toString());
			}

			if (filters.dateRange.from) {
				params.append(
					'date_from',
					filters.dateRange.from.toISOString().split('T')[0]
				);
			}

			if (filters.dateRange.to) {
				params.append(
					'date_to',
					filters.dateRange.to.toISOString().split('T')[0]
				);
			}

			// Add pagination parameters
			params.append('per_page', '100'); // Show more deals per page for Kanban
			params.append('page', '1');

			const response = await apiFetch({
				path: `/qc/v1/deals?${params.toString()}`,
				method: 'GET',
			});

			// Handle both array and paginated response
			const dealsData = Array.isArray(response)
				? response
				: (response as any)?.data || (response as any)?.items || [];

			setDeals(dealsData);
			setError(null);
		} catch (err) {
			const errorMessage = handleApiError(
				'fetch deals',
				err,
				ERROR_MESSAGES.LOAD_DEALS
			);
			setError(errorMessage);
		}
	}, [selectedPipelineId, filters]);

	// Debounced search to avoid too many API calls
	const debouncedFetchDeals = useMemo(
		() => debounce(fetchDeals, 300),
		[fetchDeals]
	);

	// Initial data load
	useEffect(() => {
		const loadInitialData = async () => {
			setLoading(true);
			await fetchPipelines();
			setLoading(false);
		};

		loadInitialData();
	}, [fetchPipelines]);

	// Fetch deals when pipeline or filters change
	useEffect(() => {
		if (selectedPipelineId) {
			debouncedFetchDeals();
		}

		// Cleanup debounced function
		return () => {
			debouncedFetchDeals.cancel();
		};
	}, [selectedPipelineId, debouncedFetchDeals]);

	// Optimistic update function for deals
	const updateDealOptimistically = useCallback(
		(dealId: number, updates: Partial<Deal>) => {
			setDeals((prevDeals) =>
				prevDeals.map((deal) =>
					deal.id === dealId ? { ...deal, ...updates } : deal
				)
			);
		},
		[]
	);

	// Optimistic update functions for pipelines/stages
	const updatePipelineOptimistically = useCallback(
		(pipelineId: number, updates: Partial<Pipeline>) => {
			setPipelines((prevPipelines) =>
				prevPipelines.map((pipeline) =>
					pipeline.id === pipelineId
						? { ...pipeline, ...updates }
						: pipeline
				)
			);
		},
		[]
	);

	const addPipelineOptimistically = useCallback((newPipeline: Pipeline) => {
		setPipelines((prevPipelines) => [...prevPipelines, newPipeline]);
	}, []);

	const removePipelineOptimistically = useCallback((pipelineId: number) => {
		setPipelines((prevPipelines) =>
			prevPipelines.filter((pipeline) => pipeline.id !== pipelineId)
		);
	}, []);

	const addStageOptimistically = useCallback(
		(pipelineId: number, newStage: any) => {
			setPipelines((prevPipelines) =>
				prevPipelines.map((pipeline) =>
					pipeline.id === pipelineId
						? {
								...pipeline,
								stages: [...pipeline.stages, newStage],
							}
						: pipeline
				)
			);
		},
		[]
	);

	const updateStageOptimistically = useCallback(
		(pipelineId: number, stageId: number, updates: any) => {
			setPipelines((prevPipelines) =>
				prevPipelines.map((pipeline) =>
					pipeline.id === pipelineId
						? {
								...pipeline,
								stages: pipeline.stages.map((stage) =>
									stage.id === stageId
										? { ...stage, ...updates }
										: stage
								),
							}
						: pipeline
				)
			);
		},
		[]
	);

	const removeStageOptimistically = useCallback(
		(pipelineId: number, stageId: number) => {
			setPipelines((prevPipelines) =>
				prevPipelines.map((pipeline) =>
					pipeline.id === pipelineId
						? {
								...pipeline,
								stages: pipeline.stages.filter(
									(stage) => stage.id !== stageId
								),
							}
						: pipeline
				)
			);
		},
		[]
	);

	const reorderStagesOptimistically = useCallback(
		(pipelineId: number, newStages: any[]) => {
			setPipelines((prevPipelines) =>
				prevPipelines.map((pipeline) =>
					pipeline.id === pipelineId
						? { ...pipeline, stages: newStages }
						: pipeline
				)
			);
		},
		[]
	);

	// Refresh function
	const refreshData = useCallback(async () => {
		setLoading(true);
		try {
			await Promise.all([
				fetchPipelines(),
				selectedPipelineId ? fetchDeals() : Promise.resolve(),
			]);
		} finally {
			setLoading(false);
		}
	}, [fetchPipelines, fetchDeals, selectedPipelineId]);

	return {
		pipelines: pipelines || [],
		selectedPipeline: selectedPipeline || null,
		deals: deals || [],
		loading: loading || false,
		error: error || null,
		refreshData,
		updateDealOptimistically,
		updatePipelineOptimistically,
		addPipelineOptimistically,
		removePipelineOptimistically,
		addStageOptimistically,
		updateStageOptimistically,
		removeStageOptimistically,
		reorderStagesOptimistically,
	};
};
