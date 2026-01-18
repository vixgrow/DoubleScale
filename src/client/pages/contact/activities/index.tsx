/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

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
import apiFetch from '@wordpress/api-fetch';
import ActivitiesFilters from './ActivitiesFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskDoneIcon } from '@quillcrm/components';
import './style.scss';

import NoteAddIcon from '@quillcrm/components/icons/note-add';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import DealValueIcon from '@quillcrm/components/icons/deal-value';
import MeetingActivityIcon from '@quillcrm/components/icons/meeting-activity';
import UserActivityIcon from '@quillcrm/components/icons/user-activity';
import StartDateIcon from '@quillcrm/components/icons/start-date';
import DurationIcon from '@quillcrm/components/icons/duration';
import LocationIcon from '@quillcrm/components/icons/location';
import CallActivityIcon from '@quillcrm/components/icons/call-activity';
import { NoData, GradientActivitiesIcon } from '@quillcrm/components';
import EmailActivityIcon from '@quillcrm/components/icons/email-activity';
import { ActivityActionsDropdown } from './activity-action-dropdown/ActivityActionDropdown';
import { useActivityOperations } from './use-activity-operations';
import { useContactContext } from '../state/context';
import NoteDialog from '../notes/note-dialog';
import CallDialog from '../calls/call-dialog';
import type { Note } from '@quillcrm/client';


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

interface TimelineItem {
    id: string;
    type: 'activity' | 'task';
    activity_id?: number;
    task_id?: number;
    title: string;
    description: string;
    timestamp: string;
    user?: {
        id: number;
        display_name: string;
    };
    data?: any;
    icon_type: string;
    status?: string;
    priority?: string;
    due_date?: string;
    due_time?: string;
    comments_count?: number;
    activity?: Activity; // Store full activity object for editing
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
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [filters, setFilters] = useState({
        activity_type: '',
        sort_by: 'created_at',
        sort_order: 'desc',
        date_from: '',
        date_to: '',
    });


    const fetchActivities = async () => {
        if (!contact_id) return;

        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('contact_id', contact_id.toString());
            params.append('per_page', '100');
            params.append('page', '1');

            if (filters.date_from) {
                params.append('date_from', filters.date_from);
            }
            if (filters.date_to) {
                params.append('date_to', filters.date_to);
            }

            const response: any = await apiFetch({
                path: `/qc/v1/activities?${params.toString()}`,
            });

            if (response && Array.isArray(response)) {
                // Transform activities to timeline items format
                const timelineItems = response.map((activity: any) => ({
                    id: `activity-${activity.id}`,
                    type: 'activity' as const,
                    activity_id: activity.id,
                    title: activity.formatted_message || '',
                    description: '',
                    timestamp: activity.created_at,
                    user: activity.user,
                    data: activity.data,
                    icon_type: activity.activity_type,
                    comments_count: activity.comments?.length || 0,
                    // Store full activity for editing
                    activity: {
                        id: activity.id,
                        contact_id: activity.contact_id,
                        activity_type: activity.activity_type,
                        data: activity.data,
                        user_id: activity.user_id,
                        formatted_message: activity.formatted_message,
                        created_at: activity.created_at,
                        updated_at: activity.updated_at,
                        user: activity.user,
                    } as Activity,
                }));
                setTimelineItems(timelineItems);
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
    const handleEditActivity = (activity: Activity) => {
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
        }
        // Add other activity types as needed
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
        const editableTypes = ['note', 'email_sent', 'call_logged', 'meeting_scheduled'];
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
                                    <p className="text-base font-normal text-[#777] leading-[26px] whitespace-pre-wrap">
                                        {activity.data.body}
                                    </p>
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
            case 'value_changed':
                return (
                    activity.data && (
                        <div className="activity-value-content flex items-center gap-2 text-base text-[#09090B]">
                            <span>
                                {__('Value changed from', 'quillcrm')}
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
                    {__('Activities', 'quillcrm')}
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
                                const activity: Activity | null = isTask ? null : (item.activity || {
                                    id: item.activity_id ?? 0,
                                    contact_id: 0,
                                    activity_type: item.icon_type,
                                    data: item.data,
                                    user_id: item.user?.id ?? 0,
                                    formatted_message: item.title || '',
                                    created_at: item.timestamp,
                                    updated_at: item.timestamp,
                                    user: item.user,
                                });
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
                                                            {item.user?.display_name || __('System', 'quillcrm')}
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
                                                    {isTask && item.status && (
                                                        <Badge variant="default" className="text-xs">
                                                            {item.status}
                                                        </Badge>
                                                    )}
                                                    {isTask && item.priority && (
                                                        <Badge variant="outline" className="text-xs ml-2">
                                                            {item.priority}
                                                        </Badge>
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
                        icon={<GradientActivitiesIcon />}
                        title={__('No activities found—this space is ready for your next action.', 'quillcrm')}
                        subtitle={__('Use it to add emails, notes, or tasks that keep your contact flow organized and proactive.', 'quillcrm')}
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
        </div>
    );
};

export default Activities;
