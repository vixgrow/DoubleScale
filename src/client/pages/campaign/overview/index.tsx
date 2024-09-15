/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Tabs } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import Analytics from './analytics';
import Engagements from './engagements';
import { useNavigate, useParams, getToLink } from '@quillcrm/navigation';

const Overview: React.FC = () => {
	const { id, subtab: tab } = useParams<{ id: string; subtab: string }>();
	const navigate = useNavigate();
	// Switch to the new tab items
	const tabItems = [
		{
			key: 'analytics',
			label: __('Analytics', 'quillcrm'),
			children: <Analytics />,
		},
		{
			key: 'engagements',
			label: __('Engagements', 'quillcrm'),
			children: <Engagements />,
		},
	];
	return (
		<Tabs
			defaultActiveKey="analytics"
			activeKey={tab || 'analytics'}
			tabPosition="left"
			tabBarStyle={{ width: 200 }}
			items={tabItems}
			onChange={(key) => {
				navigate(getToLink(`campaigns/${id}/overview/${key}`));
			}}
		/>
	);
};

export default Overview;
