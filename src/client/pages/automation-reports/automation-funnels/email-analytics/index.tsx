import React from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import './style.scss';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend
);

interface EmailAnalyticsProps {
	automation?: any;
}

class EmailAnalytics extends React.Component<EmailAnalyticsProps> {
	getEmailPerformanceData = () => {
		return {
			labels: [
				'Week 1',
				'Week 2',
				'Week 3',
				'Week 4',
				'Week 5',
				'Week 6',
			],
			datasets: [
				{
					label: 'Open Rate (%)',
					data: [22.5, 25.1, 23.8, 26.2, 24.7, 23.6],
					borderColor: '#4ade80',
					backgroundColor: 'rgba(74, 222, 128, 0.1)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
				},
				{
					label: 'Click Rate (%)',
					data: [4.2, 5.8, 5.1, 6.3, 5.5, 5.9],
					borderColor: '#3b82f6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
				},
				{
					label: 'Bounce Rate (%)',
					data: [3.1, 2.8, 2.5, 2.1, 2.3, 2.4],
					borderColor: '#ef4444',
					backgroundColor: 'rgba(239, 68, 68, 0.1)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
				},
			],
		};
	};

	getEngagementData = () => {
		return {
			labels: ['Opened', 'Clicked', 'Replied', 'Unsubscribed'],
			datasets: [
				{
					data: [30, 7.5, 2.1, 1.2],
					backgroundColor: [
						'#4ade80',
						'#3b82f6',
						'#f59e0b',
						'#ef4444',
					],
					borderWidth: 0,
					hoverOffset: 4,
				},
			],
		};
	};

	getEmailVolumeData = () => {
		return {
			labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
			datasets: [
				{
					label: 'Emails Sent',
					data: [18, 22, 19, 15, 20, 8, 12],
					backgroundColor: '#6366f1',
					borderColor: '#6366f1',
					borderWidth: 1,
				},
			],
		};
	};

	getLineChartOptions = (): any => {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'top' as const,
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					titleColor: '#fff',
					bodyColor: '#fff',
					borderColor: '#4ade80',
					borderWidth: 1,
					cornerRadius: 8,
				},
			},
			scales: {
				x: {
					display: true,
					title: {
						display: true,
						text: 'Time Period',
					},
				},
				y: {
					display: true,
					title: {
						display: true,
						text: 'Percentage (%)',
					},
					beginAtZero: true,
				},
			},
		};
	};

	getDoughnutOptions = (): any => {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'bottom' as const,
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					titleColor: '#fff',
					bodyColor: '#fff',
					borderColor: '#4ade80',
					borderWidth: 1,
					cornerRadius: 8,
					callbacks: {
						label: function (context: any) {
							return `${context.label}: ${context.parsed}%`;
						},
					},
				},
			},
		};
	};

	getBarChartOptions = (): any => {
		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					titleColor: '#fff',
					bodyColor: '#fff',
					borderColor: '#6366f1',
					borderWidth: 1,
					cornerRadius: 8,
				},
			},
			scales: {
				x: {
					display: true,
					title: {
						display: true,
						text: 'Day of Week',
					},
				},
				y: {
					display: true,
					title: {
						display: true,
						text: 'Number of Emails',
					},
					beginAtZero: true,
				},
			},
		};
	};

	render() {
		return (
			<div className="email-analytics-container">
				<div className="email-analytics-header">
					<h3>Email Campaign Analytics</h3>
					<p>
						Comprehensive analysis of email performance within your
						automation funnel
					</p>
				</div>

				<div className="email-stats-grid">
					<div className="stat-card sent">
						<div className="stat-icon">📧</div>
						<div className="stat-content">
							<h4>Total Emails Sent</h4>
							<div className="stat-value">127</div>
							<div className="stat-change positive">
								+12% from last week
							</div>
						</div>
					</div>

					<div className="stat-card open-rate">
						<div className="stat-icon">📖</div>
						<div className="stat-content">
							<h4>Open Rate</h4>
							<div className="stat-value">23.6%</div>
							<div className="stat-change positive">
								+2.1% from last week
							</div>
						</div>
					</div>

					<div className="stat-card click-rate">
						<div className="stat-icon">🔗</div>
						<div className="stat-content">
							<h4>Click Rate</h4>
							<div className="stat-value">5.9%</div>
							<div className="stat-change positive">
								+0.4% from last week
							</div>
						</div>
					</div>

					<div className="stat-card bounce-rate">
						<div className="stat-icon">⚠️</div>
						<div className="stat-content">
							<h4>Bounce Rate</h4>
							<div className="stat-value">2.4%</div>
							<div className="stat-change negative">
								-0.3% from last week
							</div>
						</div>
					</div>
				</div>

				<div className="charts-grid">
					<div className="chart-section performance-trends">
						<h4>Performance Trends Over Time</h4>
						<div className="chart-wrapper">
							<Line
								data={this.getEmailPerformanceData()}
								options={this.getLineChartOptions()}
								height={300}
							/>
						</div>
					</div>

					<div className="chart-section engagement-breakdown">
						<h4>Engagement Breakdown</h4>
						<div className="chart-wrapper">
							<Doughnut
								data={this.getEngagementData()}
								options={this.getDoughnutOptions()}
								height={300}
							/>
						</div>
					</div>

					<div className="chart-section email-volume">
						<h4>Email Volume by Day</h4>
						<div className="chart-wrapper">
							<Bar
								data={this.getEmailVolumeData()}
								options={this.getBarChartOptions()}
								height={300}
							/>
						</div>
					</div>
				</div>

				<div className="insights-section">
					<h4>Email Performance Insights</h4>
					<div className="insights-grid">
						<div className="insight-card">
							<h5>📈 Top Performing</h5>
							<p>
								Your open rates are 18% above industry average.
								Subject lines with personalization are driving
								higher engagement.
							</p>
						</div>
						<div className="insight-card">
							<h5>⏰ Best Send Time</h5>
							<p>
								Emails sent on Tuesday-Thursday between 10 AM-12
								PM show the highest engagement rates.
							</p>
						</div>
						<div className="insight-card">
							<h5>🎯 Optimization Opportunity</h5>
							<p>
								Click rates can be improved by adding more
								compelling CTAs and reducing email content
								length.
							</p>
						</div>
						<div className="insight-card">
							<h5>🔄 Deliverability Status</h5>
							<p>
								Excellent bounce rate indicates good list
								hygiene. Continue monitoring for spam
								complaints.
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default EmailAnalytics;
