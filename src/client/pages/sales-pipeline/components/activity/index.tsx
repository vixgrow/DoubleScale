/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { User, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

/**
 * Internal dependencies
 */
import ActivitiesFilters from '../deal-activities/ActivitiesFilters';
import { useDealOperations } from '../../hooks/use-deal-operations';
import { useActivityOperations } from '../../hooks/use-activity-operations';
import { ActivityComments } from '../activity-comments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddNoteModal } from '../add-note-modal';
import { LogCallModal } from '../log-call-modal';
import { LogEmailModal } from '../log-email-modal';
import { ScheduleMeetingModal } from '../schedule-meeting-modal';
import './style.scss';

import NoteAddIcon from '@quillcrm/components/icons/note-add';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import DealValueIcon from '@quillcrm/components/icons/deal-value';
import CommentIcon from '@quillcrm/components/icons/comment';
import MeetingActivityIcon from '@quillcrm/components/icons/meeting-activity';
import UserActivityIcon from '@quillcrm/components/icons/user-activity';
import StartDateIcon from '@quillcrm/components/icons/start-date';
import DurationIcon from '@quillcrm/components/icons/duration';
import LocationIcon from '@quillcrm/components/icons/location';
import NoActivity from './noActivity';
import CallActivityIcon from '@quillcrm/components/icons/call-activity';
import EmailActivityIcon from '@quillcrm/components/icons/email-activity';
import { ActivityActionsDropdown } from './activity-action-dropdown/ActivityActionDropdown';

interface ActivityProps {
	dealId?: number;
	activityTypeFilter?: string;
	onActivityAdded?: any;
	activityItem?: any;
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
	created: <UserActivityIcon color="#3B82F6" />,
	stage_changed: <ArrowRight className="w-4 h-4" />,
	value_changed: <DealValueIcon color="#F97316" />,
	status_changed: <EditHeaderIcon />,
	note_added: <NoteAddIcon />,
	email_sent: <EmailActivityIcon />,
	call_logged: <CallActivityIcon />,
	meeting_scheduled: <MeetingActivityIcon color="#CB5301" />,
};

const activityTypeColors: Record<string, string> = {
	created: '#3B82F6',
	stage_changed: '#8B5CF6',
	value_changed: '#F97316',
	status_changed: '#06B6D4',
	note_added: '#458DC7',
	email_sent: '#16A34A',
	call_logged: '#660FF1',
	meeting_scheduled: '#CB5301',
};

export default function Activity({
	dealId,
	activityTypeFilter,
	
}: ActivityProps) {
	const { getDealActivities } = useDealOperations();
	const { deleteActivity } = useActivityOperations();
	const [activities, setActivities] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(false);
	const [openCommentId, setOpenCommentId] = useState<number | null>(null);

	// Modal states for editing
	const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
	const [addNoteVisible, setAddNoteVisible] = useState(false);
	const [logCallVisible, setLogCallVisible] = useState(false);
	const [logEmailVisible, setLogEmailVisible] = useState(false);
	const [scheduleMeetingVisible, setScheduleMeetingVisible] = useState(false);

	const [filters, setFilters] = useState({
		activity_type: '',
		sort_by: 'created_at',
		sort_order: 'desc',
		date_from: '',
		date_to: '',
	});

	const handleFilterChange = (key: string, value: any) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({
			activity_type: '',
			sort_by: 'created_at',
			sort_order: 'desc',
			date_from: '',
			date_to: '',
		});
	};

	// const fetchActivities = async () => {
	// 	if (!dealId || !getDealActivities) return;

	// 	setLoading(true);
	// 	try {
	// 		const response = await getDealActivities(dealId, filters, 20, 1);
	//   // console.log(" Activities response:", response)
	// 		if (Array.isArray(response)) {
	// 			setActivities(response);
	// 		}
	//   const filtered = activityTypeFilter
	//   ? response.filter((a: any) => a.activity_type === activityTypeFilter)
	//   : response;

	// setActivities(filtered);
	// 	} catch (error) {
	// 		console.error('Failed to fetch activities:', error);
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };
	const fetchActivities = async () => {
		if (!dealId || !getDealActivities) return;

		setLoading(true);
		try {
			const response = await getDealActivities(dealId, filters, 20, 1);

			if (Array.isArray(response)) {
				const filtered =
					activityTypeFilter && typeof activityTypeFilter === 'string'
						? response.filter(
								(a: any) =>
									a.activity_type === activityTypeFilter
							)
						: response;

				setActivities(filtered);
			}
		} catch (error) {
			console.error('Failed to fetch activities:', error);
		} finally {
			setLoading(false);
		}
	};

	const applyFilters = () => {
		fetchActivities();
	};

	// Edit/Delete handlers
	const handleEditActivity = (activity: Activity) => {
		setEditingActivity(activity);

		switch (activity.activity_type) {
			case 'note_added':
				setAddNoteVisible(true);
				break;
			case 'call_logged':
				setLogCallVisible(true);
				break;
			case 'email_sent':
				setLogEmailVisible(true);
				break;
			case 'meeting_scheduled':
				setScheduleMeetingVisible(true);
				break;
		}
	};

	const handleDeleteActivity = async (activityId: number) => {
		if (!window.confirm(__('Are you sure you want to delete this activity? This action cannot be undone.', 'quillcrm'))) {
			return;
		}

		try {
			await deleteActivity(activityId);
			fetchActivities();
		} catch (error) {
			console.error('Failed to delete activity:', error);
		}
	};

	const isEditableActivity = (activityType: string) => {
		const editableTypes = ['note_added', 'email_sent', 'call_logged', 'meeting_scheduled'];
		return editableTypes.includes(activityType);
	};

	// Fetch activities when component mounts or dealId changes
	useEffect(() => {
		fetchActivities();
	}, [dealId, activityTypeFilter]);

	const getActivityIcon = (activityType: string) => {
		return activityTypeIcons[activityType] || <User className="w-4 h-4" />;
	};

	const getActivityColor = (activityType: string) => {
		return activityTypeColors[activityType] || '#6B7280';
	};

	dayjs.extend(utc);
	dayjs.extend(timezone);
	const formatActivityTime = (createdAt: string) => {
		const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const date = dayjs.utc(createdAt).tz(userTimeZone);

		const now = dayjs();
		const diffDays = now.diff(date, 'day');

		if (diffDays === 0) {
			return date.format('h:mm A');
		} else if (diffDays < 7) {
			return `Last ${date.format('dddd [at] h:mm A')}`;
		} else {
			return date.format('MMM D, YYYY [at] h:mm A');
		}
	};

	const renderActivityContent = (activity: Activity) => {
		switch (activity.activity_type) {
			case 'note_added':
				return (
					activity.data?.content && (
						<div className="activity-note-content">
							<p>{activity.data.content}</p>
						</div>
					)
				);

			case 'meeting_scheduled':
				return (
					activity.data && (
						<div className="activity-meeting-content flex gap-4 py-4 px-2 border border-[#DEE1E6] bg-[#DEE1E666] rounded-[8px]">
							<div className="meeting-date-card h-full flex flex-col items-center justify-center text-center border-r border-r-[#DEE1E6] pr-3 py-3 px-4 gap-2">
								<div className=" text-[#09090B] text-xl text-center font-semibold leading-[30px]">
									{new Date(
										activity.data.start_date ||
											activity.created_at
									).getDate()}
								</div>
								<div className=" text-[#09090B] text-base text-center font-normal leading-[26px]">
									{format(
										new Date(
											activity.data.start_date ||
												activity.created_at
										),
										'MMM'
									)}
								</div>
							</div>
							<div className=" flex flex-col gap-3">
								<div className="flex gap-6 items-center">
									{activity.data.scheduled_at && (
										<div className="flex justify-center gap-2 border-r border-r-[#DEE1E6] font-medium text-[#777] pr-4">
											<StartDateIcon />
											<span>
												{__('Start Date', 'quillcrm')}:
												<span className=" text-[#CB5301] text-base font-semibold">
													{format(
														new Date(
															activity.data.scheduled_at
														),
														'h:mm a'
													)}
												</span>
											</span>
										</div>
									)}
									{activity.data.location && (
										<div className="flex justify-center gap-2 border-r border-r-[#DEE1E6] font-medium text-[#777] pr-4">
											<LocationIcon />
											<span>
												{__('Location', 'quillcrm')}:{' '}
												<span className=" text-[#CB5301] text-base font-semibold">
													{activity.data.location}
												</span>
											</span>
										</div>
									)}
									{activity.data.duration && (
										<div className="flex justify-center gap-2  font-medium text-[#777]">
											<DurationIcon />
											<span>
												{__('Duration', 'quillcrm')}:{' '}
												<span className=" text-[#CB5301] text-base font-semibold">
													{activity.data.duration}{' '}
													{__('minutes', 'quillcrm')}
												</span>
											</span>
										</div>
									)}
								</div>
								{activity.data.description && (
									<div className="flex flex-col gap-2  ">
										<h4 className="text-[#09090B]  text-base font-medium">
											Meeting Description
										</h4>
										<p className=" text-base font-normal text-[#777] leading-[26px]">
											{activity.data.description}
										</p>
									</div>
								)}
							</div>
						</div>
					)
				);

			case 'email_sent':
				return (
					activity.data && (
						<div className=" border border-[#DEE1E6] bg-[#DEE1E666] rounded-[8px] flex flex-col gap-4 py-4 px-2">
							<h4 className="text-[#09090B]  text-base font-medium">
								{__('Email Body', 'quillcrm')}
							</h4>
							<p className=" text-base font-normal text-[#777] leading-[26px]">
								{activity.data.subject ||
									activity.formatted_message}
							</p>
						</div>
					)
				);

			case 'call_logged':
				return (
					activity.data && (
						<div className="border border-[#DEE1E6] bg-[#DEE1E666] rounded-[8px] flex flex-col gap-4 py-4 px-2">
							<h4 className="text-[#09090B] font-[Inter] text-base font-medium">
								{' '}
								{__('Call Notes', 'quillcrm')}{' '}
							</h4>
							<p className="text-base font-normal text-[#777] leading-[26px]">
								{activity.data.notes || 'No notes available'}
							</p>
						</div>
					)
				);
			case 'value_changed':
				return (
					activity.data && (
						<div className="activity-value-content flex items-center gap-2 text-base text-[#09090B]">
							<span>
								{__('Deal value changed from', 'quillcrm')}
							</span>
							<span className="line-through text-[#6B7280]">
								{activity.data.old_value}
							</span>
							<span>{__('to', 'quillcrm')}</span>
							<span className="font-semibold text-[#09090B]">
								{activity.data.new_value}
							</span>
						</div>
					)
				);

			default:
				return <p>{activity.formatted_message}</p>;
		}
	};

	return (
		<div className="activity-container">
			{!activityTypeFilter && (
				<ActivitiesFilters
					filters={filters}
					onChange={handleFilterChange}
					onDateChange={(from, to) =>
						setFilters((prev) => ({
							...prev,
							date_from: from,
							date_to: to,
						}))
					}
					onClear={clearFilters}
					onApply={applyFilters}
				/>
			)}

			<div className="activities-list mt-6">
				{loading ? (
					<div className="space-y-6">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="activity-item-skeleton">
								<Skeleton className="w-9 h-9 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
									<Skeleton className="h-20 w-full" />
								</div>
							</div>
						))}
					</div>
				) : activities.length > 0 ? (
					<div className="relative">
						{/* Timeline line */}
						<div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-dashed border-l-2 border-[#E5E7EB] border-dashed"></div>

						<div className="space-y-0">
							{activities.map((activity) => (
								<div
									key={activity.id}
									className="activity-item relative pl-12 pb-8"
								>
									{/* Activity Icon */}
									<div className="absolute p-1 left-0 top-0 w-9 h-9 rounded-full bg-[#FFF] flex items-center justify-center  border border-[#DEE1E6]">
										{getActivityIcon(
											activity.activity_type
										)}
									</div>

									{/* Activity Content */}
									<div className="activity-content">
										{/* Header */}
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<div className=" flex justify-center gap-2">
													<MeetingActivityIcon />
													<p className="text-base font-normal text-[#777] border-r border-r-[#DEE1E6] pr-2">
														{formatActivityTime(
															activity.created_at
														)}
													</p>
												</div>
												<div className="flex justify-center gap-2">
													<UserActivityIcon />
													<p className="text-base font-normal text-[#777]">
														{activity.user
															?.display_name ||
															__(
																'System',
																'quillcrm'
															)}
													</p>
												</div>
												<Badge
													className="text-base  px-2 py-1 border !shadow-none capitalize"
													style={{
														borderColor:
															getActivityColor(
																activity.activity_type
															),
														color: getActivityColor(
															activity.activity_type
														),
														backgroundColor: `${getActivityColor(activity.activity_type)}20`,
													}}
												>
													{activity.activity_type.replace(
														/_/g,
														' '
													)}
												</Badge>
											</div>
											{/* <Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 p-0"
											>
												<MoreHorizantail />
											</Button> */}
											{/* </div> */}
											{/* Actions */}
											<div className="flex items-center gap-5">
												<Button
													variant="ghost"
													size="sm"
													className="flex items-center h-10 gap-1 text-[#09090B] border border-[#458DC7] py-2 px-4 rounded-[8px] bg-[#FFF]"
													onClick={() =>
														setOpenCommentId(
															openCommentId ===
																activity.id
																? null
																: activity.id
														)
													}
												>
													<CommentIcon />
													<span className=" text-[#458DC7] text-base font-medium">
														{__(
															'Add Comment',
															'quillcrm'
														)}
													</span>
												</Button>

												{isEditableActivity(activity.activity_type) && (
													<ActivityActionsDropdown
														onEdit={() => handleEditActivity(activity)}
														onDelete={() => handleDeleteActivity(activity.id)}
													/>
												)}
											</div>
										</div>

										{/* Activity Description */}
										<div className="activity-body">
											<p className="text-base text-[#09090B] mb-3 font-medium">
												{activity.formatted_message}
											</p>

											{/* Activity-specific content */}
											{renderActivityContent(activity)}

											{/* Comments (conditionally visible) */}
											{openCommentId === activity.id && (
												<ActivityComments
													activityId={activity.id}
													initialComments={
														activity.comments || []
													}
												/>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<NoActivity
						dealId={dealId}
						activityTypeFilter={activityTypeFilter}
						onActivityAdded={() => fetchActivities()}
					/>
				)}
			</div>

			{/* Edit Modals */}
			<AddNoteModal
				visible={addNoteVisible}
				onClose={() => {
					setAddNoteVisible(false);
					setEditingActivity(null);
				}}
				onSuccess={() => {
					fetchActivities();
					setAddNoteVisible(false);
					setEditingActivity(null);
				}}
				dealId={dealId!}
				editMode={!!editingActivity}
				activity={editingActivity}
			/>

			<LogCallModal
				visible={logCallVisible}
				onClose={() => {
					setLogCallVisible(false);
					setEditingActivity(null);
				}}
				onSuccess={() => {
					fetchActivities();
					setLogCallVisible(false);
					setEditingActivity(null);
				}}
				dealId={dealId!}
				editMode={!!editingActivity}
				activity={editingActivity}
			/>

			<LogEmailModal
				visible={logEmailVisible}
				onClose={() => {
					setLogEmailVisible(false);
					setEditingActivity(null);
				}}
				onSuccess={() => {
					fetchActivities();
					setLogEmailVisible(false);
					setEditingActivity(null);
				}}
				dealId={dealId!}
				editMode={!!editingActivity}
				activity={editingActivity}
			/>

			<ScheduleMeetingModal
				visible={scheduleMeetingVisible}
				onClose={() => {
					setScheduleMeetingVisible(false);
					setEditingActivity(null);
				}}
				onSuccess={() => {
					fetchActivities();
					setScheduleMeetingVisible(false);
					setEditingActivity(null);
				}}
				dealId={dealId!}
				editMode={!!editingActivity}
				activity={editingActivity}
			/>
		</div>
	);
}
