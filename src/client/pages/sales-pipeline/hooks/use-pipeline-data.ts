/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { handleApiError, ERROR_MESSAGES, ErrorInfo } from '../utils/error-handler';
import { Deal, Pipeline, Filters } from '../types';

interface UsePipelineDataReturn {
	pipelines: Pipeline[];
	selectedPipeline: Pipeline | null;
	deals: Deal[];
	loading: boolean;
	error: ErrorInfo | null;
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
	filters?: Filters
): UsePipelineDataReturn => {
	const [pipelines, setPipelines] = useState<Pipeline[]>([]);
	const [deals, setDeals] = useState<Deal[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<ErrorInfo | null>(null);

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
			const errorInfo = handleApiError(
				'fetch pipelines',
				err,
				ERROR_MESSAGES.LOAD_PIPELINES
			);
			setError(errorInfo);
		}
	}, []);

	// Fetch all deals for the pipeline
	const fetchDeals = useCallback(async () => {
		if (!selectedPipelineId) {
			setDeals([]);
			return;
		}

		try {
			const params = new URLSearchParams();
			params.append('pipeline_id', selectedPipelineId.toString());

			// Add filter parameters if provided
			if (filters) {
				if (filters.search) {
					params.append('search', filters.search);
				}
				if (filters.ownerId) {
					params.append('owner_id', filters.ownerId.toString());
				}
				if (filters.status) {
					params.append('status', filters.status);
				}
				if (filters.priority) {
					params.append('priority', filters.priority);
				}
				// Expected close date range
				if (filters.expectedCloseDateRange?.from) {
					params.append('expected_close_from', filters.expectedCloseDateRange.from.toISOString().split('T')[0]);
				}
				if (filters.expectedCloseDateRange?.to) {
					params.append('expected_close_to', filters.expectedCloseDateRange.to.toISOString().split('T')[0]);
				}
				// Created date range
				if (filters.createdDateRange?.from) {
					params.append('date_from', filters.createdDateRange.from.toISOString().split('T')[0]);
				}
				if (filters.createdDateRange?.to) {
					params.append('date_to', filters.createdDateRange.to.toISOString().split('T')[0]);
				}
				// Value range
				if (filters.valueRange?.min !== null && filters.valueRange?.min !== undefined) {
					params.append('value_min', filters.valueRange.min.toString());
				}
				if (filters.valueRange?.max !== null && filters.valueRange?.max !== undefined) {
					params.append('value_max', filters.valueRange.max.toString());
				}
			}

			const response = await apiFetch({
				path: `/qc/v1/deals?${params.toString()}`,
				method: 'GET',
			});

			// Handle both array and wrapped response
			const dealsData = Array.isArray(response)
				? response
				: (response as any)?.data || (response as any)?.items || [];

			setDeals(dealsData);
			setError(null);
		} catch (err) {
			const errorInfo = handleApiError(
				'fetch deals',
				err,
				ERROR_MESSAGES.LOAD_DEALS
			);
			setError(errorInfo);
		}
	}, [selectedPipelineId, filters]);

	// Initial data load
	useEffect(() => {
		const loadInitialData = async () => {
			setLoading(true);
			await fetchPipelines();
			setLoading(false);
		};

		loadInitialData();
	}, [fetchPipelines]);

	// Fetch deals when pipeline changes
	useEffect(() => {
		if (selectedPipelineId) {
			fetchDeals();
		}
	}, [selectedPipelineId, fetchDeals]);

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
		error: error,
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
