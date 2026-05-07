/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { useCapabilities } from '../../../hooks/use-capabilities';
import ContactAnalytics from '../home/contacts-analytics';
import EmailAnalytics from '../home/emails-analytics';
import { useDashboardData } from '../home/use-analytics';
import { ProFeatureNotice } from '@doublescale/components';

interface AnalyticsAndReportsProps {
	defaultTab?: string;
	navigate?: (path: string) => void;
	params?: Record<string, string>;
}

const AnalyticsAndReports: React.FC<AnalyticsAndReportsProps> = ({
	defaultTab,
	navigate,
	params,
}) => {
	const { isSalesRep, canManageAllDeals } = useCapabilities();
	const { data } = useDashboardData();

	// Render content based on defaultTab prop
	const renderContent = () => {
		switch (defaultTab) {
			case 'my-reports':
				return applyFilters(
					'doublescale_analytics_my_reports_content',
					<ProFeatureNotice
						featureName={__('My Reports', 'doublescale')}
						description={__(
							'Track your personal sales performance, deals, and activity metrics.',
							'doublescale'
						)}
					/>
				);
			case 'deals':
				return applyFilters(
					'doublescale_analytics_deals_content',
					<ProFeatureNotice
						featureName={__('Deals Analytics', 'doublescale')}
						description={__(
							'Analyze deal performance, conversion rates, and sales metrics across your pipeline.',
							'doublescale'
						)}
					/>
				);
			case 'sales-rep':
				return applyFilters(
					'doublescale_analytics_sales_rep_content',
					<ProFeatureNotice
						featureName={__('Sales Rep Analytics', 'doublescale')}
						description={__(
							'Track individual sales representative performance, activity, and deal metrics.',
							'doublescale'
						)}
					/>
				);
			case 'dealSource-rep':
				return applyFilters(
					'doublescale_analytics_deal_source_content',
					<ProFeatureNotice
						featureName={__('Deal Source Analysis', 'doublescale')}
						description={__(
							'Analyze where your deals are coming from and optimize your lead sources.',
							'doublescale'
						)}
					/>
				);
			case 'pipeline-analysis':
				return applyFilters(
					'doublescale_analytics_pipeline_content',
					<ProFeatureNotice
						featureName={__('Pipeline Analytics', 'doublescale')}
						description={__(
							'Visualize your sales pipeline, identify bottlenecks, and improve conversion rates.',
							'doublescale'
						)}
					/>
				);
			case 'cart-analytics':
				return data
					? applyFilters(
							'doublescale_analytics_cart_content',
							<ProFeatureNotice
								featureName={__('Cart Analytics', 'doublescale')}
								description={__(
									'Analyze cart performance, conversion rates, and sales metrics across your pipeline.',
									'doublescale'
								)}
							/>,
							data,
							navigate,
							params
						)
					: null;
			case 'contacts-analytics':
				return data ? <ContactAnalytics dashboardData={data} /> : null;
			case 'emails-analytics':
				return data ? <EmailAnalytics dashboardData={data} /> : null;
			default:
				// Default view for analytics-and-reports main page
				// Sales Rep (without manager access) sees only their reports
				if (isSalesRep() && !canManageAllDeals()) {
					return applyFilters(
						'doublescale_analytics_my_reports_content',
						<ProFeatureNotice
							featureName={__('My Reports', 'doublescale')}
							description={__(
								'Track your personal sales performance, deals, and activity metrics.',
								'doublescale'
							)}
						/>
					);
				}
				// Show contact analytics by default (available in free version)
				return applyFilters(
					'doublescale_analytics_default_content',
					data ? <ContactAnalytics dashboardData={data} /> : null
				);
		}
	};

	return (
		<>
			<div className="space-y-6">{renderContent()}</div>
		</>
	);
};

export default AnalyticsAndReports;
