import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';
import { __ } from '@wordpress/i18n';
import {
	UserOutlined,
	CheckCircleOutlined,
	PlusCircleOutlined,
	TrophyOutlined,
	ClockCircleOutlined,
	CaretUpOutlined,
	CaretDownOutlined,
	DollarOutlined,
} from '@ant-design/icons';
import { useReportFilters } from '../../../../hooks/useReportFilters';
import ReportFilters from '../../../../components/reports/ReportFilters';
import { cn } from '../../../../lib/utils';

interface ContactsDealsReportsProps {
	contacts_created: number;
	contacts_created_change: number;
	contacts_worked: number;
	contacts_worked_change: number;
	deals_created: number;
	deals_created_change: number;
	deals_won: number;
	deals_won_change: number;
	deals_won_value: number;
	deals_won_value_change: number;
	deals_lost: number;
	deals_lost_change: number;
	deals_lost_value: number;
	deals_lost_value_change: number;
	deals_avg_time: number;
	deals_avg_time_change: number;
}

const ContactsDealsReports: React.FC = () => {
	const [data, setData] = useState<ContactsDealsReportsProps>({
		contacts_created: 0,
		contacts_created_change: 0,
		contacts_worked: 0,
		contacts_worked_change: 0,
		deals_created: 0,
		deals_created_change: 0,
		deals_won: 0,
		deals_won_change: 0,
		deals_won_value: 0,
		deals_won_value_change: 0,
		deals_lost: 0,
		deals_lost_change: 0,
		deals_lost_value: 0,
		deals_lost_value_change: 0,
		deals_avg_time: 0,
		deals_avg_time_change: 0,
	});
	const [loading, setLoading] = useState(false);

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

	const fetchContactsDealsReports = async () => {
		setLoading(true);
		try {
			const queryParams = buildQueryParams();
			const path = `/qc/v1/reports/contacts-deals${queryParams ? `?${queryParams}` : ''}`;

			const response = (await apiFetch({
				path,
			})) as ContactsDealsReportsProps;

			// Ensure all properties exist in the response
			const processedData = {
				contacts_created: response.contacts_created || 0,
				contacts_created_change: response.contacts_created_change || 0,
				contacts_worked: response.contacts_worked || 0,
				contacts_worked_change: response.contacts_worked_change || 0,
				deals_created: response.deals_created || 0,
				deals_created_change: response.deals_created_change || 0,
				deals_won: response.deals_won || 0,
				deals_won_change: response.deals_won_change || 0,
				deals_won_value: response.deals_won_value || 0,
				deals_won_value_change: response.deals_won_value_change || 0,
				deals_lost: response.deals_lost || 0,
				deals_lost_change: response.deals_lost_change || 0,
				deals_lost_value: response.deals_lost_value || 0,
				deals_lost_value_change: response.deals_lost_value_change || 0,
				deals_avg_time: response.deals_avg_time || 0,
				deals_avg_time_change: response.deals_avg_time_change || 0,
			};

			setData(processedData);
			setLoading(false);
		} catch (error) {
			console.error(error);
			setLoading(false);
		}
	};

	// Apply filters
	const applyFilters = () => {
		fetchContactsDealsReports();
	};

	useEffect(() => {
		fetchContactsDealsReports();
	}, []);

	useEffect(() => {
		fetchContactsDealsReports();
	}, [filters]);

	if (loading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-full" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-32 w-full" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Filters Section */}
			<ReportFilters
				title={__('Contacts & Deals Reports', 'quillcrm')}
				filters={filters}
				setFilters={setFilters}
				filterOptions={filterOptions}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
				clearFilters={clearFilters}
				applyFilters={applyFilters}
				showDateRange={true}
				showOwner={true}
				showPipeline={true}
				showStatus={true}
				showContact={true}
			/>

			<div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/80 rounded-xl p-6 space-y-6 shadow-sm">
				<h3 className="text-xl font-bold text-gray-900 tracking-tight">
					{__(
						'Contacts created and worked totals with deals created and won totals',
						'quillcrm'
					)}
				</h3>
				<p className="text-sm text-gray-600/80 font-medium">
					{filters.dateRange &&
					filters.dateRange[0] &&
					filters.dateRange[1]
						? `${__('Date range:', 'quillcrm')} ${filters.dateRange[0].format('MMM DD, YYYY')} - ${filters.dateRange[1].format('MMM DD, YYYY')}`
						: __(
								'Date range: In the last 30 days',
								'quillcrm'
							)}{' '}
					&nbsp;&nbsp; {__('Compared To: Year before', 'quillcrm')}
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{/* Contacts Created */}
					<Card className="w-full hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
						<CardContent className="p-6 space-y-4">
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-3 pb-1">
									<div className="qcrm-dashboard-card-icon p-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg">
										<UserOutlined className="text-base text-blue-600" />
									</div>
									<span className="font-bold text-xs text-gray-700 tracking-wider uppercase">
										{__('CONTACTS CREATED', 'quillcrm')}
									</span>
								</div>
								<div className="qcrm-analytics-count text-2xl font-bold text-gray-900 tracking-tight">
									{data.contacts_created.toLocaleString()}
								</div>
								<div className="flex items-center gap-2 pt-1">
									{data.contacts_created_change > 0 ? (
										<CaretUpOutlined className="text-green-500" />
									) : (
										<CaretDownOutlined className="text-red-500" />
									)}
									<span
										className={cn(
											'text-sm',
											data.contacts_created_change > 0
												? 'text-green-500'
												: 'text-red-500'
										)}
									>
										{Math.abs(
											data.contacts_created_change
										).toFixed(2)}
										%
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Contacts Worked */}
					<Card className="w-full hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
						<CardContent className="p-6 space-y-4">
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-3 pb-1">
									<div className="qcrm-dashboard-card-icon p-2 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-lg">
										<CheckCircleOutlined className="text-base text-green-600" />
									</div>
									<span className="font-bold text-xs text-gray-700 tracking-wider uppercase">
										{__('CONTACTS WORKED', 'quillcrm')}
									</span>
								</div>
								<div className="qcrm-analytics-count text-2xl font-bold text-gray-900 tracking-tight">
									{data.contacts_worked.toLocaleString()}
								</div>
								<div className="flex items-center gap-2 pt-1">
									{data.contacts_worked_change > 0 ? (
										<CaretUpOutlined className="text-green-500" />
									) : (
										<CaretDownOutlined className="text-red-500" />
									)}
									<span
										className={cn(
											'text-sm',
											data.contacts_worked_change > 0
												? 'text-green-500'
												: 'text-red-500'
										)}
									>
										{Math.abs(
											data.contacts_worked_change
										).toFixed(2)}
										%
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* New Deals Created */}
					<Card className="w-full hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
						<CardContent className="p-6 space-y-4">
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-3 pb-1">
									<div className="qcrm-dashboard-card-icon p-2 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-lg">
										<PlusCircleOutlined className="text-base text-purple-600" />
									</div>
									<span className="font-bold text-xs text-gray-700 tracking-wider uppercase">
										{__('NEW DEALS CREATED', 'quillcrm')}
									</span>
								</div>
								<div className="qcrm-analytics-count text-2xl font-bold text-gray-900 tracking-tight">
									{data.deals_created.toLocaleString()}
								</div>
								<div className="flex items-center gap-2 pt-1">
									{data.deals_created_change > 0 ? (
										<CaretUpOutlined className="text-green-500" />
									) : (
										<CaretDownOutlined className="text-red-500" />
									)}
									<span
										className={cn(
											'text-sm',
											data.deals_created_change > 0
												? 'text-green-500'
												: 'text-red-500'
										)}
									>
										{Math.abs(
											data.deals_created_change
										).toFixed(2)}
										%
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Deals Closed Won */}
					<Card className="w-full hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
						<CardContent className="p-6 space-y-4">
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-3 pb-1">
									<div className="qcrm-dashboard-card-icon p-2 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100 rounded-lg">
										<TrophyOutlined className="text-base text-yellow-600" />
									</div>
									<span className="font-bold text-xs text-gray-700 tracking-wider uppercase">
										{__('DEALS CLOSED WON', 'quillcrm')}
									</span>
								</div>
								<div className="qcrm-analytics-count text-2xl font-bold text-gray-900 tracking-tight">
									{data.deals_won.toLocaleString()}
								</div>
								<div className="flex items-center gap-2 pt-1">
									{data.deals_won_change > 0 ? (
										<CaretUpOutlined className="text-green-500" />
									) : (
										<CaretDownOutlined className="text-red-500" />
									)}
									<span
										className={cn(
											'text-sm',
											data.deals_won_change > 0
												? 'text-green-500'
												: 'text-red-500'
										)}
									>
										{Math.abs(
											data.deals_won_change
										).toFixed(2)}
										%
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Deals Won Value */}
					<Card className="w-full hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
						<CardContent className="p-6 space-y-4">
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-3 pb-1">
									<div className="qcrm-dashboard-card-icon p-2 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-lg">
										<DollarOutlined className="text-base text-emerald-600" />
									</div>
									<span className="font-bold text-xs text-gray-700 tracking-wider uppercase">
										{__('DEALS WON VALUE', 'quillcrm')}
									</span>
								</div>
								<div className="qcrm-analytics-count text-2xl font-bold text-gray-900 tracking-tight">
									{data.deals_won_value.toLocaleString()}{' '}
									{__('USD', 'quillcrm')}
								</div>
								<div className="flex items-center gap-2 pt-1">
									{/* For velocity, lower is usually better */}
									{data.deals_won_value_change < 0 ? (
										<CaretUpOutlined className="text-green-500" />
									) : (
										<CaretDownOutlined className="text-red-500" />
									)}
									<span
										className={cn(
											'text-sm',
											data.deals_won_value_change < 0
												? 'text-green-500'
												: 'text-red-500'
										)}
									>
										{Math.abs(
											data.deals_won_value_change
										).toFixed(2)}
										%
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Deals Closed Lost */}
					<Card className="w-full hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
						<CardContent className="p-6 space-y-4">
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-3 pb-1">
									<div className="qcrm-dashboard-card-icon p-2 bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-lg">
										<TrophyOutlined className="text-base text-red-600" />
									</div>
									<span className="font-bold text-xs text-gray-700 tracking-wider uppercase">
										{__('DEALS CLOSED LOST', 'quillcrm')}
									</span>
								</div>
								<div className="qcrm-analytics-count text-2xl font-bold text-gray-900 tracking-tight">
									{data.deals_lost.toLocaleString()}
								</div>
								<div className="flex items-center gap-2 pt-1">
									{data.deals_lost_change > 0 ? (
										<CaretUpOutlined className="text-green-500" />
									) : (
										<CaretDownOutlined className="text-red-500" />
									)}
									<span
										className={cn(
											'text-sm',
											data.deals_lost_change > 0
												? 'text-green-500'
												: 'text-red-500'
										)}
									>
										{Math.abs(
											data.deals_lost_change
										).toFixed(2)}
										%
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Deals Lost Value */}
					<Card className="w-full hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
						<CardContent className="p-6 space-y-4">
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-3 pb-1">
									<div className="qcrm-dashboard-card-icon p-2 bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-lg">
										<DollarOutlined className="text-base text-red-600" />
									</div>
									<span className="font-bold text-xs text-gray-700 tracking-wider uppercase">
										{__('DEALS LOST VALUE', 'quillcrm')}
									</span>
								</div>
								<div className="qcrm-analytics-count text-2xl font-bold text-gray-900 tracking-tight">
									{data.deals_lost_value.toLocaleString()}{' '}
									{__('USD', 'quillcrm')}
								</div>
								<div className="flex items-center gap-2 pt-1">
									{/* For velocity, lower is usually better */}
									{data.deals_lost_value_change < 0 ? (
										<CaretUpOutlined className="text-green-500" />
									) : (
										<CaretDownOutlined className="text-red-500" />
									)}
									<span
										className={cn(
											'text-sm',
											data.deals_lost_value_change < 0
												? 'text-green-500'
												: 'text-red-500'
										)}
									>
										{Math.abs(
											data.deals_lost_value_change
										).toFixed(2)}
										%
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Deals Average Time */}
					<Card className="w-full hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
						<CardContent className="p-6 space-y-4">
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-3 pb-1">
									<div className="qcrm-dashboard-card-icon p-2 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg">
										<ClockCircleOutlined className="text-base text-indigo-600" />
									</div>
									<span className="font-bold text-xs text-gray-700 tracking-wider uppercase">
										{__('DEALS AVERAGE TIME', 'quillcrm')}
									</span>
								</div>
								<div className="qcrm-analytics-count text-2xl font-bold text-gray-900 tracking-tight">
									{data.deals_avg_time}{' '}
									{__('days', 'quillcrm')}
								</div>
								<div className="flex items-center gap-2 pt-1">
									{/* For time metrics, negative change is usually good */}
									{data.deals_avg_time_change < 0 ? (
										<CaretUpOutlined className="text-green-500" />
									) : (
										<CaretDownOutlined className="text-red-500" />
									)}
									<span
										className={cn(
											'text-sm',
											data.deals_avg_time_change < 0
												? 'text-green-500'
												: 'text-red-500'
										)}
									>
										{Math.abs(
											data.deals_avg_time_change
										).toFixed(2)}
										%
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default ContactsDealsReports;
