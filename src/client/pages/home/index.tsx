/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { PageHeader } from '@quillcrm/components';
import UserDashboard from './user-dashboard';
import { UserDashboardShimmer } from './user-dashboard/UserDashboardShimmer';
import { useDashboardData } from './use-analytics';

const Dashboard: React.FC = () => {
	const [activeTab, setActiveTab] = useState('user');
	const { data, loading } = useDashboardData();

	const tabTitles = {
		user: __('Dashboard', 'quillcrm'),
		contacts: __('Contacts Analytics', 'quillcrm'),
		emails: __('Emails Analytics', 'quillcrm'),
		cart: __('Cart Analytics', 'quillcrm'),
	};

	if (!data || loading) {
		return (
			<div className="qcrm-dashboard">
				<PageHeader
					title={__('Dashboard', 'quillcrm')}
					subtitle={tabTitles[activeTab]}
					actions={[]}
				/>
				<UserDashboardShimmer />
			</div>
		);
	}

	return (
		<div className="qcrm-dashboard">
			<PageHeader
				title={__('Dashboard', 'quillcrm')}
				subtitle={tabTitles[activeTab]}
				actions={[]}
			/>

			<UserDashboard dashboardData={data} />
		</div>
	);
};

export default Dashboard;
