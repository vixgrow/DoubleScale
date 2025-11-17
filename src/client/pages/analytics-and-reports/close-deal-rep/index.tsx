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
import { Skeleton } from '@/components/ui/skeleton';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

interface DealSourceValueData {
  source: string;
  won_value: number;
  lost_value: number;
}

interface ClosedDealsValueChartProps {
  selectedPipelineId: number | null;
  ownerId?: number;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
}

const ClosedDealsValueChart: React.FC<ClosedDealsValueChartProps> = ({
  selectedPipelineId,
  ownerId,
  dateRange,
}) => {
  const [dealSourcesValue, setDealSourcesValue] = useState<DealSourceValueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDealSourcesValue = useCallback(async () => {
    if (!selectedPipelineId) {
      setDealSourcesValue([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('pipeline_id', String(selectedPipelineId));
      if (ownerId) params.append('owner_id', String(ownerId));
      if (dateRange?.from) params.append('date_from', dateRange.from.toISOString().split('T')[0]);
      if (dateRange?.to) params.append('date_to', dateRange.to.toISOString().split('T')[0]);

      const response = (await apiFetch({
        path: `/qc/v1/reports/deal-sources-value?${params.toString()}`,
      })) as { deal_sources_value: DealSourceValueData[] };

      setDealSourcesValue(response.deal_sources_value || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || __('Failed to fetch deal sources value', 'quillcrm'));
      setLoading(false);
    }
  }, [selectedPipelineId, ownerId, dateRange]);

  useEffect(() => {
    fetchDealSourcesValue();
  }, [fetchDealSourcesValue]);

  const getChartData = () => {
    if (dealSourcesValue.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: dealSourcesValue.map((source) => source.source || 'Unknown'),
      datasets: [
        {
          label: __('Total Closed Won Value', 'quillcrm'),
          data: dealSourcesValue.map((source) => source.won_value / 1000), // Convert to K
          backgroundColor: '#4CAF50',
          borderColor: '#4CAF50',
          borderWidth: 0,
          barThickness: 40,
          stack: 'stack1',
        },
        {
          label: __('Total Closed Lost Value', 'quillcrm'),
          data: dealSourcesValue.map((source) => source.lost_value / 1000), // Convert to K
          backgroundColor: '#E53935',
          borderColor: '#E53935',
          borderWidth: 0,
          barThickness: 40,
          stack: 'stack1',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 11,
            weight: 400,
          },
          color: '#09090B',
        },
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
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(0)}K USD`;
          },
          footer: function (tooltipItems: any[]) {
            let wonTotal = 0;
            let lostTotal = 0;
            
            tooltipItems.forEach((item) => {
              if (item.datasetIndex === 0) {
                wonTotal = item.parsed.y;
              } else if (item.datasetIndex === 1) {
                lostTotal = item.parsed.y;
              }
            });
            
            return [
              `Total Closed Won Value: ${wonTotal.toFixed(0)}K USD`,
              `Total Closed Lost Value: ${lostTotal.toFixed(0)}K USD`
            ];
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#777',
          maxRotation: 45,
          minRotation: 0,
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          display: true,
          color: '#E5E7EB',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#777',
        },
        border: {
          display: false,
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
  };

  if (loading) {
    return (
      <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
        <CardContent className="p-6">
          <h3 className="text-xl font-medium leading-normal tracking-[-1px] text-[#09090B] mb-4">
            {__('Number of Closed Won / Lost Value', 'quillcrm')}
          </h3>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
        <CardContent className="p-6">
          <h3 className="text-xl font-medium leading-normal tracking-[-1px] text-[#09090B] mb-4">
            {__('Number of Closed Won / Lost Value', 'quillcrm')}
          </h3>
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (dealSourcesValue.length === 0) {
    return (
      <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
        <CardContent className="p-6">
          <h3 className="text-xl font-medium leading-normal tracking-[-1px] text-[#09090B] mb-4">
            {__('Number of Closed Won / Lost Value', 'quillcrm')}
          </h3>
          <div className="text-gray-500 text-center py-8">
            {__('No data available', 'quillcrm')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
      <CardContent className="p-6">
        <h3 className="text-xl font-medium leading-normal tracking-[-1px] text-[#09090B] mb-4">
          {__('Number of Closed Won / Lost Value', 'quillcrm')}
        </h3>
        <div style={{ height: '300px', width: '100%' }}>
          <Bar data={getChartData()} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ClosedDealsValueChart;