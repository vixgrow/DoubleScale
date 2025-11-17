import React, { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Card, CardContent } from '@/components/ui/card';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Tooltip, TooltipContent, TooltipTrigger } from '@quillcrm/components/ui/tooltip';
import { Button } from '@quillcrm/components/ui/button';
import AverageDurationChartSkeleton from './Average-duration-by-stageSkeleton';
import { EmptyState } from '../../home/no-data';
import { DashboardContentCard } from '@quillcrm/components';

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

interface StageAnalytics {
  stage_id: number;
  stage_name: string;
  stage_order: number;
  total_deals: number;
  total_value: number;
  conversion_rate: number;
  avg_duration: number;
}

const AverageDurationChart: React.FC<AverageDurationChartProps> = ({
  selectedPipelineId,
  ownerId,
}) => {
  const [stages, setStages] = useState<StageAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedPipelineId) {
      setStages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (ownerId) params.append('owner_id', String(ownerId));

      const response = (await apiFetch({
        path: `/qc/v1/pipelines/${selectedPipelineId}/analytics${params.toString() ? `?${params.toString()}` : ''}`,
      })) as { stages: StageAnalytics[] };

      const sortedStages = (response.stages || []).sort(
        (a, b) => a.stage_order - b.stage_order
      );

      setStages(sortedStages);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || __('Failed to fetch analytics', 'quillcrm'));
      setLoading(false);
    }
  }, [selectedPipelineId, ownerId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const stageColors = [
    '#5B93C7', 
    '#8B5CF6', 
    '#F59E0B', 
    '#F97316', 
    '#10B981', 
    '#EF4444',
  ];

  const getChartData = () => {
    if (stages.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: stages.map((stage) => stage.stage_name),
      datasets: [
        {
          label: __('Average Duration (days)', 'quillcrm'),
          data: stages.map((stage) => stage.avg_duration),
          backgroundColor: stages.map((_, index) => stageColors[index % stageColors.length]),
          borderColor: stages.map((_, index) => stageColors[index % stageColors.length]),
          borderWidth: 0,
          barThickness: 32,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#09090B',
        bodyColor: '#09090B',
        borderColor: '#DEE1E6',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const days = context.parsed.y;
            return `${days} ${days === 1 ? 'day' : 'days'}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#09090B',
          maxRotation: 0,
          minRotation: 0,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: '#E5E7EB',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#86909C',
          callback: function (value: any) {
            return value;
          },
        },
        border: {
          display: false,
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 20,
        top: 10,
        bottom: 10,
      },
    },
  };

  if (loading) {
    return (
      <AverageDurationChartSkeleton/>
    );
  }

  if (error) {
    return (
      <Card className="border border-[#DEE1E6] bg-[#FFF] rounded-[16px]">
        <CardContent className="p-6">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (stages.length === 0) {
    return (
      <DashboardContentCard
       title={__('Average Duration per Stage', 'quillcrm')}
      >
         <EmptyState />
      </DashboardContentCard>
     
    );
  }

  return (
    <Card className="border border-[#DEE1E6] bg-[#FFF] rounded-[16px]">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-2xl font-medium text-[#09090B]">
            {__('Average Duration per Stage', 'quillcrm')}
          </h3>
          <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Add to library</p>
      </TooltipContent>
    </Tooltip>
        </div>
        <div style={{ height: '400px', width: '100%' }}>
          <Bar data={getChartData()} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

export default AverageDurationChart;