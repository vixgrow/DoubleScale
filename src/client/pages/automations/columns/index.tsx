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
import type { Automation } from '@quillcrm/client';
import { SortIcon, TimeAgoCell, SettingsOutlinedIcon, ThreeDotsIcon, ReportsIcon, DeleteIcon } from '@quillcrm/components';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@quillcrm/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { NavLink, getToLink } from '@quillcrm/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@quillcrm/components/ui/dropdown-menu';

interface AutomationColumnsProps {
    onViewReports: (automation: Automation) => void;
    onStatusChange: (automation: Automation, newStatus: string) => void;
    updatingAutomationId: number | null;
    navigate: (to: string) => void;
    onDelete: (id: number) => void;
}

export const getAutomationColumns = ({
    onViewReports,
    onStatusChange,
    updatingAutomationId,
    navigate,
    onDelete,
}: AutomationColumnsProps): ColumnDef<Automation>[] => {
    const selectionColumn: ColumnDef<Automation> = {
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

    return [
        selectionColumn,
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <div
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {__('Title', 'quillcrm')}
                    <SortIcon />
                </div>
            ),
            cell: ({ row }) => (
                <NavLink to={`automations/${row.original.id}`}>
                    {row.original.name}
                </NavLink>
            ),
        },
        {
            accessorKey: 'trigger',
            header: ({ column }) => (
                <div
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {__('Trigger', 'quillcrm')}
                    <SortIcon />
                </div>
            ),
            cell: ({ row }) => row.original.trigger,
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
                    {__('Created At', 'quillcrm')}
                    <SortIcon />
                </div>
            ),
            cell: ({ row }) => <TimeAgoCell value={row.getValue('created_at')} />,
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
            cell: ({ row }) => (
                <span
                    className={`px-3 py-1 border rounded text-sm font-normal ${row.original.status === 'active'
                        ? 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]'
                        : 'bg-[#F8F8F8] text-gray-500 border-gray-500'
                        }`}
                >
                    {row.original.status === 'active' ? 'Published' : 'Draft'}
                </span>
            ),
        },
        {
            accessorKey: 'toggle_status',
            header: () => __('Pause/Run', 'quillcrm'),
            cell: ({ row }) => {
                const isUpdating = updatingAutomationId === row.original.id;
                return (
                    <Switch
                        checked={row.original.status === 'active'}
                        disabled={isUpdating}
                        onCheckedChange={(checked) => {
                            const newStatus = checked ? 'active' : 'inactive';
                            onStatusChange(row.original, newStatus);
                        }}
                    />
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: 'actions',
            header: () => __('Actions', 'quillcrm'),
            cell: ({ row }) => {
                const automation = row.original;
                return (
                    <div className="text-start">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-6 w-6 bg-accent text-[#1E2125] rounded-lg p-0 hover:bg-accent focus-visible:border-none focus-visible:outline-none focus-visible:box-shadow-none focus-visible:ring-0">
                                    <ThreeDotsIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => {
                                        navigate(getToLink(`automations/${automation.id}`));
                                    }}
                                >
                                    <SettingsOutlinedIcon />
                                    {__('Setup', 'quillcrm')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onViewReports(automation)}
                                >
                                    <ReportsIcon />
                                    {__('Report', 'quillcrm')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(automation.id)}
                                    className="text-red-500 hover:text-red-500 focus:text-red-500"
                                >
                                    <DeleteIcon />
                                    {__('Delete', 'quillcrm')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
};

