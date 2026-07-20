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

/**
 * Internal dependencies
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActivitiesService, transformApiItemsToTimeline, TimelineItem } from '@doublescale/services/activities-service';
import { NoData, TaskDoneIcon, GradientUpcomingActivitiesIcon, NoteAddIcon, EditHeaderIcon, DealValueIcon, MeetingActivityIcon, UserActivityIcon, StartDateIcon, DurationIcon, LocationIcon, CallActivityIcon, EmailActivityIcon, CheckCircleIcon } from '@doublescale/components';
import { ActivityActionsDropdown } from '../activities/activity-action-dropdown';
import { useActivityOperations } from '@doublescale/hooks/use-activity-operations';
import { useContactContext } from '../state/context';
import NoteDialog from '../notes/note-dialog';
import CallDialog from '../calls/call-dialog';
import MeetingDialog from '../meetings/meeting-dialog';
import type { Note } from '@doublescale/client';
import ConfigAPI from '@doublescale/config';

interface UpcomingActivitiesProps {
    contact_id?: number;
    entity_type?: string | number;
    entity_id?: number;
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
    scheduled_at?: string;
    meeting_date_time?: string;
    meeting_end_time?: string;
    description?: string;
    start_date?: string;
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
// Pro plugin registers this via addFilter('doublescale_pro_component', ...)
const getProTaskService = () => applyFilters('doublescale_pro_component', null, 'TaskService') as any;

const UpcomingActivities: React.FC<UpcomingActivitiesProps> = ({ contact_id, entity_type, entity_id }) => {
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

    const fetchUpcomingActivities = async () => {
        if (!contact_id && !entity_id) return;

        setLoading(true);
        try {
            // Dedicated upcoming endpoint - backend handles date filtering
            // (today onward) and sort order (ascending, nearest first).
            const response = await ActivitiesService.getUpcoming({
                contact_id,
                entity_type,
                entity_id,
                per_page: 100,
                page: 1,
            });

            if (response && response.data) {
                // Transform using service utility
                const timelineItems = transformApiItemsToTimeline(response.data).filter(
                    (item) => item.type !== 'task' && item.icon_type !== 'task_event'
                );
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
    }, [contact_id, entity_id]);

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
        if (!window.confirm(__('Are you sure you want to delete this activity? This action cannot be undone.', 'doublescale'))) {
            return;
        }

        try {
            await deleteActivity(activityId);
            fetchUpcomingActivities();
            showNotice('success', __('Activity deleted successfully', 'doublescale'));
        } catch (error) {
            console.error('Failed to delete activity:', error);
            showNotice('error', __('Failed to delete activity', 'doublescale'));
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!ConfigAPI.isModuleEnabled('tasks')) {
            return;
        }
        if (!window.confirm(__('Are you sure you want to delete this task? This action cannot be undone.', 'doublescale'))) {
            return;
        }
        try {
            const TaskService = getProTaskService();
            if (!TaskService) {
                showNotice('error', __('Task deletion requires Pro plugin.', 'doublescale'));
                return;
            }
            await TaskService.deleteTask(taskId);
            fetchUpcomingActivities();
            showNotice('success', __('Task deleted successfully', 'doublescale'));
        } catch (error) {
            console.error('Failed to delete task:', error);
            showNotice('error', __('Failed to delete task', 'doublescale'));
        }
    };

    const handleMarkTaskComplete = async (taskId: number) => {
        if (!ConfigAPI.isModuleEnabled('tasks')) {
            return;
        }
        try {
            const TaskService = getProTaskService();
            if (!TaskService) {
                showNotice('error', __('Task updates require Pro plugin.', 'doublescale'));
                return;
            }
            await TaskService.markCompleted(taskId);
            fetchUpcomingActivities();
            showNotice('success', __('Task marked as complete', 'doublescale'));
        } catch (error) {
            console.error('Failed to mark task as complete:', error);
            showNotice('error', __('Failed to mark task as complete', 'doublescale'));
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
        return date.format('MMM D, YYYY [at] h:mm A');
    };

    const renderActivityContent = (activity: EditableActivity) => {
        switch (activity.activity_type) {
            case 'note':
                return (
                    activity.data?.content && (
                        <div className="activity-note-content">
                            <p className="text-base font-normal text-muted-foreground leading-[26px]">
                                {activity.data.content}
                            </p>
                        </div>
                    )
                );

            case 'meeting_scheduled':
                return (
                    activity.data && (
                        <div className="activity-meeting-content flex max-sm:flex-col max-sm:justify-center max-sm:items-center gap-4 py-4 px-2 border border-border/60 bg-[#DEE1E666] rounded-lg">
                            <div className="meeting-date-card h-full flex flex-row sm:flex-col items-center justify-center text-center sm:border-r border-r-[#DEE1E6] pr-3 py-3 px-4 gap-2">
                                <div className=" text-foreground text-xl text-center font-semibold leading-[30px]">
                                    {new Date(
                                        activity.data.scheduled_at ||
                                        activity.created_at
                                    ).getDate()}
                                </div>
                                <div className=" text-foreground text-base text-center font-normal leading-[26px]">
                                    {format(
                                        new Date(
                                            activity.data.scheduled_at ||
                                            activity.created_at
                                        ),
                                        'MMM'
                                    )}
                                </div>
                            </div>
                            <div className=" flex flex-col gap-3">
                                <div className="flex max-sm:flex-col max-sm:justify-center max-sm:items-center gap-6 items-center">
                                    {activity.data.scheduled_at && (
                                        <div className="flex justify-center gap-2 sm:border-r border-r-[#DEE1E6] font-medium text-muted-foreground pr-4">
                                            <StartDateIcon />
                                            <span>
                                                {__('Start Date', 'doublescale')}:
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
                                        <div className="flex justify-center gap-2 sm:border-r border-r-[#DEE1E6] font-medium text-muted-foreground pr-4">
                                            <LocationIcon />
                                            <span>
                                                {__('Location', 'doublescale')}:{' '}
                                                <span className=" text-[#CB5301] text-base font-semibold">
                                                    {activity.data.location}
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                    {activity.data.duration && (
                                        <div className="flex justify-center gap-2  font-medium text-muted-foreground">
                                            <DurationIcon />
                                            <span>
                                                {__('Duration', 'doublescale')}:{' '}
                                                <span className=" text-[#CB5301] text-base font-semibold">
                                                    {activity.data.duration}{' '}
                                                    {__('minutes', 'doublescale')}
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {activity.data.description && (
                                    <div className="flex flex-col gap-2  ">
                                        <h4 className="text-foreground  text-base font-medium">
                                            {__('Meeting Description', 'doublescale')}
                                        </h4>
                                        <p className=" text-base font-normal text-muted-foreground leading-[26px]">
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
                        <div className="border border-border/60 bg-[#DEE1E666] rounded-lg flex flex-col gap-4 py-4 px-2">
                            {activity.data.subject && (
                                <div>
                                    <h4 className="text-foreground text-base font-medium">
                                        {__('Subject', 'doublescale')}
                                    </h4>
                                    <p className="text-base font-normal text-muted-foreground leading-[26px]">
                                        {activity.data.subject}
                                    </p>
                                </div>
                            )}
                            {activity.data.body && (
                                <div>
                                    <h4 className="text-foreground text-base font-medium">
                                        {__('Email Body', 'doublescale')}
                                    </h4>
                                    <div
                                        className="text-base font-normal text-muted-foreground leading-[26px]"
                                        dangerouslySetInnerHTML={{ __html: activity.data.body }}
                                    />
                                </div>
                            )}
                            {!activity.data.subject && !activity.data.body && (
                                <p className="text-base font-normal text-muted-foreground leading-[26px]">
                                    {activity.formatted_message}
                                </p>
                            )}
                        </div>
                    )
                );

            case 'call_logged':
                return (
                    activity.data && (
                        <div className="border border-border/60 bg-[#DEE1E666] rounded-lg flex flex-col gap-4 py-4 px-2">
                            <h4 className="text-foreground text-base font-medium">
                                {__('Call Notes', 'doublescale')}
                            </h4>
                            <p className="text-base font-normal text-muted-foreground leading-[26px]">
                                {activity.data.notes || __('No notes available', 'doublescale')}
                            </p>
                        </div>
                    )
                );

            default:
                return (
                    <p className="text-base font-normal text-muted-foreground leading-[26px]">
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
                    {__('Upcoming Activities', 'doublescale')}
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
                                        <div className="absolute p-1 left-0 top-0 w-9 h-9 rounded-full bg-card flex items-center justify-center border border-border/60">
                                            {getActivityIcon(item.icon_type)}
                                        </div>

                                        {/* Activity/Task Content */}
                                        <div className="activity-content">
                                            {/* Header */}
                                            <div className="flex items-center flex-wrap gap-y-2 justify-between mb-2">
                                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                                    <div className="flex justify-center gap-2">
                                                        {isTask ? <TaskDoneIcon /> : <MeetingActivityIcon />}
                                                        <p className="text-base font-normal text-muted-foreground sm:border-r border-r-[#DEE1E6] pr-2">
                                                            {formatActivityTime(displayDate)}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-center gap-2">
                                                        <UserActivityIcon />
                                                        <p className="text-base font-normal text-muted-foreground">
                                                            {contact?.first_name} {contact?.last_name}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Actions */}
                                                <div className="flex max-sm:flex-col max-sm:items-start items-center gap-5">
                                                    {!isTask && activity && isEditableActivity(item.icon_type) && (
                                                        <ActivityActionsDropdown
                                                            onEdit={() => handleEditActivity(activity)}
                                                            onDelete={() => handleDeleteActivity(itemId!)}
                                                        />
                                                    )}
                                                    {!isTask && item.display_status && (
                                                        <Badge
                                                            className={cn(
                                                                "text-xs",
                                                                item.display_status === 'upcoming' && "bg-blue-100 text-blue-800 hover:bg-blue-100",
                                                                item.display_status === 'due_today' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                                                                item.display_status === 'completed' && "bg-green-100 text-green-800 hover:bg-green-100"
                                                            )}
                                                        >
                                                            {item.display_status === 'due_today'
                                                                ? __('Due Today', 'doublescale')
                                                                : item.display_status === 'upcoming'
                                                                ? __('Upcoming', 'doublescale')
                                                                : __('Completed', 'doublescale')
                                                            }
                                                        </Badge>
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
                                                                    {__('Mark Complete', 'doublescale')}
                                                                </Button>
                                                            )}
                                                            {item.status && (
                                                                <Badge className="text-xs">
                                                                    {item.status}
                                                                </Badge>
                                                            )}
                                                            {item.priority && (
                                                                <Badge className="text-xs">
                                                                    {item.priority}
                                                                </Badge>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Activity/Task Description */}
                                            <div className="activity-body">
                                                <p className="text-base text-foreground mb-3 font-medium">
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
                                                        {__('Due', 'doublescale')}: {item.due_date} {item.due_time}
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
                        title={__('No upcoming activities found yet', 'doublescale')}
                        subtitle={__('No upcoming activities yet—this space is ready for your next move, Add emails, notes, or tasks to stay connected and organized.', 'doublescale')}
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
                contact_id={contact_id ?? 0}
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
                    contact_id={contact_id ?? 0}
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
                    contact_id={contact_id ?? 0}
                    selectedMeeting={{
                        id: selectedMeeting.id,
                        contact_id: selectedMeeting.contact_id,
                        activity_type: selectedMeeting.activity_type,
                        data: {
                            meeting_title: selectedMeeting.data?.meeting_title || selectedMeeting.data?.title,
                            duration: selectedMeeting.data?.duration,
                            location: selectedMeeting.data?.location,
                            meeting_date_time: selectedMeeting.data?.meeting_date_time || selectedMeeting.data?.scheduled_at,
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
