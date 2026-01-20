/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
/**
 * Internal dependencies
 */
import { Button } from '@quillcrm/components/ui/button';
import EditHeaderIcon from '@/components/icons/edit-header';
import TrashIcon from '@quillcrm/components/icons/trash';

interface Meeting {
    id: number;
    contact_id: number;
    activity_type: string;
    data: {
        meeting_title?: string;
        duration?: number;
        location?: string;
        meeting_date_time?: string;
        meeting_end_time?: string;
        description?: string;
    };
    created_at: string;
    updated_at?: string;
    user?: {
        id: number;
        display_name: string;
    };
}

interface ColumnsProps {
    onEdit: (meeting: Meeting) => void;
    onDelete: (meeting: Meeting) => void;
}

dayjs.extend(utc);
dayjs.extend(timezone);

const formatMeetingDateTime = (dateString: string) => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = dayjs.utc(dateString).tz(userTimeZone);
    return date.format('DD MMM, YYYY - hh:mm a');
};

const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 60) {
        return `${duration} ${__('minutes', 'quillcrm')}`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (minutes === 0) {
        return `${hours} ${hours === 1 ? __('hour', 'quillcrm') : __('hours', 'quillcrm')}`;
    }
    return `${hours} ${hours === 1 ? __('hour', 'quillcrm') : __('hours', 'quillcrm')} ${minutes} ${__('minutes', 'quillcrm')}`;
};

export function getColumns({ onEdit, onDelete }: ColumnsProps) {
    const columns: ColumnDef<Meeting>[] = [
        {
            accessorKey: 'meeting_date_time',
            header: __('Meeting Date & Time', 'quillcrm'),
            cell: ({ row }) => {
                const dateTime = row.original.data?.meeting_date_time || row.original.created_at;
                return (
                    <span className="text-[#09090B]">
                        {formatMeetingDateTime(dateTime)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'location',
            header: __('Location', 'quillcrm'),
            cell: ({ row }) => (
                <span className="text-[#09090B]">
                    {row.original.data?.location || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'duration',
            header: __('Duration', 'quillcrm'),
            cell: ({ row }) => {
                const duration = row.original.data?.duration || 0;
                return (
                    <span className="text-[#09090B]">
                        {formatDuration(duration)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'actions',
            header: __('Actions', 'quillcrm'),
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <Button
                        size="sm"
                        className="bg-transparent border-none shadow-none p-0 text-muted-foreground hover:bg-transparent hover:text-primary/80"
                        onClick={() => onEdit(row.original)}
                    >
                        <EditHeaderIcon />
                    </Button>
                    <Button
                        size="sm"
                        className="bg-transparent border-none p-0 shadow-none text-destructive hover:bg-transparent hover:text-destructive/80"
                        onClick={() => onDelete(row.original)}
                    >
                        <TrashIcon />
                    </Button>
                </div>
            ),
        },
    ];

    return columns;
}
