import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../../components/ui/select';

import { InfoCircleOutlined } from '@ant-design/icons';
import { __ } from '@wordpress/i18n';
import { useReportFilters } from '../../../../hooks/useReportFilters';
import ReportFilters from '../../../../components/reports/ReportFilters';
import { Chart } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip as ChartTooltip,
	Legend,
} from 'chart.js';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	ChartTooltip,
	Legend
);

interface DealData {
	date: string;
	open: number;
	won: number;
	lost: number;
	total: number;
}

interface DealsReportsByDateResponse {
	deals_by_date: DealData[];
	date_range: {
		days_back: number;
		frequency: string;
	};
}

const DealsReportsByDate: React.FC = () => {
	const [data, setData] = useState<DealsReportsByDateResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [daysBack, setDaysBack] = useState(30);
	const [frequency, setFrequency] = useState('daily');

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

	const fetchDealsReportsByDate = useCallback(
		async (days: number = 30, freq: string = 'daily') => {
			setLoading(true);
			try {
				const filterParams = buildQueryParams();
				const baseParams = `days_back=${days}&frequency=${freq}`;
				const fullParams = filterParams
					? `${baseParams}&${filterParams}`
					: baseParams;

				const response = (await apiFetch({
					path: `/qc/v1/reports/deals-by-date?${fullParams}`,
				})) as DealsReportsByDateResponse;

				setData(response);
			} catch (error) {
				console.error('Error fetching deals reports:', error);
			} finally {
				setLoading(false);
			}
		},
		[buildQueryParams, daysBack, frequency]
	);

	useEffect(() => {
		fetchDealsReportsByDate(daysBack, frequency);
	}, [fetchDealsReportsByDate]);

	// Apply filters
	const applyFilters = useCallback(() => {
		fetchDealsReportsByDate(daysBack, frequency);
	}, [fetchDealsReportsByDate]);

	// Format date for display based on frequency
	const formatDate = (dateStr: string, freq: string = frequency) => {
		if (freq === 'weekly') {
			// Handle format like "2025-W37"
			const match = dateStr.match(/(\d{4})-W(\d{1,2})/);
			if (match) {
				const year = parseInt(match[1]);
				const week = parseInt(match[2]);
				return `Week ${week}, ${year}`;
			}
		} else if (freq === 'monthly') {
			// Handle format like "2025-09"
			const match = dateStr.match(/(\d{4})-(\d{1,2})/);
			if (match) {
				const year = parseInt(match[1]);
				const month = parseInt(match[2]);
				const date = new Date(year, month - 1, 1);
				return date.toLocaleDateString('en-US', {
					month: 'long',
					year: 'numeric',
				});
			}
		} else {
			// Daily format - normal date parsing
			const date = new Date(dateStr);
			if (!isNaN(date.getTime())) {
				return date.toLocaleDateString('en-US', {
					month: 'numeric',
					day: 'numeric',
					year: 'numeric',
				});
			}
		}

		// Fallback - return the original string if parsing fails
		return dateStr;
	};

	// Prepare chart data for Chart.js
	const getChartData = () => {
		const chartData = data?.deals_by_date || [];

		if (chartData.length === 0) {
			return {
				labels: [],
				datasets: [],
			};
		}

		return {
			labels: chartData.map((deal) => formatDate(deal.date, frequency)),
			datasets: [
				{
					label: __('Open', 'quillcrm'),
					data: chartData.map((deal) => deal.open),
					backgroundColor: '#458DC7', 
					borderColor: '#ef4444', 
					borderWidth: 1,
				},
				{
					label: __('Closed Won', 'quillcrm'),
					data: chartData.map((deal) => deal.won),
					backgroundColor: '#16A34A', 
					borderColor: '#0891b2', 
					borderWidth: 1,
				},
				{
					label: __('Lost', 'quillcrm'),
					data: chartData.map((deal) => deal.lost),
					backgroundColor: '#E13B3B', 
					borderColor: '#7c3aed', 
					borderWidth: 1,
				},
			],
		};
	};

	// Chart options
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				stacked: true,
				title: {
					display: true,
					text: __('Create Date', 'quillcrm'),
				},
			},
			y: {
				stacked: true,
				beginAtZero: true,
				title: {
					display: true,
					text: __('Count of Deals', 'quillcrm'),
				},
			},
		},
		plugins: {
			legend: {
				display: true,
				position: 'top' as const,
			},
			tooltip: {
				mode: 'index' as const,
				intersect: false,
				callbacks: {
					footer: function (tooltipItems: any[]) {
						let total = 0;
						tooltipItems.forEach(function (tooltipItem) {
							total += tooltipItem.parsed.y;
						});
						return __('Total: ', 'quillcrm') + total;
					},
					afterBody: function (tooltipItems: any[]) {
						if (tooltipItems.length > 0) {
							const total = tooltipItems.reduce(
								(sum: number, item: any) => sum + item.parsed.y,
								0
							);
							return tooltipItems.map((item: any) => {
								const percentage =
									total > 0
										? Math.round(
												(item.parsed.y / total) * 100
											)
										: 0;
								return `${item.dataset.label}: ${percentage}%`;
							});
						}
						return [];
					},
				},
			},
		},
		interaction: {
			mode: 'index' as const,
			intersect: false,
		},
	};

	return (
		<div className="p-6 space-y-6">
			{/* Filters Section */}
			<ReportFilters 
				key={`filters-${JSON.stringify(filters)}`}
				title={__('Deal Reports by Date - Filters', 'quillcrm')}
				filters={filters}
				setFilters={setFilters}
				filterOptions={filterOptions}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
				clearFilters={clearFilters}
				applyFilters={applyFilters}
				showPredefinedDateRange={false}
				showDateRange={false}
				showOwner={true}
				showPipeline={true}
				showStatus={true}
				showContact={true}
			/> */}

			<Card>
				<CardContent className="p-6">
					<div className="mb-6">
						<div className="flex justify-between items-center mb-4">
							<div className="flex items-center gap-2">
								<h4 className="text-2xl font-medium truncate font-[Inter] leading-normal tracking-[-1px] text-[#09090B] m-0">
									{__(
										'Deal totals by create date with status breakdown',
										'quillcrm'
									)}
								</h4>
								
							</div>
							<div className="flex gap-4">
								<div className="flex flex-col gap-1">
									<span className="text-sm font-medium text-gray-700">
										{__('Date range:', 'quillcrm')}
									</span>
									<Select
										value={daysBack.toString()}
										onValueChange={(value) =>
											setDaysBack(parseInt(value))
										}
									>
										<SelectTrigger className="w-32">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="7">
												{__('Last 7 days', 'quillcrm')}
											</SelectItem>
											<SelectItem value="14">
												{__('Last 14 days', 'quillcrm')}
											</SelectItem>
											<SelectItem value="30">
												{__('Last 30 days', 'quillcrm')}
											</SelectItem>
											<SelectItem value="60">
												{__('Last 60 days', 'quillcrm')}
											</SelectItem>
											<SelectItem value="90">
												{__('Last 90 days', 'quillcrm')}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-sm font-medium text-gray-700">
										{__('Frequency:', 'quillcrm')}
									</span>
									<Select
										value={frequency}
										onValueChange={setFrequency}
									>
										<SelectTrigger className="w-28">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="daily">
												{__('Daily', 'quillcrm')}
											</SelectItem>
											<SelectItem value="weekly">
												{__('Weekly', 'quillcrm')}
											</SelectItem>
											<SelectItem value="monthly">
												{__('Monthly', 'quillcrm')}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</div>

					{loading ? (
						<div className="text-center py-15">
							<span className="text-gray-600">
								{__('Loading...', 'quillcrm')}
							</span>
						</div>
					) : (
						<div style={{ height: '400px', width: '100%' }}>
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

export default DealsReportsByDate;
