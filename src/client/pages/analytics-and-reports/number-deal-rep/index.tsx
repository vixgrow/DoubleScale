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

interface DealSourceData {
  source: string;
  total_deals: number;
}

interface NumberOfDealsChartProps {
  selectedPipelineId: number | null;
  ownerId?: number;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
}

const NumberOfDealsChart: React.FC<NumberOfDealsChartProps> = ({
  selectedPipelineId,
  ownerId,
  dateRange,
}) => {
  const [dealSources, setDealSources] = useState<DealSourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDealSources = useCallback(async () => {
    if (!selectedPipelineId) {
      setDealSources([]);
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
        path: `/qc/v1/reports/deal-sources?${params.toString()}`,
      })) as { deal_sources: DealSourceData[] };

      setDealSources(response.deal_sources || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || __('Failed to fetch deal sources', 'quillcrm'));
      setLoading(false);
    }
  }, [selectedPipelineId, ownerId, dateRange]);

  useEffect(() => {
    fetchDealSources();
  }, [fetchDealSources]);

  const getChartData = () => {
    if (dealSources.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const totalDeals = dealSources.reduce((sum, source) => sum + source.total_deals, 0);

    return {
      labels: dealSources.map((source) => source.source || 'Unknown'),
      datasets: [
        {
          label: __('Total Deals', 'quillcrm'),
          data: dealSources.map((source) => source.total_deals),
          backgroundColor: '#60A5FA',
          borderColor: '#60A5FA',
          borderWidth: 0,
          barThickness: 40,
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
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            const total = dealSources.reduce((sum, source) => sum + source.total_deals, 0);
            return `Total Deals: ${context.parsed.y}`;
          },
          afterLabel: function(context: any) {
            const total = dealSources.reduce((sum, source) => sum + source.total_deals, 0);
            return `${total}K`;
          }
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
            {__('Number of Deals', 'quillcrm')}
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
            {__('Number of Deals', 'quillcrm')}
          </h3>
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (dealSources.length === 0) {
    return (
      <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
        <CardContent className="p-6">
          <h3 className="text-xl font-medium leading-normal tracking-[-1px] text-[#09090B] mb-4">
            {__('Number of Deals', 'quillcrm')}
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
          {__('Number of Deals', 'quillcrm')}
        </h3>
        <div style={{ height: '300px', width: '100%' }}>
          <Bar data={getChartData()} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

export default NumberOfDealsChart;