import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';
import { Flex, Skeleton, Typography } from 'antd';
import Card from 'antd/es/card/Card';
import { CardContent } from '../../../../components/ui/card';
import { __ } from '@wordpress/i18n';
import {
	UserOutlined,
	CheckCircleOutlined,
	PlusCircleOutlined,
	TrophyOutlined,
	ClockCircleOutlined,
	ThunderboltOutlined,
	CaretUpOutlined,
	CaretDownOutlined,
} from '@ant-design/icons';
import { useReportFilters } from '../../../../hooks/useReportFilters';
import ReportFilters from '../../../../components/reports/ReportFilters';

interface ContactsDealsReportsProps {
	contacts_created: number;
	contacts_created_change: number;
	contacts_worked: number;
	contacts_worked_change: number;
	deals_created: number;
	deals_created_change: number;
	deals_won: number;
	deals_won_change: number;
	deals_avg_time: number;
	deals_avg_time_change: number;
	deal_velocity: number;
	deal_velocity_change: number;
}

const ContactsDealsReports: React.FC = () => {
	const [data, setData] = useState<ContactsDealsReportsProps>({
		contacts_created: 0,
		contacts_created_change: 0,
		contacts_worked: 0,
		contacts_worked_change: 0,
		deals_created: 0,
		deals_created_change: 0,
		deals_won: 0,
		deals_won_change: 0,
		deals_avg_time: 0,
		deals_avg_time_change: 0,
		deal_velocity: 0,
		deal_velocity_change: 0,
	});
	const [loading, setLoading] = useState(false);

	// Use the custom hook for filters
	const {
		filters,
		setFilters,
		filterOptions,
		showFilters,
		setShowFilters,
		buildQueryParams,
		clearFilters,
	} = useReportFilters();

	const fetchContactsDealsReports = async () => {
		setLoading(true);
		try {
			const queryParams = buildQueryParams();
			const path = `/qc/v1/reports/contacts-deals${queryParams ? `?${queryParams}` : ''}`;

			const response = (await apiFetch({
				path,
			})) as ContactsDealsReportsProps;

			// Ensure all properties exist in the response
			const processedData = {
				contacts_created: response.contacts_created || 0,
				contacts_created_change: response.contacts_created_change || 0,
				contacts_worked: response.contacts_worked || 0,
				contacts_worked_change: response.contacts_worked_change || 0,
				deals_created: response.deals_created || 0,
				deals_created_change: response.deals_created_change || 0,
				deals_won: response.deals_won || 0,
				deals_won_change: response.deals_won_change || 0,
				deals_avg_time: response.deals_avg_time || 0,
				deals_avg_time_change: response.deals_avg_time_change || 0,
				deal_velocity: response.deal_velocity || 0,
				deal_velocity_change: response.deal_velocity_change || 0,
			};

			setData(processedData);
			setLoading(false);
		} catch (error) {
			console.error(error);
			setLoading(false);
		}
	};

	// Apply filters
	const applyFilters = () => {
		fetchContactsDealsReports();
	};

	useEffect(() => {
		fetchContactsDealsReports();
	}, []);

	useEffect(() => {
		fetchContactsDealsReports();
	}, [filters]);

	if (loading) {
		return <Skeleton active />;
	}

	return (
		<div>
			{/* Filters Section */}
			<ReportFilters
				title={__('Contacts & Deals Reports', 'quillcrm')}
				filters={filters}
				setFilters={setFilters}
				filterOptions={filterOptions}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
				clearFilters={clearFilters}
				applyFilters={applyFilters}
				showDateRange={true}
				showOwner={true}
				showPipeline={true}
				showStatus={true}
				showContact={true}
			/>

			<Flex
				gap={20}
				vertical
				style={{
					marginTop: 20,
					border: '1px solid #f0f0f0',
					borderRadius: 10,
					padding: 20,
					backgroundColor: '#f0f0f0',
				}}
			>
				<Typography.Title level={5}>
					{__(
						'Contacts created and worked totals with deals created and won totals',
						'quillcrm'
					)}
				</Typography.Title>
				<Typography.Text type="secondary">
					{filters.dateRange &&
					filters.dateRange[0] &&
					filters.dateRange[1]
						? `${__('Date range:', 'quillcrm')} ${filters.dateRange[0].format('MMM DD, YYYY')} - ${filters.dateRange[1].format('MMM DD, YYYY')}`
						: __(
								'Date range: In the last 30 days',
								'quillcrm'
							)}{' '}
					&nbsp;&nbsp; {__('Compared To: Year before', 'quillcrm')}
				</Typography.Text>
				<Flex gap={20} style={{ marginTop: 20 }} wrap="wrap">
					{/* Contacts Created */}
					<Card style={{ flex: 1 }}>
						<CardContent>
							<Flex gap={10} vertical>
								<Flex gap={10}>
									<div className="qcrm-dashboard-card-icon">
										<UserOutlined
											style={{ fontSize: 16 }}
										/>
									</div>
									<Typography.Text strong>
										{__('CONTACTS CREATED', 'quillcrm')}
									</Typography.Text>
								</Flex>
								<Typography.Text
									className="qcrm-analytics-count"
									style={{
										fontSize: 28,
										fontWeight: 'bold',
										color: '#0891b2',
									}}
								>
									{data.contacts_created.toLocaleString()}
								</Typography.Text>
								<Flex align="center">
									{data.contacts_created_change > 0 ? (
										<CaretUpOutlined
											style={{ color: '#10b981' }}
										/>
									) : (
										<CaretDownOutlined
											style={{ color: '#ef4444' }}
										/>
									)}
									<Typography.Text
										style={{
											color:
												data.contacts_created_change > 0
													? '#10b981'
													: '#ef4444',
										}}
									>
										{Math.abs(
											data.contacts_created_change
										).toFixed(2)}
										%
									</Typography.Text>
								</Flex>
							</Flex>
						</CardContent>
					</Card>

					{/* Contacts Worked */}
					<Card style={{ flex: 1 }}>
						<CardContent>
							<Flex gap={10} vertical>
								<Flex gap={10}>
									<div className="qcrm-dashboard-card-icon">
										<CheckCircleOutlined
											style={{ fontSize: 16 }}
										/>
									</div>
									<Typography.Text strong>
										{__('CONTACTS WORKED', 'quillcrm')}
									</Typography.Text>
								</Flex>
								<Typography.Text
									className="qcrm-analytics-count"
									style={{
										fontSize: 28,
										fontWeight: 'bold',
										color: '#0891b2',
									}}
								>
									{data.contacts_worked.toLocaleString()}
								</Typography.Text>
								<Flex align="center">
									{data.contacts_worked_change > 0 ? (
										<CaretUpOutlined
											style={{ color: '#10b981' }}
										/>
									) : (
										<CaretDownOutlined
											style={{ color: '#ef4444' }}
										/>
									)}
									<Typography.Text
										style={{
											color:
												data.contacts_worked_change > 0
													? '#10b981'
													: '#ef4444',
										}}
									>
										{Math.abs(
											data.contacts_worked_change
										).toFixed(2)}
										%
									</Typography.Text>
								</Flex>
							</Flex>
						</CardContent>
					</Card>

					<Flex
						gap={20}
						style={{ marginTop: 20, width: '100%' }}
						wrap="wrap"
					>
						{/* New Deals Created */}
						<Card style={{ flex: 1 }}>
							<CardContent>
								<Flex gap={10} vertical>
									<Flex gap={10}>
										<div className="qcrm-dashboard-card-icon">
											<PlusCircleOutlined
												style={{ fontSize: 16 }}
											/>
										</div>
										<Typography.Text strong>
											{__(
												'NEW DEALS CREATED',
												'quillcrm'
											)}
										</Typography.Text>
									</Flex>
									<Typography.Text
										className="qcrm-analytics-count"
										style={{
											fontSize: 28,
											fontWeight: 'bold',
											color: '#0891b2',
										}}
									>
										{data.deals_created.toLocaleString()}
									</Typography.Text>
									<Flex align="center">
										{data.deals_created_change > 0 ? (
											<CaretUpOutlined
												style={{ color: '#10b981' }}
											/>
										) : (
											<CaretDownOutlined
												style={{ color: '#ef4444' }}
											/>
										)}
										<Typography.Text
											style={{
												color:
													data.deals_created_change >
													0
														? '#10b981'
														: '#ef4444',
											}}
										>
											{Math.abs(
												data.deals_created_change
											).toFixed(2)}
											%
										</Typography.Text>
									</Flex>
								</Flex>
							</CardContent>
						</Card>

						{/* Deals Closed Won */}
						<Card style={{ flex: 1 }}>
							<CardContent>
								<Flex gap={10} vertical>
									<Flex gap={10}>
										<div className="qcrm-dashboard-card-icon">
											<TrophyOutlined
												style={{ fontSize: 16 }}
											/>
										</div>
										<Typography.Text strong>
											{__('DEALS CLOSED WON', 'quillcrm')}
										</Typography.Text>
									</Flex>
									<Typography.Text
										className="qcrm-analytics-count"
										style={{
											fontSize: 28,
											fontWeight: 'bold',
											color: '#0891b2',
										}}
									>
										{data.deals_won.toLocaleString()}
									</Typography.Text>
									<Flex align="center">
										{data.deals_won_change > 0 ? (
											<CaretUpOutlined
												style={{ color: '#10b981' }}
											/>
										) : (
											<CaretDownOutlined
												style={{ color: '#ef4444' }}
											/>
										)}
										<Typography.Text
											style={{
												color:
													data.deals_won_change > 0
														? '#10b981'
														: '#ef4444',
											}}
										>
											{Math.abs(
												data.deals_won_change
											).toFixed(2)}
											%
										</Typography.Text>
									</Flex>
								</Flex>
							</CardContent>
						</Card>

						{/* Deals Average Time */}
						<Card style={{ flex: 1 }}>
							<CardContent>
								<Flex gap={10} vertical>
									<Flex gap={10}>
										<div className="qcrm-dashboard-card-icon">
											<ClockCircleOutlined
												style={{ fontSize: 16 }}
											/>
										</div>
										<Typography.Text strong>
											{__(
												'DEALS AVERAGE TIME',
												'quillcrm'
											)}
										</Typography.Text>
									</Flex>
									<Typography.Text
										className="qcrm-analytics-count"
										style={{
											fontSize: 28,
											fontWeight: 'bold',
											color: '#0891b2',
										}}
									>
										{data.deals_avg_time}{' '}
										{__('days', 'quillcrm')}
									</Typography.Text>
									<Flex align="center">
										{/* For time metrics, negative change is usually good */}
										{data.deals_avg_time_change < 0 ? (
											<CaretUpOutlined
												style={{ color: '#10b981' }}
											/>
										) : (
											<CaretDownOutlined
												style={{ color: '#ef4444' }}
											/>
										)}
										<Typography.Text
											style={{
												color:
													data.deals_avg_time_change <
													0
														? '#10b981'
														: '#ef4444',
											}}
										>
											{Math.abs(
												data.deals_avg_time_change
											).toFixed(2)}
											%
										</Typography.Text>
									</Flex>
								</Flex>
							</CardContent>
						</Card>

						{/* Deal Velocity */}
						<Card style={{ flex: 1 }}>
							<CardContent>
								<Flex gap={10} vertical>
									<Flex gap={10}>
										<div className="qcrm-dashboard-card-icon">
											<ThunderboltOutlined
												style={{ fontSize: 16 }}
											/>
										</div>
										<Typography.Text strong>
											{__('DEAL VELOCITY', 'quillcrm')}
										</Typography.Text>
									</Flex>
									<Typography.Text
										className="qcrm-analytics-count"
										style={{
											fontSize: 28,
											fontWeight: 'bold',
											color: '#0891b2',
										}}
									>
										{data.deal_velocity}{' '}
										{__('days', 'quillcrm')}
									</Typography.Text>
									<Flex align="center">
										{/* For velocity, lower is usually better */}
										{data.deal_velocity_change < 0 ? (
											<CaretUpOutlined
												style={{ color: '#10b981' }}
											/>
										) : (
											<CaretDownOutlined
												style={{ color: '#ef4444' }}
											/>
										)}
										<Typography.Text
											style={{
												color:
													data.deal_velocity_change <
													0
														? '#10b981'
														: '#ef4444',
											}}
										>
											{Math.abs(
												data.deal_velocity_change
											).toFixed(2)}
											%
										</Typography.Text>
									</Flex>
								</Flex>
							</CardContent>
						</Card>
					</Flex>
				</Flex>
			</Flex>
		</div>
	);
};

export default ContactsDealsReports;
