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
import DealsReportsByDateSkeleton from './deal-report-by-date-skeleton';

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
		[buildQueryParams]
	);

	useEffect(() => {
		fetchDealsReportsByDate(daysBack, frequency);
	}, [daysBack, frequency, fetchDealsReportsByDate]);

	// Apply filters
	const applyFilters = useCallback(() => {
		fetchDealsReportsByDate(daysBack, frequency);
	}, [fetchDealsReportsByDate, daysBack, frequency]);

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
					month: 'short',
					year: 'numeric',
				});
			}
		} else {
			// Daily format - normal date parsing
			const date = new Date(dateStr + 'T00:00:00');
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
					backgroundColor: '#5B93C7',
					borderColor: '#5B93C7',
					borderWidth: 0,
					barThickness: 32,
				},
				{
					label: __('Closed Won', 'quillcrm'),
					data: chartData.map((deal) => deal.won),
					backgroundColor: '#4CAF50',
					borderColor: '#4CAF50',
					borderWidth: 0,
					barThickness: 32,
				},
				{
					label: __('Closed Lost', 'quillcrm'),
					data: chartData.map((deal) => deal.lost),
					backgroundColor: '#E53935',
					borderColor: '#E53935',
					borderWidth: 0,
					barThickness: 32,
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
				grid: {
					display: false,
				},
				ticks: {
					font: {
						size: 11,
					},
					maxRotation: 0,
					minRotation: 0,
				},
			},
			y: {
				stacked: true,
				beginAtZero: true,
				grid: {
					display: false,
				},
				ticks: {
					font: {
						size: 11,
					},
					stepSize: 0.2,
				},
			},
		},
		plugins: {
			legend: {
				display: true,
				position: 'top' as const,
				align: 'center' as const,
				labels: {
					usePointStyle: true,
					pointStyle: 'circle',
					padding: 20,
					font: {
						size: 12,
						weight: 400,
					},
					color: '#09090B',
				},
			},
			tooltip: {
				mode: 'index' as const,
				intersect: false,
				backgroundColor: '#fff',
				titleColor: '#000',
				bodyColor: '#000',
				borderColor: '#e5e7eb',
				borderWidth: 1,
				padding: 12,
				displayColors: true,
				callbacks: {
					footer: function (tooltipItems: any[]) {
						let total = 0;
						tooltipItems.forEach(function (tooltipItem) {
							total += tooltipItem.parsed.y;
						});
						return __('Total: ', 'quillcrm') + total.toFixed(1);
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
		<div className="space-y-6">
			{/* Filters Section */}
			{/* <ReportFilters
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

			<Card className='border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5'>
				<CardContent className="p-6">
					<div className="mb-6">
						<div className="flex justify-between items-start mb-6">
							<h3 className="text-2xl font-medium font-[Inter] leading-normal tracking-[-1px] text-[#09090B] mb-4">
								{__(
									'Deal totals by create date with status breakdown',
									'quillcrm'
								)}
							</h3>
							<div className="flex gap-4">
								<div className="flex flex-col gap-1">
									<Select
										value={daysBack.toString()}
										onValueChange={(value) =>
											setDaysBack(parseInt(value))
										}
									>
										<SelectTrigger className=" h-12 py-[5px] px-4 text-[#09090B] font-normal leading-[150%] track-[-.32px] text- font-[Manrope] border border-[#DEE1E6] bg-[#FFF] rounded-[8px]">
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
									<Select
										value={frequency}
										onValueChange={setFrequency}
									>
										<SelectTrigger className=" h-12 py-[5px] px-4 text-[#09090B] font-normal leading-[150%] track-[-.32px] text- font-[Manrope] border border-[#DEE1E6] bg-[#FFF] rounded-[8px]">
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
						  <DealsReportsByDateSkeleton/>
					) : (
						<div style={{ height: '450px', width: '100%' }}>
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