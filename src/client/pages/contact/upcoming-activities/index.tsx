/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';

/**
 * External dependencies
 */
import { format } from 'date-fns';
import { User, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

/**
 * Internal dependencies
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivitiesService, transformApiItemsToTimeline, TimelineItem } from '@quillcrm/services/activities-service';
import { NoData, TaskDoneIcon, GradientUpcomingActivitiesIcon, NoteAddIcon, EditHeaderIcon, DealValueIcon, MeetingActivityIcon, UserActivityIcon, StartDateIcon, DurationIcon, LocationIcon, CallActivityIcon, EmailActivityIcon, CheckCircleIcon } from '@quillcrm/components';
import { ActivityActionsDropdown } from '../activities/activity-action-dropdown';
import { useActivityOperations } from '@quillcrm/hooks/use-activity-operations';
import { useContactContext } from '../state/context';
import NoteDialog from '../notes/note-dialog';
import CallDialog from '../calls/call-dialog';
import MeetingDialog from '../meetings/meeting-dialog';
import type { Note } from '@quillcrm/client';

interface UpcomingActivitiesProps {
    contact_id: number;
}

/**
 * Activity data types for different activity types.
 */
interface ActivityData {
    // Note
    title?: string;
    content?: string;
    note?: string;
    // Call
    phone_number?: string;
    duration?: number;
    outcome?: string;
    notes?: string;
    called_at?: string;
    // Meeting
    meeting_title?: string;
    location?: string;
    meeting_date_time?: string;
    meeting_end_time?: string;
    description?: string;
    start_date?: string;
    scheduled_at?: string;
    // Email
    subject?: string;
    body?: string;
}

/**
 * Activity type used for editing dialogs.
 * More specific than the generic TimelineItem.activity for dialog compatibility.
 */
interface EditableActivity {
    id: number;
    contact_id: number;
    activity_type: string;
    data: ActivityData;
    user_id: number;
    formatted_message: string;
    created_at: string;
    updated_at?: string;
    user?: {
        id: number;
        display_name: string;
    };
    comments?: unknown[];
}

const activityTypeIcons: Record<string, React.ReactNode> = {
    created: <UserActivityIcon color="#3B82F6" />,
    stage_changed: <ArrowRight className="w-4 h-4" />,
    value_changed: <DealValueIcon color="#F97316" />,
    status_changed: <EditHeaderIcon />,
    note: <NoteAddIcon />,
    email_sent: <EmailActivityIcon />,
    call_logged: <CallActivityIcon width={16} height={16} />,
    meeting_scheduled: <MeetingActivityIcon color="#CB5301" />,
    task: <TaskDoneIcon color="#CB5301" />,
    call: <CallActivityIcon width={16} height={16} />,
    email: <EmailActivityIcon />,
    meeting: <MeetingActivityIcon color="#CB5301" />,
    todo: <TaskDoneIcon color="#CB5301" />,
    follow_up: <TaskDoneIcon color="#CB5301" />,
};

// Pro plugin TaskService - loaded via WordPress filters at runtime
// Pro plugin registers this via addFilter('quillcrm_pro_component', ...)
const getProTaskService = () => applyFilters('quillcrm_pro_component', null, 'TaskService') as any;

const UpcomingActivities: React.FC<UpcomingActivitiesProps> = ({ contact_id }) => {
    const { deleteActivity } = useActivityOperations();
    const { contact } = useContactContext();
    const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modal states for editing
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState<EditableActivity | null>(null);
    const [callDialogOpen, setCallDialogOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<EditableActivity | null>(null);
    const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);

    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.extend(isSameOrAfter);

    const fetchUpcomingActivities = async () => {
        if (!contact_id) return;

        setLoading(true);
        try {
            const today = dayjs().format('YYYY-MM-DD');

            // Use timeline endpoint to get activities + tasks
            // Backend filters by scheduled date for activities and due_date for tasks
            const response = await ActivitiesService.getTimeline({
                contact_id,
                per_page: 100,
                page: 1,
                date_from: today,
            });

            if (response && response.data) {
                // Transform using service utility
                const timelineItems = transformApiItemsToTimeline(response.data);
                setTimelineItems(timelineItems);
            }
        } catch (error) {
            console.error('Failed to fetch upcoming activities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpcomingActivities();
    }, [contact_id]);

    const handleEditActivity = (activity: EditableActivity) => {
        if (activity.activity_type === 'note') {
            const note: Note = {
                id: activity.id,
                contact_id: activity.contact_id,
                title: activity.data?.title || activity.formatted_message || '',
                note: activity.data?.content || activity.data?.note || '',
                type: 'note',
                created_at: activity.created_at,
                updated_at: activity.updated_at || activity.created_at,
            };
            setSelectedNote(note);
            setNoteDialogOpen(true);
        } else if (activity.activity_type === 'call_logged') {
            setSelectedCall(activity);
            setCallDialogOpen(true);
        } else if (activity.activity_type === 'meeting_scheduled') {
            setSelectedMeeting(activity);
            setMeetingDialogOpen(true);
        }
    };

    const handleNoteSave = () => {
        fetchUpcomingActivities();
    };

    const handleNoteUpdate = () => {
        fetchUpcomingActivities();
    };

    const showNotice = (type: 'success' | 'error', message: string) => {
        setNotice({ type, message });
        setTimeout(() => setNotice(null), 3000);
    };

    const handleDeleteActivity = async (activityId: number) => {
        if (!window.confirm(__('Are you sure you want to delete this activity? This action cannot be undone.', 'quillcrm'))) {
            return;
        }

        try {
            await deleteActivity(activityId);
            fetchUpcomingActivities();
            showNotice('success', __('Activity deleted successfully', 'quillcrm'));
        } catch (error) {
            console.error('Failed to delete activity:', error);
            showNotice('error', __('Failed to delete activity', 'quillcrm'));
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!window.confirm(__('Are you sure you want to delete this task? This action cannot be undone.', 'quillcrm'))) {
            return;
        }
        try {
            const TaskService = getProTaskService();
            if (!TaskService) {
                showNotice('error', __('Task deletion requires Pro plugin.', 'quillcrm'));
                return;
            }
            await TaskService.deleteTask(taskId);
            fetchUpcomingActivities();
            showNotice('success', __('Task deleted successfully', 'quillcrm'));
        } catch (error) {
            console.error('Failed to delete task:', error);
            showNotice('error', __('Failed to delete task', 'quillcrm'));
        }
    };

    const handleMarkTaskComplete = async (taskId: number) => {
        try {
            await apiFetch({
                path: `/qc/v1/tasks/${taskId}`,
                method: 'PATCH',
                data: {
                    status: 'completed',
                },
            });
            fetchUpcomingActivities();
            showNotice('success', __('Task marked as complete', 'quillcrm'));
        } catch (error) {
            console.error('Failed to mark task as complete:', error);
            showNotice('error', __('Failed to mark task as complete', 'quillcrm'));
        }
    };

    const isEditableActivity = (activityType: string) => {
        const editableTypes = ['note', 'call_logged', 'meeting_scheduled'];
        return editableTypes.includes(activityType);
    };

    const getActivityIcon = (activityType: string) => {
        return activityTypeIcons[activityType] || <User className="w-4 h-4" />;
    };

    const formatActivityTime = (dateStr: string) => {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const date = dayjs.utc(dateStr).tz(userTimeZone);
        const now = dayjs();
        
        // Check if date is in the future or past
        const isFuture = date.isAfter(now);
        const diffDays = Math.abs(now.diff(date, 'day'));

        if (diffDays === 0) {
            return date.format('h:mm A');
        } else if (diffDays < 7) {
            if (isFuture) {
                // Future dates: "This Tuesday at 2:00 PM" or "Next Tuesday at 2:00 PM"
                const thisWeekEnd = now.endOf('week');
                if (date.isBefore(thisWeekEnd)) {
                    return `This ${date.format('dddd [at] h:mm A')}`;
                } else {
                    return `Next ${date.format('dddd [at] h:mm A')}`;
                }
            } else {
                // Past dates: "Last Tuesday at 2:00 PM"
                return `Last ${date.format('dddd [at] h:mm A')}`;
            }
        } else {
            return date.format('MMM D, YYYY [at] h:mm A');
        }
    };

    const renderActivityContent = (activity: EditableActivity) => {
        switch (activity.activity_type) {
            case 'note':
                return (
                    activity.data?.content && (
                        <div className="activity-note-content">
                            <p className="text-base font-normal text-[#777] leading-[26px]">
                                {activity.data.content}
                            </p>
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
                                            {__('Meeting Description', 'quillcrm')}
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
                        <div className="border border-[#DEE1E6] bg-[#DEE1E666] rounded-[8px] flex flex-col gap-4 py-4 px-2">
                            {activity.data.subject && (
                                <div>
                                    <h4 className="text-[#09090B] text-base font-medium">
                                        {__('Subject', 'quillcrm')}
                                    </h4>
                                    <p className="text-base font-normal text-[#777] leading-[26px]">
                                        {activity.data.subject}
                                    </p>
                                </div>
                            )}
                            {activity.data.body && (
                                <div>
                                    <h4 className="text-[#09090B] text-base font-medium">
                                        {__('Email Body', 'quillcrm')}
                                    </h4>
                                    <div
                                        className="text-base font-normal text-[#777] leading-[26px]"
                                        dangerouslySetInnerHTML={{ __html: activity.data.body }}
                                    />
                                </div>
                            )}
                            {!activity.data.subject && !activity.data.body && (
                                <p className="text-base font-normal text-[#777] leading-[26px]">
                                    {activity.formatted_message}
                                </p>
                            )}
                        </div>
                    )
                );

            case 'call_logged':
                return (
                    activity.data && (
                        <div className="border border-[#DEE1E6] bg-[#DEE1E666] rounded-[8px] flex flex-col gap-4 py-4 px-2">
                            <h4 className="text-[#09090B] text-base font-medium">
                                {__('Call Notes', 'quillcrm')}
                            </h4>
                            <p className="text-base font-normal text-[#777] leading-[26px]">
                                {activity.data.notes || __('No notes available', 'quillcrm')}
                            </p>
                        </div>
                    )
                );

            default:
                return (
                    <p className="text-base font-normal text-[#777] leading-[26px]">
                        {activity.formatted_message}
                    </p>
                );
        }
    };

    return (
        <div className="upcoming-activities-container">
            {/* Notice */}
            {notice && (
                <div className={`mb-4 p-3 rounded-md ${notice.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {notice.message}
                </div>
            )}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">
                    {__('Upcoming Activities', 'quillcrm')}
                </h2>
            </div>
            <div className="upcoming-activities-list mt-6">
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
                ) : timelineItems.length > 0 ? (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-dashed border-l-2 border-[#E5E7EB] border-dashed"></div>

                        <div className="space-y-0">
                            {timelineItems.map((item) => {
                                const isTask = item.type === 'task';
                                // Build editable activity from timeline item for dialog compatibility (only for activities)
                                const activityRecord = item.activity as Record<string, unknown> | undefined;
                                const activity: EditableActivity | null = isTask ? null : {
                                    id: item.activity_id ?? 0,
                                    contact_id: (activityRecord?.contact_id as number) ?? contact_id,
                                    activity_type: item.icon_type,
                                    data: (item.data ?? {}) as ActivityData,
                                    user_id: item.user?.id ?? 0,
                                    formatted_message: item.title || '',
                                    created_at: item.timestamp,
                                    updated_at: item.timestamp,
                                    user: item.user,
                                };
                                const itemId = isTask ? item.task_id : item.activity_id;

                                // For tasks, use due_date for display; for activities use scheduled date or timestamp
                                const displayDate = isTask && item.due_date
                                    ? item.due_date
                                    : (item.data as ActivityData)?.scheduled_at 
                                        || (item.data as ActivityData)?.called_at
                                        || item.timestamp;

                                return (
                                    <div
                                        key={item.id}
                                        className="activity-item relative pl-12 pb-8"
                                    >
                                        {/* Activity/Task Icon */}
                                        <div className="absolute p-1 left-0 top-0 w-9 h-9 rounded-full bg-[#FFF] flex items-center justify-center border border-[#DEE1E6]">
                                            {getActivityIcon(item.icon_type)}
                                        </div>

                                        {/* Activity/Task Content */}
                                        <div className="activity-content">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex justify-center gap-2">
                                                        {isTask ? <TaskDoneIcon color="#CB5301" /> : <MeetingActivityIcon />}
                                                        <p className="text-base font-normal text-[#777] border-r border-r-[#DEE1E6] pr-2">
                                                            {formatActivityTime(displayDate)}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-center gap-2">
                                                        <UserActivityIcon />
                                                        <p className="text-base font-normal text-[#777]">
                                                            {contact?.first_name} {contact?.last_name}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Actions */}
                                                <div className="flex items-center gap-5">
                                                    {!isTask && activity && isEditableActivity(item.icon_type) && (
                                                        <ActivityActionsDropdown
                                                            onEdit={() => handleEditActivity(activity)}
                                                            onDelete={() => handleDeleteActivity(itemId!)}
                                                        />
                                                    )}
                                                    {isTask && (
                                                        <>
                                                            <ActivityActionsDropdown
                                                                onEdit={() => {}} // Task editing requires Pro dialog
                                                                onDelete={() => handleDeleteTask(item.task_id!)}
                                                            />
                                                            {item.status !== 'completed' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleMarkTaskComplete(item.task_id!)}
                                                                    className="flex items-center gap-2 text-[#16A34A]"
                                                                >
                                                                    <CheckCircleIcon width={16} height={16} />
                                                                    {__('Mark Complete', 'quillcrm')}
                                                                </Button>
                                                            )}
                                                            {item.status && (
                                                                <Badge className="text-xs">
                                                                    {item.status}
                                                                </Badge>
                                                            )}
                                                            {item.priority && (
                                                                <Badge className="text-xs ml-2">
                                                                    {item.priority}
                                                                </Badge>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Activity/Task Description */}
                                            <div className="activity-body">
                                                <p className="text-base text-[#09090B] mb-3 font-medium">
                                                    {isTask ? item.title : (activity?.formatted_message || item.title)}
                                                </p>

                                                {/* Task-specific content */}
                                                {isTask && item.description && (
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        {item.description}
                                                    </p>
                                                )}

                                                {isTask && item.due_date && (
                                                    <p className="text-xs text-gray-600">
                                                        {__('Due', 'quillcrm')}: {item.due_date} {item.due_time}
                                                    </p>
                                                )}

                                                {/* Activity-specific content */}
                                                {!isTask && activity && renderActivityContent(activity)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <NoData
                        icon={<GradientUpcomingActivitiesIcon />}
                        title={__('No upcoming activities found yet', 'quillcrm')}
                        subtitle={__('No upcoming activities yet—this space is ready for your next move, Add emails, notes, or tasks to stay connected and organized.', 'quillcrm')}
                    />
                )}
            </div>

            {/* Note Dialog */}
            <NoteDialog
                open={noteDialogOpen}
                onClose={() => {
                    setNoteDialogOpen(false);
                    setSelectedNote(null);
                }}
                contact_id={contact_id}
                selectedNote={selectedNote}
                onSave={handleNoteSave}
                onUpdate={handleNoteUpdate}
                showNotice={showNotice}
            />

            {/* Call Dialog */}
            {selectedCall && (
                <CallDialog
                    open={callDialogOpen}
                    onClose={() => {
                        setCallDialogOpen(false);
                        setSelectedCall(null);
                    }}
                    contact_id={contact_id}
                    selectedCall={{
                        id: selectedCall.id,
                        contact_id: selectedCall.contact_id,
                        activity_type: selectedCall.activity_type,
                        data: {
                            phone_number: selectedCall.data?.phone_number,
                            duration: selectedCall.data?.duration,
                            outcome: selectedCall.data?.outcome,
                            notes: selectedCall.data?.notes,
                            called_at: selectedCall.data?.called_at,
                        },
                        created_at: selectedCall.created_at,
                        updated_at: selectedCall.updated_at,
                    }}
                    onSave={() => {
                        fetchUpcomingActivities();
                    }}
                    onUpdate={() => {
                        fetchUpcomingActivities();
                    }}
                    showNotice={showNotice}
                />
            )}

            {/* Meeting Dialog */}
            {selectedMeeting && (
                <MeetingDialog
                    open={meetingDialogOpen}
                    onClose={() => {
                        setMeetingDialogOpen(false);
                        setSelectedMeeting(null);
                    }}
                    contact_id={contact_id}
                    selectedMeeting={{
                        id: selectedMeeting.id,
                        contact_id: selectedMeeting.contact_id,
                        activity_type: selectedMeeting.activity_type,
                        data: {
                            meeting_title: selectedMeeting.data?.meeting_title,
                            duration: selectedMeeting.data?.duration,
                            location: selectedMeeting.data?.location,
                            meeting_date_time: selectedMeeting.data?.meeting_date_time,
                            meeting_end_time: selectedMeeting.data?.meeting_end_time,
                            description: selectedMeeting.data?.description,
                        },
                        created_at: selectedMeeting.created_at,
                        updated_at: selectedMeeting.updated_at,
                    }}
                    onSave={() => {
                        fetchUpcomingActivities();
                    }}
                    onUpdate={() => {
                        fetchUpcomingActivities();
                    }}
                    showNotice={showNotice}
                />
            )}
        </div>
    );
};

export default UpcomingActivities;
