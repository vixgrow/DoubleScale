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
import ReportFilters from '../../../../components/reports/ReportFilters';

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
		showFilters,
		setShowFilters,
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

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6">
			{/* Filters Section */}
			<ReportFilters
				key={`filters-${JSON.stringify(filters)}`}
				title={__('Sales Rep', 'quillcrm')}
				filters={filters}
				setFilters={setFilters}
				filterOptions={filterOptions}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
				clearFilters={clearFilters}
				applyFilters={applyFilters}
				showSource={false}
				showOwner={false}
				showPipeline={false}
				showStatus={false}
				showContact={false}
			/>
			{/* Header Section */}
			<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
						{saleInfo?.name?.charAt(0)}
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							{saleInfo?.name}
						</h1>
						<p className="text-sm text-gray-500">
							{saleInfo.email}
						</p>
					</div>
				</div>
			</div>

			{loading ? (
				<Skeleton className="h-40 w-full" />
			) : (
				<>
					{/*  Cards Statistics */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
						{Object.entries(cardsStatistics).map(
							([, value], index) => (
								<CardsStatistics
									key={index}
									label={value.label}
									value={value.value}
									change={value.change}
									isArrow={value.isArrow}
									isColor={value.isColor}
								/>
							)
						)}
					</div>

					{/* Main Content Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Pipeline Stages */}
						<CardPipelineStages ownerId={ownerId ?? null} />
						{/* Win/Loss Analysis */}
						<Card>
							<CardHeader>
								<div className="flex justify-between items-center">
									<CardTitle>
										{__('Win/Loss Analysis', 'quillcrm')}
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-8">
									{/* Donut Chart */}
									<div className="relative w-24 h-24">
										<svg
											className="w-24 h-24 transform -rotate-90"
											viewBox="0 0 100 100"
										>
											{/* Background circle */}
											<circle
												cx="50"
												cy="50"
												r="40"
												stroke="#e5e7eb"
												strokeWidth="8"
												fill="none"
											/>
											{/* Progress circle for win rate */}
											<circle
												cx="50"
												cy="50"
												r="40"
												stroke="#10b981"
												strokeWidth="8"
												fill="none"
												strokeDasharray={`${parseFloat(wonLossAnalytics.win_rate || '0') * 2.51} 251`}
												strokeLinecap="round"
											/>
										</svg>
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="text-center">
												<div className="text-xl font-bold text-gray-900">
													{wonLossAnalytics.win_rate ||
														'0'}
													%
												</div>
												<div className="text-xs text-gray-500 uppercase">
													{__('Win Rate', 'quillcrm')}
												</div>
											</div>
										</div>
									</div>

									{/* Statistics */}
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
												<span className="text-green-600 font-semibold text-sm">
													{wonLossAnalytics.total_deals_won ||
														'0'}
												</span>
											</div>
											<span className="text-xs text-gray-500 uppercase">
												{__('Won Deals', 'quillcrm')}
											</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
												<span className="text-red-600 font-semibold text-sm">
													{wonLossAnalytics.total_deals_lost ||
														'0'}
												</span>
											</div>
											<span className="text-xs text-gray-500 uppercase">
												{__('Lost Deals', 'quillcrm')}
											</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
												<span className="text-gray-600 font-semibold text-sm">
													{wonLossAnalytics.total_deals_open ||
														'0'}
												</span>
											</div>
											<span className="text-xs text-gray-500 uppercase">
												{__('No Decision', 'quillcrm')}
											</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
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
										{__('No recent activities', 'quillcrm')}
									</div>
								) : (
									recentActivities.map((activity) => (
										<ActivityCard
											key={activity.id}
											activity={activity}
										/>
									))
								)}
							</div>
						</CardContent>
					</Card>

					{/* Table Active Deals */}
					<TableActiveDeals
						ownerId={ownerId ?? null}
						filters={filters}
						queryParams={queryParams}
					/>
				</>
			)}
		</div>
	);
};

export default SalesRep;
