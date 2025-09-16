import { useEffect, useState } from 'react';
import { Flex, Skeleton, Typography, Card } from 'antd';
import { CardContent } from '../../../../components/ui/card';
import { __ } from '@wordpress/i18n';
import { useReportFilters } from '../../../../hooks/useReportFilters';
import ReportFilters from '../../../../components/reports/ReportFilters';
import apiFetch from '@wordpress/api-fetch';
import { Chart } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';

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
		filters,
		setFilters,
		filterOptions,
		showFilters,
		setShowFilters,
		buildQueryParams,
		clearFilters,
	} = useReportFilters();

	const fetchDealsReportsLeaderboard = async () => {
		setLoading(true);
		try {
			const queryParams = buildQueryParams();
			const path = `/qc/v1/reports/deals-leaderboard${queryParams ? `?${queryParams}` : ''}`;

			const response = (await apiFetch({
				path,
			})) as DealsReportsLeaderboardProps;

			console.log('response', response);

			setData(response);
		} catch (error) {
			console.error('Error fetching deals reports leaderboard:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDealsReportsLeaderboard();
	}, []);

	useEffect(() => {
		fetchDealsReportsLeaderboard();
	}, [filters]);

	// Apply filters
	const applyFilters = () => {
		fetchDealsReportsLeaderboard();
	};

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
			labels: sortedData.map((item) => item.owner_name), // Y-axis: Owner names
			datasets: [
				{
					label: __('Deal Value ($)', 'quillcrm'),
					data: sortedData.map((item) => item.total_amount), // X-axis: Money values
					backgroundColor: '#1890ff',
					borderColor: '#096dd9',
					borderWidth: 1,
				},
			],
		};
	};

	const chartOptions = {
		indexAxis: 'y' as const, // This makes it horizontal (Y-axis = owner names, X-axis = money values)
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			title: {
				display: true,
				text: __('Deal Leaderboard - Amount Closed by Rep', 'quillcrm'),
				font: {
					size: 16,
					weight: 'bold' as const,
				},
			},
			tooltip: {
				callbacks: {
					label: function (context: any) {
						const value = context.parsed.x; // X-axis value (money amount)
						const ownerName = context.label; // Y-axis label (owner name)
						return `${ownerName}: ${new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD',
						}).format(value)}`;
					},
				},
			},
		},
		scales: {
			x: {
				// X-axis: Money values
				beginAtZero: true,
				title: {
					display: true,
					text: __('Deal Value ($)', 'quillcrm'),
				},
				ticks: {
					callback: function (value: any) {
						return new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: 'USD',
							notation: 'compact',
						}).format(value);
					},
				},
			},
			y: {
				// Y-axis: Owner names
				title: {
					display: true,
					text: __('Sales Rep', 'quillcrm'),
				},
				ticks: {
					font: {
						size: 12,
					},
				},
			},
		},
	};

	return (
		<div>
			{/* Filters Section */}
			<ReportFilters
				title={__(
					'Deal leaderboard - amount closed by rep',
					'quillcrm'
				)}
				filters={filters}
				setFilters={setFilters}
				filterOptions={filterOptions}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
				clearFilters={clearFilters}
				applyFilters={applyFilters}
				showDateRange={false}
				showOwner={true}
				showPipeline={true}
				showStatus={false}
				showContact={true}
			/>

			{/* Chart Section */}
			<Card style={{ marginTop: 20 }}>
				<CardContent>
					<div style={{ marginBottom: 16 }}>
						<Typography.Text type="secondary">
							{__(
								'Showing deal values closed by each sales representative',
								'quillcrm'
							)}
						</Typography.Text>
						<br />
						<Typography.Text type="secondary">
							🔸{' '}
							{__(
								'Y-axis: Sales Rep Names | X-axis: Deal Values ($)',
								'quillcrm'
							)}
						</Typography.Text>
					</div>

					{loading ? (
						<Skeleton active paragraph={{ rows: 8 }} />
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
		</div>
	);
};

export default DealsReportsLeaderboard;
