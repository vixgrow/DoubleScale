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
import { ContactsIcon } from '@quillcrm/components';
import DealOwnerIcon from '@quillcrm/components/icons/deal-owner';
import DealValueIcon from '@quillcrm/components/icons/deal-value';

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

	const applyFilters = useCallback(() => {
		fetchContactsDealsReports();
	}, [fetchContactsDealsReports]);

	useEffect(() => {
		fetchContactsDealsReports();
	}, [fetchContactsDealsReports]);

	
	const contactsDealsSection = [
		{
			key: 'contacts_created',
			title: __('Contacts Created', 'quillcrm'),
			value: data.contacts_created,
			change: data.contacts_created_change,
			icon: ContactsIcon,
			iconColor: '#1E3A8A',
			iconBg: 'bg-[#E3EEFF] ',
			changeLogic: 'standard',
			bo: 'standard',
		},
		{
			key: 'contacts_worked',
			title: __('Total Contacts Worked', 'quillcrm'),
			value: data.contacts_worked,
			change: data.contacts_worked_change,
			icon: DealOwnerIcon,
			iconBg: 'bg-[#FAEADF]',
			iconColor: '#CB5301',
			changeLogic: 'standard',
		},
		{
			key: 'deals_created',
			title: __('New Deals Created', 'quillcrm'),
			value: data.deals_created,
			change: data.deals_created_change,
			icon: DealValueIcon,
			iconBg: 'bg-[#E4EEFD]',
			iconColor: '#458DC7',
			changeLogic: 'standard',
		},
	];

	const dealsClosedSection = [
		{
			key: 'deals_won',
			title: __('Deals Closed Won', 'quillcrm'),
			value: data.deals_won,
			change: data.deals_won_change,
			icon: TrophyOutlined,
			iconBg: 'bg-green-100',
			iconColor: 'text-green-600',
			changeLogic: 'standard',
		},
		{
			key: 'deals_lost',
			title: __('Deals Closed Lost', 'quillcrm'),
			value: data.deals_lost,
			change: data.deals_lost_change,
			icon: TrophyOutlined,
			iconBg: 'bg-red-100',
			iconColor: 'text-red-600',
			changeLogic: 'inverse',
		},
	];

	const dealsValueSection = [
		{
			key: 'deals_won_value',
			title: __('Deals Won Value', 'quillcrm'),
			value: `${(data.deals_won_value / 1000).toFixed(1)}K USD`,
			change: data.deals_won_value_change,
			icon: DollarOutlined,
			iconBg: 'bg-green-100',
			iconColor: 'text-green-600',
			changeLogic: 'standard',
		},
		{
			key: 'deals_lost_value',
			title: __('Deals Lost Value', 'quillcrm'),
			value: `${(data.deals_lost_value / 1000).toFixed(0)}K USD`,
			change: data.deals_lost_value_change,
			icon: DollarOutlined,
			iconBg: 'bg-red-100',
			iconColor: 'text-red-600',
			changeLogic: 'inverse',
		},
	];

	const renderStatCard = (item: any, showIcon: boolean = true) => {
		const isPositiveChange =
			item.changeLogic === 'standard'
				? item.change >= 0
				: item.change < 0;
		const IconComponent = item.icon;

		return (
			<div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
				<div className="flex items-center gap-3">
					{showIcon && (
						<div className={`p-2 ${item.iconBg} rounded-full`}>
							<IconComponent color={`${item.iconColor}`} />
						</div>
					)}
					<div className="flex flex-col">
						<span className="text-2xl font-bold text-gray-900">
							{typeof item.value === 'string' ? item.value : item.value.toLocaleString()}
						</span>
						<span className="text-xs text-gray-500 mt-0.5">
							{item.title}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-1.5">
					{isPositiveChange ? (
						<CaretUpOutlined className="text-green-500 text-sm" />
					) : (
						<CaretDownOutlined className="text-red-500 text-sm" />
					)}
					<span
						className={cn(
							'text-sm font-medium',
							isPositiveChange ? 'text-green-500' : 'text-red-500'
						)}
					>
						{Math.abs(item.change).toFixed(2)}%
					</span>
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-6">
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

			{loading ? (
				<Skeleton className="h-64 w-full" />
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Summary Contacts & Deals */}
					<Card className="border border-[#DEE1E6] bg-[#F8F8F8] rounded-[16px] p-5 shadow-sm lg:col-span-1">
						<CardContent className="p-6">
							<h3 className="text-2xl font-medium font-[Inter] leading-normal tracking-[-1px] text-[#09090B] mb-4">
								{__('Summary Contacts & Deals', 'quillcrm')}
							</h3>
							<div className="space-y-1">
								{contactsDealsSection.map((item) =>
									renderStatCard(item, true)
								)}
							</div>
						</CardContent>
					</Card>

					{/* Summary Deals Closed */}
					<Card className="border-gray-200 shadow-sm lg:col-span-2">
						<CardContent className="p-6">
							<h3 className="text-base font-semibold text-gray-900 mb-4">
								{__('Summary Deals Closed', 'quillcrm')}
							</h3>
							<div className="space-y-1">
								<div className="grid grid-cols-2 gap-6">
									<div className="space-y-1">
										{dealsClosedSection.map((item) =>
											renderStatCard(item, true)
										)}
									</div>
									<div className="space-y-1">
										{dealsValueSection.map((item) =>
											renderStatCard(item, false)
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
};

export default ContactsDealsReports;