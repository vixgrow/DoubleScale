import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import {
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	ComposedChart,
	ResponsiveContainer,
} from 'recharts';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar } from 'recharts';
import './style.scss';

interface ChartReportProps {
	automation?: any;
}

interface FunnelDataItem {
	label: string;
	value: number;
	percentage: number;
}

const ChartReport: React.FC<ChartReportProps> = ({ automation }) => {
	const [funnelData, setFunnelData] = useState<FunnelDataItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchFunnelData = async () => {
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
			})) as any;

			console.log('response', response);

			setFunnelData(response.funnel_data || []);
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
	};

	useEffect(() => {
		fetchFunnelData();
	}, [automation?.id]);

	const getChartData = () => {
		// Fallback data if no real data is available
		const chartData =
			funnelData.length > 0
				? funnelData
				: [
						{
							label: __('Email Sent', 'quillcrm'),
							value: 100,
							percentage: 100,
						},
						{
							label: __('Opened', 'quillcrm'),
							value: 75,
							percentage: 75,
						},
						{
							label: __('Clicked', 'quillcrm'),
							value: 30,
							percentage: 30,
						},
						{
							label: __('Converted', 'quillcrm'),
							value: 15,
							percentage: 15,
						},
					];

		console.log('chartData', chartData);
		// Transform data for Recharts format
		return chartData.map((item) => ({
			name: item.label,
			contacts: item.value,
			conversionRate: item.percentage,
		}));
	};

	const chartConfig: ChartConfig = {
		contacts: {
			label: __('Contacts', 'quillcrm'),
			color: 'hsl(var(--chart-1))',
		},
		conversionRate: {
			label: __('Conversion Rate', 'quillcrm'),
			color: 'hsl(var(--chart-2))',
		},
	};

	const formatTooltipValue = (value: any, name: string | number) => {
		if (name === 'conversionRate') {
			return [`${value}%`, __('Conversion Rate', 'quillcrm')];
		}
		return [`${value} contacts`, __('Contacts', 'quillcrm')];
	};

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

	const chartData = getChartData();

	return (
		<div className="chart-report-container">
			<Card>
				<CardHeader>
					<CardTitle>
						{__('Automation Funnel Report', 'quillcrm')}
					</CardTitle>
					<CardDescription>
						{__(
							'Contact flow and conversion rates through automation steps',
							'quillcrm'
						)}
					</CardDescription>
				</CardHeader>
				<CardContent className="p-6">
					<ChartContainer
						config={chartConfig}
						className="h-[400px] w-full"
					>
						<ComposedChart
							data={chartData}
							margin={{
								top: 20,
								right: 30,
								left: 20,
								bottom: 80,
							}}
						>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis
								dataKey="name"
								tick={{ fontSize: 12 }}
								angle={-45}
								textAnchor="end"
								height={80}
							/>
							<YAxis
								yAxisId="left"
								orientation="left"
								tick={{ fontSize: 12 }}
							/>
							<YAxis
								yAxisId="right"
								orientation="right"
								tick={{ fontSize: 12 }}
								domain={[0, 100]}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={formatTooltipValue}
										indicator="dot"
									/>
								}
							/>

							<Bar
								yAxisId="left"
								dataKey="contacts"
								fill="var(--color-contacts)"
								name="contacts"
								radius={[4, 4, 0, 0]}
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="conversionRate"
								stroke="var(--color-conversionRate)"
								strokeWidth={3}
								dot={{
									fill: 'var(--color-conversionRate)',
									strokeWidth: 2,
									r: 6,
								}}
								name="conversionRate"
							/>
						</ComposedChart>
					</ChartContainer>
				</CardContent>
			</Card>
		</div>
	);
};

export default ChartReport;
