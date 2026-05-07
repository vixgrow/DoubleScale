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
import { User, ArrowRight, Badge } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

/**
 * Internal dependencies
 */
import ActivitiesFilters from './ActivitiesFilters';
import {
    ActivitiesService,
    ACTIVITY_TYPES,
    type TimelineItem,
} from '@doublescale/services/activities-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import './style.scss';
import { NoData, TaskDoneIcon, GradientActivitiesIcon, NoteAddIcon, EditHeaderIcon, DealValueIcon, MeetingActivityIcon, UserActivityIcon, StartDateIcon, DurationIcon, LocationIcon, CallActivityIcon, EmailActivityIcon, CheckCircleIcon } from '@doublescale/components';
import { ActivityActionsDropdown } from './activity-action-dropdown';
import { useActivityOperations } from '@doublescale/hooks/use-activity-operations';
import { useContactContext } from '../state/context';
import NoteDialog from '../notes/note-dialog';
import CallDialog from '../calls/call-dialog';
import MeetingDialog from '../meetings/meeting-dialog';
import type { Note } from '@doublescale/client';

// Pro plugin components - loaded via WordPress filters at runtime
// Pro plugin registers these via addFilter('doublescale_pro_component', ...)
const getProTaskDialog = () => applyFilters('doublescale_pro_component', null, 'TaskDialog') as React.ComponentType<any> | null;
const getProTaskService = () => applyFilters('doublescale_pro_component', null, 'TaskService') as any;


interface ActivitiesProps {
    contact_id: number;
}

interface Activity {
    id: number;
    contact_id: number;
    activity_type: string;
    data: any;
    user_id: number;
    formatted_message: string;
    created_at: string;
    updated_at?: string;
    user?: {
        id: number;
        display_name: string;
    };
    comments?: any[];
}

// TimelineItem is imported from activities-service (includes activity field)

const activityTypeIcons: Record<string, React.ReactNode> = {
    created: <UserActivityIcon color="#3B82F6" />,
    stage_changed: <ArrowRight className="w-4 h-4" />,
    value_changed: <DealValueIcon color="#F97316" />,
    status_changed: <EditHeaderIcon />,
    note: <NoteAddIcon />,
    email_sent: <EmailActivityIcon />,
    call_logged: <CallActivityIcon width={16} height={16} />,
    meeting_scheduled: <MeetingActivityIcon color="#CB5301" />,
    // Task types
    task: <TaskDoneIcon color="#CB5301" />,
    call: <CallActivityIcon width={16} height={16} />,
    email: <EmailActivityIcon />,
    meeting: <MeetingActivityIcon color="#CB5301" />,
    todo: <TaskDoneIcon color="#CB5301" />,
    follow_up: <TaskDoneIcon color="#CB5301" />,
};

const activityTypeColors: Record<string, string> = {
    created: '#3B82F6',
    stage_changed: '#8B5CF6',
    value_changed: '#F97316',
    status_changed: '#06B6D4',
    note: '#458DC7',
    email_sent: '#16A34A',
    call_logged: '#660FF1',
    meeting_scheduled: '#CB5301',
    // Task types
    task: '#CB5301',
    call: '#660FF1',
    email: '#16A34A',
    meeting: '#CB5301',
    todo: '#CB5301',
    follow_up: '#F59E0B',
};

// Task Dialog Wrapper Component - uses Pro plugin components via WordPress filters
const TaskDialogWrapper: React.FC<{
    open: boolean;
    onClose: (open: boolean) => void;
    task: any;
    contact_id: number;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
    onSuccess: () => void;
    showNotice: (type: 'success' | 'error', message: string) => void;
}> = ({ open, onClose, task, contact_id, isSubmitting, setIsSubmitting, onSuccess, showNotice }) => {
    // Get Pro components via WordPress filters (registered by Pro plugin at runtime)
    const TaskDialog = getProTaskDialog();
    const TaskService = getProTaskService();

    if (!TaskDialog || !TaskService) {
        return null;
    }

    return (
        <TaskDialog
            open={open}
            onClose={onClose}
            mode="edit"
            task={task}
            presetContactId={contact_id}
            isSubmitting={isSubmitting}
            onSubmit={async (data: any) => {
                setIsSubmitting(true);
                try {
                    await TaskService.updateTask(task.id, data);
                    showNotice('success', __('Task updated successfully', 'doublescale'));
                    onClose(false);
                    onSuccess();
                } catch (error: any) {
                    showNotice('error', error?.message || __('Failed to update task', 'doublescale'));
                } finally {
                    setIsSubmitting(false);
                }
            }}
        />
    );
};

const Activities: React.FC<ActivitiesProps> = ({ contact_id }) => {
    const { deleteActivity } = useActivityOperations();
    const { contact } = useContactContext();
    const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal states for editing
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState<Activity | null>(null);
    const [callDialogOpen, setCallDialogOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Activity | null>(null);
    const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [filters, setFilters] = useState({
        sort_by: 'activity_date',
        sort_order: 'desc',
        date_from: '',
        date_to: '',
    });


    const fetchActivities = async () => {
        if (!contact_id) return;

        setLoading(true);
        try {
            const { response, items: serviceItems } = await ActivitiesService.fetch({
                contact_id,
                per_page: 100,
                page: 1,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
            });

            if (response && response.data) {
                // Items already include activity data from service transformer
                setTimelineItems(serviceItems);
            } else {
                setTimelineItems([]);
            }
        } catch (error) {
            console.error('Failed to fetch timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch activities when component mounts or contact_id changes
    useEffect(() => {
        fetchActivities();
    }, [contact_id]);

    // Auto-apply filters when date range changes
    useEffect(() => {
        // Only fetch if contact_id is available and we're not in initial mount
        // The initial mount is handled by the contact_id useEffect
        if (contact_id) {
            fetchActivities();
        }
    }, [filters.date_from, filters.date_to]);

    // Edit/Delete handlers
    const handleEditActivity = async (activity: Activity) => {
        if (activity.activity_type === 'note') {
            // Convert Activity to Note format
            // Note: The activity data structure may have 'content' for the note body
            // and may or may not have a 'title' field
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
            // Convert Activity to Call format for CallDialog
            setSelectedCall(activity);
            setCallDialogOpen(true);
        } else if (activity.activity_type === 'meeting_scheduled') {
            // Convert Activity to Meeting format for MeetingDialog
            setSelectedMeeting(activity);
            setMeetingDialogOpen(true);
        }
        // Tasks are handled separately via handleEditTask
    };

    const handleEditTask = async (taskId: number) => {
        try {
            const TaskService = getProTaskService();
            if (!TaskService) {
                showNotice('error', __('Task editing is not available. Pro plugin may not be installed.', 'doublescale'));
                return;
            }
            const task = await TaskService.getTask(taskId);
            setSelectedTask(task);
            setTaskDialogOpen(true);
        } catch (error) {
            console.error('Failed to fetch task:', error);
            showNotice('error', __('Failed to load task', 'doublescale'));
        }
    };

    const handleNoteSave = (note: Note) => {
        // Note was created, refresh activities
        fetchActivities();
    };

    const handleNoteUpdate = (note: Note) => {
        // Note was updated, refresh activities
        fetchActivities();
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
            fetchActivities();
        } catch (error) {
            console.error('Failed to delete activity:', error);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
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
            fetchActivities();
            showNotice('success', __('Task deleted successfully', 'doublescale'));
        } catch (error) {
            console.error('Failed to delete task:', error);
            showNotice('error', __('Failed to delete task', 'doublescale'));
        }
    };

    const handleMarkTaskComplete = async (taskId: number) => {
        try {
            await apiFetch({
                path: `/doublescale/v1/tasks/${taskId}`,
                method: 'PATCH',
                data: {
                    status: 'completed',
                },
            });
            fetchActivities();
            showNotice('success', __('Task marked as complete', 'doublescale'));
        } catch (error) {
            console.error('Failed to mark task as complete:', error);
            showNotice('error', __('Failed to mark task as complete', 'doublescale'));
        }
    };

    const isEditableActivity = (activityType: string) => {
        // Only these activity types can be edited (matches PHP Activity_Types::get_editable_types())
        const editableTypes: string[] = [
            ACTIVITY_TYPES.NOTE,
            ACTIVITY_TYPES.EMAIL_SENT,
            ACTIVITY_TYPES.CALL_LOGGED,
            ACTIVITY_TYPES.MEETING_SCHEDULED,
        ];
        return editableTypes.includes(activityType);
    };

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
        return date.format('MMM D, YYYY [at] h:mm A');
    };

    const renderActivityContent = (activity: Activity) => {
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
                                        activity.data.scheduled_at ||
                                        activity.created_at
                                    ).getDate()}
                                </div>
                                <div className=" text-[#09090B] text-base text-center font-normal leading-[26px]">
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
                                <div className="flex gap-6 items-center">
                                    {activity.data.scheduled_at && (
                                        <div className="flex justify-center gap-2 border-r border-r-[#DEE1E6] font-medium text-[#777] pr-4">
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
                                        <div className="flex justify-center gap-2 border-r border-r-[#DEE1E6] font-medium text-[#777] pr-4">
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
                                        <div className="flex justify-center gap-2  font-medium text-[#777]">
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
                                        <h4 className="text-[#09090B]  text-base font-medium">
                                            {__('Meeting Description', 'doublescale')}
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
                                        {__('Subject', 'doublescale')}
                                    </h4>
                                    <p className="text-base font-normal text-[#777] leading-[26px]">
                                        {activity.data.subject}
                                    </p>
                                </div>
                            )}
                            {activity.data.body && (
                                <div>
                                    <h4 className="text-[#09090B] text-base font-medium">
                                        {__('Email Body', 'doublescale')}
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
                                {__('Call Notes', 'doublescale')}
                            </h4>
                            <p className="text-base font-normal text-[#777] leading-[26px]">
                                {activity.data.notes || __('No notes available', 'doublescale')}
                            </p>
                        </div>
                    )
                );
            case 'value_changed':
                return (
                    activity.data && (
                        <div className="activity-value-content flex items-center gap-2 text-base text-[#09090B]">
                            <span>
                                {__('Value changed from', 'doublescale')}
                            </span>
                            <span className="line-through text-[#6B7280]">
                                {activity.data.old_value}
                            </span>
                            <span>{__('to', 'doublescale')}</span>
                            <span className="font-semibold text-[#09090B]">
                                {activity.data.new_value}
                            </span>
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
        <div className="activity-container">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">
                    {__('Activities', 'doublescale')}
                </h2>
                <ActivitiesFilters
                    filters={filters}
                    onDateChange={(from, to) =>
                        setFilters((prev) => ({
                            ...prev,
                            date_from: from,
                            date_to: to,
                        }))
                    }
                />
            </div>
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
                ) : timelineItems.length > 0 ? (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-dashed border-l-2 border-[#E5E7EB] border-dashed"></div>

                        <div className="space-y-0">
                            {timelineItems.map((item) => {
                                const isTask = item.type === 'task';
                                // Use stored activity if available, otherwise construct it
                                const activity: Activity | null = isTask ? null : {
                                    id: item.activity_id ?? 0,
                                    contact_id: (item.activity as Record<string, unknown>)?.contact_id as number ?? 0,
                                    activity_type: item.icon_type,
                                    data: item.data,
                                    user_id: item.user?.id ?? 0,
                                    formatted_message: item.title || '',
                                    created_at: item.timestamp,
                                    updated_at: item.timestamp,
                                    user: item.user,
                                };
                                const itemId = isTask ? item.task_id : item.activity_id;

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
                                                        <MeetingActivityIcon />
                                                        <p className="text-base font-normal text-[#777] border-r border-r-[#DEE1E6] pr-2">
                                                            {formatActivityTime(item.timestamp)}
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
                                                                onEdit={() => handleEditTask(item.task_id!)}
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
                        icon={<GradientActivitiesIcon />}
                        title={__('No activities found—this space is ready for your next action.', 'doublescale')}
                        subtitle={__('Use it to add emails, notes, or tasks that keep your contact flow organized and proactive.', 'doublescale')}
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
                        fetchActivities();
                    }}
                    onUpdate={() => {
                        fetchActivities();
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
                        fetchActivities();
                    }}
                    onUpdate={() => {
                        fetchActivities();
                    }}
                    showNotice={showNotice}
                />
            )}

            {/* Task Dialog (Pro plugin) */}
            {selectedTask && <TaskDialogWrapper
                open={taskDialogOpen}
                onClose={(open: boolean) => {
                    setTaskDialogOpen(open);
                    if (!open) {
                        setSelectedTask(null);
                    }
                }}
                task={selectedTask}
                contact_id={contact_id}
                isSubmitting={isSubmittingTask}
                setIsSubmitting={setIsSubmittingTask}
                onSuccess={() => {
                    fetchActivities();
                }}
                showNotice={showNotice}
            />}
        </div>
    );
};

export default Activities;
