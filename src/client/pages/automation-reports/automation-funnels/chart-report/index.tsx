import React from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './style.scss';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	Title,
	Tooltip,
	Legend
);

interface ChartReportProps {
	automation?: any;
}

class ChartReport extends React.Component<ChartReportProps> {
	getChartData = () => {
		const chartData = [
			{ label: 'Entrance', value: 8, percentage: 100 },
			{ label: 'Apply List', value: 7, percentage: 88 },
			{ label: 'Apply List', value: 6, percentage: 75 },
			{ label: 'Check Condition', value: 5, percentage: 63 },
			{ label: 'Apply List', value: 4, percentage: 50 },
			{ label: 'Apply List', value: 1, percentage: 13 },
			{ label: 'Wait X Days/Hours', value: 1, percentage: 13 },
			{ label: 'Apply List', value: 1, percentage: 13 },
		];

		return {
			labels: chartData.map((item) => item.label),
			datasets: [
				{
					type: 'bar' as const,
					label: 'Contacts',
					data: chartData.map((item) => item.value),
					backgroundColor: '#2d6a4f',
					borderColor: '#2d6a4f',
					borderWidth: 1,
					yAxisID: 'y',
				},
				{
					type: 'line' as const,
					label: 'Conversion Rate',
					data: chartData.map((item) => item.percentage),
					borderColor: '#4A9EFF',
					backgroundColor: 'rgba(74, 158, 255, 0.1)',
					borderWidth: 3,
					fill: false,
					tension: 0.1,
					yAxisID: 'y1',
					pointBackgroundColor: '#4A9EFF',
					pointBorderColor: '#4A9EFF',
					pointRadius: 6,
					pointHoverRadius: 8,
				},
			],
		};
	};

	getChartOptions = (): any => {
		return {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: 'index' as const,
				intersect: false,
			},
			plugins: {
				title: {
					display: false,
				},
				legend: {
					position: 'top' as const,
					align: 'end' as const,
					labels: {
						usePointStyle: true,
						padding: 20,
						font: {
							size: 14,
						},
					},
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					titleColor: '#fff',
					bodyColor: '#fff',
					borderColor: '#4A9EFF',
					borderWidth: 1,
					cornerRadius: 8,
					displayColors: true,
					callbacks: {
						label: function (context: any) {
							const label = context.dataset.label || '';
							const value = context.parsed.y;
							if (context.datasetIndex === 0) {
								return `${label}: ${value} contacts`;
							} else {
								return `${label}: ${value}%`;
							}
						},
					},
				},
			},
			scales: {
				x: {
					display: true,
					title: {
						display: true,
						text: 'Funnel Steps',
						font: {
							size: 14,
							weight: 'bold' as const,
						},
					},
					ticks: {
						maxRotation: 45,
						minRotation: 0,
					},
					grid: {
						display: false,
					},
				},
				y: {
					type: 'linear' as const,
					display: true,
					position: 'left' as const,
					title: {
						display: true,
						text: 'Number of Contacts',
						font: {
							size: 14,
							weight: 'bold' as const,
						},
					},
					beginAtZero: true,
					grid: {
						color: 'rgba(0, 0, 0, 0.1)',
					},
				},
				y1: {
					type: 'linear' as const,
					display: true,
					position: 'right' as const,
					title: {
						display: true,
						text: 'Conversion Rate (%)',
						font: {
							size: 14,
							weight: 'bold' as const,
						},
					},
					beginAtZero: true,
					max: 100,
					grid: {
						drawOnChartArea: false,
					},
				},
			},
		};
	};

	render() {
		return (
			<div className="chart-report-container">
				<div className="chart-report-header">
					<h3>Automation Funnel Performance</h3>
					<p>Track how contacts move through your automation steps</p>
				</div>

				<div className="chart-wrapper">
					<Chart
						type="bar"
						data={this.getChartData()}
						options={this.getChartOptions()}
						height={400}
					/>
				</div>

				<div className="chart-summary">
					<div className="summary-stats">
						<div className="stat-item">
							<span className="stat-label">
								Total Contacts Entered:
							</span>
							<span className="stat-value">8</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">
								Contacts Completed:
							</span>
							<span className="stat-value">1</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">
								Overall Conversion Rate:
							</span>
							<span className="stat-value">12.5%</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">
								Biggest Drop-off:
							</span>
							<span className="stat-value">
								Apply List → Wait X Days/Hours (75%)
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default ChartReport;
