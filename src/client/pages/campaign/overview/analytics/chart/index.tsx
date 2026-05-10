/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import '../../../../../lib/chart-setup';
import { Chart } from 'react-chartjs-2';

/**
 * Internal dependencies
 */
import { Campaign as CampaignType } from '@doublescale/client';
import { CAMPAIGN_CHANNEL, isEmailChannel } from '@/constants/campaign-channel';

export interface ChartData {
	labels: string[];
	data: number[];
	colors: string[];
}

interface ChartProps {
	campaign?: CampaignType | null;
	chartData?: ChartData;
}

function buildChartDataFromCampaign(campaign: CampaignType): ChartData {
	if (isEmailChannel(campaign.type)) {
		return {
			labels: [
				__('Sent Emails', 'doublescale'),
				__('Open Rate', 'doublescale'),
				__('Click Rate', 'doublescale'),
				__('Failed Emails', 'doublescale'),
			],
			data: [campaign.sent_count, campaign.opened_count || 0, campaign.clicked_count, campaign.failed_count],
			colors: ['#458DC7', '#16A34A', '#660FF1', '#E13B3B'],
		};
	}

	if (campaign.type === CAMPAIGN_CHANNEL.SMS) {
		return {
			labels: [
				__('Sent', 'doublescale'),
				__('Failed', 'doublescale'),
				__('Delivered', 'doublescale'),
				__('Clicked', 'doublescale'),
			],
			data: [campaign.sent_count, campaign.failed_count, campaign.delivered_count || 0, campaign.clicked_count],
			colors: ['#458DC7', '#E13B3B', '#16A34A', '#660FF1'],
		};
	}

	// WhatsApp
	return {
		labels: [
			__('Sent', 'doublescale'),
			__('Failed', 'doublescale'),
			__('Delivered', 'doublescale'),
			__('Read', 'doublescale'),
			__('Clicked', 'doublescale'),
		],
		data: [campaign.sent_count, campaign.failed_count, campaign.delivered_count || 0, campaign.read_count || 0, campaign.clicked_count],
		colors: ['#458DC7', '#E13B3B', '#16A34A', '#FFA500', '#660FF1'],
	};
}

export const RenderChart: React.FC<ChartProps> = ({ campaign, chartData: externalChartData }) => {
	let chartData: ChartData;

	if (externalChartData) {
		chartData = externalChartData;
	} else if (campaign) {
		chartData = buildChartDataFromCampaign(campaign);
	} else {
		return null;
	}

	// Calculate total for percentage calculations
	// Use sum of all data points in the chart
	const totalForPercentage = chartData.data.reduce(
		(sum, value) => sum + value,
		0
	);

	return (
		<div className="flex items-center gap-3 p-0 rounded">
			{/* Chart on the left */}
			<div className="flex-shrink-0 w-[200px] h-[200px]">
				<Chart
					type="pie"
					data={{
						labels: chartData.labels,
						datasets: [
							{
								data: chartData.data,
								backgroundColor: chartData.colors,
								borderWidth: 0,
							},
						],
					}}
					options={{
						responsive: true,
						maintainAspectRatio: true,
						plugins: {
							legend: {
								display: false,
							},
							tooltip: {
								callbacks: {
									label: (context: any) => {
										const value =
											context.raw ||
											context.parsed ||
											0;
										const percentage =
											totalForPercentage > 0
												? (
													(value /
														totalForPercentage) *
													100
												).toFixed(1)
												: '0.0';
										return `${percentage}%`;
									},
								},
							},
						},
					}}
				/>
			</div>

			{/* Legend on the right */}
			<div className="flex flex-col gap-3 flex-1">
				{chartData.labels.map((label, index) => {
					const value = chartData.data[index];
					const percentage =
						totalForPercentage > 0
							? ((value / totalForPercentage) * 100).toFixed(
								1
							)
							: '0.0';
					return (
						<div
							key={index}
							className="flex items-center gap-2"
						>
							<div
								className="w-2 h-2 rounded-full flex-shrink-0"
								style={{
									backgroundColor:
										chartData.colors[index],
								}}
							/>
							<span className="text-base text-gray-500">
								{label}
							</span>
							<span className="text-base font-semibold text-[#09090B]">
								{percentage}%
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

