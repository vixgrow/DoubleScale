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
import type { CRMUser } from '@doublescale/services/user-management';
import { Button } from '@/components/ui/button';
import { ManagerRoleLabels } from '../components/types';
import { DeleteIcon } from '@doublescale/components';
import EditHeaderIcon from '@/components/icons/edit-header';

interface ManagerColumnsProps {
    onEdit: (managerId: number) => void;
    onDelete: (managerId: number) => void;
    isUpdating?: boolean;
    isDeleting?: boolean;
}

export const getManagerColumns = ({
    onEdit,
    onDelete,
    isUpdating = false,
    isDeleting = false,
}: ManagerColumnsProps): ColumnDef<CRMUser>[] => {
    return [
        {
            accessorKey: 'id',
            header: () => __('ID', 'doublescale'),
            cell: ({ row }) => <span className="font-medium">{row.original.id}</span>,
        },
        {
            accessorKey: 'name',
            header: () => __('Name', 'doublescale'),
            cell: ({ row }) => row.original.name,
        },
        {
            accessorKey: 'email',
            header: () => __('Email', 'doublescale'),
            cell: ({ row }) => row.original.email,
        },
        {
            accessorKey: 'crm_role',
            header: () => __('Role', 'doublescale'),
            cell: ({ row }) => (
                <div
                    className={`inline-flex items-center text-xs font-medium py-0.5 px-2.5 rounded-full capitalize border w-fit ${row.original.crm_role === 'doublescale_crm_manager' || row.original.crm_role === 'ds_crm_manager'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                >
                    {ManagerRoleLabels[row.original.crm_role]}
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => __('Actions', 'doublescale'),
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <Button
                        size="sm"
                        onClick={() => onEdit(row.original.id)}
                        disabled={isUpdating}
                        variant="ghost"
                        className="p-0 text-muted-foreground hover:text-foreground"
                        title={__('Edit role', 'doublescale')}
                    >
                        <EditHeaderIcon/>
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => onDelete(row.original.id)}
                        disabled={isDeleting}
                        className="text-destructive bg-transparent border-none shadow-none p-0 hover:bg-transparent"
                        title={__('Remove CRM access', 'doublescale')}
                    >
                        <DeleteIcon />
                    </Button>
                </div>
            ),
        },
    ];
};


