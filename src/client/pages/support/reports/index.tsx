/**
 * Support → Reports — ticket volume, trends, and performance analytics.
 */

import React, { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import dayjs from 'dayjs';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from 'recharts';

import { DateFilter } from '@doublescale/components';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';
import {
	useReportSummary,
	useTicketsOverTime,
	useReportBreakdown,
	useAgentReport,
	useMailboxReport,
	useMailboxes,
	useAssignableAgents,
} from '@/hooks/support';
import type { ReportFilters } from '@/types/support';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/constants/support';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';

const toYmd = (date: Date): string => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
};

const FILTER_SELECT_CLASS =
	'h-10 min-w-[180px] gap-2 rounded-lg border-brandPrimary bg-white px-3 text-sm font-medium text-brandPrimary shadow-sm transition-colors hover:bg-brandPrimary/5 focus:ring-2 focus:ring-brandPrimary/30';

const getIntervalDates = (
	interval: string,
	customFrom?: Date,
	customTo?: Date
): { from: Date; to: Date } => {
	const today = dayjs().endOf('day');
	switch (interval) {
		case 'today':
			return {
				from: today.startOf('day').toDate(),
				to: today.toDate(),
			};
		case 'yesterday': {
			const yesterday = today.subtract(1, 'day');
			return {
				from: yesterday.startOf('day').toDate(),
				to: yesterday.endOf('day').toDate(),
			};
		}
		case 'last_7_days':
			return {
				from: today.subtract(6, 'day').startOf('day').toDate(),
				to: today.toDate(),
			};
		case 'this_month':
			return {
				from: today.startOf('month').toDate(),
				to: today.toDate(),
			};
		case 'last_month': {
			const lastMonth = today.subtract(1, 'month');
			return {
				from: lastMonth.startOf('month').toDate(),
				to: lastMonth.endOf('month').toDate(),
			};
		}
		case 'this_year':
			return {
				from: today.startOf('year').toDate(),
				to: today.toDate(),
			};
		case 'last_year': {
			const lastYear = today.subtract(1, 'year');
			return {
				from: lastYear.startOf('year').toDate(),
				to: lastYear.endOf('year').toDate(),
			};
		}
		case 'custom':
			return {
				from: customFrom ?? today.subtract(29, 'day').startOf('day').toDate(),
				to: customTo ?? today.toDate(),
			};
		case 'last_30_days':
		default:
			return {
				from: today.subtract(29, 'day').startOf('day').toDate(),
				to: today.toDate(),
			};
	}
};

const STATUS_COLORS: Record<string, string> = {
	open: 'hsl(var(--chart-1))',
	pending: 'hsl(var(--chart-2))',
	resolved: 'hsl(var(--chart-3))',
	closed: 'hsl(var(--chart-4))',
};

const PRIORITY_COLORS = [
	'hsl(var(--chart-1))',
	'hsl(var(--chart-2))',
	'hsl(var(--chart-3))',
	'hsl(var(--chart-4))',
];

const formatBucketLabel = (date: string, bucket: string): string => {
	if (bucket === 'monthly') {
		const [year, month] = date.split('-');
		return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
			undefined,
			{ month: 'short', year: 'numeric' }
		);
	}
	if (bucket === 'weekly') {
		return date;
	}
	try {
		return new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
		});
	} catch {
		return date;
	}
};

const SupportReports: React.FC = () => {
	const initialDates = getIntervalDates('last_30_days');
	const [interval, setInterval] = useState('last_30_days');
	const [startDate, setStartDate] = useState(initialDates.from);
	const [endDate, setEndDate] = useState(initialDates.to);
	const [mailboxId, setMailboxId] = useState<string>('all');
	const [agentId, setAgentId] = useState<string>('all');
	const canManageAllTickets = useCapabilities().canManageAllTickets();
	const { data: mailboxes } = useMailboxes();
	const { data: assignableAgents } = useAssignableAgents();

	const handleIntervalChange = useCallback((value: string) => {
		setInterval(value);
		if (value !== 'custom') {
			const range = getIntervalDates(value);
			setStartDate(range.from);
			setEndDate(range.to);
		}
	}, []);

	const filters: ReportFilters = useMemo(
		() => ({
			from: toYmd(startDate),
			to: toYmd(endDate),
			...(mailboxId !== 'all' ? { mailbox_id: Number(mailboxId) } : {}),
			...(agentId !== 'all' && canManageAllTickets
				? { agent_user_id: Number(agentId) }
				: {}),
		}),
		[startDate, endDate, mailboxId, agentId, canManageAllTickets]
	);

	const summary = useReportSummary(filters);
	const overTime = useTicketsOverTime(filters);
	const breakdown = useReportBreakdown(filters);
	const agents = useAgentReport(filters);
	const mailboxesReport = useMailboxReport(filters);

	const isLoading =
		summary.loading ||
		overTime.loading ||
		breakdown.loading ||
		agents.loading ||
		mailboxesReport.loading;

	const hasError =
		summary.error ||
		overTime.error ||
		breakdown.error ||
		agents.error ||
		mailboxesReport.error;

	const statusChartData = useMemo(
		() =>
			(breakdown.data?.by_status ?? [])
				.filter((item) => item.count > 0)
				.map((item) => ({
					name: STATUS_LABELS[item.key as keyof typeof STATUS_LABELS] ?? item.label,
					value: item.count,
					fill: STATUS_COLORS[item.key] ?? 'hsl(var(--chart-5))',
				})),
		[breakdown.data]
	);

	const priorityChartData = useMemo(
		() =>
			(breakdown.data?.by_priority ?? []).map((item, index) => ({
				name:
					PRIORITY_LABELS[item.key as keyof typeof PRIORITY_LABELS] ??
					item.label,
				count: item.count,
				fill: PRIORITY_COLORS[index % PRIORITY_COLORS.length],
			})),
		[breakdown.data]
	);

	const timeSeries = overTime.data?.series ?? [];
	const bucket = overTime.data?.bucket ?? 'daily';

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					{__('Reports', 'doublescale')}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{__(
						'Ticket volume, resolution trends, and team performance.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
				<div className="flex flex-col sm:flex-row flex-wrap  gap-x-4 gap-y-3">
					<div className="flex min-w-0 flex-col gap-1.5">
						<span className="text-xs font-medium text-muted-foreground">
							{__('Period', 'doublescale')}
						</span>
						<DateFilter
							interval={interval}
							startDate={startDate}
							endDate={endDate}
							onIntervalChange={handleIntervalChange}
							onChangeFromDate={setStartDate}
							onChangeToDate={setEndDate}
						/>
					</div>
					<div className="flex min-w-0 flex-col gap-1.5">
						<span className="text-xs font-medium text-muted-foreground">
							{__('Mailbox', 'doublescale')}
						</span>
						<Select value={mailboxId} onValueChange={setMailboxId}>
							<SelectTrigger className={FILTER_SELECT_CLASS}>
								<SelectValue placeholder={__('All mailboxes', 'doublescale')} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									{__('All mailboxes', 'doublescale')}
								</SelectItem>
								{mailboxes.map((mailbox) => (
									<SelectItem key={mailbox.id} value={String(mailbox.id)}>
										{mailbox.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{canManageAllTickets && (
						<div className="flex min-w-0 flex-col gap-1.5">
							<span className="text-xs font-medium text-muted-foreground">
								{__('Agent', 'doublescale')}
							</span>
							<Select value={agentId} onValueChange={setAgentId}>
								<SelectTrigger className={FILTER_SELECT_CLASS}>
									<SelectValue placeholder={__('All agents', 'doublescale')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										{__('All agents', 'doublescale')}
									</SelectItem>
									{assignableAgents.map((agent) => (
										<SelectItem key={agent.id} value={String(agent.id)}>
											{agent.display_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</div>
			</div>

			{hasError && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{hasError}
				</div>
			)}

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{[
					{ label: __('New', 'doublescale'), value: summary.data?.new },
					{ label: __('Open', 'doublescale'), value: summary.data?.open },
					{
						label: __('Resolved', 'doublescale'),
						value: summary.data?.resolved,
					},
					{ label: __('Closed', 'doublescale'), value: summary.data?.closed },
					{
						label: __('Responses', 'doublescale'),
						value: summary.data?.total_responses,
					},
				].map((card) => (
					<Card key={card.label}>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{card.label}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{summary.loading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<div className="text-2xl font-bold">{card.value ?? 0}</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{__('Tickets over time', 'doublescale')}</CardTitle>
				</CardHeader>
				<CardContent>
					{overTime.loading ? (
						<Skeleton className="h-[300px] w-full" />
					) : timeSeries.length === 0 ? (
						<p className="text-sm text-muted-foreground py-12 text-center">
							{__('No tickets in this date range.', 'doublescale')}
						</p>
					) : (
						<ChartContainer
							config={{
								created: {
									label: __('Created', 'doublescale'),
									color: 'hsl(var(--chart-1))',
								},
								resolved: {
									label: __('Resolved', 'doublescale'),
									color: 'hsl(var(--chart-2))',
								},
							}}
							className="h-[300px] w-full"
						>
							<AreaChart data={timeSeries} margin={{ left: 0, right: 8 }}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="date"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									tickFormatter={(value) => formatBucketLabel(value, bucket)}
								/>
								<YAxis allowDecimals={false} tickLine={false} axisLine={false} />
								<ChartTooltip
									content={
										<ChartTooltipContent
											labelFormatter={(value) =>
												formatBucketLabel(String(value), bucket)
											}
										/>
									}
								/>
								<Area
									type="monotone"
									dataKey="created"
									stroke="var(--color-created)"
									fill="var(--color-created)"
									fillOpacity={0.2}
									stackId="a"
								/>
								<Area
									type="monotone"
									dataKey="resolved"
									stroke="var(--color-resolved)"
									fill="var(--color-resolved)"
									fillOpacity={0.2}
									stackId="b"
								/>
							</AreaChart>
						</ChartContainer>
					)}
				</CardContent>
			</Card>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>{__('By status', 'doublescale')}</CardTitle>
					</CardHeader>
					<CardContent>
						{breakdown.loading ? (
							<Skeleton className="h-[240px] w-full" />
						) : statusChartData.length === 0 ? (
							<p className="text-sm text-muted-foreground py-12 text-center">
								{__('No data', 'doublescale')}
							</p>
						) : (
							<ChartContainer
								config={Object.fromEntries(
									statusChartData.map((item) => [
										item.name,
										{ label: item.name, color: item.fill },
									])
								)}
								className="mx-auto h-[240px] w-full max-w-[280px]"
							>
								<PieChart>
									<ChartTooltip content={<ChartTooltipContent hideLabel />} />
									<Pie
										data={statusChartData}
										dataKey="value"
										nameKey="name"
										innerRadius={50}
										outerRadius={90}
									>
										{statusChartData.map((entry) => (
											<Cell key={entry.name} fill={entry.fill} />
										))}
									</Pie>
								</PieChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{__('By priority', 'doublescale')}</CardTitle>
					</CardHeader>
					<CardContent>
						{breakdown.loading ? (
							<Skeleton className="h-[240px] w-full" />
						) : (
							<ChartContainer
								config={Object.fromEntries(
									priorityChartData.map((item) => [
										item.name,
										{ label: item.name, color: item.fill },
									])
								)}
								className="h-[240px] w-full"
							>
								<BarChart data={priorityChartData} layout="vertical" margin={{ left: 8 }}>
									<CartesianGrid horizontal={false} />
									<XAxis type="number" allowDecimals={false} hide />
									<YAxis
										type="category"
										dataKey="name"
										tickLine={false}
										axisLine={false}
										width={72}
									/>
									<ChartTooltip content={<ChartTooltipContent hideLabel />} />
									<Bar dataKey="count" radius={4}>
										{priorityChartData.map((entry) => (
											<Cell key={entry.name} fill={entry.fill} />
										))}
									</Bar>
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
			</div>

			{canManageAllTickets && (
				<Card>
					<CardHeader>
						<CardTitle>{__('Agent performance', 'doublescale')}</CardTitle>
					</CardHeader>
					<CardContent>
						{agents.loading ? (
							<Skeleton className="h-40 w-full" />
						) : (agents.data?.data.length ?? 0) === 0 ? (
							<p className="text-sm text-muted-foreground py-8 text-center">
								{__('No agent activity in this date range.', 'doublescale')}
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{__('Agent', 'doublescale')}</TableHead>
										<TableHead className="text-right">
											{__('Assigned', 'doublescale')}
										</TableHead>
										<TableHead className="text-right">
											{__('Resolved', 'doublescale')}
										</TableHead>
										<TableHead className="text-right">
											{__('Responses', 'doublescale')}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{agents.data?.data.map((row) => (
										<TableRow key={row.agent.id}>
											<TableCell>
												<div className="font-medium">{row.agent.display_name}</div>
												<div className="text-xs text-muted-foreground">
													{row.agent.email}
												</div>
											</TableCell>
											<TableCell className="text-right">{row.assigned}</TableCell>
											<TableCell className="text-right">{row.resolved}</TableCell>
											<TableCell className="text-right">{row.responses}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>{__('Mailbox performance', 'doublescale')}</CardTitle>
				</CardHeader>
				<CardContent>
					{mailboxesReport.loading ? (
						<Skeleton className="h-40 w-full" />
					) : (mailboxesReport.data?.data.length ?? 0) === 0 ? (
						<p className="text-sm text-muted-foreground py-8 text-center">
							{__('No mailbox activity in this date range.', 'doublescale')}
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{__('Mailbox', 'doublescale')}</TableHead>
									<TableHead className="text-right">
										{__('Total', 'doublescale')}
									</TableHead>
									<TableHead className="text-right">
										{__('Open', 'doublescale')}
									</TableHead>
									<TableHead className="text-right">
										{__('Resolved', 'doublescale')}
									</TableHead>
									<TableHead className="text-right">
										{__('Closed', 'doublescale')}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{mailboxesReport.data?.data.map((row) => (
									<TableRow key={row.mailbox.id}>
										<TableCell className="font-medium">
											{row.mailbox.name}
										</TableCell>
										<TableCell className="text-right">{row.total}</TableCell>
										<TableCell className="text-right">{row.open}</TableCell>
										<TableCell className="text-right">{row.resolved}</TableCell>
										<TableCell className="text-right">{row.closed}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{isLoading && !hasError && (
				<p className="sr-only">{__('Loading reports…', 'doublescale')}</p>
			)}
		</div>
	);
};

export default SupportReports;
