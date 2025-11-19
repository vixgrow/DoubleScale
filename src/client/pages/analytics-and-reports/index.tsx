/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
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
import { ContactsIcon, PageTabs, ProFeatureNotice } from '@quillcrm/components';


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
				return applyFilters(
					'quillcrm_analytics_my_reports_content',
					<ProFeatureNotice
						featureName={__('My Reports', 'quillcrm')}
						description={__(
							'Track your personal sales performance, deals, and activity metrics.',
							'quillcrm'
						)}
					/>
				);
			case 'deals':
				return applyFilters(
					'quillcrm_analytics_deals_content',
					<ProFeatureNotice
						featureName={__('Deals Analytics', 'quillcrm')}
						description={__(
							'Analyze deal performance, conversion rates, and sales metrics across your pipeline.',
							'quillcrm'
						)}
					/>
				);
			case 'sales-rep':
				return applyFilters(
					'quillcrm_analytics_sales_rep_content',
					<ProFeatureNotice
						featureName={__('Sales Rep Analytics', 'quillcrm')}
						description={__(
							'Track individual sales representative performance, activity, and deal metrics.',
							'quillcrm'
						)}
					/>
				);
			case 'dealSource-rep':
				return applyFilters(
					'quillcrm_analytics_deal_source_content',
					<ProFeatureNotice
						featureName={__('Deal Source Analysis', 'quillcrm')}
						description={__(
							'Analyze where your deals are coming from and optimize your lead sources.',
							'quillcrm'
						)}
					/>
				);
			case 'pipeline-analysis':
				return applyFilters(
					'quillcrm_analytics_pipeline_content',
					<ProFeatureNotice
						featureName={__('Pipeline Analytics', 'quillcrm')}
						description={__(
							'Visualize your sales pipeline, identify bottlenecks, and improve conversion rates.',
							'quillcrm'
						)}
					/>
				);
			case 'contacts-analytics':
				return data ? <ContactAnalytics dashboardData={data} /> : null;
			case 'emails-analytics':
				return data ? <EmailAnalytics dashboardData={data} /> : null;
			case 'Cart-analytics':
				return data ? <CartAnalytics dashboardData={data} /> : null;
			default:
				// Default view for analytics-and-reports main page
				if (isDealOwner()) {
					return applyFilters(
						'quillcrm_analytics_my_reports_content',
						<ProFeatureNotice
							featureName={__('My Reports', 'quillcrm')}
							description={__(
								'Track your personal sales performance, deals, and activity metrics.',
								'quillcrm'
							)}
						/>
					);
				}
				return applyFilters(
					'quillcrm_analytics_default_content',
					<ProFeatureNotice
						featureName={__('Deals Analytics', 'quillcrm')}
						description={__(
							'Access comprehensive analytics for deals, sales performance, and pipeline metrics. Upgrade to QuillCRM Pro to unlock powerful insights.',
							'quillcrm'
						)}
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
