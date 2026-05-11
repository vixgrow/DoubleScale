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
import { Button } from '@doublescale/components/ui/button';
import EditHeaderIcon from '@doublescale/shared/icons/edit-header';
import { Badge } from '@/components/ui/badge';
import TrashIcon from '@doublescale/shared/icons/trash';

interface Call {
    id: number;
    contact_id: number;
    activity_type: string;
    data: {
        phone_number?: string;
        duration?: number;
        outcome?: string;
        notes?: string;
        called_at?: string;
    };
    created_at: string;
    updated_at?: string;
    user?: {
        id: number;
        display_name: string;
    };
}

interface ColumnsProps {
    onEdit: (call: Call) => void;
    onDelete: (call: Call) => void;
}

dayjs.extend(utc);
dayjs.extend(timezone);

const formatCallDateTime = (dateString: string) => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = dayjs.utc(dateString).tz(userTimeZone);
    return date.format('DD MMM, YYYY - hh:mm a');
};

const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '-';
    // Mask phone number: show first 3 digits, mask the rest
    if (phone.length > 3) {
        const visible = phone.substring(0, 3);
        const masked = '*'.repeat(phone.length - 3);
        return `${visible}${masked}`;
    }
    return phone;
};

const getOutcomeBadgeColor = (outcome?: string) => {
    const colors: Record<string, string> = {
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        no_answer: 'bg-destructive/5 text-destructive border-destructive/20',
        busy: 'bg-amber-50 text-amber-700 border-amber-200',
        voicemail: 'bg-violet-50 text-violet-700 border-violet-200',
        callback_requested: 'bg-blue-50 text-blue-700 border-blue-200',
        not_interested: 'bg-destructive/5 text-destructive border-destructive/20',
        follow_up: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return colors[outcome || 'completed'] || colors.completed;
};

export function getColumns({ onEdit, onDelete }: ColumnsProps) {
    const columns: ColumnDef<Call>[] = [
        {
            accessorKey: 'phone_number',
            header: __('Phone Number', 'doublescale'),
            cell: ({ row }) => (
                <span className="text-foreground">
                    {formatPhoneNumber(row.original.data?.phone_number)}
                </span>
            ),
        },
        {
            accessorKey: 'call_date_time',
            header: __('Call Date & Time', 'doublescale'),
            cell: ({ row }) => {
                const dateTime = row.original.data?.called_at || row.original.created_at;
                return (
                    <span className="text-foreground">
                        {formatCallDateTime(dateTime)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'outcome',
            header: __('Call Outcome', 'doublescale'),
            cell: ({ row }) => {
                const outcome = row.original.data?.outcome || 'completed';
                const colorClass = getOutcomeBadgeColor(outcome);
                return (
                    <Badge
                        className={`border rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}
                    >
                        {outcome.replace(/_/g, ' ')}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'duration',
            header: __('Duration (min)', 'doublescale'),
            cell: ({ row }) => {
                const duration = row.original.data?.duration || 0;
                return (
                    <span className="text-foreground">
                        {duration} {__('M', 'doublescale')}
                    </span>
                );
            },
        },
        {
            accessorKey: 'actions',
            header: __('Actions', 'doublescale'),
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
