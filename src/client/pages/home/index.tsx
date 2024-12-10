/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Table, Card, Flex, Typography, Skeleton } from 'antd';
import {
	UserOutlined,
	MailOutlined,
	TransactionOutlined,
	ShopOutlined,
} from '@ant-design/icons';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { DashboardData } from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { convertDate } from '@quillcrm/utils';
import ConfigAPI from '@quillcrm/config';

const Dashboard: React.FC = () => {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const { createNotice } = useDispatch('quillcrm/core');
	const isWooCommerceActive = ConfigAPI.isWoocommerceActive();

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
		return <Skeleton active />;
	}

	return (
		<Flex gap={20} vertical className="qcrm-dashboard">
			<Flex gap={20}>
				<Card className="qcrm-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="qcrm-dashboard-card-icon">
								<UserOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Contacts', 'quillcrm')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="qcrm-dashboard-card-value">
							{data.total_contacts}
						</Typography.Text>
					</Flex>
				</Card>
				<Card className="qcrm-dashboard-card">
					<Flex gap={10} vertical>
						<Flex gap={10}>
							<div className="qcrm-dashboard-card-icon">
								<MailOutlined style={{ fontSize: 16 }} />
							</div>
							<Typography.Text strong>
								{__('Total Sent Emails', 'quillcrm')}
							</Typography.Text>
						</Flex>
						<Typography.Text className="qcrm-dashboard-card-value">
							{data.total_sent_emails}
						</Typography.Text>
					</Flex>
				</Card>
				{isWooCommerceActive && (
					<>
						<Card className="qcrm-dashboard-card">
							<Flex gap={10} vertical>
								<Flex gap={10}>
									<div className="qcrm-dashboard-card-icon">
										<TransactionOutlined
											style={{ fontSize: 16 }}
										/>
									</div>
									<Typography.Text strong>
										{__('Total Orders', 'quillcrm')}
									</Typography.Text>
								</Flex>
								<Typography.Text className="qcrm-dashboard-card-value">
									{data.total_orders}
								</Typography.Text>
							</Flex>
						</Card>
						<Card className="qcrm-dashboard-card">
							<Flex gap={10} vertical>
								<Flex gap={10}>
									<div className="qcrm-dashboard-card-icon">
										<ShopOutlined
											style={{ fontSize: 16 }}
										/>
									</div>
									<Typography.Text strong>
										{__('Total Revenue', 'quillcrm')}
									</Typography.Text>
								</Flex>
								<Typography.Text className="qcrm-dashboard-card-value">
									{data.total_revenue}
								</Typography.Text>
							</Flex>
						</Card>
					</>
				)}
			</Flex>
			<Flex gap={20}>
				<Card
					title={__('Recent Contacts', 'quillcrm')}
					className="qcrm-dashboard-card"
				>
					{isEmpty(data.recent_contacts) ? (
						<Typography.Text>
							{__('No recent contacts', 'quillcrm')}
						</Typography.Text>
					) : (
						<Table
							dataSource={data.recent_contacts}
							pagination={false}
							className="qcrm-dashboard-table"
							columns={[
								{
									title: __('Name', 'quillcrm'),
									dataIndex: 'name',
									key: 'name',
									render: (_, record) => (
										<NavLink to={`contacts/${record.id}`}>
											<Flex gap={10} align="center">
												<div className="qcrm-contacts-list__avatar">
													<UserOutlined />
												</div>
												{record.first_name || '-'}{' '}
												{record.last_name || '-'}
											</Flex>
										</NavLink>
									),
								},
								{
									title: __('Email', 'quillcrm'),
									dataIndex: 'email',
									key: 'email',
									render: (text, record) => (
										<NavLink to={`contacts/${record.id}`}>
											{text}
										</NavLink>
									),
								},
							]}
						/>
					)}
				</Card>
				<Card
					title={__('Recent Unsubscribed Contacts', 'quillcrm')}
					className="qcrm-dashboard-card"
				>
					{isEmpty(data.recent_unsubscribed_contacts) ? (
						<Typography.Text>
							{__('No recent unsubscribed contacts', 'quillcrm')}
						</Typography.Text>
					) : (
						<Table
							dataSource={data.recent_unsubscribed_contacts}
							pagination={false}
							className="qcrm-dashboard-table"
							columns={[
								{
									title: __('Name', 'quillcrm'),
									dataIndex: 'name',
									key: 'name',
									render: (_, record) => (
										<NavLink to={`contacts/${record.id}`}>
											<Flex gap={10} align="center">
												<div className="qcrm-contacts-list__avatar">
													<UserOutlined />
												</div>
												{record.first_name || '-'}{' '}
												{record.last_name || '-'}
											</Flex>
										</NavLink>
									),
								},
								{
									title: __('Email', 'quillcrm'),
									dataIndex: 'email',
									key: 'email',
									render: (text, record) => (
										<NavLink to={`contacts/${record.id}`}>
											{text}
										</NavLink>
									),
								},
							]}
						/>
					)}
				</Card>
			</Flex>
			<Flex gap={20}>
				<Card
					title={__('Recent Automations', 'quillcrm')}
					className="qcrm-dashboard-card"
				>
					{isEmpty(data.top_automations) ? (
						<Typography.Text>
							{__('No recent automations', 'quillcrm')}
						</Typography.Text>
					) : (
						<Table
							dataSource={data.top_automations}
							pagination={false}
							className="qcrm-dashboard-table"
							columns={[
								{
									title: __('Name', 'quillcrm'),
									dataIndex: 'name',
									key: 'name',
									render: (_, record) => (
										<NavLink
											to={`automations/${record.id}`}
										>
											{record.name}
										</NavLink>
									),
								},
								{
									title: __('Status', 'quillcrm'),
									dataIndex: 'status',
									key: 'status',
								},
							]}
						/>
					)}
				</Card>
				<Card
					title={__('Recent Campaigns', 'quillcrm')}
					className="qcrm-dashboard-card"
				>
					{isEmpty(data.top_campaigns) ? (
						<Typography.Text>
							{__('No recent campaigns', 'quillcrm')}
						</Typography.Text>
					) : (
						<Table
							dataSource={data.top_campaigns}
							pagination={false}
							className="qcrm-dashboard-table"
							columns={[
								{
									title: __('Name', 'quillcrm'),
									dataIndex: 'name',
									key: 'name',
									render: (_, record) => (
										<NavLink to={`campaigns/${record.id}`}>
											{record.name}
										</NavLink>
									),
								},
								{
									title: __('Status', 'quillcrm'),
									dataIndex: 'status',
									key: 'status',
								},
							]}
						/>
					)}
				</Card>
			</Flex>
			<Card
				title={__('Recent Emails', 'quillcrm')}
				className="qcrm-dashboard-card"
			>
				{isEmpty(data.recent_emails) ? (
					<Typography.Text>
						{__('No recent emails', 'quillcrm')}
					</Typography.Text>
				) : (
					<Table
						dataSource={data.recent_emails}
						pagination={false}
						className="qcrm-dashboard-table"
						columns={[
							{
								title: __('Email', 'quillcrm'),
								dataIndex: 'email',
								key: 'email',
								render: (_, record) => (
									<NavLink
										to={`contacts/${record.contact_id}`}
									>
										{record.email}
									</NavLink>
								),
							},
							{
								title: __('Opened', 'quillcrm'),
								dataIndex: 'opened',
								key: 'opened',
							},
							{
								title: __('Clicked', 'quillcrm'),
								dataIndex: 'clicked',
								key: 'clicked',
							},
							{
								title: __('Status', 'quillcrm'),
								dataIndex: 'status',
								key: 'status',
							},
							{
								title: __('Sent At', 'quillcrm'),
								dataIndex: 'sent_at',
								key: 'sent_at',
								render: (text) => convertDate(text),
							},
						]}
					/>
				)}
			</Card>
			{isWooCommerceActive && (
				<Flex gap={20}>
					<Card
						title={__('Recent Abandoned Carts', 'quillcrm')}
						className="qcrm-dashboard-card"
					>
						{isEmpty(data.recent_abandoned_carts) ? (
							<Typography.Text>
								{__('No recent abandoned carts', 'quillcrm')}
							</Typography.Text>
						) : (
							<Table
								dataSource={data.recent_abandoned_carts}
								pagination={false}
								className="qcrm-dashboard-table"
								columns={[
									{
										title: __('Email', 'quillcrm'),
										dataIndex: 'email',
										key: 'email',
										render: (_, record) => (
											<NavLink
												to={`abandoned-carts/${record.id}`}
											>
												{record.email}
											</NavLink>
										),
									},
									{
										title: __('Total', 'quillcrm'),
										dataIndex: 'total',
										key: 'total',
									},
									{
										title: __('Created At', 'quillcrm'),
										dataIndex: 'created_at',
										key: 'created_at',
										render: (text) => convertDate(text),
									},
								]}
							/>
						)}
					</Card>
					<Card
						title={__('Recent Recovered Carts', 'quillcrm')}
						className="qcrm-dashboard-card"
					>
						{isEmpty(data.recent_recoverd_carts) ? (
							<Typography.Text>
								{__('No recent recovered carts', 'quillcrm')}
							</Typography.Text>
						) : (
							<Table
								dataSource={data.recent_recoverd_carts}
								pagination={false}
								className="qcrm-dashboard-table"
								columns={[
									{
										title: __('Email', 'quillcrm'),
										dataIndex: 'email',
										key: 'email',
										render: (_, record) => (
											<NavLink
												to={`abandoned-carts/${record.id}`}
											>
												{record.email}
											</NavLink>
										),
									},
									{
										title: __('Total', 'quillcrm'),
										dataIndex: 'total',
										key: 'total',
									},
									{
										title: __('Created At', 'quillcrm'),
										dataIndex: 'created_at',
										key: 'created_at',
										render: (text) => convertDate(text),
									},
								]}
							/>
						)}
					</Card>
				</Flex>
			)}
		</Flex>
	);
};

export default Dashboard;
