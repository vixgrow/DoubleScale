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
import type { LMSCourse } from '@doublescale/client';
import { FormattedDateCell } from '@doublescale/components';

const STATUS_STYLES: Record<
    'completed' | 'in_progress' | 'not_started',
    string
> = {
    completed:
        'bg-emerald-50 border-emerald-200 text-emerald-700',
    in_progress:
        'bg-amber-50 border-amber-200 text-amber-700',
    not_started:
        'bg-muted/50 border-border text-muted-foreground',
};

const LMS_LABELS: Record<string, string> = {
    learndash: 'LearnDash',
    tutorlms: 'Tutor LMS',
    lifterlms: 'LifterLMS',
    learnpress: 'LearnPress',
};

const getStatusContent = (status?: string) => {
    if (!status) {
        return {
            label: '-',
            classes:
                'border-transparent',
        };
    }

    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_') as keyof typeof STATUS_STYLES;

    const classes =
        STATUS_STYLES[normalizedStatus] ??
        'bg-muted/50 border-border text-muted-foreground';

    return {
        // Display label: replace underscores with spaces and capitalize first letter of each word
        label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        classes,
    };
};

export const getColumns = (): ColumnDef<LMSCourse>[] => [
    {
        accessorKey: 'id',
        header: __('ID', 'doublescale'),
        cell: ({ row }) => row.original.id,
    },
    {
        accessorKey: 'name',
        header: __('Course', 'doublescale'),
        cell: ({ row }) => row.original.name,
    },
    {
        accessorKey: 'status',
        header: __('Status', 'doublescale'),
        cell: ({ row }) => {
            const statusContent = getStatusContent(row.original.status);

            return (
                <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusContent.classes}`}
                >
                    {statusContent.label}
                </span>
            );
        },
    },
    {
        accessorKey: 'started_on',
        header: __('Enrolled', 'doublescale'),
        cell: ({ row }) => (
            row.original.started_on ? <FormattedDateCell value={row.original.started_on} /> : <span>-</span>
        ),
    },
    {
        accessorKey: 'completed_on',
        header: __('Completed', 'doublescale'),
        cell: ({ row }) => (
            row.original.completed_on ? <FormattedDateCell value={row.original.completed_on} /> : <span>-</span>
        ),
    },
    {
        accessorKey: 'lms',
        header: __('LMS', 'doublescale'),
        cell: ({ row }) => {
            const lms = row.original.lms;
            if (!lms) return <span>-</span>;
            return (
                <span className="inline-flex items-center rounded-full bg-muted/50 border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {LMS_LABELS[lms] || lms}
                </span>
            );
        },
    },
];

