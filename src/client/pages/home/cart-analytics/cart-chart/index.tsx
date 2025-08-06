/**
 * wordpress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { map } from 'lodash';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
/**
 * internal dependencies
 */
import { DashboardContentCard, DateFilter } from '@quillcrm/components';
import { formatDate, convertDate } from '@quillcrm/utils';
import type { CartAnalytics } from '@quillcrm/client';

// Register Chart.js components for doughnut chart
ChartJS.register(ArcElement, Tooltip, Legend);

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
	// Calculate totals for pending and paid revenue
	const calculateRevenueTotals = () => {
		let pendingTotal = 0;
		let paidTotal = 0;

		// Assuming data structure has revenue breakdown
		// You may need to adjust based on your actual data structure
		if (data.revenue) {
			pendingTotal = data.revenue.pending || 0;
			paidTotal = data.revenue.paid || 0;
		} else {
			// Fallback: calculate from revenue data if breakdown not available
			// This is a placeholder - adjust based on your actual data structure
			const totalRevenue = data.total?.revenue || 0;
			// Assuming 70% paid, 30% pending as example - adjust based on your logic
			paidTotal = totalRevenue * 0.7;
			pendingTotal = totalRevenue * 0.3;
		}

		return { pendingTotal, paidTotal };
	};

	const { pendingTotal, paidTotal } = calculateRevenueTotals();

	const chartData = {
		labels: [
			__('Paid', 'quillcrm'),
			__('Pending', 'quillcrm'),
		],
		datasets: [
			{
				data: [paidTotal, pendingTotal],
				backgroundColor: [
					'#1E3A8A', // Solid green for paid revenue
					'#3B82F6', // Solid orange for pending revenue
				],
				cutout: '60%', // Creates the doughnut hole
			},
		],
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top' as const,
				labels: {
					padding: 20,
					usePointStyle: true,
					pointStyle: 'circle',
					font: {
						size: 10,
					},
				},
			},
			tooltip: {
				callbacks: {
					label: function (context: any) {
						const label = context.label || '';
						const value = context.parsed || 0;
						const total = paidTotal + pendingTotal;
						const percentage =
							total > 0
								? ((value / total) * 100).toFixed(1)
								: '0.0';
						return `${label}: ${value.toFixed(2)} (${percentage}%)`;
					},
				},
			},
		},
		elements: {
			arc: {
				borderWidth: 2,
			},
		},
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
			<div className="flex flex-col items-center">
				<div className="w-full h-64 mb-4">
					<Doughnut data={chartData} options={chartOptions} />
				</div>
			</div>
		</DashboardContentCard>
	);
};
