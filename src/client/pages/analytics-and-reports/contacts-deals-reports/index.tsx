import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, useCallback } from 'react';
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

import { cn } from '../../../../lib/utils';
import ReportFilters from '@quillcrm/components/reports/ReportFilters';


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

	const fetchContactsDealsReports = useCallback(async () => {
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
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, [buildQueryParams]);

	// Apply filters
	const applyFilters = useCallback(() => {
		fetchContactsDealsReports();
	}, [fetchContactsDealsReports]);

	useEffect(() => {
		fetchContactsDealsReports();
	}, [fetchContactsDealsReports]);

	return (
		<div className="space-y-6">
			{/* Filters Section */}
			<ReportFilters
				key={`filters-${JSON.stringify(filters)}`}
				title={__('Contacts & Deals Reports', 'quillcrm')}
				filters={filters}
				setFilters={setFilters}
				filterOptions={filterOptions}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
				clearFilters={clearFilters}
				applyFilters={applyFilters}
				showPredefinedDateRange={true}
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

				{loading ? (
					<Skeleton className="h-8 w-full" />
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{[
							{
								key: 'contacts_created',
								title: __('CONTACTS CREATED', 'quillcrm'),
								value: data.contacts_created,
								change: data.contacts_created_change,
								icon: UserOutlined,
								iconBg: 'from-blue-50 to-indigo-50',
								iconBorder: 'border-blue-100',
								iconColor: 'text-blue-600',
								suffix: '',
								changeLogic: 'standard', // positive is good
							},
							{
								key: 'contacts_worked',
								title: __('CONTACTS WORKED', 'quillcrm'),
								value: data.contacts_worked,
								change: data.contacts_worked_change,
								icon: CheckCircleOutlined,
								iconBg: 'from-green-50 to-emerald-50',
								iconBorder: 'border-green-100',
								iconColor: 'text-green-600',
								suffix: '',
								changeLogic: 'standard',
							},
							{
								key: 'deals_created',
								title: __('NEW DEALS CREATED', 'quillcrm'),
								value: data.deals_created,
								change: data.deals_created_change,
								icon: PlusCircleOutlined,
								iconBg: 'from-purple-50 to-violet-50',
								iconBorder: 'border-purple-100',
								iconColor: 'text-purple-600',
								suffix: '',
								changeLogic: 'standard',
							},
							{
								key: 'deals_won',
								title: __('DEALS CLOSED WON', 'quillcrm'),
								value: data.deals_won,
								change: data.deals_won_change,
								icon: TrophyOutlined,
								iconBg: 'from-yellow-50 to-amber-50',
								iconBorder: 'border-yellow-100',
								iconColor: 'text-yellow-600',
								suffix: '',
								changeLogic: 'standard',
							},
							{
								key: 'deals_won_value',
								title: __('DEALS WON VALUE', 'quillcrm'),
								value: data.deals_won_value,
								change: data.deals_won_value_change,
								icon: DollarOutlined,
								iconBg: 'from-emerald-50 to-green-50',
								iconBorder: 'border-emerald-100',
								iconColor: 'text-emerald-600',
								suffix: ` ${__('USD', 'quillcrm')}`,
								changeLogic: 'standard',
							},
							{
								key: 'deals_lost',
								title: __('DEALS CLOSED LOST', 'quillcrm'),
								value: data.deals_lost,
								change: data.deals_lost_change,
								icon: TrophyOutlined,
								iconBg: 'from-red-50 to-rose-50',
								iconBorder: 'border-red-100',
								iconColor: 'text-red-600',
								suffix: '',
								changeLogic: 'inverse', // negative is good for lost deals
							},
							{
								key: 'deals_lost_value',
								title: __('DEALS LOST VALUE', 'quillcrm'),
								value: data.deals_lost_value,
								change: data.deals_lost_value_change,
								icon: DollarOutlined,
								iconBg: 'from-red-50 to-rose-50',
								iconBorder: 'border-red-100',
								iconColor: 'text-red-600',
								suffix: ` ${__('USD', 'quillcrm')}`,
								changeLogic: 'inverse',
							},
							{
								key: 'deals_avg_time',
								title: __('DEALS AVERAGE TIME', 'quillcrm'),
								value: data.deals_avg_time,
								change: data.deals_avg_time_change,
								icon: ClockCircleOutlined,
								iconBg: 'from-indigo-50 to-blue-50',
								iconBorder: 'border-indigo-100',
								iconColor: 'text-indigo-600',
								suffix: ` ${__('days', 'quillcrm')}`,
								changeLogic: 'inverse', // lower time is better
							},
						].map((card) => {
							const isPositiveChange =
								card.changeLogic === 'standard'
									? card.change >= 0
									: card.change < 0;
							const IconComponent = card.icon;

							return (
								<Card
									key={card.key}
									className="w-full hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm"
								>
									<CardContent className="p-6 space-y-4">
										<div className="flex flex-col gap-4">
											<div className="flex items-center gap-3 pb-1">
												<div
													className={`qcrm-dashboard-card-icon p-2 bg-gradient-to-br ${card.iconBg} border ${card.iconBorder} rounded-lg`}
												>
													<IconComponent
														className={`text-base ${card.iconColor}`}
													/>
												</div>
												<span className="font-bold text-xs text-gray-700 tracking-wider uppercase">
													{card.title}
												</span>
											</div>
											<div className="qcrm-analytics-count text-2xl font-bold text-gray-900 tracking-tight">
												{card.value.toLocaleString()}
												{card.suffix}
											</div>
											<div className="flex items-center gap-2 pt-1">
												{isPositiveChange ? (
													<CaretUpOutlined className="text-green-500" />
												) : (
													<CaretDownOutlined className="text-red-500" />
												)}
												<span
													className={cn(
														'text-sm',
														isPositiveChange
															? 'text-green-500'
															: 'text-red-500'
													)}
												>
													{Math.abs(
														card.change
													).toFixed(2)}
													%
												</span>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default ContactsDealsReports;
