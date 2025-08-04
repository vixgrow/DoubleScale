/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import './style.scss';
import { PageHeader, PageTabs } from '@quillcrm/components';
import UserDashboard from './user-dashboard';
import ContactsAnalytics from './contacts-analytics';
import EmailAnalytics from './emails-analytics';
import CartAnalytics from './cart-analytics';
import { DashboardData } from '@quillcrm/client';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard: React.FC = () => {
	const [activeTab, setActiveTab] = useState('user');
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const { createNotice } = useDispatch('quillcrm/core');
	console.log('Dashboard component rendered:',data);

	const tabTitles = {
		user: __('User Dashboard', 'quillcrm'),
		contacts: __('Contacts Analytics', 'quillcrm'),
		emails: __('Emails Analytics', 'quillcrm'),
		cart: __('Cart Analytics', 'quillcrm'),
	};

	const fetchDashboardData = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/general/dashboard'),
			})) as DashboardData;

			setData(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Error fetching dashboard data', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDashboardData();
	}, []);

	if (!data || loading) {
		return <Skeleton />;
	}

	return (
		<div className="qcrm-dashboard">
			<PageHeader
				title={__('Dashboard', 'quillcrm')}
				subtitle={tabTitles[activeTab]}
				actions={[]}
			/>

			<PageTabs
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
						children: <UserDashboard data={data} />,
					},
					{
						value: 'contacts',
						children: <ContactsAnalytics ContactsData={data} />,
					},
					{
						value: 'emails',
						children: <EmailAnalytics EmailsData={data.recent_emails}/>,
					},
					{
						value: 'cart',
						children: <CartAnalytics />,
					},
				]}
			/>
		</div>
	);
};

export default Dashboard;
