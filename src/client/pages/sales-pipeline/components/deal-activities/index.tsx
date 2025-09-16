/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	List,
	Avatar,
	Typography,
	Spin,
	Empty,
	Select,
	DatePicker,
	Button,
	Space,
	Tag,
	Pagination,
} from 'antd';
import {
	User,
	Calendar,
	Edit,
	MessageSquare,
	TrendingUp,
	ArrowRight,
	RefreshCw,
	Plus,
	Phone,
	Mail,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
import { AddNoteModal } from '../add-note-modal';
import { LogCallModal } from '../log-call-modal';
import { LogEmailModal } from '../log-email-modal';
import { ScheduleMeetingModal } from '../schedule-meeting-modal';
import { ActivityComments } from '../activity-comments';
import './style.scss';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface DealActivitiesProps {
	dealId: number;
	dealTitle?: string;
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
	created: <User size={16} />,
	stage_changed: <ArrowRight size={16} />,
	value_changed: <TrendingUp size={16} />,
	status_changed: <Edit size={16} />,
	note_added: <MessageSquare size={16} />,
	email_sent: <Mail size={16} />,
	call_logged: <Phone size={16} />,
	meeting_scheduled: <Calendar size={16} />,
	updated: <Edit size={16} />,
	won: <TrendingUp size={16} />,
	lost: <TrendingUp size={16} />,
	reopened: <RefreshCw size={16} />,
	comment: <MessageSquare size={16} />,
	note: <MessageSquare size={16} />,
};

const activityTypeColors: Record<string, string> = {
	created: 'blue',
	stage_changed: 'purple',
	value_changed: 'orange',
	status_changed: 'geekblue',
	note_added: 'default',
	email_sent: 'blue',
	call_logged: 'green',
	meeting_scheduled: 'purple',
	updated: 'orange',
	won: 'green',
	lost: 'red',
	reopened: 'cyan',
	comment: 'default',
	note: 'default',
};

export const DealActivities: React.FC<DealActivitiesProps> = ({
	dealId,
	dealTitle,
}) => {
	const [activities, setActivities] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(false);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	// Modal states
	const [addNoteVisible, setAddNoteVisible] = useState(false);
	const [logCallVisible, setLogCallVisible] = useState(false);
	const [logEmailVisible, setLogEmailVisible] = useState(false);
	const [scheduleMeetingVisible, setScheduleMeetingVisible] = useState(false);

	// Filters
	const [filters, setFilters] = useState({
		activity_type: '',
		user_id: '',
		date_from: '',
		date_to: '',
		sort_by: 'created_at',
		sort_order: 'desc',
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
			const response = await getDealActivities(
				dealId,
				filters,
				pageSize,
				currentPage
			);

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
		setFilters((prev) => ({ ...prev, [key]: value }));
		setCurrentPage(1); // Reset to first page when filters change
	};

	const handleDateRangeChange = (
		dates: any,
		dateStrings: [string, string]
	) => {
		setFilters((prev) => ({
			...prev,
			date_from: dateStrings[0],
			date_to: dateStrings[1],
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
			sort_order: 'desc',
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
								style={{
									backgroundColor: `var(--ant-${getActivityColor(activity.activity_type)}-color)`,
								}}
								icon={getActivityIcon(activity.activity_type)}
							/>
						</div>
					}
					title={
						<div className="activity-header">
							<div className="activity-info">
								<Text strong>
									{activity.user?.display_name ||
										__('System', 'quillcrm')}
								</Text>
								<Tag
									color={getActivityColor(
										activity.activity_type
									)}
								>
									{activity.activity_type
										.replace('_', ' ')
										.toUpperCase()}
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

							{/* Show value changes for deal updates */}
							{activity.data &&
								activity.data.old_value &&
								activity.data.new_value && (
									<div className="activity-data">
										<div className="value-change">
											<Text type="secondary">
												{__(
													'Changed from:',
													'quillcrm'
												)}
												<Text
													delete
													style={{
														marginLeft: 4,
													}}
												>
													{activity.data.old_value}
												</Text>
												{' → '}
												<Text
													strong
													style={{
														color: '#52c41a',
													}}
												>
													{activity.data.new_value}
												</Text>
											</Text>
										</div>
									</div>
								)}

							{/* Show call notes for call activities */}
							{activity.activity_type === 'call_logged' &&
								activity.data &&
								activity.data.notes && (
									<div className="activity-data">
										<div className="call-notes">
											<Text strong>
												{__('Call Notes:', 'quillcrm')}
											</Text>
											<br />
											<Text
												style={{
													marginTop: 4,
													display: 'block',
												}}
											>
												{activity.data.notes}
											</Text>
										</div>
									</div>
								)}

							{/* Activity Comments */}
							<ActivityComments
								activityId={activity.id}
								activityType={activity.activity_type}
								initialComments={activity.comments || []}
							/>
						</div>
					}
				/>
			</List.Item>
		);
	};

	return (
		<div className="deal-activities">
			{/* Activity Actions */}
			<div className="activity-actions">
				<Space wrap>
					<Button
						type="primary"
						icon={<Plus size={14} />}
						onClick={() => setAddNoteVisible(true)}
					>
						{__('Add Note', 'quillcrm')}
					</Button>
					<Button
						icon={<Phone size={14} />}
						onClick={() => setLogCallVisible(true)}
					>
						{__('Log Call', 'quillcrm')}
					</Button>
					<Button
						icon={<Mail size={14} />}
						onClick={() => setLogEmailVisible(true)}
					>
						{__('Log Email', 'quillcrm')}
					</Button>
					<Button
						icon={<Calendar size={14} />}
						onClick={() => setScheduleMeetingVisible(true)}
					>
						{__('Schedule Meeting', 'quillcrm')}
					</Button>
				</Space>
			</div>

			{/* Filters */}
			<div className="activities-filters">
				<Space wrap>
					<Select
						placeholder={__('Filter by type', 'quillcrm')}
						value={filters.activity_type || undefined}
						onChange={(value) =>
							handleFilterChange('activity_type', value)
						}
						allowClear
						style={{ width: 150 }}
					>
						<Select.Option value="created">
							{__('Created', 'quillcrm')}
						</Select.Option>
						<Select.Option value="stage_changed">
							{__('Stage Changed', 'quillcrm')}
						</Select.Option>
						<Select.Option value="value_changed">
							{__('Value Changed', 'quillcrm')}
						</Select.Option>
						<Select.Option value="status_changed">
							{__('Status Changed', 'quillcrm')}
						</Select.Option>
						<Select.Option value="note_added">
							{__('Note Added', 'quillcrm')}
						</Select.Option>
						<Select.Option value="email_sent">
							{__('Email Sent', 'quillcrm')}
						</Select.Option>
						<Select.Option value="call_logged">
							{__('Call Logged', 'quillcrm')}
						</Select.Option>
						<Select.Option value="meeting_scheduled">
							{__('Meeting Scheduled', 'quillcrm')}
						</Select.Option>
					</Select>

					<RangePicker
						placeholder={[
							__('From date', 'quillcrm'),
							__('To date', 'quillcrm'),
						]}
						onChange={handleDateRangeChange}
					/>

					<Select
						placeholder={__('Sort by', 'quillcrm')}
						value={`${filters.sort_by}-${filters.sort_order}`}
						onChange={(value) => {
							const [sortBy, sortOrder] = value.split('-');
							setFilters((prev) => ({
								...prev,
								sort_by: sortBy,
								sort_order: sortOrder,
							}));
							setCurrentPage(1);
						}}
						style={{ width: 120 }}
					>
						<Select.Option value="created_at-desc">
							{__('Newest', 'quillcrm')}
						</Select.Option>
						<Select.Option value="created_at-asc">
							{__('Oldest', 'quillcrm')}
						</Select.Option>
					</Select>

					<Button onClick={clearFilters}>
						{__('Clear Filters', 'quillcrm')}
					</Button>

					<Button
						icon={<RefreshCw size={14} />}
						onClick={fetchActivities}
					>
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
										__(
											`${range[0]}-${range[1]} of ${total} activities`,
											'quillcrm'
										)
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

			{/* Activity Modals */}
			<AddNoteModal
				visible={addNoteVisible}
				onClose={() => setAddNoteVisible(false)}
				onSuccess={() => {
					fetchActivities();
					setAddNoteVisible(false);
				}}
				dealId={dealId}
				dealTitle={dealTitle}
			/>

			<LogCallModal
				visible={logCallVisible}
				onClose={() => setLogCallVisible(false)}
				onSuccess={() => {
					fetchActivities();
					setLogCallVisible(false);
				}}
				dealId={dealId}
				dealTitle={dealTitle}
			/>

			<LogEmailModal
				visible={logEmailVisible}
				onClose={() => setLogEmailVisible(false)}
				onSuccess={() => {
					fetchActivities();
					setLogEmailVisible(false);
				}}
				dealId={dealId}
				dealTitle={dealTitle}
			/>

			<ScheduleMeetingModal
				visible={scheduleMeetingVisible}
				onClose={() => setScheduleMeetingVisible(false)}
				onSuccess={() => {
					fetchActivities();
					setScheduleMeetingVisible(false);
				}}
				dealId={dealId}
				dealTitle={dealTitle}
			/>
		</div>
	);
};
