/**
 * wordpress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { map } from 'lodash';
import { Line } from 'react-chartjs-2';
/**
 * internal dependencies
 */
import { DashboardContentCard, DateFilter } from '@doublescale/components';
import { formatDate, convertDate } from '@doublescale/utils';
import type { ContactAnalytics as ContactAnalyticsData } from '@doublescale/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ContactAnalyticsChartProps {
	data: ContactAnalyticsData;
	loading?: boolean;
	interval: string;
	startDate: Date;
	endDate: Date;
	onIntervalChange: (value: string) => void;
	onChangeFromDate: (date: Date) => void;
	onChangeToDate: (date: Date) => void;
	onSubmit: (date: Date) => void;
	/** Merged with default dashboard card styles */
	cardClassName?: string;
	contentClassName?: string;
}

export const ContactAnalyticsChart: React.FC<ContactAnalyticsChartProps> = ({
	data,
	loading = false,
	interval,
	startDate,
	endDate,
	onIntervalChange,
	onChangeFromDate,
	onChangeToDate,
	onSubmit,
	cardClassName,
	contentClassName,
}) => {
	const [gradients, setGradients] = useState<{
		line: CanvasGradient | string;
		fill: CanvasGradient | string;
	}>({
		line: '#3B82F6',
		fill: 'rgba(59, 130, 246, 0.2)',
	});

	// Create gradient function
	const createGradients = (canvas: HTMLCanvasElement) => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const chartArea = canvas.getBoundingClientRect();

		// Line gradient from #1E3A8A to #3B82F6
		const lineGradient = ctx.createLinearGradient(
			0,
			chartArea.height,
			0,
			0
		);
		lineGradient.addColorStop(0, '#1E3A8A');
		lineGradient.addColorStop(1, '#3B82F6');

		// Fill gradient from #1E3A8A to #3B82F6 with transparency
		const fillGradient = ctx.createLinearGradient(
			0,
			chartArea.height,
			0,
			0
		);
		fillGradient.addColorStop(0, 'rgba(30, 58, 138, 0.3)');
		fillGradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

		setGradients({
			line: lineGradient,
			fill: fillGradient,
		});
	};

	return (
		<DashboardContentCard
			title={__('Contact Analytics', 'doublescale')}
			dateFilter={true}
			dateFilterComponent={
				<DateFilter
					interval={interval}
					startDate={startDate}
					endDate={endDate}
					onIntervalChange={onIntervalChange}
					onChangeFromDate={onChangeFromDate}
					onChangeToDate={onChangeToDate}
					
				/>
			}
			cardClassName={cn(
				'flex h-full min-h-0 w-full flex-col bg-white rounded-[20px] shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]',
				cardClassName
			)}
			contentClassName={cn(
				'flex min-h-0 flex-1 flex-col',
				contentClassName
			)}
		>
			{loading ? (
				<div className="flex min-h-0 flex-1 flex-col space-y-4 py-2">
					<Skeleton className="h-12 w-full" />
					<div className="flex gap-4">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="min-h-[280px] w-full flex-1 rounded-lg" />
				</div>
			) : (
				<div className="relative min-h-[300px] w-full flex-1 lg:min-h-[320px]">
					<Line
						ref={(ref) => {
							if (ref?.canvas) {
								createGradients(ref.canvas);
							}
						}}
						data={{
						labels: map(data.data.dates, (date) => {
							return formatDate(date, data.data.type);
						}),
						datasets: [
							{
								label: __('Contacts', 'doublescale'),
								data: map(data.data.dates, (date) => {
									return data.contacts[date]
										? data.contacts[date]
										: 0;
								}),
								borderColor: gradients.line,
								backgroundColor: gradients.fill,
								fill: true,
								tension: 0.4,
								pointRadius: 0,
								pointHoverRadius: 6,
								borderWidth: 3,
							},
						],
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							x: {
								grid: {
									display: false,
								},
								border: {
									display: false,
								},
							},
							y: {
								beginAtZero: true,
								max: parseInt(data.total) + 10,
								grid: {
									color: 'rgba(0, 0, 0, 0.1)',
								},
								border: {
									display: false,
								},
							},
						},
						plugins: {
							legend: {
								display: false,
							},
							tooltip: {
								mode: 'index',
								intersect: false,
								backgroundColor: 'rgba(255, 255, 255, 0.95)',
								titleColor: '#333',
								bodyColor: '#666',
								borderColor: '#ddd',
								borderWidth: 1,
								cornerRadius: 8,
								callbacks: {
									label: function (context) {
										return `Date: ${convertDate(data.data.dates[context.dataIndex])}`;
									},
									title: function (context) {
										return `Contacts: ${data.contacts[data.data.dates[context[0].dataIndex]]}`;
									},
								},
							},
						},
						interaction: {
							mode: 'nearest',
							axis: 'x',
							intersect: false,
						},
					}}
					/>
				</div>
			)}
		</DashboardContentCard>
	);
};
