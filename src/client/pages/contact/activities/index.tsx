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
import { User, ArrowRight, Eye, MousePointerClick, Globe, XCircle, RotateCw, Clock, Ban } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import './style.scss';
import { NoData, TaskDoneIcon, GradientActivitiesIcon, NoteAddIcon, EditHeaderIcon, DealValueIcon, MeetingActivityIcon, UserActivityIcon, StartDateIcon, DurationIcon, LocationIcon, CallActivityIcon, EmailActivityIcon, CheckCircleIcon, SMSIcon, WhatsAppIcon } from '@doublescale/components';
import { ActivityActionsDropdown, EmailActivityActionsDropdown } from './activity-action-dropdown';
import { useActivityOperations } from '@doublescale/hooks/use-activity-operations';
import NoteDialog from '../notes/note-dialog';
import CallDialog from '../calls/call-dialog';
import MeetingDialog from '../meetings/meeting-dialog';
import EmailDetails from '../emails/email-details-dialog';
import type { CampaignEmail, Note } from '@doublescale/client';
import { isManualEmailLog } from '@doublescale/utils/email-activity';
import { fetchContactEmailByActivityId } from '@doublescale/utils/fetch-contact-email-by-activity';

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
    created: <UserActivityIcon color="hsl(var(--primary))" />,
    stage_changed: <ArrowRight className="h-4 w-4 text-primary" />,
    value_changed: <DealValueIcon color="#F97316" />,
    status_changed: <EditHeaderIcon />,
    note: <NoteAddIcon />,
    email_sent: <EmailActivityIcon />,
    email_received: <EmailActivityIcon />,
    call_logged: <CallActivityIcon width={16} height={16} />,
    meeting_scheduled: <MeetingActivityIcon color="#CB5301" />,
    sms_sent: <SMSIcon />,
    sms_received: <SMSIcon />,
    whatsapp_sent: <WhatsAppIcon />,
    whatsapp_received: <WhatsAppIcon />,
    // Tracking types
    email_opened: <Eye className="w-4 h-4" />,
    email_clicked: <MousePointerClick className="w-4 h-4" />,
    sms_clicked: <MousePointerClick className="w-4 h-4" />,
    whatsapp_clicked: <MousePointerClick className="w-4 h-4" />,
    page_visited: <Globe className="w-4 h-4" />,
    // Booking lifecycle types
    booking_scheduled: <MeetingActivityIcon color="#CB5301" />,
    booking_confirmed: <CheckCircleIcon />,
    booking_pending: <Clock className="w-4 h-4" />,
    booking_rescheduled: <RotateCw className="w-4 h-4" />,
    booking_cancelled: <XCircle className="w-4 h-4" />,
    booking_completed: <CheckCircleIcon />,
    booking_rejected: <Ban className="w-4 h-4" />,
    // Task types
    task: <TaskDoneIcon color="#CB5301" />,
    call: <CallActivityIcon width={16} height={16} />,
    email: <EmailActivityIcon />,
    meeting: <MeetingActivityIcon color="#CB5301" />,
    todo: <TaskDoneIcon color="#CB5301" />,
    follow_up: <TaskDoneIcon color="#CB5301" />,
};

/** Matches deal pipeline activity timeline badge tokens */
const activityBadgeClass: Record<string, string> = {
    created: 'border-primary/40 bg-primary/10 text-primary',
    stage_changed: 'border-primary/40 bg-primary/10 text-primary',
    value_changed:
        'border-orange-500/40 bg-orange-500/10 text-orange-900 dark:text-orange-100',
    status_changed:
        'border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100',
    note: 'border-primary/40 bg-primary/10 text-primary',
    email_sent:
        'border-emerald-600/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    email_received:
        'border-emerald-600/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    call_logged: 'border-primary/40 bg-primary/10 text-primary',
    meeting_scheduled:
        'border-amber-600/35 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    sms_sent: 'border-violet-500/40 bg-violet-500/10 text-violet-900 dark:text-violet-100',
    sms_received:
        'border-violet-500/40 bg-violet-500/10 text-violet-900 dark:text-violet-100',
    whatsapp_sent:
        'border-emerald-600/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    whatsapp_received:
        'border-emerald-600/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    email_opened: 'border-primary/40 bg-primary/10 text-primary',
    email_clicked: 'border-primary/40 bg-primary/10 text-primary',
    sms_clicked:
        'border-violet-500/40 bg-violet-500/10 text-violet-900 dark:text-violet-100',
    whatsapp_clicked:
        'border-emerald-600/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    page_visited:
        'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    booking_scheduled:
        'border-amber-600/35 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    booking_confirmed:
        'border-emerald-600/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    booking_pending:
        'border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100',
    booking_rescheduled:
        'border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100',
    booking_cancelled:
        'border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100',
    booking_completed:
        'border-emerald-600/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    booking_rejected:
        'border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100',
    task: 'border-border bg-muted/70 text-foreground',
    call: 'border-primary/40 bg-primary/10 text-primary',
    email:
        'border-emerald-600/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    meeting:
        'border-amber-600/35 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    todo: 'border-border bg-muted/70 text-foreground',
    follow_up:
        'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
};

const getActivityBadgeClass = (activityType: string) =>
    activityBadgeClass[activityType] ??
    'border-border/60 bg-muted/50 text-muted-foreground';

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
            nestedModal={true}
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
    const [selectedCampaignEmail, setSelectedCampaignEmail] = useState<CampaignEmail | null>(null);
    const [isLoadingEmailAction, setIsLoadingEmailAction] = useState(false);
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
            const { items: serviceItems } = await ActivitiesService.fetch({
                contact_id,
                per_page: 100,
                page: 1,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
            });

            setTimelineItems(
                serviceItems.filter(
                    (item) =>
                        item.type !== 'task' && item.icon_type !== 'task_event'
                )
            );
        } catch (error) {
            console.error('Failed to fetch timeline:', error);
            setTimelineItems([]);
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

    const handleOpenEmailActivity = async (activity: Activity) => {
        if (isLoadingEmailAction) {
            return;
        }

        setIsLoadingEmailAction(true);
        try {
            const email = await fetchContactEmailByActivityId(contact_id, activity.id);
            if (!email) {
                showNotice('error', __('Email details could not be loaded', 'doublescale'));
                return;
            }
            setSelectedCampaignEmail(email);
        } catch (error) {
            console.error('Failed to load email:', error);
            showNotice('error', __('Failed to load email', 'doublescale'));
        } finally {
            setIsLoadingEmailAction(false);
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

    const isEditableActivity = (activityType: string, data?: Record<string, unknown>) => {
        if (activityType === ACTIVITY_TYPES.EMAIL_SENT) {
            return isManualEmailLog(data);
        }

        const editableTypes: string[] = [
            ACTIVITY_TYPES.NOTE,
            ACTIVITY_TYPES.CALL_LOGGED,
            ACTIVITY_TYPES.MEETING_SCHEDULED,
        ];
        return editableTypes.includes(activityType);
    };

    const isCrmSentEmailActivity = (activity: Activity) =>
        activity.activity_type === ACTIVITY_TYPES.EMAIL_SENT &&
        !isManualEmailLog(activity.data);

    const getActivityIcon = (activityType: string) => {
        return activityTypeIcons[activityType] || <User className="w-4 h-4" />;
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
                            <p className="text-sm leading-snug text-muted-foreground">
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

            case 'sms_sent':
            case 'sms_received':
            case 'whatsapp_sent':
            case 'whatsapp_received':
                return (
                    activity.data && (
                        <div className="border border-border/60 bg-[#DEE1E666] rounded-lg flex flex-col gap-4 py-4 px-2">
                            {activity.data.to && (
                                <div>
                                    <h4 className="text-foreground text-base font-medium">
                                        {__('To', 'doublescale')}
                                    </h4>
                                    <p className="text-base font-normal text-muted-foreground leading-[26px]">
                                        {activity.data.to}
                                    </p>
                                </div>
                            )}
                            {activity.data.body && (
                                <div>
                                    <h4 className="text-foreground text-base font-medium">
                                        {__('Message', 'doublescale')}
                                    </h4>
                                    <p className="text-base font-normal text-muted-foreground leading-[26px]">
                                        {activity.data.body}
                                    </p>
                                </div>
                            )}
                            {!activity.data.body && (
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
            case 'email_opened':
            case 'email_clicked':
            case 'sms_clicked':
            case 'whatsapp_clicked':
                return (
                    activity.data?.campaign_name ? (
                        <div className="border border-border/60 bg-[#DEE1E666] rounded-lg flex flex-col gap-2 py-3 px-3">
                            <p className="text-sm text-muted-foreground">
                                {__('Campaign', 'doublescale')}: <span className="font-medium text-foreground">{activity.data.campaign_name as string}</span>
                            </p>
                        </div>
                    ) : null
                );

            case 'booking_scheduled':
            case 'booking_confirmed':
            case 'booking_pending':
            case 'booking_rescheduled':
            case 'booking_cancelled':
            case 'booking_completed':
            case 'booking_rejected':
                return (
                    activity.data && (
                        <div className="border border-border/60 bg-[#DEE1E666] rounded-lg flex flex-col gap-3 py-4 px-3">
                            <div className="flex flex-wrap gap-4 items-center">
                                {activity.data.event_name && (
                                    <div className="flex gap-2 items-center font-medium text-foreground">
                                        <MeetingActivityIcon color="#CB5301" />
                                        <span>{activity.data.event_name as string}</span>
                                    </div>
                                )}
                                {activity.data.scheduled_at && (
                                    <div className="flex gap-2 items-center text-muted-foreground">
                                        <StartDateIcon />
                                        <span>
                                            {format(
                                                new Date(activity.data.scheduled_at as string),
                                                'MMM d, h:mm a'
                                            )}
                                        </span>
                                    </div>
                                )}
                                {activity.data.host_name && (
                                    <div className="flex gap-2 items-center text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        <span>{activity.data.host_name as string}</span>
                                    </div>
                                )}
                                {activity.data.duration && (
                                    <div className="flex gap-2 items-center text-muted-foreground">
                                        <DurationIcon />
                                        <span>
                                            {activity.data.duration as number}{' '}
                                            {__('minutes', 'doublescale')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {activity.data.details_url && (
                                <a
                                    href={activity.data.details_url as string}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {__('View booking', 'doublescale')}
                                </a>
                            )}
                        </div>
                    )
                );

            case 'page_visited':
                return (
                    <div className="flex min-w-0 max-w-full flex-col gap-2 rounded-lg border border-border/60 bg-[#DEE1E666] px-3 py-3">
                        <p className="text-sm text-muted-foreground max-sm:break-all">
                            <span className="font-medium text-foreground">{activity.data?.path as string || '/'}</span>
                            {activity.data?.query ? (
                                <span className="ml-1 text-xs text-[#999] max-sm:break-all">?{activity.data.query as string}</span>
                            ) : null}
                        </p>
                    </div>
                );

            case 'value_changed':
                return (
                    activity.data && (
                        <div className="activity-value-content flex flex-wrap items-center gap-2 text-sm text-foreground">
                            <span>
                                {__('Value changed from', 'doublescale')}
                            </span>
                            <span className="line-through text-muted-foreground">
                                {activity.data.old_value}
                            </span>
                            <span>{__('to', 'doublescale')}</span>
                            <span className="font-medium text-foreground">
                                {activity.data.new_value}
                            </span>
                        </div>
                    )
                );

            default:
                return (
                    <p className="text-sm leading-snug text-muted-foreground">
                        {activity.formatted_message}
                    </p>
                );
        }
    };

    return (
        <div className="activity-container">
            <div className="flex justify-between items-center max-sm:flex-col max-sm:gap-4">
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
            <div className="activities-list mt-4">
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
                        <div className="absolute bottom-0 left-[18px] top-0 border-l-2 border-dashed border-border" />

                        <div className="space-y-0">
                            {timelineItems.map((item) => {
                                const isTask = item.type === 'task';
                                const isTracking = item.type === 'tracking';
                                const isBooking = item.type === 'booking';
                                // Use stored activity if available, otherwise construct it
                                const activity: Activity | null = (isTask || isTracking || isBooking) ? null : {
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
                                // For tracking AND booking items, build a pseudo-activity for renderActivityContent
                                const trackingActivity: Activity | null = (isTracking || isBooking) ? {
                                    id: (isBooking ? item.booking_id : item.tracking_id) ?? 0,
                                    contact_id: item.contact_id ?? 0,
                                    activity_type: item.icon_type,
                                    data: item.data,
                                    user_id: 0,
                                    formatted_message: item.title || '',
                                    created_at: item.timestamp,
                                    updated_at: item.timestamp,
                                } : null;
                                const itemId = isTask ? item.task_id : item.activity_id;

                                return (
                                    <div
                                        key={item.id}
                                        className="activity-item relative pl-12 pb-8"
                                    >
                                        {/* Activity/Task Icon */}
                                        <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card p-1 shadow-sm">
                                            {getActivityIcon(item.icon_type)}
                                        </div>

                                        {/* Activity/Task Content */}
                                        <div className="activity-content">
                                            {/* Header */}
                                            <div className="mb-2 flex flex-wrap items-center justify-between gap-y-2">
                                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <MeetingActivityIcon />
                                                        <p className="sm:border-r border-border/60 pr-2 text-xs font-medium text-muted-foreground">
                                                            {formatActivityTime(item.timestamp)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <UserActivityIcon />
                                                        <p className="text-xs font-medium text-muted-foreground">
                                                            {item.user?.display_name ||
                                                                __(
                                                                    'System',
                                                                    'doublescale'
                                                                )}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'max-w-[12rem] truncate border px-2 py-0.5 text-xs font-medium capitalize shadow-none',
                                                            getActivityBadgeClass(
                                                                item.icon_type
                                                            )
                                                        )}
                                                    >
                                                        {isTask
                                                            ? __('Task', 'doublescale')
                                                            : item.icon_type.replace(
                                                                    /_/g,
                                                                    ' '
                                                                )}
                                                    </Badge>
                                                </div>
                                                {/* Actions */}
                                                <div className="flex max-sm:flex-col max-sm:items-start shrink-0 items-center gap-2 sm:gap-3">
                                                    {!isTask && activity && isCrmSentEmailActivity(activity) && (
                                                        <EmailActivityActionsDropdown
                                                            onView={() => handleOpenEmailActivity(activity)}
                                                            onResend={() => handleOpenEmailActivity(activity)}
                                                        />
                                                    )}
                                                    {!isTask && activity && isEditableActivity(item.icon_type, activity.data) && (
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
                                                                    className="h-8 gap-1.5 border-emerald-600/35 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                                                >
                                                                    <CheckCircleIcon width={16} height={16} />
                                                                    {__('Mark Complete', 'doublescale')}
                                                                </Button>
                                                            )}
                                                            {item.status && (
                                                                <Badge variant="default" className="text-xs">
                                                                    {item.status}
                                                                </Badge>
                                                            )}
                                                            {item.priority && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {item.priority}
                                                                </Badge>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Activity/Task Description */}
                                            <div className="activity-body">
                                                <p className="mb-2 text-sm font-medium leading-snug text-foreground">
                                                    {isTask ? item.title : (activity?.formatted_message || trackingActivity?.formatted_message || item.title)}
                                                </p>

                                                {isTask && item.description && (
                                                    <p className="mb-2 text-sm text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                )}

                                                {isTask && item.due_date && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {__('Due', 'doublescale')}: {item.due_date} {item.due_time}
                                                    </p>
                                                )}

                                                {/* Activity-specific content */}
                                                {!isTask && activity && renderActivityContent(activity)}
                                                {(isTracking || isBooking) && trackingActivity && renderActivityContent(trackingActivity)}
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

            <EmailDetails
                campaignEmail={selectedCampaignEmail}
                onClose={() => setSelectedCampaignEmail(null)}
                onResendSuccess={() => {
                    setSelectedCampaignEmail(null);
                    fetchActivities();
                }}
            />

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
