// // import React from 'react';

// // const PipelineAnalysis: React.FC = () => {
// //     return (
// //         <div>
// //             <h3>Pipeline Analysis</h3>

// //         </div>
// //     );
// // };

// // export default PipelineAnalysis;

// /**
//  * WordPress dependencies
//  */
// /**
//  * WordPress dependencies
//  */
// // import React, { useState, useEffect, useCallback, useRef } from 'react';
// // import { __ } from '@wordpress/i18n';
// // import apiFetch from '@wordpress/api-fetch';
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// // import { Button } from '@/components/ui/button';
// // // @ts-ignore
// // import D3Funnel from 'd3-funnel';

// // interface PipelineAnalyticsProps {
// // 	pipelineId?: number;
// // 	ownerId?: number;
// // }

// // interface PipelineStageData {
// // 	stage_id: number;
// // 	stage_name: string;
// // 	stage_order: number;
// // 	total_deals: number;
// // 	total_value: number;
// // 	conversion_rate: number;
// // 	avg_duration: number; // in days
// // }

// // interface PipelineAnalyticsResponse {
// // 	pipeline_id: number;
// // 	pipeline_name: string;
// // 	stages: PipelineStageData[];
// // 	total_deals: number;
// // 	total_value: number;
// // 	overall_conversion_rate: number;
// // }

// // const PipelineAnalytics: React.FC<PipelineAnalyticsProps> = ({
// // 	pipelineId,
// // 	ownerId
// // }) => {
// // 	const [analyticsData, setAnalyticsData] = useState<PipelineAnalyticsResponse | null>(null);
// // 	const [loading, setLoading] = useState(true);
// // 	const [error, setError] = useState<string | null>(null);
// // 	const [selectedPipeline, setSelectedPipeline] = useState<number | undefined>(pipelineId);
// // 	const [availablePipelines, setAvailablePipelines] = useState<Array<{id: number, name: string}>>([]);

// // 	const chartRef = useRef<HTMLDivElement>(null);
// // 	const chartInstance = useRef<any>(null);

// // 	// Fetch available pipelines
// // 	const fetchPipelines = useCallback(async () => {
// // 		try {
// // 			const response = await apiFetch({
// // 				path: '/qc/v1/pipelines',
// // 			}) as Array<{id: number, name: string}>;

// // 			setAvailablePipelines(response);
// // 			if (!selectedPipeline && response?.length > 0) {
// // 				setSelectedPipeline(response[0].id);
// // 			}
// // 		} catch (error: any) {
// // 			console.error('Failed to fetch pipelines:', error);
// // 		}
// // 	}, [selectedPipeline]);

// // 	// Fetch pipeline analytics data
// // 	const fetchPipelineAnalytics = useCallback(async () => {
// // 		if (!selectedPipeline) {
// // 			setLoading(false);
// // 			return;
// // 		}

// // 		try {
// // 			setLoading(true);
// // 			setError(null);

// // 			// Build query params
// // 			const params = new URLSearchParams();
// // 			if (ownerId) params.append('owner_id', String(ownerId));

// // 			const apiPath = `/qc/v1/pipelines/${selectedPipeline}/analytics${params.toString() ? `?${params.toString()}` : ''}`;

// // 			const response = await apiFetch({
// // 				path: apiPath,
// // 			}) as PipelineAnalyticsResponse;

// // 			console.log('Pipeline Analytics Response:', response);
// // 			setAnalyticsData(response);
// // 			setLoading(false);
// // 		} catch (error: any) {
// // 			console.error('Failed to fetch pipeline analytics:', error);
// // 			setError(error.message || __('Failed to fetch pipeline analytics', 'quillcrm'));
// // 			setLoading(false);
// // 		}
// // 	}, [selectedPipeline, ownerId]);

// // 	useEffect(() => {
// // 		fetchPipelines();
// // 	}, [fetchPipelines]);

// // 	useEffect(() => {
// // 		if (selectedPipeline) {
// // 			fetchPipelineAnalytics();
// // 		}
// // 	}, [fetchPipelineAnalytics]);

// // 	// Draw funnel chart
// // 	useEffect(() => {
// // 		if (chartRef.current && analyticsData && analyticsData.stages?.length > 0) {
// // 			// Clear the container
// // 			chartRef.current.innerHTML = '';

// // 			const stages = analyticsData.stages.sort((a, b) => a.stage_order - b.stage_order);

// // 			// Create a wrapper div
// // 			const wrapper = document.createElement('div');
// // 			wrapper.style.position = 'relative';
// // 			wrapper.style.width = '100%';
// // 			wrapper.style.minHeight = '400px';

// // 			// Create container for D3 funnel
// // 			const funnelContainer = document.createElement('div');
// // 			funnelContainer.style.position = 'absolute';
// // 			funnelContainer.style.width = '250px';
// // 			funnelContainer.style.height = '1000px';
// // 			funnelContainer.style.left = '50%';
// // 			funnelContainer.style.top = '52%';
// // 			funnelContainer.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
// // 			funnelContainer.style.transformOrigin = 'center center';
// // 			funnelContainer.style.display = 'flex';
// // 			funnelContainer.style.justifyContent = 'center';
// // 			funnelContainer.style.alignItems = 'center';

// // 			// Create SVG overlay for labels
// // 			const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
// // 			svgOverlay.setAttribute('width', '100%');
// // 			svgOverlay.setAttribute('height', '400');
// // 			svgOverlay.setAttribute('viewBox', '0 0 1000 400');
// // 			svgOverlay.setAttribute('preserveAspectRatio', 'xMidYMid meet');
// // 			svgOverlay.style.position = 'absolute';
// // 			svgOverlay.style.top = '0';
// // 			svgOverlay.style.left = '0';
// // 			svgOverlay.style.width = '100%';
// // 			svgOverlay.style.maxWidth = '100%';

// // 			const svgWidth = 1000;
// // 			const svgHeight = 400;
// // 			const segmentWidth = svgWidth / stages?.length;

// // 			// Add vertical segments with labels
// // 			stages.forEach((stage, index) => {
// // 				const x = index * segmentWidth;
// // 				const leftX = x + 15;

// // 				// Vertical separator line
// // 				if (index > 0) {
// // 					const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
// // 					line.setAttribute('x1', String(x));
// // 					line.setAttribute('y1', '50');
// // 					line.setAttribute('x2', String(x));
// // 					line.setAttribute('y2', String(svgHeight - 20));
// // 					line.setAttribute('stroke', '#e5e7eb');
// // 					line.setAttribute('stroke-width', '2');
// // 					svgOverlay.appendChild(line);
// // 				}

// // 				// Stage name
// // 				const stageLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
// // 				stageLabel.setAttribute('x', String(leftX));
// // 				stageLabel.setAttribute('y', '30');
// // 				stageLabel.setAttribute('text-anchor', 'start');
// // 				stageLabel.setAttribute('fill', '#09090B');
// // 				stageLabel.setAttribute('font-size', '16');
// // 				stageLabel.setAttribute('font-weight', '600');
// // 				stageLabel.textContent = stage.stage_name;
// // 				svgOverlay.appendChild(stageLabel);

// // 				// Total Deals
// // 				const dealsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
// // 				dealsText.setAttribute('x', String(leftX));
// // 				dealsText.setAttribute('y', '52');
// // 				dealsText.setAttribute('text-anchor', 'start');
// // 				dealsText.setAttribute('fill', '#09090B');
// // 				dealsText.setAttribute('font-size', '13');

// // 				const dealsLabel = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
// // 				dealsLabel.textContent = __('Total Deals: ', 'quillcrm');
// // 				dealsLabel.setAttribute('fill', '#09090B');

// // 				const dealsValue = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
// // 				dealsValue.textContent = String(stage.total_deals);
// // 				dealsValue.setAttribute('fill', '#3b82f6');
// // 				dealsValue.setAttribute('font-weight', 'bold');

// // 				dealsText.appendChild(dealsLabel);
// // 				dealsText.appendChild(dealsValue);
// // 				svgOverlay.appendChild(dealsText);

// // 				// Total Value
// // 				const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
// // 				valueText.setAttribute('x', String(leftX));
// // 				valueText.setAttribute('y', '68');
// // 				valueText.setAttribute('text-anchor', 'start');
// // 				valueText.setAttribute('fill', '#09090B');
// // 				valueText.setAttribute('font-size', '13');

// // 				const valueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
// // 				valueLabel.textContent = __('Total Deals Value: ', 'quillcrm');
// // 				valueLabel.setAttribute('fill', '#09090B');

// // 				const valueValue = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
// // 				valueValue.textContent = `${(stage.total_value / 1000).toFixed(1)}K €`;
// // 				valueValue.setAttribute('fill', '#16a34a');
// // 				valueValue.setAttribute('font-weight', 'bold');

// // 				valueText.appendChild(valueLabel);
// // 				valueText.appendChild(valueValue);
// // 				svgOverlay.appendChild(valueText);

// // 				// Conversion Rate
// // 				const conversionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
// // 				conversionText.setAttribute('x', String(leftX));
// // 				conversionText.setAttribute('y', '84');
// // 				conversionText.setAttribute('text-anchor', 'start');
// // 				conversionText.setAttribute('fill', '#09090B');
// // 				conversionText.setAttribute('font-size', '13');

// // 				const conversionLabel = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
// // 				conversionLabel.textContent = __('Conversion Rate: ', 'quillcrm');
// // 				conversionLabel.setAttribute('fill', '#09090B');

// // 				const conversionValue = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
// // 				conversionValue.textContent = `${stage.conversion_rate}%`;
// // 				conversionValue.setAttribute('fill', '#3b82f6');
// // 				conversionValue.setAttribute('font-weight', 'bold');

// // 				conversionText.appendChild(conversionLabel);
// // 				conversionText.appendChild(conversionValue);
// // 				svgOverlay.appendChild(conversionText);
// // 			});

// // 			// Add horizontal line at bottom
// // 			const horizontalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
// // 			horizontalLine.setAttribute('x1', '0');
// // 			horizontalLine.setAttribute('y1', String(svgHeight - 20));
// // 			horizontalLine.setAttribute('x2', String(svgWidth));
// // 			horizontalLine.setAttribute('y2', String(svgHeight - 20));
// // 			horizontalLine.setAttribute('stroke', '#e5e7eb');
// // 			horizontalLine.setAttribute('stroke-width', '2');
// // 			svgOverlay.appendChild(horizontalLine);

// // 			// Initialize D3 Funnel
// // 			const data = stages.map((stage) => ({
// // 				label: '',
// // 				value: stage.total_deals,
// // 			}));

// // 			const chart = new D3Funnel(funnelContainer);
// // 			chart.draw(data, {
// // 				chart: {
// // 					width: 250,
// // 					height: 1000,
// // 					horizontal: false,
// // 					bottomWidth: 1 / 3,
// // 					bottomPinch: 0,
// // 					curve: {
// // 						enabled: true,
// // 						height: 15,
// // 					},
// // 				},
// // 				block: {
// // 					dynamicHeight: false,
// // 					dynamicSlope: true,
// // 					fill: {
// // 						type: 'solid',
// // 						scale: ['#E3EEFF99'],
// // 					},
// // 					minHeight: 30,
// // 					highlight: false,
// // 				},
// // 				label: {
// // 					enabled: false,
// // 				},
// // 			});

// // 			// Style the funnel SVG
// // 			setTimeout(() => {
// // 				const svg = funnelContainer.querySelector('svg');
// // 				if (svg) {
// // 					svg.style.width = '100%';
// // 					svg.style.height = '100%';
// // 					svg.style.display = 'block';

// // 					const paths = svg.querySelectorAll('path');
// // 					paths.forEach((path) => {
// // 						path.setAttribute('fill', '#E3EEFF99');
// // 						path.setAttribute('stroke', 'none');
// // 					});
// // 				}
// // 			}, 100);

// // 			wrapper.appendChild(funnelContainer);
// // 			wrapper.appendChild(svgOverlay);
// // 			chartRef.current.appendChild(wrapper);

// // 			chartInstance.current = chart;
// // 		}

// // 		return () => {
// // 			if (chartRef.current) {
// // 				chartRef.current.innerHTML = '';
// // 			}
// // 		};
// // 	}, [analyticsData]);

// // 	if (loading) {
// // 		return (
// // 			<div className="pipeline-analytics-container p-6">
// // 				<div className="report-header mb-4">
// // 					<h2 className="text-2xl font-semibold">
// // 						{__('Pipeline Funnel Chart', 'quillcrm')}
// // 					</h2>
// // 				</div>
// // 				<div className="flex justify-center items-center h-64">
// // 					<div className="text-gray-500">
// // 						{__('Loading pipeline data...', 'quillcrm')}
// // 					</div>
// // 				</div>
// // 			</div>
// // 		);
// // 	}

// // 	if (error) {
// // 		return (
// // 			<div className="pipeline-analytics-container p-6">
// // 				<div className="report-header mb-4">
// // 					<h2 className="text-2xl font-semibold">
// // 						{__('Pipeline Funnel Chart', 'quillcrm')}
// // 					</h2>
// // 				</div>
// // 				<div className="text-red-500 p-4 bg-red-50 rounded">{error}</div>
// // 			</div>
// // 		);
// // 	}

// // 	if (!analyticsData || analyticsData?.stages?.length === 0) {
// // 		return (
// // 			<div className="pipeline-analytics-container p-6">
// // 				<div className="report-header mb-4">
// // 					<h2 className="text-2xl font-semibold">
// // 						{__('Pipeline Funnel Chart', 'quillcrm')}
// // 					</h2>
// // 				</div>
// // 				<div className="text-center text-gray-500 p-8">
// // 					{__('No pipeline data available', 'quillcrm')}
// // 				</div>
// // 			</div>
// // 		);
// // 	}

// // 	return (
// // 		<div className="pipeline-analytics-container">
// // 			{/* Header with Pipeline Selector */}
// // 			<div className="report-header mb-6 flex justify-between items-center">
// // 				<h2 className="text-2xl font-semibold text-[#09090B]">
// // 					{__('Pipeline Funnel Chart', 'quillcrm')}
// // 				</h2>

// // 				{/* Pipeline Selector */}
// // 				{availablePipelines?.length > 1 && (
// // 					<select
// // 						value={selectedPipeline}
// // 						onChange={(e) => setSelectedPipeline(Number(e.target.value))}
// // 						className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
// // 					>
// // 						{availablePipelines.map((pipeline) => (
// // 							<option key={pipeline.id} value={pipeline.id}>
// // 								{pipeline.name}
// // 							</option>
// // 						))}
// // 					</select>
// // 				)}
// // 			</div>

// // 			{/* Statistics Cards */}
// // 			<div className="stats-container mb-6 flex gap-4">
// // 				<div className="stat-box bg-[#E3EEFF99] text-[#3b82f6] border border-[#3b82f6] px-6 py-4 rounded-lg flex items-center gap-3">
// // 					<span className="text-sm font-medium">
// // 						{__('Total Deals:', 'quillcrm')}
// // 					</span>
// // 					<span className="text-xl font-bold">{analyticsData?.total_deals}</span>
// // 				</div>
// // 				<div className="stat-box bg-[#E4FAEC] text-[#16A34A] border border-[#16A34A] px-6 py-4 rounded-lg flex items-center gap-3">
// // 					<span className="text-sm font-medium">
// // 						{__('Total Value:', 'quillcrm')}
// // 					</span>
// // 					<span className="text-xl font-bold">
// // 						{(analyticsData.total_value / 1000).toFixed(1)}K €
// // 					</span>
// // 				</div>
// // 				<div className="stat-box bg-[#FEF3C7] text-[#D97706] border border-[#D97706] px-6 py-4 rounded-lg flex items-center gap-3">
// // 					<span className="text-sm font-medium">
// // 						{__('Overall Conversion:', 'quillcrm')}
// // 					</span>
// // 					<span className="text-xl font-bold">
// // 						{analyticsData.overall_conversion_rate}%
// // 					</span>
// // 				</div>
// // 			</div>

// // 			{/* Funnel Chart */}
// // 			<Card className="border border-[#DEE1E6] rounded-[20px] bg-[#F8F8F8]">
// // 				<CardContent className="p-6">
// // 					<div className="chart-wrapper">
// // 						<div ref={chartRef}></div>
// // 					</div>
// // 				</CardContent>
// // 			</Card>

// // 			{/* Additional Info */}
// // 			<div className="mt-6 text-sm text-gray-600 text-center">
// // 				{__('Shows how many deals successfully move from one stage to the next in the sales pipeline', 'quillcrm')}
// // 			</div>
// // 		</div>
// // 	);
// // };

// // export default PipelineAnalytics;

// import React, { useState, useEffect, useCallback } from 'react';
// import { __ } from '@wordpress/i18n';
// import apiFetch from '@wordpress/api-fetch';
// import { Card, CardContent } from '@/components/ui/card';
// import ConversionRatesChart from '../conversion-rate-by-stage';
// import AverageDurationChart from '../average-duration-by-stage';
// import ChartReport from '../funnelStages';
// // import FunnelChart from './FunnelChart';

// interface PipelineAnalyticsProps {
// 	pipelineId?: number;
// 	ownerId?: number;
// }

// interface PipelineStageData {
// 	stage_id: number;
// 	stage_name: string;
// 	stage_order: number;
// 	total_deals: number;
// 	total_value: number;
// 	conversion_rate: number;
// 	avg_duration: number;
// }

// interface PipelineAnalyticsResponse {
// 	pipeline_id: number;
// 	pipeline_name: string;
// 	stages: PipelineStageData[];
// 	total_deals: number;
// 	total_value: number;
// 	overall_conversion_rate: number;
// }

// const PipelineAnalytics: React.FC<PipelineAnalyticsProps> = ({
// 	pipelineId,
// 	ownerId,
// }) => {
// 	const [analyticsData, setAnalyticsData] =
// 		useState<PipelineAnalyticsResponse | null>(null);
// 	const [loading, setLoading] = useState(true);
// 	const [error, setError] = useState<string | null>(null);
// 	const [selectedPipeline, setSelectedPipeline] = useState<
// 		number | undefined
// 	>(pipelineId);
// 	const [availablePipelines, setAvailablePipelines] = useState<
// 		Array<{ id: number; name: string }>
// 	>([]);

// 	const fetchPipelines = useCallback(async () => {
// 		try {
// 			const response = (await apiFetch({
// 				path: '/qc/v1/pipelines',
// 			})) as Array<{ id: number; name: string }>;

// 			setAvailablePipelines(response);
// 			if (!selectedPipeline && response.length > 0) {
// 				setSelectedPipeline(response[0].id);
// 			}
// 		} catch (error: any) {
// 			console.error('Failed to fetch pipelines:', error);
// 		}
// 	}, [selectedPipeline]);

// 	const fetchPipelineAnalytics = useCallback(async () => {
// 		if (!selectedPipeline) {
// 			setLoading(false);
// 			return;
// 		}

// 		try {
// 			setLoading(true);
// 			setError(null);

// 			const params = new URLSearchParams();
// 			if (ownerId) params.append('owner_id', String(ownerId));

// 			const apiPath = `/qc/v1/pipelines/${selectedPipeline}/analytics${params.toString() ? `?${params.toString()}` : ''}`;

// 			const response = (await apiFetch({
// 				path: apiPath,
// 			})) as PipelineAnalyticsResponse;

// 			console.log('Pipeline Analytics Response:', response);
// 			setAnalyticsData(response);
// 			setLoading(false);
// 		} catch (error: any) {
// 			console.error('Failed to fetch pipeline analytics:', error);
// 			setError(
// 				error.message ||
// 					__('Failed to fetch pipeline analytics', 'quillcrm')
// 			);
// 			setLoading(false);
// 		}
// 	}, [selectedPipeline, ownerId]);

// 	useEffect(() => {
// 		fetchPipelines();
// 	}, [fetchPipelines]);

// 	useEffect(() => {
// 		if (selectedPipeline) {
// 			fetchPipelineAnalytics();
// 		}
// 	}, [fetchPipelineAnalytics]);

// 	if (loading) {
// 		return (
// 			<div className="pipeline-analytics-container p-6">
// 				<div className="report-header mb-4">
// 					<h2 className="text-2xl font-semibold text-[#09090B]">
// 						{__('Pipeline Funnel Chart', 'quillcrm')}
// 					</h2>
// 				</div>
// 				<div className="flex justify-center items-center h-64">
// 					<div className="text-gray-500">
// 						{__('Loading pipeline data...', 'quillcrm')}
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	}

// 	if (error) {
// 		return (
// 			<div className="pipeline-analytics-container p-6">
// 				<div className="report-header mb-4">
// 					<h2 className="text-2xl font-semibold text-[#09090B]">
// 						{__('Pipeline Funnel Chart', 'quillcrm')}
// 					</h2>
// 				</div>
// 				<div className="text-red-500 p-4 bg-red-50 rounded">
// 					{error}
// 				</div>
// 			</div>
// 		);
// 	}

// 	if (!analyticsData || analyticsData.stages?.length === 0) {
// 		return (
// 			<div className="pipeline-analytics-container p-6">
// 				<div className="report-header mb-4">
// 					<h2 className="text-2xl font-semibold text-[#09090B]">
// 						{__('Pipeline Funnel Chart', 'quillcrm')}
// 					</h2>
// 				</div>
// 				<div className="text-center text-gray-500 p-8">
// 					{__('No pipeline data available', 'quillcrm')}
// 				</div>
// 			</div>
// 		);
// 	}

// 	// const sortedStages = [...analyticsData?.stages].sort((a, b) => a.stage_order - b.stage_order);
// 	const sortedStages = Array.isArray(analyticsData?.stages)
// 		? [...analyticsData.stages].sort(
// 				(a, b) => a.stage_order - b.stage_order
// 			)
// 		: [];

// 	return (
// 		<div className="pipeline-analytics-container w-full mx-auto">
// 			{/* Header */}
// 			<div className="report-header mb-6 flex justify-between items-center px-6">
// 				<h2 className="text-2xl font-semibold text-[#09090B] font-[Inter]">
// 					{__('Pipelines Analytics', 'quillcrm')}
// 				</h2>

// 				{availablePipelines?.length > 1 && (
// 					<select
// 						value={selectedPipeline}
// 						onChange={(e) =>
// 							setSelectedPipeline(Number(e.target.value))
// 						}
// 						className="px-4 py-2 border border-[#DEE1E6] rounded-lg bg-white text-[#09090B]"
// 					>
// 						{availablePipelines.map((pipeline) => (
// 							<option key={pipeline.id} value={pipeline.id}>
// 								{pipeline.name}
// 							</option>
// 						))}
// 					</select>
// 				)}
// 			</div>

// 			{/* Funnel Chart Card */}
// 			<Card className="border border-[#DEE1E6] rounded-[20px] bg-[#F8F8F8] mx-5">
// 				<CardContent className="p-0">
// 					<ChartReport
// 						selectedPipelineId={selectedPipeline ?? null}
// 					/>
// 				</CardContent>
// 			</Card>
// 			<div className="grid grid-cols-2 gap-5 mx-5 mt-5">
// 				<ConversionRatesChart
// 					selectedPipelineId={selectedPipeline ?? null}
// 					ownerId={ownerId}
// 				/>
// 				<AverageDurationChart
// 					selectedPipelineId={selectedPipeline ?? null}
// 					ownerId={ownerId}
// 				/>
// 			</div>
// 		</div>
// 	);
// };

// export default PipelineAnalytics;
import React, { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Card, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import ConversionRatesChart from '../conversion-rate-by-stage';
import AverageDurationChart from '../average-duration-by-stage';
import ChartReport from '../funnelStages';
import { DateRangePopup } from '@/client/pages/analytics-and-reports/components/DateRangePopup';
import dayjs from 'dayjs';
import PipelineFilters from '../components/pipeline-rep-filter';
import { PageHeader } from '@quillcrm/components';

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
	const [analyticsData, setAnalyticsData] = useState<PipelineAnalyticsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [availablePipelines, setAvailablePipelines] = useState<Array<{ id: number; name: string }>>([]);
	const [availableOwners, setAvailableOwners] = useState<Owner[]>([]);
	
	// Filter states
	const [selectedPipeline, setSelectedPipeline] = useState<number | null>(pipelineId ?? null);
	const [selectedOwner, setSelectedOwner] = useState<number | null>(initialOwnerId ?? null);
	const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });

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

			console.log('Raw Owners Response:', response); // للتشخيص

			// تحويل البيانات للصيغة المطلوبة
			const formattedOwners = response.map((user) => ({
				id: user.id || user.ID,
				name: user.display_name || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
			}));

			console.log('Formatted Owners:', formattedOwners); // للتشخيص
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
			if (dateRange.from) params.append('date_from', dayjs(dateRange.from).format('YYYY-MM-DD'));
			if (dateRange.to) params.append('date_to', dayjs(dateRange.to).format('YYYY-MM-DD'));

			const apiPath = `/qc/v1/pipelines/${selectedPipeline}/analytics${params.toString() ? `?${params.toString()}` : ''}`;

			const response = (await apiFetch({
				path: apiPath,
			})) as PipelineAnalyticsResponse;

			console.log('Pipeline Analytics Response:', response);
			setAnalyticsData(response);
			setLoading(false);
		} catch (error: any) {
			console.error('Failed to fetch pipeline analytics:', error);
			setError(
				error.message || __('Failed to fetch pipeline analytics', 'quillcrm')
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
			<div className="pipeline-analytics-container p-6">
				<div className="report-header mb-4">
					<h2 className="text-2xl font-semibold text-[#09090B]">
						{__('Pipeline Analytics', 'quillcrm')}
					</h2>
				</div>
				<div className="flex justify-center items-center h-64">
					<div className="text-gray-500">
						{__('Loading pipeline data...', 'quillcrm')}
					</div>
				</div>
			</div>
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
				<div className="text-red-500 p-4 bg-red-50 rounded">{error}</div>
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
					<PageHeader title={__('Pipelines Analytics', 'quillcrm')}
					subtitle={__('Pipelines Analytics', 'quillcrm')}
					actions={[]}/>

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
			<Card className="border border-[#DEE1E6] rounded-[20px] bg-[#F8F8F8] mx-5">
				<CardContent className="p-0">
					<ChartReport
						selectedPipelineId={selectedPipeline}
						ownerId={selectedOwner ?? undefined}
					/>
				</CardContent>
			</Card>

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