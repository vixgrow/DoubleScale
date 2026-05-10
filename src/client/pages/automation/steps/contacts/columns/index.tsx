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

                if (!contact) {
                    return (
                        <div className="flex items-center gap-2.5">
                            <Avatar className="w-9 h-9 rounded-full">
                                <AvatarFallback className="rounded-full bg-muted/50 text-muted-foreground font-semibold text-xs">
                                    ?
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <div className="text-sm text-muted-foreground italic">
                                    {__('Deleted Contact', 'doublescale')}
                                </div>
                            </div>
                        </div>
                    );
                }

                const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                const initials = getContactInitials(contact.first_name, contact.last_name);
                const avatarUrl = (contact as any).avatar_url;

                return (
                    <NavLink to={`contacts/${contact.id}`}>
                        <div className="flex items-center gap-2.5">
                            <Avatar className="w-9 h-9 rounded-full">
                                {avatarUrl ? (
                                    <AvatarImage src={avatarUrl} alt={fullName || contact.email} className="rounded-full" />
                                ) : null}
                                <AvatarFallback className="rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                {fullName && (
                                    <div className="font-medium capitalize text-sm max-w-[180px] truncate text-foreground leading-tight">
                                        {fullName}
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground">
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
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : status === 'failed'
                        ? 'bg-destructive/5 text-destructive border-destructive/20'
                        : 'bg-muted/50 text-muted-foreground border-border';

                return (
                    <span className={`inline-flex items-center text-xs font-medium capitalize border rounded-full py-0.5 px-2.5 w-fit ${bgColor}`}>
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
