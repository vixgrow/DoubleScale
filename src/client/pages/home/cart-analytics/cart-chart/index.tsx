/**
 * wordpress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { map } from 'lodash';
import { Line } from 'react-chartjs-2';
/**
 * internal dependencies
 */
import { DashboardContentCard, DateFilter } from '@quillcrm/components';
import { formatDate, convertDate } from '@quillcrm/utils';
import type { CartAnalytics } from '@quillcrm/client';

interface CartsChartProps {
    data: CartAnalytics;
    interval: string;
    startDate: Date;
    endDate: Date;
    onIntervalChange: (value: string) => void;
    onChangeFromDate: (date: Date) => void;
    onChangeToDate: (date: Date) => void;
    onSubmit: () => void;
}

export const CartsChart: React.FC<CartsChartProps> = ({
    data,
    interval,
    startDate,
    endDate,
    onIntervalChange,
    onChangeFromDate,
    onChangeToDate,
    onSubmit,
}) => {
    const [gradients, setGradients] = useState<{
        line: CanvasGradient | string;
        fill: CanvasGradient | string;
    }>({
        line: '#3B82F6',
        fill: 'rgba(59, 130, 246, 0.2)',
    });

    // Create gradient function
    const createGradients = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const chartArea = canvas.getBoundingClientRect();

        // Line gradient from #1E3A8A to #3B82F6
        const lineGradient = ctx.createLinearGradient(
            0,
            chartArea.height,
            0,
            0
        );
        lineGradient.addColorStop(0, '#1E3A8A');
        lineGradient.addColorStop(1, '#3B82F6');

        // Fill gradient from #1E3A8A to #3B82F6 with transparency
        const fillGradient = ctx.createLinearGradient(
            0,
            chartArea.height,
            0,
            0
        );
        fillGradient.addColorStop(0, 'rgba(30, 58, 138, 0.3)');
        fillGradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

        setGradients({
            line: lineGradient,
            fill: fillGradient,
        });
    };

    return (
        <DashboardContentCard
            title={__('Revenue', 'quillcrm')}
            headerContent={
                <DateFilter
                    interval={interval}
                    startDate={startDate}
                    endDate={endDate}
                    onIntervalChange={onIntervalChange}
                    onChangeFromDate={onChangeFromDate}
                    onChangeToDate={onChangeToDate}
                    onSubmit={onSubmit}
                />
            }
            className="w-1/3"
        >
            revenue chart
        </DashboardContentCard>
    );
};
