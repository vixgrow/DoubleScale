/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { PageHeader, PageTabs } from '@quillcrm/components';
import UserDashboard from './user-dashboard';
import ContactsAnalytics from './contacts-analytics';
import EmailAnalytics from './emails-analytics';
import CartAnalytics from './cart-analytics';
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

			{/* <PageTabs
				defaultValue="user"
				onValueChange={(value) => setActiveTab(value)}
				tabsList={[
					{
						label: __('User Dashboard', 'quillcrm'),
						value: 'user',
					},
					{
						label: __('Contacts Analytics', 'quillcrm'),
						value: 'contacts',
					},
					{
						label: __('Emails Analytics', 'quillcrm'),
						value: 'emails',
					},
					{
						label: __('Cart Analytics', 'quillcrm'),
						value: 'cart',
					},
				]}
				tabsContent={[
					{
						value: 'user',
						children: <UserDashboard dashboardData={data} />,
					},
					{
						value: 'contacts',
						children: <ContactsAnalytics dashboardData={data} />,
					},
					{
						value: 'emails',
						children: <EmailAnalytics dashboardData={data} />,
					},
					{
						value: 'cart',
						children: <CartAnalytics dashboardData={data} />,
					},
				]}
			/> */}
		</div>
	);
};

export default Dashboard;
