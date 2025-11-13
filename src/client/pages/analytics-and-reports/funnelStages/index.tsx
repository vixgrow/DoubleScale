
import React, { useState, useEffect, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Chart } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip as ChartTooltip,
	Legend,
} from 'chart.js';
import { EmptyState } from '../../home/no-data';
import { DashboardContentCard } from '@quillcrm/components';
import AveragePipelineChartSkeleton from './AveragePipelineChartSkeleton';


ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	ChartTooltip,
	Legend
);

interface AverageDurationChartProps {
	selectedPipelineId: number | null;
	ownerId?: number;
}

interface StageData {
	id: number;
	name: string;
	count: number;
	value: string;
	color: string;
}

const AveragePipelineChart: React.FC<AverageDurationChartProps> = ({
	selectedPipelineId,
	ownerId,
}) => {
	const [stages, setStages] = useState<StageData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStages = useCallback(async () => {
		if (!selectedPipelineId) {
			setStages([]);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const params = new URLSearchParams();
			params.append('pipeline_id', String(selectedPipelineId));
			if (ownerId) params.append('owner_id', String(ownerId));

			const response = (await apiFetch({
				path: `/qc/v1/reports/sales-rep/pipeline-stages?${params.toString()}`,
				method: 'GET',
			})) as any;

			const stagesData: StageData[] = (
				response.pipeline_stages?.stages || []
			).map((stage: any) => ({
				id: stage.id,
				name: stage.name,
				count: stage.count,
				value: stage.value,
				color: stage.color || '#ccc',
			}));

			setStages(stagesData);
			setLoading(false);
		} catch (err: any) {
			console.error(err);
			setError(err.message || __('Failed to fetch stages', 'quillcrm'));
			setLoading(false);
		}
	}, [selectedPipelineId, ownerId]);

	useEffect(() => {
		fetchStages();
	}, [fetchStages]);

	// Prepare chart data
	const getChartData = () => {
		if (stages.length === 0) {
			return {
				labels: [],
				datasets: [],
			};
		}

		return {
			labels: stages.map((stage) => stage.name),
			datasets: [
				{
					label: __('Total Deals', 'quillcrm'),
					data: stages.map((stage) => stage.count),
					backgroundColor: '#E4B123',
					borderColor: '#E4B123',
					borderWidth: 0,
					barThickness: 21,
        
				},
				{
					label: __('Total Deals Value', 'quillcrm'),
					data: stages.map((stage) => {
						
						const numValue = parseFloat(
							stage.value.replace(/[^0-9.-]+/g, '')
						);
						return isNaN(numValue) ? 0 : numValue / 1000; 
					}),
					backgroundColor: '#16A34A',
					borderColor: '#16A34A',
					borderWidth: 0,
					barThickness: 21,
				},
			],
		};
	};

	// Chart options
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				grid: {
					display: false,
				},
				ticks: {
					font: {
						size: 14,
						weight: 500,
					},
					color: '#777',
				},
			},
			y: {
				beginAtZero: true,
				grid: {
					color: '#F3F4F6',
					drawBorder: false,
				},
				ticks: {
					font: {
						size: 14,
					},
					color: '#777',
					stepSize: 10,
				},
			},
		},
		plugins: {
			legend: {
				display: true,
				position: 'top' as const,
				align: 'center' as const,
				labels: {
					usePointStyle: true,
					pointStyle: 'circle',
					padding: 15,
          
					font: {
						size: 12,
						weight: 400,
					},
          Text:{
            size:18
          },
					color: '#09090B',
				},
			},
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#fff',
        titleColor: '#09090B',
        bodyColor: '#09090B',
        borderColor: '#DEE1E6',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function () {
            
            return '';
          },
          afterBody: function (tooltipItems: any[]) {
            const dataIndex = tooltipItems[0].dataIndex;
            const stage = stages[dataIndex];
      
            if (!stage) return [];
      
            return [
              `${__('Total Deals Value', 'quillcrm')}: ${stage.value}`,
              `${__('Total Deals', 'quillcrm')}: ${stage.count}`,
            ];
          },
        },
      },
      
		},
		interaction: {
			mode: 'index' as const,
			intersect: false,
		},
	};

	if (loading) {
		return (
			<AveragePipelineChartSkeleton/>
		);
	}

	if (error) {
		return (
			<Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
				<CardContent className="p-6">
					<div className="text-red-500 text-center">{error}</div>
				</CardContent>
			</Card>
		);
	}

	if (stages.length === 0) {
		return (
      <DashboardContentCard title={__('Average Duration per Stage', 'quillcrm')}>
         <EmptyState/>

      </DashboardContentCard>
     
		);
	}

	return (
		<div className="mb-6">
			<div style={{ height: '450px', width: '100%' }}>
				<Chart
					type="bar"
					data={getChartData()}
					options={chartOptions}
				/>
			</div>
		</div>
	);
};

export default AveragePipelineChart;
