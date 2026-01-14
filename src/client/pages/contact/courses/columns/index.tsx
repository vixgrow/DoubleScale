/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { ColumnDef } from '@tanstack/react-table';

/**
 * Internal dependencies
 */
import type { LMSCourse } from '@quillcrm/client';
import { FormattedDateCell } from '@quillcrm/components';

const STATUS_STYLES: Record<
    'completed' | 'in_progress' | 'not_started',
    string
> = {
    completed:
        'bg-[#EFFFF5] border-[#16A34A] text-[#16A34A]',
    in_progress:
        'bg-[#FFF2E2] border-[#CB5301] text-[#CB5301]',
    not_started:
        'bg-[#F8F8F8] border-gray-500 text-gray-500',
};

const LMS_LABELS: Record<string, string> = {
    learndash: 'LearnDash',
    tutorlms: 'Tutor LMS',
};

const getStatusContent = (status?: string) => {
    if (!status) {
        return {
            label: '-',
            classes:
                'border-transparent',
        };
    }

    const normalizedStatus = status.toLowerCase() as keyof typeof STATUS_STYLES;

    const classes =
        STATUS_STYLES[normalizedStatus] ??
        'bg-[#F4F4F5] border-[#D4D4D8] text-[#4B5563]';

    return {
        label: status.replace(/_/g, ' '),
        classes,
    };
};

export const getColumns = (): ColumnDef<LMSCourse>[] => [
    {
        accessorKey: 'id',
        header: __('ID', 'quillcrm'),
        cell: ({ row }) => row.original.id,
    },
    {
        accessorKey: 'name',
        header: __('Course', 'quillcrm'),
        cell: ({ row }) => row.original.name,
    },
    {
        accessorKey: 'status',
        header: __('Status', 'quillcrm'),
        cell: ({ row }) => {
            const statusContent = getStatusContent(row.original.status);

            return (
                <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize ${statusContent.classes}`}
                >
                    {statusContent.label}
                </span>
            );
        },
    },
    {
        accessorKey: 'started_on',
        header: __('Enrolled', 'quillcrm'),
        cell: ({ row }) => (
            row.original.started_on ? <FormattedDateCell value={row.original.started_on} /> : <span>-</span>
        ),
    },
    {
        accessorKey: 'completed_on',
        header: __('Completed', 'quillcrm'),
        cell: ({ row }) => (
            row.original.completed_on ? <FormattedDateCell value={row.original.completed_on} /> : <span>-</span>
        ),
    },
    {
        accessorKey: 'lms',
        header: __('LMS', 'quillcrm'),
        cell: ({ row }) => {
            const lms = row.original.lms;
            if (!lms) return <span>-</span>;
            return (
                <span className="inline-flex items-center rounded-full bg-[#F4F4F5] border border-[#D4D4D8] px-3 py-1 text-sm font-medium text-[#4B5563]">
                    {LMS_LABELS[lms] || lms}
                </span>
            );
        },
    },
];

