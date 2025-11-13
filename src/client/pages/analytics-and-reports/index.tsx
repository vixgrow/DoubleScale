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
import ContactAnalytics from '../home/contacts-analytics';
import EmailAnalytics from '../home/emails-analytics';
import { useDashboardData } from '../home/use-analytics';
import CartAnalytics from '../home/cart-analytics';


const AnalyticsAndReports: React.FC = () => {
	const { isDealOwner } = useCapabilities();
	// const { data: dashboardData} = useDashboardData();
	const { data, loading } = useDashboardData();

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
				{
					value: 'emails-analytics',
					label: 'emails-analytics',
					icon: <BarChartOutlined />, 
				},
				{
					value: 'contacts-analytics',
					label: 'contacts-analytics',
					icon: <BarChartOutlined />, 
				},
				{
					value: 'Cart-analytics',
					label: 'Cart-analytics',
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
				{
							value: 'contacts-analytics',
								children: data&&( <ContactAnalytics dashboardData={data}/>),
							
							},
							{
								value: 'emails-analytics',
								children: data &&(
									<EmailAnalytics dashboardData={data} />
								)
								
							},
							{
								value: 'Cart-analytics',
								children: data &&(
									<CartAnalytics dashboardData={data} />
								)
								
							},
			]
	
		// const tabsContent = [
		// 		{
		// 			value: 'my-reports',
		// 			children: <SalesRepDetailView />,
		// 		},
		// 		{
		// 			value: 'deals',
		// 			children: (
		// 				<div className="space-y-6">
		// 					<ContactsDealsReports />
		// 					<DealsReportsByDate />
		// 					<DealsReportsLeaderboard />
		// 				</div>
		// 			),
		// 		},
		// 		{
		// 			value: 'sales-rep',
		// 			children: <SalesRep />,
		// 		},
		// 		{
		// 			value: 'pipeline-analysis',
		// 			children: <PipelineAnalysis />,
		// 		},
		// 		{
		// 			value: 'contacts-analytics',
		// 			children: data&&( <ContactAnalytics dashboardData={data}/>),
				
		// 		},
		// 		{
		// 			value: 'emails-analytics',
		// 			children: data &&(
		// 				<EmailAnalytics dashboardData={data} />
		// 			)
					
		// 		},
		// 		{
		// 			value: 'Cart-analytics',
		// 			children: data &&(
		// 				<CartAnalytics dashboardData={data} />
		// 			)
					
		// 		},
				
		// ]

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
