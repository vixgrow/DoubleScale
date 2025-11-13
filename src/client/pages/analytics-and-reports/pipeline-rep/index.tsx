
import React, { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

import ConversionRatesChart from '../conversion-rate-by-stage';
import AverageDurationChart from '../average-duration-by-stage';

import dayjs from 'dayjs';
import PipelineFilters from '../components/pipeline-rep-filter';
import { DashboardContentCard, PageHeader } from '@quillcrm/components';
import AveragePipelineChart from '../funnelStages';

import WinTagIcon from '@quillcrm/components/icons/win-tag';
import { PipelineAnalyticsSkeleton } from './PipelineAnalyticsSkeleton';

interface PipelineAnalyticsProps {
	pipelineId?: number;
	ownerId?: number;
}

interface PipelineStageData {
	stage_id: number;
	stage_name: string;
	stage_order: number;
	total_deals: number;
	total_value: number;
	conversion_rate: number;
	avg_duration: number;
}

interface PipelineAnalyticsResponse {
	pipeline_id: number;
	pipeline_name: string;
	stages: PipelineStageData[];
	total_deals: number;
	total_value: number;
	overall_conversion_rate: number;
}

interface Owner {
	id: number;
	name: string;
}

const PipelineAnalytics: React.FC<PipelineAnalyticsProps> = ({
	pipelineId,
	ownerId: initialOwnerId,
}) => {
	const [analyticsData, setAnalyticsData] =
		useState<PipelineAnalyticsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [availablePipelines, setAvailablePipelines] = useState<
		Array<{ id: number; name: string }>
	>([]);
	const [availableOwners, setAvailableOwners] = useState<Owner[]>([]);

	// Filter states
	const [selectedPipeline, setSelectedPipeline] = useState<number | null>(
		pipelineId ?? null
	);
	const [selectedOwner, setSelectedOwner] = useState<number | null>(
		initialOwnerId ?? null
	);
	const [dateRange, setDateRange] = useState<{
		from: Date | null;
		to: Date | null;
	}>({ from: null, to: null });

	const fetchPipelines = useCallback(async () => {
		try {
			const response = (await apiFetch({
				path: '/qc/v1/pipelines',
			})) as Array<{ id: number; name: string }>;

			setAvailablePipelines(response);

			if (!selectedPipeline && response.length > 0) {
				setSelectedPipeline(response[0].id);
			}
		} catch (error: any) {
			console.error('Failed to fetch pipelines:', error);
		}
	}, [selectedPipeline]);

	const fetchOwners = useCallback(async () => {
		try {
			const response = (await apiFetch({
				path: '/qc/v1/users',
			})) as any[];




			const formattedOwners = response.map((user) => ({
				id: user.id || user.ID,
				name:
					user.display_name ||
					user.name ||
					`${user.first_name || ''} ${user.last_name || ''}`.trim() ||
					'Unknown User',
			}));


			setAvailableOwners(formattedOwners);
		} catch (error: any) {
			console.error('Failed to fetch owners:', error);
		}
	}, []);

	const fetchPipelineAnalytics = useCallback(async () => {
		if (!selectedPipeline) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams();
			if (selectedOwner) params.append('owner_id', String(selectedOwner));
			if (dateRange.from)
				params.append(
					'date_from',
					dayjs(dateRange.from).format('YYYY-MM-DD')
				);
			if (dateRange.to)
				params.append(
					'date_to',
					dayjs(dateRange.to).format('YYYY-MM-DD')
				);

			const apiPath = `/qc/v1/pipelines/${selectedPipeline}/analytics${params.toString() ? `?${params.toString()}` : ''}`;

			const response = (await apiFetch({
				path: apiPath,
			})) as PipelineAnalyticsResponse;
			setAnalyticsData(response);
			setLoading(false);
		} catch (error: any) {
			console.error('Failed to fetch pipeline analytics:', error);
			setError(
				error.message ||
					__('Failed to fetch pipeline analytics', 'quillcrm')
			);
			setLoading(false);
		}
	}, [selectedPipeline, selectedOwner, dateRange]);

	useEffect(() => {
		fetchPipelines();
		fetchOwners();
	}, [fetchPipelines, fetchOwners]);

	useEffect(() => {
		if (selectedPipeline) {
			fetchPipelineAnalytics();
		}
	}, [fetchPipelineAnalytics]);

	if (loading) {
		return (
			<PipelineAnalyticsSkeleton />
		);
	}

	if (error) {
		return (
			<div className="pipeline-analytics-container p-6">
				<div className="report-header mb-4">
					<h2 className="text-2xl font-semibold text-[#09090B]">
						{__('Pipeline Analytics', 'quillcrm')}
					</h2>
				</div>
				<div className="text-red-500 p-4 bg-red-50 rounded">
					{error}
				</div>
			</div>
		);
	}

	if (!analyticsData || analyticsData.stages?.length === 0) {
		return (
			<div className="pipeline-analytics-container p-6">
				<div className="report-header mb-4">
					<h2 className="text-2xl font-semibold text-[#09090B]">
						{__('Pipeline Analytics', 'quillcrm')}
					</h2>
				</div>
				<div className="text-center text-gray-500 p-8">
					{__('No pipeline data available', 'quillcrm')}
				</div>
			</div>
		);
	}

	return (
		<div className="pipeline-analytics-container w-full mx-auto">
			{/* Header with Filters */}
			<div className="report-header mb-6 px-6">
				<div className="flex justify-between items-center mb-4">
					<PageHeader
						title={__('Pipelines Analytics', 'quillcrm')}
						subtitle={__('Pipelines Analytics', 'quillcrm')}
						actions={[]}
					/>

					<PipelineFilters
						selectedPipeline={selectedPipeline}
						onPipelineChange={setSelectedPipeline}
						selectedOwner={selectedOwner}
						onOwnerChange={setSelectedOwner}
						dateRange={dateRange}
						onDateRangeChange={setDateRange}
						availablePipelines={availablePipelines}
						availableOwners={availableOwners}
					/>
				</div>
			</div>

			{/* Funnel Chart Card */}
			<DashboardContentCard
				title={__('Average Duration per Stage', 'quillcrm')}
				headerContent={<WinTagIcon />}
				cardClassName='!shadow-none'
			>
				<AveragePipelineChart
					selectedPipelineId={selectedPipeline}
					ownerId={selectedOwner ?? undefined}
				/>
			</DashboardContentCard>
			

			{/* Conversion Rates and Average Duration Charts */}
			<div className="grid grid-cols-2 gap-5 mx-5 mt-5">
				<ConversionRatesChart
					selectedPipelineId={selectedPipeline}
					ownerId={selectedOwner ?? undefined}
				/>
				<AverageDurationChart
					selectedPipelineId={selectedPipeline}
					ownerId={selectedOwner ?? undefined}
				/>
			</div>
		</div>
	);
};

export default PipelineAnalytics;
