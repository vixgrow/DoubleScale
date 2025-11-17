import { useEffect, useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { useReportFilters } from '../../../../hooks/useReportFilters';
import apiFetch from '@wordpress/api-fetch';
import '../../../lib/chart-setup';
import { Chart } from 'react-chartjs-2';
import { Card, CardContent } from '../../../../components/ui/card';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import LeaderboardChartSkeleton from './LeaderboardChartSkeleton';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

interface LeaderboardItem {
	owner_id: number;
	owner_name: string;
	won_amount: number;
	lost_amount: number;
	total_amount: number;
	won_count: number;
	lost_count: number;
	total_count: number;
}

interface DealsReportsLeaderboardProps {
	deals_leaderboard: LeaderboardItem[];
}

const DealsReportsLeaderboard: React.FC = () => {
	const [data, setData] = useState<DealsReportsLeaderboardProps>({
		deals_leaderboard: [],
	});
	const [loading, setLoading] = useState(false);

	// Use the custom hook for filters
	const {
		buildQueryParams,
	} = useReportFilters();

	const fetchDealsReportsLeaderboard = useCallback(async () => {
		setLoading(true);
		try {
			const queryParams = buildQueryParams();
			const path = `/qc/v1/reports/deals-leaderboard${queryParams ? `?${queryParams}` : ''}`;

			const response = (await apiFetch({
				path,
			})) as DealsReportsLeaderboardProps;

			setData(response);
		} catch (error) {
			console.error('Error fetching deals reports leaderboard:', error);
		} finally {
			setLoading(false);
		}
	}, [buildQueryParams]);

	useEffect(() => {
		fetchDealsReportsLeaderboard();
	}, [fetchDealsReportsLeaderboard]);

	// Apply filters
	const applyFilters = useCallback(() => {
		fetchDealsReportsLeaderboard();
	}, [fetchDealsReportsLeaderboard]);

	// Prepare chart data
	const getChartData = () => {
		if (!data.deals_leaderboard || data.deals_leaderboard.length === 0) {
			return {
				labels: [],
				datasets: [],
			};
		}

		// Sort by total amount descending and take top 10
		const sortedData = data.deals_leaderboard
			.sort((a, b) => b.total_amount - a.total_amount)
			.slice(0, 10);

		return {
			labels: sortedData.map((item) => item.owner_name),
			datasets: [
				{
					label: __('Deal Value ($)', 'quillcrm'),
					data: sortedData.map((item) => item.total_amount),
					backgroundColor: '#16A34A', 
					borderColor: '#16A34A',
					borderWidth: 0,
					borderRadius: 4,
					barThickness: 20,
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
			title: {
				display: true,
				text: __('Deal leaderboard - amount closed by rep', 'quillcrm'),
				font: {
					size: 24,
					weight: 500,
				},
				align: 'start' as const,
				padding: {
					bottom: 20,
				},
				color: '#09090B',
			},
			tooltip: {
				backgroundColor: '#1f2937',
				padding: 12,
				cornerRadius: 6,
				titleFont: {
					size: 13,
					weight: 600,
				},
				bodyFont: {
					size: 12,
				},
				callbacks: {
					label: function (context: any) {
						const value = context.parsed.x;
						return `Deal Values: ${new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD',
						}).format(value)}`;
					},
				},
			},
		},
		scales: {
			x: {
				beginAtZero: true,
				grid: {
					display: true,
					color: '#E5E6EB',
					drawBorder: false,
					borderDash: [4, 4]
				},
				ticks: {
					font: {
						size: 12,
					},
					color: '#86909C',
					callback: function (value: any) {
						return new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD',
							notation: 'compact',
							maximumFractionDigits: 1,
						}).format(value);
					},
				},
				border: {
					display: false,
				},
			},
			y: {
				
				grid: {
					display: false,
					drawBorder: false,
					borderDash: [4, 4],
				},
				ticks: {
					font: {
						size: 14,
					},
					color: '#777',
					padding: 8,
				},
				border: {
					display: true,
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

	return (
			
			<Card className='border border-[#DEE1E6] p-5' style={{ backgroundColor: '#F5F5F5' , boxShadow:'none' }}>
				<CardContent style={{ padding: '24px' }}>
					{loading ? (
						<LeaderboardChartSkeleton/>
					) : (
						<div style={{ height: '500px', width: '100%' }}>
							<Chart
								type="bar"
								data={getChartData()}
								options={chartOptions}
							/>
						</div>
					)}
				</CardContent>
			</Card>
		
	);
};

export default DealsReportsLeaderboard;