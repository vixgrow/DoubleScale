/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useState, useEffect } from 'react';
import {
	TrendingUp,
	TrendingDown,
	Phone,
	Mail,
	Calendar,
	Search,
} from 'lucide-react';

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
import { Badge } from '../../../../components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../../../components/ui/table';
import apiFetch from '@wordpress/api-fetch';
import CardsStatistics, {
	CardsStatisticsProps,
} from '../components/card-statistics';
import { useReportFilters } from '../../../../hooks/useReportFilters';
import ReportFilters from '../../../../components/reports/ReportFilters';
import { Skeleton } from 'antd';

interface ActivityItem {
	id: string;
	type: 'call' | 'email' | 'meeting';
	title: string;
	subtitle: string;
	time: string;
}

const ActivityCard: React.FC<{ activity: ActivityItem }> = ({ activity }) => {
	const iconConfig = {
		call: { icon: Phone, bg: 'bg-red-50', color: 'text-red-600' },
		email: { icon: Mail, bg: 'bg-green-50', color: 'text-green-600' },
		meeting: {
			icon: Calendar,
			bg: 'bg-yellow-50',
			color: 'text-yellow-600',
		},
	};

	const config = iconConfig[activity.type];
	const Icon = config.icon;

	return (
		<div className="flex items-center p-3 hover:bg-gray-50 transition-colors rounded-lg">
			<div
				className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 ${config.bg}`}
			>
				<Icon className={`w-4 h-4 ${config.color}`} />
			</div>
			<div className="flex-1 min-w-0">
				<div className="text-sm font-medium text-gray-900 truncate">
					{activity.title}
				</div>
				<div className="text-xs text-gray-500">
					{activity.time} • {activity.subtitle}
				</div>
			</div>
		</div>
	);
};

interface Deal {
	id: string;
	name: string;
	company: string;
	value: string;
	stage: 'qualification' | 'proposal' | 'negotiation' | 'closing';
	closeDate: string;
	daysInStage: number;
	lastActivity: string;
	risk: 'low' | 'medium' | 'high';
}

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
}

const SalesRep: React.FC = () => {
	const [activeFilter, setActiveFilter] = useState('This Month');
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);
	const [saleInfo, setSaleInfo] = useState<SalesRepResponse['sale_info']>({});
	const [cardsStatistics, setCardsStatistics] = useState<
		SalesRepResponse['cards_statistics']
	>({});

	const {
		filters,
		setFilters,
		filterOptions,
		showFilters,
		setShowFilters,
		buildQueryParams,
		clearFilters,
	} = useReportFilters();

	const fetchSalesRep = async () => {
		setLoading(true);
		try {
			const queryParams = buildQueryParams();
			const response = (await apiFetch({
				path: `/qc/v1/reports/sales-rep${queryParams ? `?${queryParams}` : ''}`,
			})) as SalesRepResponse;

			setSaleInfo(response.sale_info);
			setCardsStatistics(response.cards_statistics);
		} catch (error) {
			console.error('Error fetching sales rep:', error);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		fetchSalesRep();
	}, []);

	useEffect(() => {
		fetchSalesRep();
	}, [filters]);

	// Apply filters
	const applyFilters = () => {
		fetchSalesRep();
	};

	const pipelineStages = [
		{
			name: 'Qualification',
			count: 5,
			value: '$125K',
			color: 'bg-red-500',
		},
		{ name: 'Proposal', count: 8, value: '$280K', color: 'bg-yellow-500' },
		{ name: 'Negotiation', count: 6, value: '$195K', color: 'bg-blue-500' },
		{ name: 'Closing', count: 4, value: '$140K', color: 'bg-green-500' },
	];

	const activities: ActivityItem[] = [
		{
			id: '1',
			type: 'call',
			title: 'Call with Acme Corp',
			subtitle: 'Decision maker call',
			time: '2 hours ago',
		},
		{
			id: '2',
			type: 'email',
			title: 'Proposal sent to TechCo',
			subtitle: '$45K deal',
			time: '5 hours ago',
		},
		{
			id: '3',
			type: 'meeting',
			title: 'Demo with GlobalTech',
			subtitle: '3 stakeholders attended',
			time: 'Yesterday',
		},
		{
			id: '4',
			type: 'call',
			title: 'Follow-up call with DataSys',
			subtitle: 'Pricing discussion',
			time: '2 days ago',
		},
		{
			id: '5',
			type: 'email',
			title: 'Contract sent to MegaCorp',
			subtitle: 'Final review stage',
			time: '3 days ago',
		},
	];

	const deals: Deal[] = [
		{
			id: '1',
			name: 'Enterprise License 2024',
			company: 'Acme Corp',
			value: '$85,000',
			stage: 'closing',
			closeDate: 'Oct 30, 2024',
			daysInStage: 3,
			lastActivity: '2 hours ago',
			risk: 'low',
		},
		{
			id: '2',
			name: 'Cloud Migration Project',
			company: 'TechCo',
			value: '$45,000',
			stage: 'proposal',
			closeDate: 'Nov 15, 2024',
			daysInStage: 8,
			lastActivity: '5 hours ago',
			risk: 'low',
		},
		{
			id: '3',
			name: 'Security Upgrade',
			company: 'GlobalTech',
			value: '$62,000',
			stage: 'negotiation',
			closeDate: 'Nov 5, 2024',
			daysInStage: 12,
			lastActivity: 'Yesterday',
			risk: 'medium',
		},
		{
			id: '4',
			name: 'Annual Subscription',
			company: 'DataSys',
			value: '$28,000',
			stage: 'proposal',
			closeDate: 'Nov 20, 2024',
			daysInStage: 15,
			lastActivity: '2 days ago',
			risk: 'high',
		},
		{
			id: '5',
			name: 'Platform Integration',
			company: 'MegaCorp',
			value: '$95,000',
			stage: 'closing',
			closeDate: 'Oct 28, 2024',
			daysInStage: 5,
			lastActivity: '3 days ago',
			risk: 'medium',
		},
		{
			id: '6',
			name: 'Consulting Services',
			company: 'StartupXYZ',
			value: '$18,000',
			stage: 'qualification',
			closeDate: 'Dec 10, 2024',
			daysInStage: 2,
			lastActivity: 'Today',
			risk: 'low',
		},
	];

	const filteredDeals = deals.filter(
		(deal) =>
			deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			deal.company.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const getStageVariant = (stage: Deal['stage']) => {
		const variants = {
			qualification: 'bg-red-50 text-red-700',
			proposal: 'bg-yellow-50 text-yellow-700',
			negotiation: 'bg-blue-50 text-blue-700',
			closing: 'bg-green-50 text-green-700',
		};
		return variants[stage];
	};

	const getRiskVariant = (risk: Deal['risk']) => {
		const variants = {
			low: 'bg-green-50 text-green-700',
			medium: 'bg-yellow-50 text-yellow-700',
			high: 'bg-red-50 text-red-700',
		};
		return variants[risk];
	};

	const metricsData = [
		{
			name: 'Deal Velocity',
			value: 75,
			change: '+15%',
			color: 'bg-green-500',
		},
		{
			name: 'Activity Rate',
			value: 68,
			change: '+8%',
			color: 'bg-blue-500',
		},
		{
			name: 'Contact Coverage',
			value: 45,
			change: '-5%',
			color: 'bg-yellow-500',
		},
		{
			name: 'Pipeline Coverage',
			value: 82,
			change: '+22%',
			color: 'bg-green-500',
		},
	];

	if (loading) {
		return <Skeleton active paragraph={{ rows: 6 }} />;
	}

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6">
			{/* Filters Section */}
			<ReportFilters
				title={__('Sales Rep - Sales Performance', 'quillcrm')}
				filters={filters}
				setFilters={setFilters}
				filterOptions={filterOptions}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
				clearFilters={clearFilters}
				applyFilters={applyFilters}
				showStatus={false}
				showContact={false}
				showDateRange={true}
				showOwner={true}
				showOwnerDefault={true}
				selectedOwnerId={saleInfo?.id}
				showPipeline={true}
				showPredefinedDateRange={true}
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

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
				{Object.entries(cardsStatistics).map(([key, value], index) => (
					<CardsStatistics
						key={index}
						label={value.label}
						value={value.value}
						change={value.change}
						isArrow={value.isArrow}
						isColor={value.isColor}
					/>
				))}
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Pipeline Stages */}
				{/* <Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle>Pipeline by Stage</CardTitle>
							<span className="text-sm text-gray-500">
								23 active deals
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex justify-between items-center relative py-4">
							{pipelineStages.map((stage, index) => (
								<div
									key={stage.name}
									className="text-center flex-1 relative"
								>
									<div
										className={`w-15 h-15 rounded-full ${stage.color} text-white font-bold text-lg flex items-center justify-center mx-auto mb-2 relative z-10`}
									>
										{stage.count}
									</div>
									{index < pipelineStages.length - 1 && (
										<div className="absolute top-7 left-1/2 w-full h-0.5 bg-gray-200 z-0" />
									)}
									<div className="text-xs text-gray-500 mb-1">
										{stage.name}
									</div>
									<div className="text-sm font-semibold text-gray-900">
										{stage.value}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card> */}

				{/* Win/Loss Analysis */}
				{/* <Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle>Win/Loss Analysis</CardTitle>
							<span className="text-sm text-gray-500">
								This month
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-8">
							<div className="relative w-24 h-24">
								<svg
									className="w-24 h-24 transform -rotate-90"
									viewBox="0 0 100 100"
								>
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#e5e7eb"
										strokeWidth="8"
										fill="none"
									/>
									<circle
										cx="50"
										cy="50"
										r="40"
										stroke="#10b981"
										strokeWidth="8"
										fill="none"
										strokeDasharray={`${68 * 2.51} 251`}
										strokeLinecap="round"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center">
										<div className="text-xl font-bold text-gray-900">
											68%
										</div>
										<div className="text-xs text-gray-500 uppercase">
											Win Rate
										</div>
									</div>
								</div>
							</div>
							<div className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
										<span className="text-green-600 font-semibold text-sm">
											15
										</span>
									</div>
									<span className="text-xs text-gray-500 uppercase">
										Won Deals
									</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
										<span className="text-red-600 font-semibold text-sm">
											7
										</span>
									</div>
									<span className="text-xs text-gray-500 uppercase">
										Lost Deals
									</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
										<span className="text-gray-600 font-semibold text-sm">
											3
										</span>
									</div>
									<span className="text-xs text-gray-500 uppercase">
										No Decision
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card> */}

				{/* Recent Activities */}
				{/* <Card>
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
							{activities.map((activity) => (
								<ActivityCard
									key={activity.id}
									activity={activity}
								/>
							))}
						</div>
					</CardContent>
				</Card> */}

				{/* Key Metrics Comparison */}
				{/* <Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle>Key Metrics Comparison</CardTitle>
							<span className="text-sm text-gray-500">
								You vs Team Average
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							{metricsData.map((metric) => (
								<div key={metric.name}>
									<div className="flex justify-between items-center mb-2">
										<span className="text-sm text-gray-600">
											{metric.name}
										</span>
										<span className="text-sm font-semibold text-green-600">
											{metric.change}
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className={`h-2 rounded-full ${metric.color}`}
											style={{
												width: `${metric.value}%`,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card> */}
			</div>

			{/* Active Deals Table */}
			{/* <Card>
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<CardTitle>Active Deals</CardTitle>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input
								type="text"
								placeholder="Search deals..."
								className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Deal Name</TableHead>
								<TableHead>Company</TableHead>
								<TableHead>Value</TableHead>
								<TableHead>Stage</TableHead>
								<TableHead>Close Date</TableHead>
								<TableHead>Days in Stage</TableHead>
								<TableHead>Last Activity</TableHead>
								<TableHead>Risk</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredDeals.map((deal) => (
								<TableRow key={deal.id}>
									<TableCell className="font-semibold">
										{deal.name}
									</TableCell>
									<TableCell>{deal.company}</TableCell>
									<TableCell className="font-semibold">
										{deal.value}
									</TableCell>
									<TableCell>
										<Badge
											className={`${getStageVariant(deal.stage)} border-0 capitalize`}
										>
											{deal.stage}
										</Badge>
									</TableCell>
									<TableCell>{deal.closeDate}</TableCell>
									<TableCell>
										{deal.daysInStage} days
									</TableCell>
									<TableCell>{deal.lastActivity}</TableCell>
									<TableCell>
										<Badge
											className={`${getRiskVariant(deal.risk)} border-0 text-xs uppercase`}
										>
											{deal.risk}
										</Badge>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card> */}
		</div>
	);
};

export default SalesRep;
