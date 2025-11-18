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
 * Internal dependencies
 */
import { useCapabilities } from '../../../hooks/use-capabilities';
import PipelineAnalysis from './pipeline-rep';
import ContactAnalytics from '../home/contacts-analytics';
import EmailAnalytics from '../home/emails-analytics';
import { useDashboardData } from '../home/use-analytics';
import CartAnalytics from '../home/cart-analytics';
import DealSourceAnalytics from './deal-source';
import { ContactsIcon, PageTabs } from '@quillcrm/components';


interface AnalyticsAndReportsProps {
	defaultTab?: string;
}

const AnalyticsAndReports: React.FC<AnalyticsAndReportsProps> = ({ defaultTab }) => {
	const { isDealOwner } = useCapabilities();
	const { data } = useDashboardData();

	// Render content based on defaultTab prop
	const renderContent = () => {
		switch (defaultTab) {
			case 'my-reports':
				return <SalesRepDetailView />;
			case 'deals':
				return (
					<div className="space-y-6">
						<ContactsDealsReports />
						<DealsReportsByDate />
						<DealsReportsLeaderboard />
					</div>
				);
			case 'sales-rep':
				return <SalesRep />;
			case 'dealSource-rep':
				return <DealSourceAnalytics />;
			case 'pipeline-analysis':
				return <PipelineAnalysis />;
			case 'contacts-analytics':
				return data ? <ContactAnalytics dashboardData={data} /> : null;
			case 'emails-analytics':
				return data ? <EmailAnalytics dashboardData={data} /> : null;
			case 'Cart-analytics':
				return data ? <CartAnalytics dashboardData={data} /> : null;
			default:
				// Default view for analytics-and-reports main page
				if (isDealOwner()) {
					return <SalesRepDetailView />;
				}
				return (
					// <div className="space-y-6">
					// 	<ContactsDealsReports />
					// 	<DealsReportsByDate />
					// 	<DealsReportsLeaderboard />
					// </div>
					<PageTabs
						defaultValue='deals'
						tabsList={[
							{
								label: __('Deal Analysis', 'quillcrm'),
								value: 'deals',
								icon: <ContactsIcon width={20} height={20} />,
							},
							{
								label: __('Deal Source Analysis', 'quillcrm'),
								value: 'dealSource-rep',
								icon: <ContactsIcon width={20} height={20} />,
							},
						]}
						tabsContent={[
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
								value: 'dealSource-rep',
								children: <DealSourceAnalytics />,
							},
						]}
					/>
				);
		}
	};



	return (
		<>
			<div className="space-y-6">
				{renderContent()}
			</div>
		</>
	);
};

export default AnalyticsAndReports;
