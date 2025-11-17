/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * Internal dependencies
 */
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '../../../../components/ui/card';

import { Button } from '../../../../components/ui/button';

import apiFetch from '@wordpress/api-fetch';
import CardsStatistics, {
	CardsStatisticsProps,
} from '../components/card-statistics';

import { Skeleton } from '../../../../components/ui/skeleton';
import ActivityCard, { ActivityItem } from '../components/card-activity';
import CardPipelineStages from '../components/card-pipeline-stages';
import TableActiveDeals from '../components/table-active-deals';
import { useReportFilters } from '../../../../hooks/useReportFilters';
import { PieChart, Pie, Cell } from 'recharts';
import DealsStatisticsCard, {
	convertToDealsStatistics,
} from '../components/card-statistics-deatails';
import SaleRepHeader from '../components/sale-rep-header';
import SaleReportFilter from '../components/sale-report-filter';
import SalesRepSkeleton from './SalesRepSkeleton';
import { PageHeader } from '@quillcrm/components';

interface SalesRepResponse {
	sale_info: {
		id: number;
		name: string;
		email: string;
	};
	cards_statistics: {
		total_deals_close_won_number: CardsStatisticsProps;
		total_deals_close_won_value: CardsStatisticsProps;
		total_deals_close_lost_number: CardsStatisticsProps;
		total_deals_close_lost_value: CardsStatisticsProps;
		total_deals_close_number: CardsStatisticsProps;
		total_deals_close_value: CardsStatisticsProps;
		performance_rate_number: CardsStatisticsProps;
		performance_rate_value: CardsStatisticsProps;
	};
	won_loss_analytics: {
		total_deals_won: string;
		total_deals_lost: string;
		total_deals_open: string;
		win_rate: string;
	};
	recent_activities: ActivityItem[];
}

// Utility function to convert timestamp to relative time
const getRelativeTime = (timestamp: string): string => {
	const now = new Date();
	const past = new Date(timestamp);
	const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return __('Just now', 'quillcrm');
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return diffInMinutes === 1
			? __('1 minute ago', 'quillcrm')
			: `${diffInMinutes} ${__('minutes ago', 'quillcrm')}`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return diffInHours === 1
			? __('1 hour ago', 'quillcrm')
			: `${diffInHours} ${__('hours ago', 'quillcrm')}`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 30) {
		return diffInDays === 1
			? __('1 day ago', 'quillcrm')
			: `${diffInDays} ${__('days ago', 'quillcrm')}`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		return diffInMonths === 1
			? __('1 month ago', 'quillcrm')
			: `${diffInMonths} ${__('months ago', 'quillcrm')}`;
	}

	const diffInYears = Math.floor(diffInMonths / 12);
	return diffInYears === 1
		? __('1 year ago', 'quillcrm')
		: `${diffInYears} ${__('years ago', 'quillcrm')}`;
};

interface SalesRepProps {
	ownerId?: number;
}

const SalesRep: React.FC<SalesRepProps> = ({ ownerId }) => {
	const [loading, setLoading] = useState(true);
	const [saleInfo, setSaleInfo] = useState<SalesRepResponse['sale_info']>({
		id: 0,
		name: '',
		email: '',
	});
	const [cardsStatistics, setCardsStatistics] = useState<
		SalesRepResponse['cards_statistics']
	>({} as SalesRepResponse['cards_statistics']);
	const [wonLossAnalytics, setWonLossAnalytics] = useState<
		SalesRepResponse['won_loss_analytics']
	>({
		total_deals_won: '0',
		total_deals_lost: '0',
		total_deals_open: '0',
		win_rate: '0',
	});
	const [recentActivities, setRecentActivities] = useState<
		SalesRepResponse['recent_activities']
	>([]);

	const [queryParams, setQueryParams] = useState<string>('');

	const {
		filters,
		setFilters,
		filterOptions,
		buildQueryParams,
		clearFilters,
	} = useReportFilters();

	const fetchSalesRep = useCallback(async () => {
		setLoading(true);
		try {
			const queryParams = buildQueryParams();
			setQueryParams(queryParams);
			let apiPath = '';
			if (ownerId) {
				apiPath = `/qc/v1/reports/sales-rep?owner_id=${ownerId}${queryParams ? `&${queryParams}` : ''}`;
			} else {
				apiPath = `/qc/v1/reports/sales-rep${queryParams ? `?${queryParams}` : ''}`;
			}

			const response = (await apiFetch({
				path: apiPath,
			})) as SalesRepResponse;

			setSaleInfo(response.sale_info);
			setCardsStatistics(response.cards_statistics);
			setWonLossAnalytics(response.won_loss_analytics);
			setRecentActivities(response.recent_activities);
		} catch (error) {
			console.error('Error fetching sales rep:', error);
		} finally {
			setLoading(false);
		}
	}, [buildQueryParams, ownerId]);

	useEffect(() => {
		fetchSalesRep();
	}, [fetchSalesRep]);

	// Apply filters
	const applyFilters = useCallback(() => {
		fetchSalesRep();
	}, [fetchSalesRep]);
	const open = Number(wonLossAnalytics.total_deals_open);
	const won = Number(wonLossAnalytics.total_deals_won);
	const lost = Number(wonLossAnalytics.total_deals_lost);

	const total = open + won + lost;

	const openPercent = total ? ((open / total) * 100).toFixed(1) : 0;
	const wonPercent = total ? ((won / total) * 100).toFixed(1) : 0;
	const lostPercent = total ? ((lost / total) * 100).toFixed(1) : 0;

	// time header
	// Get relative time for last activity
	const lastActivityTime = recentActivities[0]?.time
		? getRelativeTime(recentActivities[0].time)
		: __('No activity', 'quillcrm');

	return (
		<>
			<PageHeader
				title={
					ownerId
						? `${__('Sales Representative Details', 'quillcrm')} - ${saleInfo.name}`
						: __('My Reports', 'quillcrm')
				}
				subtitle={
					ownerId
						? `${__('Sales Representative Details', 'quillcrm')} - ${saleInfo.name}`
						: __('My Reports', 'quillcrm')
				}
				actions={[]}
			/>
			<div className="w-7xl max-w-[90vw] mx-auto flex flex-col gap-5 ">
				<div className=" flex justify-end items-end">
					{/* Header Section */}

					{/* Filters Section */}
					<SaleReportFilter
						key={`filters-${JSON.stringify(filters)}`}
						// title={__('Sales Rep', 'quillcrm')}
						filters={filters}
						setFilters={setFilters}
						clearFilters={clearFilters}
						applyFilters={applyFilters}
						filterOptions={filterOptions}
					/>
				</div>

				{loading ? (
					<SalesRepSkeleton />
				) : (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4  border-b py-8 border-b-[#DEE1E6]">
							{convertToDealsStatistics(cardsStatistics).map(
								(stat, index) => (
									<DealsStatisticsCard
										key={index}
										iconBgColor={stat.iconBgColor}
										borderColor={stat.borderColor}
										title={stat.title}
										icon={stat.icon}
										statistics={stat.statistics}
									/>
								)
							)}
						</div>

						{/* Main Content Grid */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start border-b py-8 border-b-[#DEE1E6]">
							{/* Pipeline Stages */}
							<div className="lg:col-span-2 h-full">
								<CardPipelineStages ownerId={ownerId ?? null} />
							</div>
							{/* Win/Loss Analysis */}
							<Card className="border border-[#DEE1E6] rounded-[20px] bg-[#F8F8F8] p-3  h-full  lg:col-span-1 flex flex-col">
								<CardHeader>
									<div className="flex justify-between items-center">
										<CardTitle className=" text-[#09090B] text-2xl font-medium leading-normal tracking-[-1]">
											{__(
												'Win/Loss Analysis',
												'quillcrm'
											)}
										</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between p-0 gap-1">
										{/* Pie Chart */}
										<div className="flex-shrink-0">
											<PieChart width={260} height={260}>
												<Pie
													data={[
														{
															name: 'Open Deals',
															value: open,
														},
														{
															name: 'Won Deals',
															value: won,
														},
														{
															name: 'Lost Deals',
															value: lost,
														},
													]}
													cx="50%"
													cy="50%"
													outerRadius={110}
													innerRadius={0}
													dataKey="value"
													startAngle={90}
													endAngle={-270}
												>
													{[
														'#458DC7',
														'#16A34A',
														'#E13B3B',
													].map((fill, index) => (
														<Cell
															key={index}
															fill={fill}
														/>
													))}
												</Pie>
											</PieChart>
										</div>

										{/* Legend */}
										<div className="flex flex-col gap-5 flex-1">
											{/* Open Deals */}
											<div className="flex items-center gap-3">
												<div className="w-4 h-4 rounded-full bg-[#458DC7]"></div>
												<div className="flex items-center justify-center gap-2">
													<span className="text-base font-normal leading-[26px]  text-[#09090B]">
														Open Deals (
														{openPercent}%):
													</span>
													<span className="text-base font-semibold leading-[26px]  text-[#09090B]">
														{open}K Deal
													</span>
												</div>
											</div>

											{/* Closed Won */}
											<div className="flex items-center gap-3">
												<div className="w-4 h-4 rounded-full bg-[#16A34A]"></div>
												<div className="flex items-center justify-center gap-2">
													<span className="text-base font-normal leading-[26px]  text-[#09090B]">
														Closed Won ({wonPercent}
														%):
													</span>
													<span className="text-base font-semibold leading-[26px] text-[#09090B]">
														{won}K Deal
													</span>
												</div>
											</div>

											{/* Closed Lost */}
											<div className="flex items-center gap-3">
												<div className="w-4 h-4 rounded-full bg-[#E13B3B]"></div>
												<div className="flex items-center justify-center gap-2">
													<span className="text-base font-normal leading-[26px]  text-[#09090B]">
														Closed Lost (
														{lostPercent}
														%):
													</span>
													<span className="text-base font-semibold leading-[26px] text-[#09090B]">
														{lost}K Deal
													</span>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Table Active Deals */}
						<div className="border-b py-8 border-b-[#DEE1E6]">
							<TableActiveDeals
								ownerId={ownerId ?? null}
								filters={filters}
								queryParams={queryParams}
							/>
						</div>

						{/* Recent Activities */}
						<Card>
							<CardHeader>
								<div className="flex justify-between items-center">
									<CardTitle>Recent Activities</CardTitle>
									<Button
										variant="ghost"
										size="sm"
										className="text-blue-600 text-sm"
									>
										View all →
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-1 max-h-80 overflow-y-auto">
									{recentActivities.length === 0 ? (
										<div className="text-center text-gray-500">
											{__(
												'No recent activities',
												'quillcrm'
											)}
										</div>
									) : (
										recentActivities.map((activity) => (
											<ActivityCard
												key={activity.id}
												activity={activity}
											/>

											// <Activity dealId={activity.id}
											// 	 />
										))
									)}
								</div>
							</CardContent>
						</Card>
					</>
				)}
			</div>
		</>
	);
};

export default SalesRep;
