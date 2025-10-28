import React, { useState, useEffect, useCallback, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Card, CardContent } from '@/components/ui/card';
import './style.scss';
import { Automation } from '@quillcrm/client';
import Chart from 'chart.js/auto';

interface ChartReportProps {
	automation: Automation | null;
}

interface FunnelDataItem {
	label: string;
	value: number;
	percentage: number;
	step_id: number | null;
	step_type: string;
}

interface FunnelResponse {
	funnel_data: FunnelDataItem[];
	total_contacts: number;
	completion_rate: number;
	automation: {
		id: number;
		name: string;
	};
}

const ChartReport: React.FC<ChartReportProps> = ({ automation }) => {
	const [funnelData, setFunnelData] = useState<FunnelDataItem[]>([]);
	const [totalContacts, setTotalContacts] = useState<number>(0);
	const [completionRate, setCompletionRate] = useState<number>(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const chartRef = useRef<HTMLCanvasElement>(null);
	const chartInstance = useRef<Chart | null>(null);

	const fetchFunnelData = useCallback(async () => {
		if (!automation?.id) {
			setFunnelData([]);
			setLoading(false);
			setError(null);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = (await apiFetch({
				path: `/qc/v1/automation-reports/${automation.id}/get-chart-report`,
			})) as FunnelResponse;

			console.log('response', response);

			if (response.funnel_data) {
				setFunnelData(response.funnel_data || []);
				setTotalContacts(response.total_contacts || 0);
				setCompletionRate(response.completion_rate || 0);
			}
			setLoading(false);
			setError(null);
		} catch (error: any) {
			console.error('Failed to fetch funnel data:', error);
			setFunnelData([]);
			setLoading(false);
			setError(
				error.message || __('Failed to fetch funnel data', 'quillcrm')
			);
		}
	}, [automation?.id]);

	useEffect(() => {
		fetchFunnelData();
	}, [fetchFunnelData]);

	useEffect(() => {
		if (chartRef.current && funnelData.length > 0) {
			// Destroy existing chart if it exists
			if (chartInstance.current) {
				chartInstance.current.destroy();
			}

			const labels = funnelData.map((item) => item.label);
			const contactValues = funnelData.map((item) => item.value);
			const percentageValues = funnelData.map((item) => item.percentage);

			const ctx = chartRef.current.getContext('2d');

			if (ctx) {
				chartInstance.current = new Chart(ctx, {
					type: 'bar',
					data: {
						labels: labels,
						datasets: [
							{
								label: __('Contacts', 'quillcrm'),
								data: contactValues,
								backgroundColor: 'rgba(54, 162, 235, 0.5)',
								borderColor: 'rgba(54, 162, 235, 1)',
								borderWidth: 1,
								yAxisID: 'y',
							},
							{
								label: __('Conversion Rate (%)', 'quillcrm'),
								data: percentageValues,
								type: 'line',
								backgroundColor: 'rgba(255, 99, 132, 0.2)',
								borderColor: 'rgba(255, 99, 132, 1)',
								borderWidth: 2,
								pointBackgroundColor: 'rgba(255, 99, 132, 1)',
								pointBorderColor: '#fff',
								pointHoverBackgroundColor: '#fff',
								pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
								pointRadius: 5,
								pointHoverRadius: 7,
								yAxisID: 'y1',
							},
						],
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							y: {
								type: 'linear',
								display: true,
								position: 'left',
								title: {
									display: true,
									text: __('Number of Contacts', 'quillcrm'),
								},
							},
							y1: {
								type: 'linear',
								display: true,
								position: 'right',
								title: {
									display: true,
									text: __('Conversion Rate (%)', 'quillcrm'),
								},
								min: 0,
								max: 100,
								grid: {
									drawOnChartArea: false,
								},
							},
						},
						plugins: {
							title: {
								display: true,
								text: __('Automation Funnel Chart', 'quillcrm'),
								font: {
									size: 16,
								},
							},
							subtitle: {
								display: true,
								text: __(
									`Total Contacts: ${totalContacts} | Overall Completion Rate: ${completionRate}%`,
									'quillcrm'
								),
								padding: {
									bottom: 10,
								},
							},
							tooltip: {
								callbacks: {
									label: function (context) {
										const label =
											context.dataset.label || '';
										const value = context.parsed.y;
										if (label.includes('Conversion')) {
											return `${label}: ${value}%`;
										}
										return `${label}: ${value}`;
									},
								},
							},
						},
					},
				});
			}
		}

		// Cleanup function
		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
			}
		};
	}, [funnelData, totalContacts, completionRate]);

	if (loading) {
		return (
			<div className="chart-report-container">
				<div className="report-header">
					<h2 className="report-title">{__('Automation Funnel Chart', 'quillcrm')}</h2>
				</div>
				<div className="loading-spinner">
					{__('Loading funnel data...', 'quillcrm')}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="chart-report-container">
				<div className="report-header">
					<h2 className="report-title">{__('Automation Funnel Chart', 'quillcrm')}</h2>
				</div>
				<div className="error-message">{error}</div>
			</div>
		);
	}

	if (funnelData.length === 0) {
		return (
			<div className="chart-report-container">
				<div className="report-header">
					<h2 className="report-title">{__('Automation Funnel Chart', 'quillcrm')}</h2>
				</div>
				<div className="empty-state">
					{__('No funnel data available', 'quillcrm')}
				</div>
			</div>
		);
	}

	return (
		<div className="chart-report-container">
			<div className="report-header">
				<h2 className="report-title">{__('Automation Funnel Chart', 'quillcrm')}</h2>
				<div className="stats-container">
					<div className="stat-box bg-[#E3EEFF99] text-secondary border border-secondary">
						<span className="stat-label">
							{__('Total Contacts:', 'quillcrm')}
						</span>
						<span className="stat-value">{totalContacts}</span>
					</div>
					<div className="stat-box bg-[#E4FAEC] text-[#16A34A] border border-[#16A34A]">
						<span className="stat-label">
							{__('Completion Rate:', 'quillcrm')}
						</span>
						<span className="stat-value">{completionRate}%</span>
					</div>
				</div>
			</div>
			<Card>
				<CardContent className="p-6">
					<div
						className="chart-wrapper"
						style={{ height: '400px', width: '100%' }}
					>
						<canvas ref={chartRef}></canvas>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default ChartReport;
