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
import type { AutomationContact } from '@doublescale/client';
import {
    SortIcon,
    TimeAgoCell,
    FormattedDateCell,
    ViewIcon,
} from '@doublescale/components';
import { Button } from '@doublescale/components/ui/button';
import { NavLink } from '@doublescale/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Helper function to generate contact initials
const getContactInitials = (firstName: string, lastName: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
};

export function getColumns({ onViewJourney }) {
    const columns: ColumnDef<AutomationContact>[] = [
        {
            accessorKey: 'contact',
            header: ({ column }) => (
                <div
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {__('Contact', 'doublescale')}
                    <SortIcon />
                </div>
            ),
            cell: ({ row }) => {
                const contact = row.original.contact;
                const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                const initials = getContactInitials(contact.first_name, contact.last_name);
                const avatarUrl = (contact as any).avatar_url;

                return (
                    <NavLink to={`contacts/${contact.id}`}>
                        <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 rounded-lg">
                                {avatarUrl ? (
                                    <AvatarImage src={avatarUrl} alt={fullName || contact.email} className="rounded-lg" />
                                ) : null}
                                <AvatarFallback className="rounded-lg bg-[#E3EEFF99] text-secondary font-bold text-lg">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                {fullName && (
                                    <div className="font-semibold capitalize text-base w-40 truncate text-[#09090B]">
                                        {fullName}
                                    </div>
                                )}
                                <div className="text-base text-gray-500">
                                    {contact.email}
                                </div>
                            </div>
                        </div>
                    </NavLink>
                );
            },
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
                    {__('Started At', 'doublescale')}
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
                    {__('Last Run', 'doublescale')}
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
                    {__('Status', 'doublescale')}
                    <SortIcon />
                </div>
            ),
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                const bgColor = status === 'completed'
                    ? 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]'
                    : status === 'failed'
                        ? 'bg-[#EF444429] text-destructive border-destructive'
                        : 'bg-gray-100 text-gray-700';

                return (
                    <span className={`capitalize border rounded py-1 px-3 text-sm w-fit ${bgColor}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: 'actions',
            header: () => __('Actions', 'doublescale'),
            cell: ({ row }) => {
                return (
                    <Button
                        onClick={() => onViewJourney(row.original)}
                        className="text-primary p-0 text-left hover:bg-transparent cursor-pointer bg-transparent shadow-none border-none"
                    >
                        <ViewIcon />
                        {__('View Journey', 'doublescale')}
                    </Button>
                );
            },
        },
    ];
    return columns;
}
