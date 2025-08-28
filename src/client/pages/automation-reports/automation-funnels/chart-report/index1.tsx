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
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
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

interface ChartReportState {
	funnelData: any[];
	loading: boolean;
	error: string | null;
}

class ChartReport extends React.Component<ChartReportProps, ChartReportState> {
	constructor(props: ChartReportProps) {
		super(props);
		this.state = {
			funnelData: [],
			loading: true,
			error: null,
		};
	}

	componentDidMount() {
		this.fetchFunnelData();
	}

	componentDidUpdate(prevProps: ChartReportProps) {
		if (prevProps.automation?.id !== this.props.automation?.id) {
			this.fetchFunnelData();
		}
	}

	fetchFunnelData = async () => {
		if (!this.props.automation?.id) {
			this.setState({
				funnelData: [],
				loading: false,
				error: null,
			});
			return;
		}

		try {
			this.setState({ loading: true, error: null });

			const response = (await apiFetch({
				path: `/qc/v1/automation-reports/${this.props.automation.id}/get-chart-report`,
			})) as any;

			this.setState({
				funnelData: response.funnel_data || [],
				loading: false,
				error: null,
			});
		} catch (error: any) {
			console.error('Failed to fetch funnel data:', error);
			this.setState({
				funnelData: [],
				loading: false,
				error:
					error.message ||
					__('Failed to fetch funnel data', 'quillcrm'),
			});
		}
	};

	getChartData = () => {
		const { funnelData } = this.state;

		// Fallback data if no real data is available
		const chartData =
			funnelData.length > 0
				? funnelData
				: [
						{
							label: __('No data available', 'quillcrm'),
							value: 0,
							percentage: 0,
						},
					];

		return {
			labels: chartData.map(
				(item) => item.label + ' ' + item.percentage + '%'
			),
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
				y: {
					type: 'linear' as const,
					display: true,
					position: 'left' as const,
					beginAtZero: true,
					grid: {
						color: 'rgba(0, 0, 0, 0.1)',
					},
				},
				y1: {
					type: 'linear' as const,
					display: true,
					position: 'right' as const,
					beginAtZero: true,
					grid: {
						drawOnChartArea: false,
					},
				},
			},
		};
	};

	render() {
		const { loading, error } = this.state;

		if (loading) {
			return (
				<div className="chart-report-container">
					<div className="loading-spinner">
						{__('Loading funnel data...', 'quillcrm')}
					</div>
				</div>
			);
		}

		if (error) {
			return (
				<div className="chart-report-container">
					<div className="error-message">{error}</div>
				</div>
			);
		}

		return (
			<div className="chart-report-container">
				<div className="chart-wrapper">
					<Chart
						type="bar"
						data={this.getChartData()}
						options={this.getChartOptions()}
						height={400}
					/>
				</div>
			</div>
		);
	}
}

export default ChartReport;
