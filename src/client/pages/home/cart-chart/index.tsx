// /**
//  * wordpress dependencies
//  */
// import { __ } from '@wordpress/i18n';
// /**
//  * external dependencies
//  */
// import { Doughnut } from 'react-chartjs-2';
// import {
// 	Chart as ChartJS,
// 	ArcElement,
// 	Tooltip,
// 	Legend,
// 	ChartOptions,
// } from 'chart.js';
// /**
//  * internal dependencies
//  */
// import { DashboardContentCard, DateFilter } from '@quillcrm/components';
// import type { CartAnalytics } from '@quillcrm/client';

// // Register Chart.js components for doughnut chart
// ChartJS.register(ArcElement, Tooltip, Legend);

// interface CartsChartProps {
// 	data: CartAnalytics;
// 	interval: string;
// 	startDate: Date;
// 	endDate: Date;
// 	onIntervalChange: (value: string) => void;
// 	onChangeFromDate: (date: Date) => void;
// 	onChangeToDate: (date: Date) => void;
// 	onSubmit: () => void;
// }

// export const CartsChart: React.FC<CartsChartProps> = ({
// 	data,
// 	interval,
// 	startDate,
// 	endDate,
// 	onIntervalChange,
// 	onChangeFromDate,
// 	onChangeToDate,
// 	onSubmit,
// }) => {
// 	// Calculate totals for pending and paid revenue
// 	const calculateRevenueTotals = () => {
// 		let pendingTotal = 0;
// 		let paidTotal = 0;

// 		if (data.revenue) {
// 			pendingTotal = data.revenue.pending || 0;
// 			paidTotal = data.revenue.paid || 0;
// 		} else {
// 			const totalRevenue = data.total?.revenue || 0;
// 			paidTotal = totalRevenue * 0.7;
// 			pendingTotal = totalRevenue * 0.3;
// 		}

// 		return { pendingTotal, paidTotal };
// 	};

// 	const { pendingTotal, paidTotal } = calculateRevenueTotals();

// 	const chartData = {
// 		labels: [__('Paid', 'quillcrm'), __('Pending', 'quillcrm')],
// 		datasets: [
// 			{
// 				data: [paidTotal, pendingTotal],
// 				backgroundColor: ['#1E3A8A', '#3B82F6'],
// 				borderColor: ['#ffffff', '#ffffff'],
// 				borderWidth: 2,
// 			},
// 		],
// 	};

// 	const chartOptions: ChartOptions<'doughnut'> = {
// 		responsive: true,
// 		maintainAspectRatio: false,
// 		plugins: {
// 			legend: {
// 				position: 'top',
// 				labels: {
// 					padding: 20,
// 					usePointStyle: true,
// 					pointStyle: 'circle',
// 					font: {
// 						size: 12,
// 					},
// 				},
// 			},
// 			tooltip: {
// 				callbacks: {
// 					label: function (context) {
// 						const label = context.label || '';
// 						const value = context.parsed || 0;
// 						const total = paidTotal + pendingTotal;
// 						const percentage =
// 							total > 0
// 								? ((value / total) * 100).toFixed(1)
// 								: '0.0';
// 						return `${label}: ${value.toFixed(2)} (${percentage}%)`;
// 					},
// 				},
// 			},
// 		},
// 		cutout: '60%',
// 	};

// 	return (
// 		<DashboardContentCard
// 			title={__('Revenue', 'quillcrm')}
// 			headerContent={
// 				<DateFilter
// 					interval={interval}
// 					startDate={startDate}
// 					endDate={endDate}
// 					onIntervalChange={onIntervalChange}
// 					onChangeFromDate={onChangeFromDate}
// 					onChangeToDate={onChangeToDate}
// 				/>
// 			}
// 		>
// 			<div className="flex flex-col items-center p-4">
// 				<div className="w-full max-w-md h-64">
// 					<Doughnut data={chartData} options={chartOptions} />
// 				</div>
// 			</div>
// 		</DashboardContentCard>
// 	);
// };

/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { Doughnut } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	ChartOptions,
} from 'chart.js';
/**
 * internal dependencies
 */
import { DashboardContentCard, DateFilter } from '@quillcrm/components';
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

		if (data.revenue) {
			pendingTotal = data.revenue.pending || 0;
			paidTotal = data.revenue.paid || 0;
		} else {
			const totalRevenue = data.total?.revenue || 0;
			paidTotal = totalRevenue * 0.7;
			pendingTotal = totalRevenue * 0.3;
		}

		return { pendingTotal, paidTotal };
	};

	const { pendingTotal, paidTotal } = calculateRevenueTotals();
	const hasData = pendingTotal > 0 || paidTotal > 0;

	const chartData = {
		labels: [__('Paid', 'quillcrm'), __('Pending', 'quillcrm')],
		datasets: [
			{
				data: hasData ? [paidTotal, pendingTotal] : [1, 0],
				backgroundColor: hasData 
					? ['#1E3A8A', '#3B82F6']
					: ['#E5E7EB', '#E5E7EB'],
				borderColor: ['#ffffff', '#ffffff'],
				borderWidth: 2,
			},
		],
	};

	const chartOptions: ChartOptions<'doughnut'> = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top',
				display: hasData,
				labels: {
					padding: 20,
					usePointStyle: true,
					pointStyle: 'circle',
					font: {
						size: 12,
					},
				},
			},
			tooltip: {
				enabled: hasData,
				callbacks: {
					label: function (context) {
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
		cutout: '60%',
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
				/>
			}
		>
			<div className="flex flex-col items-center p-4">
				{hasData ? (
					<>
						<div className="w-full max-w-md h-64">
							<Doughnut data={chartData} options={chartOptions} />
						</div>
						{/* Revenue Summary */}
						<div className="flex gap-8 mt-6">
							<div className="flex items-center gap-3">
								<div className="w-4 h-4 rounded-full bg-[#1E3A8A]"></div>
								<div className="flex flex-col">
									<span className="text-sm text-gray-600">
										{__('Paid', 'quillcrm')}
									</span>
									<span className="text-lg font-semibold text-gray-900">
										{paidTotal.toFixed(2)}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-4 h-4 rounded-full bg-[#3B82F6]"></div>
								<div className="flex flex-col">
									<span className="text-sm text-gray-600">
										{__('Pending', 'quillcrm')}
									</span>
									<span className="text-lg font-semibold text-gray-900">
										{pendingTotal.toFixed(2)}
									</span>
								</div>
							</div>
						</div>
					</>
				) : (
					<div className="flex flex-col items-center justify-center h-64 text-gray-500">
						<svg
							className="w-16 h-16 mb-4 text-gray-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<p className="text-base font-medium">
							{__('No Revenue Data Available', 'quillcrm')}
						</p>
						<p className="text-sm text-gray-400 mt-1">
							{__('Data will appear here once you have revenue', 'quillcrm')}
						</p>
					</div>
				)}
			</div>
		</DashboardContentCard>
	);
};