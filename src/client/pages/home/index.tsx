/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { PageHeader } from '@doublescale/components';
import UserDashboard from './user-dashboard';
import { UserDashboardShimmer } from './user-dashboard/UserDashboardShimmer';
import { useDashboardData } from './use-analytics';

const Dashboard: React.FC = () => {
	const [activeTab, setActiveTab] = useState('user');
	const { data, loading } = useDashboardData();

	const tabTitles = {
		user: __('Dashboard', 'doublescale'),
		contacts: __('Contacts Analytics', 'doublescale'),
		emails: __('Emails Analytics', 'doublescale'),
		cart: __('Cart Analytics', 'doublescale'),
	};

	if (!data || loading) {
		return (
			<div className="doublescale-dashboard">
				<PageHeader
					title={__('Dashboard', 'doublescale')}
					subtitle={tabTitles[activeTab]}
					actions={[]}
				/>
				<UserDashboardShimmer />
			</div>
		);
	}

	return (
		<div className="doublescale-dashboard">
			<PageHeader
				title={__('Dashboard', 'doublescale')}
				subtitle={tabTitles[activeTab]}
				actions={[]}
			/>

			<UserDashboard dashboardData={data} />
		</div>
	);
};

export default Dashboard;
