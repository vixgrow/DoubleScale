/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { List, Avatar, Typography, Spin, Empty, Select, DatePicker, Button, Space, Tag, Pagination } from 'antd';
import { User, Calendar, Edit, MessageSquare, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
import './style.scss';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface DealActivitiesProps {
	dealId: number;
}

interface Activity {
	id: number;
	deal_id: number;
	activity_type: string;
	data: any;
	user_id: number;
	formatted_message: string;
	created_at: string;
	user?: {
		id: number;
		display_name: string;
	};
	comments?: any[];
}

const activityTypeIcons: Record<string, React.ReactNode> = {
	'created': <User size={16} />,
	'stage_changed': <ArrowRight size={16} />,
	'updated': <Edit size={16} />,
	'won': <TrendingUp size={16} />,
	'lost': <TrendingUp size={16} />,
	'reopened': <RefreshCw size={16} />,
	'comment': <MessageSquare size={16} />,
	'note': <MessageSquare size={16} />
};

const activityTypeColors: Record<string, string> = {
	'created': 'blue',
	'stage_changed': 'purple',
	'updated': 'orange',
	'won': 'green',
	'lost': 'red',
	'reopened': 'cyan',
	'comment': 'default',
	'note': 'default'
};

export const DealActivities: React.FC<DealActivitiesProps> = ({ dealId }) => {
	const [activities, setActivities] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(false);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	
	// Filters
	const [filters, setFilters] = useState({
		activity_type: '',
		user_id: '',
		date_from: '',
		date_to: '',
		sort_by: 'created_at',
		sort_order: 'desc'
	});

	const { getDealActivities } = useDealOperations();

	useEffect(() => {
		if (dealId) {
			fetchActivities();
		}
	}, [dealId, currentPage, pageSize, filters]);

	const fetchActivities = async () => {
		setLoading(true);
		try {
			const response = await getDealActivities(dealId, filters, pageSize, currentPage);
			
			// The response should be an array with pagination headers
			if (Array.isArray(response)) {
				setActivities(response);
				// Try to get total from response headers if available
				setTotal(response.length); // Fallback if no headers
			} else {
				setActivities([]);
				setTotal(0);
			}
		} catch (error) {
			console.error('Failed to fetch activities:', error);
			setActivities([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	};

	const handleFilterChange = (key: string, value: any) => {
		setFilters(prev => ({ ...prev, [key]: value }));
		setCurrentPage(1); // Reset to first page when filters change
	};

	const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
		setFilters(prev => ({
			...prev,
			date_from: dateStrings[0],
			date_to: dateStrings[1]
		}));
		setCurrentPage(1);
	};

	const clearFilters = () => {
		setFilters({
			activity_type: '',
			user_id: '',
			date_from: '',
			date_to: '',
			sort_by: 'created_at',
			sort_order: 'desc'
		});
		setCurrentPage(1);
	};

	const getActivityIcon = (activityType: string) => {
		return activityTypeIcons[activityType] || <User size={16} />;
	};

	const getActivityColor = (activityType: string) => {
		return activityTypeColors[activityType] || 'default';
	};

	const formatActivityTime = (createdAt: string) => {
		const date = new Date(createdAt);
		const now = new Date();
		const diffDays = differenceInDays(now, date);

		if (diffDays === 0) {
			return format(date, 'h:mm a'); // Same day - show time
		} else if (diffDays < 7) {
			return formatDistanceToNow(date, { addSuffix: true }); // Within a week - show relative time
		} else {
			return format(date, 'MMM d, yyyy'); // Older - show full date
		}
	};

	const renderActivityItem = (activity: Activity) => {
		return (
			<List.Item className="activity-item" key={activity.id}>
				<List.Item.Meta
					avatar={
						<div className="activity-avatar">
							<Avatar 
								size={36} 
								style={{ backgroundColor: `var(--ant-${getActivityColor(activity.activity_type)}-color)` }}
								icon={getActivityIcon(activity.activity_type)}
							/>
						</div>
					}
					title={
						<div className="activity-header">
							<div className="activity-info">
								<Text strong>
									{activity.user?.display_name || __('System', 'quillcrm')}
								</Text>
								<Tag 
									color={getActivityColor(activity.activity_type)}
									size="small"
								>
									{activity.activity_type.replace('_', ' ').toUpperCase()}
								</Tag>
							</div>
							<Text type="secondary" className="activity-time">
								{formatActivityTime(activity.created_at)}
							</Text>
						</div>
					}
					description={
						<div className="activity-content">
							<Text>{activity.formatted_message}</Text>
							
							{activity.data && Object.keys(activity.data).length > 0 && (
								<div className="activity-data">
									{/* Display additional activity data if needed */}
									{activity.data.old_value && activity.data.new_value && (
										<div className="value-change">
											<Text type="secondary">
												{__('Changed from:', 'quillcrm')} 
												<Text delete style={{ marginLeft: 4 }}>
													{activity.data.old_value}
												</Text>
												{' → '}
												<Text strong style={{ color: '#52c41a' }}>
													{activity.data.new_value}
												</Text>
											</Text>
										</div>
									)}
								</div>
							)}

							{activity.comments && activity.comments.length > 0 && (
								<div className="activity-comments">
									<Text type="secondary">
										{activity.comments.length} {__('comment(s)', 'quillcrm')}
									</Text>
								</div>
							)}
						</div>
					}
				/>
			</List.Item>
		);
	};

	return (
		<div className="deal-activities">
			{/* Filters */}
			<div className="activities-filters">
				<Space wrap>
					<Select
						placeholder={__('Filter by type', 'quillcrm')}
						value={filters.activity_type || undefined}
						onChange={(value) => handleFilterChange('activity_type', value)}
						allowClear
						style={{ width: 150 }}
					>
						<Select.Option value="created">{__('Created', 'quillcrm')}</Select.Option>
						<Select.Option value="stage_changed">{__('Stage Changed', 'quillcrm')}</Select.Option>
						<Select.Option value="updated">{__('Updated', 'quillcrm')}</Select.Option>
						<Select.Option value="won">{__('Won', 'quillcrm')}</Select.Option>
						<Select.Option value="lost">{__('Lost', 'quillcrm')}</Select.Option>
						<Select.Option value="reopened">{__('Reopened', 'quillcrm')}</Select.Option>
						<Select.Option value="comment">{__('Comment', 'quillcrm')}</Select.Option>
						<Select.Option value="note">{__('Note', 'quillcrm')}</Select.Option>
					</Select>

					<RangePicker
						placeholder={[__('From date', 'quillcrm'), __('To date', 'quillcrm')]}
						onChange={handleDateRangeChange}
					/>

					<Select
						placeholder={__('Sort by', 'quillcrm')}
						value={`${filters.sort_by}-${filters.sort_order}`}
						onChange={(value) => {
							const [sortBy, sortOrder] = value.split('-');
							setFilters(prev => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }));
							setCurrentPage(1);
						}}
						style={{ width: 120 }}
					>
						<Select.Option value="created_at-desc">{__('Newest', 'quillcrm')}</Select.Option>
						<Select.Option value="created_at-asc">{__('Oldest', 'quillcrm')}</Select.Option>
					</Select>

					<Button onClick={clearFilters}>
						{__('Clear Filters', 'quillcrm')}
					</Button>

					<Button icon={<RefreshCw size={14} />} onClick={fetchActivities}>
						{__('Refresh', 'quillcrm')}
					</Button>
				</Space>
			</div>

			{/* Activities List */}
			<div className="activities-content">
				{loading ? (
					<div className="activities-loading">
						<Spin size="large" />
					</div>
				) : activities.length > 0 ? (
					<>
						<List
							className="activities-list"
							dataSource={activities}
							renderItem={renderActivityItem}
						/>
						
						{total > pageSize && (
							<div className="activities-pagination">
								<Pagination
									current={currentPage}
									total={total}
									pageSize={pageSize}
									onChange={(page, size) => {
										setCurrentPage(page);
										if (size !== pageSize) {
											setPageSize(size);
										}
									}}
									showSizeChanger
									showQuickJumper
									showTotal={(total, range) => 
										__(`${range[0]}-${range[1]} of ${total} activities`, 'quillcrm')
									}
								/>
							</div>
						)}
					</>
				) : (
					<Empty
						description={__('No activities found', 'quillcrm')}
						image={Empty.PRESENTED_IMAGE_SIMPLE}
					/>
				)}
			</div>
		</div>
	);
};