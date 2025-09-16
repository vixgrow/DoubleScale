import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';
import { Card, Select, Typography, Flex, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { __ } from '@wordpress/i18n';
import { useReportFilters } from '../../../../hooks/useReportFilters';
import ReportFilters from '../../../../components/reports/ReportFilters';

const { Title, Text } = Typography;
const { Option } = Select;

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
		<div style={{ padding: '24px' }}>
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
				<div style={{ marginBottom: '24px' }}>
					<Flex
						justify="space-between"
						align="center"
						style={{ marginBottom: '16px' }}
					>
						<Flex align="center" gap={8}>
							<Title level={4} style={{ margin: 0 }}>
								{__(
									'Deal totals by create date with status breakdown',
									'quillcrm'
								)}
							</Title>
							<Tooltip
								title={__(
									'Shows the number of deals created each day, grouped by their current status',
									'quillcrm'
								)}
							>
								<InfoCircleOutlined style={{ color: '#666' }} />
							</Tooltip>
						</Flex>
						<Flex gap={16}>
							<div>
								<Text strong>
									{__('Date range:', 'quillcrm')}{' '}
								</Text>
								<Select
									value={daysBack}
									onChange={setDaysBack}
									style={{ width: 120 }}
									size="small"
								>
									<Option value={7}>
										{__('Last 7 days', 'quillcrm')}
									</Option>
									<Option value={14}>
										{__('Last 14 days', 'quillcrm')}
									</Option>
									<Option value={30}>
										{__('Last 30 days', 'quillcrm')}
									</Option>
									<Option value={60}>
										{__('Last 60 days', 'quillcrm')}
									</Option>
									<Option value={90}>
										{__('Last 90 days', 'quillcrm')}
									</Option>
								</Select>
							</div>
							<div>
								<Text strong>
									{__('Frequency:', 'quillcrm')}{' '}
								</Text>
								<Select
									value={frequency}
									onChange={setFrequency}
									style={{ width: 100 }}
									size="small"
								>
									<Option value="daily">
										{__('Daily', 'quillcrm')}
									</Option>
									<Option value="weekly">
										{__('Weekly', 'quillcrm')}
									</Option>
									<Option value="monthly">
										{__('Monthly', 'quillcrm')}
									</Option>
								</Select>
							</div>
						</Flex>
					</Flex>

					{/* Legend */}
					<Flex gap={24} style={{ marginBottom: '20px' }}>
						<Flex align="center" gap={8}>
							<div
								style={{
									width: 12,
									height: 12,
									backgroundColor: '#fca5a5',
									borderRadius: '50%',
								}}
							/>
							<Text>{__('Open', 'quillcrm')}</Text>
						</Flex>
						<Flex align="center" gap={8}>
							<div
								style={{
									width: 12,
									height: 12,
									backgroundColor: '#22d3ee',
									borderRadius: '50%',
								}}
							/>
							<Text>{__('Won', 'quillcrm')}</Text>
						</Flex>
						<Flex align="center" gap={8}>
							<div
								style={{
									width: 12,
									height: 12,
									backgroundColor: '#a78bfa',
									borderRadius: '50%',
								}}
							/>
							<Text>{__('Lost', 'quillcrm')}</Text>
						</Flex>
					</Flex>
				</div>

				{loading ? (
					<div style={{ textAlign: 'center', padding: '60px' }}>
						<Text>{__('Loading...', 'quillcrm')}</Text>
					</div>
				) : (
					<div style={{ position: 'relative' }}>
						{/* Chart Container */}
						<div
							style={{
								overflowX: 'auto',
								border: '1px solid #f0f0f0',
								borderRadius: '8px',
								padding: '20px',
							}}
						>
							<svg
								width={chartWidth}
								height={chartHeight + 60}
								style={{ display: 'block' }}
							>
								{/* Y-axis labels */}
								{Array.from({ length: 6 }, (_, i) => {
									const value = Math.ceil((maxValue / 5) * i);
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
													y={currentY - lostHeight}
													width={barWidth}
													height={lostHeight}
													fill="#a78bfa"
													cursor="pointer"
													onMouseEnter={(e) =>
														handleBarHover(deal, e)
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
														handleBarHover(deal, e)
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
														handleBarHover(deal, e)
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
								style={{
									position: 'fixed',
									left: hoveredPosition.x + 10,
									top: hoveredPosition.y - 10,
									backgroundColor: '#1f2937',
									color: 'white',
									padding: '12px',
									borderRadius: '6px',
									fontSize: '12px',
									zIndex: 1000,
									boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
									pointerEvents: 'none',
								}}
							>
								<div
									style={{
										fontWeight: 'bold',
										marginBottom: '8px',
									}}
								>
									{formatDate(hoveredBar.date, frequency)}
								</div>
								<div style={{ marginBottom: '4px' }}>
									<span style={{ color: '#fca5a5' }}>● </span>
									{__('Open:', 'quillcrm')} {hoveredBar.open}{' '}
									(
									{calculatePercentage(
										hoveredBar.open,
										hoveredBar.total
									)}
									%)
								</div>
								<div style={{ marginBottom: '4px' }}>
									<span style={{ color: '#22d3ee' }}>● </span>
									{__('Won:', 'quillcrm')} {hoveredBar.won} (
									{calculatePercentage(
										hoveredBar.won,
										hoveredBar.total
									)}
									%)
								</div>
								<div style={{ marginBottom: '8px' }}>
									<span style={{ color: '#a78bfa' }}>● </span>
									{__('Lost:', 'quillcrm')} {hoveredBar.lost}{' '}
									(
									{calculatePercentage(
										hoveredBar.lost,
										hoveredBar.total
									)}
									%)
								</div>
								<div
									style={{
										fontWeight: 'bold',
										borderTop: '1px solid #374151',
										paddingTop: '4px',
									}}
								>
									{__('Totals:', 'quillcrm')}{' '}
									{hoveredBar.total}
								</div>
							</div>
						)}
					</div>
				)}
			</Card>
		</div>
	);
};

export default DealsReportsByDate;
