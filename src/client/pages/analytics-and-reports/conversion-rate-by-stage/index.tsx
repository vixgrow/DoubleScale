
import React, { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Card, CardContent } from '@/components/ui/card';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider
  } from "@/components/ui/tooltip";
import { Bar } from 'react-chartjs-2';
import WinTagIcon from '@quillcrm/components/icons/win-tag';
import ConversionRateChartSkelton from './Conversion-rate-ChartSkeleton';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

// Plugin مخصص لعرض النسبة داخل البار
const percentagePlugin = {
  id: 'percentageLabel',
  afterDatasetsDraw(chart: any) {
    const { ctx, data } = chart;
    
    chart.getDatasetMeta(0).data.forEach((bar: any, index: number) => {
      const value = data.datasets[0].data[index];
      
      if (value > 0) {
        ctx.save();
        
        // موضع النص
        const x = bar.x + 10; // داخل البار مع مسافة صغيرة من البداية
        const y = bar.y;
        
        // تنسيق النص
        ctx.fillStyle = '#09090B';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // رسم النص
        ctx.fillText(`${value}%`, x, y);
        
        ctx.restore();
      }
    });
  },
};

interface ConversionRatesChartProps {
  selectedPipelineId: number | null;
  ownerId?: number;
}

interface StageData {
  id: number;
  name: string;
  count: number;
  value: string;
  color: string;
  percentage: number;
}

const ConversionRatesChart: React.FC<ConversionRatesChartProps> = ({
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
      })) as { pipeline_stages: { stages: any[] } };

      const rawStages = (response.pipeline_stages.stages || []).map((stage) => ({
        id: stage.id,
        name: stage.name,
        count: stage.count || 0,
        value: stage.value || '0',
        color: stage.color || '#60A5FA',
        percentage: 0,
      }));

      // حساب الـ Conversion Rate بالنسبة لأكبر عدد deals
      // هنلاقي أكبر عدد deals في كل المراحل ونستخدمه كـ 100%
      const maxDealsCount = Math.max(...rawStages.map(s => s.count), 1);

      const stagesWithConversion = rawStages.map((stage) => {
        // حساب النسبة المئوية بالنسبة لأكبر عدد
        const conversionRate = Math.round((stage.count / maxDealsCount) * 100);
        
        return { ...stage, percentage: conversionRate };
      });

      setStages(stagesWithConversion);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || __('Failed to fetch stages', 'quillcrm'));
      setLoading(false);
    }
  }, [selectedPipelineId, ownerId]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

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
          label: __('Conversion Rate', 'quillcrm'),
          data: stages.map((stage) => stage.percentage),
          backgroundColor: stages.map((stage) => stage.color),
          borderColor: stages.map((stage) => stage.color),
          borderWidth: 0,
          barThickness: 40,
        },
      ],
    };
  };

  const chartOptions = {
    indexAxis: 'y' as const,
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
            return `Conversion Rate: ${context.parsed.x}%`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: Math.max(100, Math.max(...stages.map(s => s.percentage)) + 10),
        grid: {
          display: true,
          color: '#E5E7EB',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 14,
          },
          color: '#777',
          callback: function (value: any) {
            return value + '%';
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 14,
          },
          color: '#777',
          padding: 12,
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
          <ConversionRateChartSkelton/>
    );
  }

  if (error) {
    return (
      <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
        <CardContent className="p-6 flex justify-center items-center text-2xl">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (stages.length === 0) {
    return (
      <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
        <CardContent className="p-6">
          <div className="p-6 flex justify-center items-center text-2xl text-[#777]">
            {__('No data available', 'quillcrm')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-medium font-[Inter] leading-normal tracking-[-1px] text-[#09090B] mb-4">
            {__('Conversion Rates by Stage', 'quillcrm')}
          </h3>
          <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="cursor-pointer inline-flex">
        <WinTagIcon width={27} height={27} />
      </span>
    </TooltipTrigger>

    <TooltipContent side="top" className="bg-white text-black border shadow p-2 rounded-md">
      Shows how many deals successfully move from one stage to the next in the sales pipeline
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
        </div>
        <div style={{ height: '400px', width: '100%' }}>
          <Bar data={getChartData()} options={chartOptions} plugins={[percentagePlugin]} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionRatesChart;