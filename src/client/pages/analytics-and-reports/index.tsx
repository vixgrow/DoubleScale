/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import ContactsDealsReports from './contacts-deals-reports';
import DealsReportsByDate from './deals-reports-by-date';
import DealsReportsLeaderboard from './deals-reports-leaderboard';
import SalesRep from './sales-rep';

/**
 * External dependencies
 */
import { useState } from 'react';
import { BarChartOutlined, UserOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import PageTabs from '../../../components/page-tabs';

const AnalyticsAndReports: React.FC = () => {
	const [activeTab, setActiveTab] = useState('deals');

	const tabsList = [
		{
			value: 'deals',
			label: 'Deals',
			icon: <BarChartOutlined />,
		},
		{
			value: 'sales-rep',
			label: 'Sales Rep',
			icon: <UserOutlined />,
		},
	];

	const tabsContent = [
		{
			value: 'deals',
			children: (
				<div className="space-y-6">
					<ContactsDealsReports />
					<DealsReportsByDate />
					<DealsReportsLeaderboard />
				</div>
			),
		},
		{
			value: 'sales-rep',
			children: <SalesRep />,
		},
	];

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">
				{__('Analytics and Reports', 'quillcrm')}
			</h2>
			<PageTabs
				defaultValue="deals"
				tabsList={tabsList}
				tabsContent={tabsContent}
				onValueChange={setActiveTab}
			/>
		</div>
	);
};

export default AnalyticsAndReports;
