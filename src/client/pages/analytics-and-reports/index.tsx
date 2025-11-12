/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import ContactsDealsReports from './contacts-deals-reports';
import DealsReportsByDate from './deals-reports-by-date';
import DealsReportsLeaderboard from './deals-reports-leaderboard';
import SalesRep from './sales-rep';
import SalesRepDetailView from './sale-rep';

/**
 * External dependencies
 */
import { BarChartOutlined, UserOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import PageTabs from '../../../components/page-tabs';
import { useCapabilities } from '../../../hooks/use-capabilities';
import PipelineAnalysis from './pipeline-rep';

const AnalyticsAndReports: React.FC = () => {
	const { isDealOwner } = useCapabilities();

	// Configure tabs based on user capabilities
	const tabsList = isDealOwner()
		? [
				{
					value: 'my-reports',
					label: 'My Reports',
					icon: <BarChartOutlined />,
				},
			]
		: [
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
				{
					value: 'pipeline-analysis',
					label: 'Pipeline Analysis',
					icon: <BarChartOutlined />, 
				},
			];

	const tabsContent = isDealOwner()
		? [
				{
					value: 'my-reports',
					children: <SalesRepDetailView />,
				},
			]
		: [
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
				{
					value: 'pipeline-analysis',
					children: <PipelineAnalysis />,
				},
		
			];

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">
				{__('Analytics and Reports', 'quillcrm')}
			</h2>
			<PageTabs
				defaultValue={isDealOwner() ? 'my-reports' : 'deals'}
				tabsList={tabsList}
				tabsContent={tabsContent}
				onValueChange={() => {}}
			/>
		</div>
	);
};

export default AnalyticsAndReports;
