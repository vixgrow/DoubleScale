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
import type { CRMUser } from '../../../../services/user-management';
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
                    className={`text-base py-1 px-2 rounded-md capitalize border w-fit ${row.original.crm_role === 'doublescale_crm_manager'
                        ? 'bg-secondary/10 text-secondary border-secondary'
                        : 'bg-[#E6F7EE] text-[#166534] border-[#166534]'
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
                        className="border-none bg-transparent text-[#09090B] p-0 shadow-none hover:bg-transparent"
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


