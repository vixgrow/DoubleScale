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
import { Badge } from '@/components/ui/badge';
import TrashIcon from '@quillcrm/components/icons/trash';

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
        completed: 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]',
        no_answer: 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]',
        busy: 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]',
        voicemail: 'bg-[#E0E7FF] text-[#6366F1] border-[#6366F1]',
        callback_requested: 'bg-[#DBEAFE] text-[#2563EB] border-[#2563EB]',
        not_interested: 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]',
        follow_up: 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]',
    };
    return colors[outcome || 'completed'] || colors.completed;
};

export function getColumns({ onEdit, onDelete }: ColumnsProps) {
    const columns: ColumnDef<Call>[] = [
        {
            accessorKey: 'phone_number',
            header: __('Phone Number', 'quillcrm'),
            cell: ({ row }) => (
                <span className="text-[#09090B]">
                    {formatPhoneNumber(row.original.data?.phone_number)}
                </span>
            ),
        },
        {
            accessorKey: 'call_date_time',
            header: __('Call Date & Time', 'quillcrm'),
            cell: ({ row }) => {
                const dateTime = row.original.data?.called_at || row.original.created_at;
                return (
                    <span className="text-[#09090B]">
                        {formatCallDateTime(dateTime)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'outcome',
            header: __('Call Outcome', 'quillcrm'),
            cell: ({ row }) => {
                const outcome = row.original.data?.outcome || 'completed';
                const colorClass = getOutcomeBadgeColor(outcome);
                return (
                    <Badge
                        className={`border rounded-md px-2 py-1 capitalize ${colorClass} hover:`}
                    >
                        {outcome.replace(/_/g, ' ')}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'duration',
            header: __('Duration (min)', 'quillcrm'),
            cell: ({ row }) => {
                const duration = row.original.data?.duration || 0;
                return (
                    <span className="text-[#09090B]">
                        {duration} {__('M', 'quillcrm')}
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
