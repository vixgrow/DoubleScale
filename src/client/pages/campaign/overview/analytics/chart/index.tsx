/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Chart } from 'react-chartjs-2';

/**
 * Internal dependencies
 */
import { Campaign as CampaignType } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';

interface ChartProps {
	campaign: CampaignType | null;
}

export const RenderChart: React.FC<ChartProps> = ({ campaign }) => {
	if (!campaign) return null;

	let chartData: {
		labels: string[];
		data: number[];
		colors: string[];
	};

	if (campaign.type === CAMPAIGN_CHANNEL.EMAIL) {
		const sentCount = campaign.sent_count;
		const openCount = campaign.opened_count || 0;
		const clickCount = campaign.clicked_count;
		const failedCount = campaign.failed_count;

		chartData = {
			labels: [
				__('Sent Emails', 'quillcrm'),
				__('Open Rate', 'quillcrm'),
				__('Click Rate', 'quillcrm'),
				__('Failed Emails', 'quillcrm'),
			],
			data: [sentCount, openCount, clickCount, failedCount],
			colors: ['#458DC7', '#16A34A', '#660FF1', '#E13B3B'],
		};
	} else if (campaign.type === CAMPAIGN_CHANNEL.SMS) {
		chartData = {
			labels: [
				__('Sent', 'quillcrm'),
				__('Failed', 'quillcrm'),
				__('Delivered', 'quillcrm'),
				__('Clicked', 'quillcrm'),
			],
			data: [
				campaign.sent_count,
				campaign.failed_count,
				campaign.delivered_count || 0,
				campaign.clicked_count,
			],
			colors: ['#458DC7', '#E13B3B', '#16A34A', '#660FF1'],
		};
	} else {
		// WhatsApp
		chartData = {
			labels: [
				__('Sent', 'quillcrm'),
				__('Failed', 'quillcrm'),
				__('Delivered', 'quillcrm'),
				__('Read', 'quillcrm'),
				__('Clicked', 'quillcrm'),
			],
			data: [
				campaign.sent_count,
				campaign.failed_count,
				campaign.delivered_count || 0,
				campaign.clicked_count,
			],
			colors: ['#458DC7', '#E13B3B', '#16A34A', '#660FF1'],
		};
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
					type="polarArea"
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
						scales: {
							r: {
								ticks: {
									display: false,
								},
								grid: {
									display: false,
								},
							},
						},
						plugins: {
							legend: {
								display: false,
							},
							tooltip: {
								callbacks: {
									label: (context: any) => {
										const value =
											context.raw ||
											context.parsed?.r ||
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

