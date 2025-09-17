import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../../components/ui/select';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { InfoCircleOutlined } from '@ant-design/icons';
import { __ } from '@wordpress/i18n';
import { useReportFilters } from '../../../../hooks/useReportFilters';
import ReportFilters from '../../../../components/reports/ReportFilters';

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
	const [hoveredBar, setHoveredBar] = useState<DealData | null>(null);
	const [hoveredPosition, setHoveredPosition] = useState({ x: 0, y: 0 });

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

	const fetchDealsReportsByDate = async (
		days: number = 30,
		freq: string = 'daily'
	) => {
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
	};

	useEffect(() => {
		fetchDealsReportsByDate(daysBack, frequency);
	}, [daysBack, frequency]);

	useEffect(() => {
		fetchDealsReportsByDate(daysBack, frequency);
	}, [filters]);

	// Apply filters
	const applyFilters = () => {
		fetchDealsReportsByDate(daysBack, frequency);
	};

	// Calculate chart dimensions and max value
	const chartData = data?.deals_by_date || [];
	const maxValue = Math.max(...chartData.map((d) => d.total), 1);
	const chartHeight = 300;
	const chartWidth = Math.max(chartData.length * 60, 800);
	const barWidth = Math.min(50, (chartWidth - 100) / chartData.length);

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

	// Calculate percentages for tooltip
	const calculatePercentage = (value: number, total: number) => {
		return total > 0 ? Math.round((value / total) * 100) : 0;
	};

	// Handle bar hover
	const handleBarHover = (deal: DealData, event: React.MouseEvent) => {
		if (deal.total > 0) {
			setHoveredBar(deal);
			setHoveredPosition({ x: event.clientX, y: event.clientY });
		}
	};

	const handleBarLeave = () => {
		setHoveredBar(null);
	};

	return (
		<div className="p-6 space-y-6">
			{/* Filters Section */}
			<ReportFilters
				title={__('Deal Reports by Date - Filters', 'quillcrm')}
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
				showStatus={true}
				showContact={true}
			/>

			<Card>
				<CardContent className="p-6">
					<div className="mb-6">
						<div className="flex justify-between items-center mb-4">
							<div className="flex items-center gap-2">
								<h4 className="text-lg font-semibold text-gray-900 m-0">
									{__(
										'Deal totals by create date with status breakdown',
										'quillcrm'
									)}
								</h4>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger>
											<InfoCircleOutlined className="text-gray-500" />
										</TooltipTrigger>
										<TooltipContent>
											<p>
												{__(
													'Shows the number of deals created each day, grouped by their current status',
													'quillcrm'
												)}
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
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

						{/* Legend */}
						<div className="flex gap-6 mb-5">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-red-300 rounded-full" />
								<span className="text-sm text-gray-700">
									{__('Open', 'quillcrm')}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-cyan-400 rounded-full" />
								<span className="text-sm text-gray-700">
									{__('Won', 'quillcrm')}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-violet-400 rounded-full" />
								<span className="text-sm text-gray-700">
									{__('Lost', 'quillcrm')}
								</span>
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
						<div className="relative">
							{/* Chart Container */}
							<div className="overflow-x-auto border border-gray-200 rounded-lg p-5">
								<svg
									width={chartWidth}
									height={chartHeight + 60}
									className="block"
								>
									{/* Y-axis labels */}
									{Array.from({ length: 6 }, (_, i) => {
										const value = Math.ceil(
											(maxValue / 5) * i
										);
										const y =
											chartHeight - (i * chartHeight) / 5;
										return (
											<g key={i}>
												<text
													x={40}
													y={y + 5}
													textAnchor="end"
													fontSize="12"
													fill="#666"
												>
													{value}
												</text>
												<line
													x1={50}
													y1={y}
													x2={chartWidth - 20}
													y2={y}
													stroke="#f0f0f0"
													strokeWidth={1}
												/>
											</g>
										);
									})}

									{/* Bars */}
									{chartData.map((deal, index) => {
										const x = 60 + index * (barWidth + 10);
										const total = deal.total;

										if (total === 0) {
											return (
												<g key={deal.date}>
													{/* X-axis label */}
													<text
														x={x + barWidth / 2}
														y={chartHeight + 20}
														textAnchor="middle"
														fontSize="11"
														fill="#666"
														transform={`rotate(-45, ${x + barWidth / 2}, ${chartHeight + 20})`}
													>
														{formatDate(
															deal.date,
															frequency
														)}
													</text>
												</g>
											);
										}

										const scale = chartHeight / maxValue;
										const lostHeight =
											(deal.lost / total) * total * scale;
										const wonHeight =
											(deal.won / total) * total * scale;
										const openHeight =
											(deal.open / total) * total * scale;

										let currentY = chartHeight;

										return (
											<g key={deal.date}>
												{/* Lost section */}
												{deal.lost > 0 && (
													<rect
														x={x}
														y={
															currentY -
															lostHeight
														}
														width={barWidth}
														height={lostHeight}
														fill="#a78bfa"
														cursor="pointer"
														onMouseEnter={(e) =>
															handleBarHover(
																deal,
																e
															)
														}
														onMouseLeave={
															handleBarLeave
														}
													/>
												)}

												{/* Won section */}
												{deal.won > 0 && (
													<rect
														x={x}
														y={
															currentY -
															lostHeight -
															wonHeight
														}
														width={barWidth}
														height={wonHeight}
														fill="#22d3ee"
														cursor="pointer"
														onMouseEnter={(e) =>
															handleBarHover(
																deal,
																e
															)
														}
														onMouseLeave={
															handleBarLeave
														}
													/>
												)}

												{/* Open section */}
												{deal.open > 0 && (
													<rect
														x={x}
														y={
															currentY -
															lostHeight -
															wonHeight -
															openHeight
														}
														width={barWidth}
														height={openHeight}
														fill="#fca5a5"
														cursor="pointer"
														onMouseEnter={(e) =>
															handleBarHover(
																deal,
																e
															)
														}
														onMouseLeave={
															handleBarLeave
														}
													/>
												)}

												{/* Total label on top of bar */}
												{total > 0 && (
													<text
														x={x + barWidth / 2}
														y={
															currentY -
															lostHeight -
															wonHeight -
															openHeight -
															8
														}
														textAnchor="middle"
														fontSize="12"
														fontWeight="bold"
														fill="#333"
													>
														{total}
													</text>
												)}

												{/* X-axis label */}
												<text
													x={x + barWidth / 2}
													y={chartHeight + 20}
													textAnchor="middle"
													fontSize="11"
													fill="#666"
													transform={`rotate(-45, ${x + barWidth / 2}, ${chartHeight + 20})`}
												>
													{formatDate(
														deal.date,
														frequency
													)}
												</text>
											</g>
										);
									})}

									{/* Y-axis title */}
									<text
										x={15}
										y={chartHeight / 2}
										textAnchor="middle"
										fontSize="12"
										fill="#666"
										transform={`rotate(-90, 15, ${chartHeight / 2})`}
									>
										{__('Count of Deals', 'quillcrm')}
									</text>

									{/* X-axis title */}
									<text
										x={chartWidth / 2}
										y={chartHeight + 50}
										textAnchor="middle"
										fontSize="12"
										fill="#666"
									>
										{__('Create Date', 'quillcrm')}
									</text>
								</svg>
							</div>

							{/* Tooltip */}
							{hoveredBar && (
								<div
									className="fixed bg-gray-800 text-white p-3 rounded-md text-xs z-50 pointer-events-none shadow-lg"
									style={{
										left: hoveredPosition.x + 10,
										top: hoveredPosition.y - 10,
									}}
								>
									<div className="font-bold mb-2">
										{formatDate(hoveredBar.date, frequency)}
									</div>
									<div className="mb-1">
										<span className="text-red-300">● </span>
										{__('Open:', 'quillcrm')}{' '}
										{hoveredBar.open} (
										{calculatePercentage(
											hoveredBar.open,
											hoveredBar.total
										)}
										%)
									</div>
									<div className="mb-1">
										<span className="text-cyan-400">
											●{' '}
										</span>
										{__('Won:', 'quillcrm')}{' '}
										{hoveredBar.won} (
										{calculatePercentage(
											hoveredBar.won,
											hoveredBar.total
										)}
										%)
									</div>
									<div className="mb-2">
										<span className="text-violet-400">
											●{' '}
										</span>
										{__('Lost:', 'quillcrm')}{' '}
										{hoveredBar.lost} (
										{calculatePercentage(
											hoveredBar.lost,
											hoveredBar.total
										)}
										%)
									</div>
									<div className="font-bold border-t border-gray-600 pt-1">
										{__('Totals:', 'quillcrm')}{' '}
										{hoveredBar.total}
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default DealsReportsByDate;
