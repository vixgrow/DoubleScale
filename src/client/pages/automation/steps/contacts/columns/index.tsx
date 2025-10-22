/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import { ColumnDef } from '@tanstack/react-table';

/**
 * internal dependencies
 */
import type { AutomationContact } from '@quillcrm/client';
import {
    SortIcon,
    ViewOutlinedIcon,
    TimeAgoCell,
    FormattedDateCell,
    ViewIcon,
} from '@quillcrm/components';
import { getToLink } from '@quillcrm/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@quillcrm/components/ui/button';
import { Badge } from '@quillcrm/components/ui/badge';
import { NavLink } from '@quillcrm/navigation';

export const selectionColumn: ColumnDef<AutomationContact> = {
    id: 'select',
    header: ({ table }) => (
        <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
        />
    ),
    cell: ({ row }) => (
        <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
        />
    ),
    enableSorting: false,
    enableHiding: false,
};

export function getColumns({ onViewJourney }) {
    const columns: ColumnDef<AutomationContact>[] = [
        selectionColumn,
        {
            accessorKey: 'contact',
            header: ({ column }) => (
                <div
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {__('Contact', 'quillcrm')}
                    <SortIcon />
                </div>
            ),
            cell: ({ row }) => (
                <NavLink to={getToLink(`contacts/${row.original.contact.id}`)}>
                    {row.original.contact.email}
                </NavLink>
            ),
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => (
                <div
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {__('Started At', 'quillcrm')}
                    <SortIcon />
                </div>
            ),
            cell: ({ row }) => (
                <TimeAgoCell value={row.getValue('created_at')} />
            ),
        },
        {
            accessorKey: 'updated_at',
            header: ({ column }) => (
                <div
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {__('Last Run', 'quillcrm')}
                    <SortIcon />
                </div>
            ),
            cell: ({ row }) => (
                <FormattedDateCell value={row.getValue('updated_at')} />
            ),
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <div
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {__('Status', 'quillcrm')}
                    <SortIcon />
                </div>
            ),
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                const bgColor = status === 'completed'
                    ? 'bg-[#EFFFF5] text-[#16A34A]'
                    : status === 'failed'
                        ? 'bg-[#EF44444A] text-destructive'
                        : 'bg-gray-100 text-gray-700';

                return (
                    <span className={`capitalize rounded-xl py-1 px-3 text-xs w-fit ${bgColor}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: 'actions',
            header: () => __('Actions', 'quillcrm'),
            cell: ({ row }) => {
                return (
                    <Button
                        size="sm"
                        onClick={() => onViewJourney(row.original)}
                        className="flex items-center h-auto p-0 text-left hover:bg-transparent cursor-pointer bg-transparent shadow-none border-none"
                    >
                        <ViewIcon />
                        {__('View Journey', 'quillcrm')}
                    </Button>
                );
            },
        },
    ];
    return columns;
}
