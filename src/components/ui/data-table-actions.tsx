/**
 * wordpress depnedencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import { Table } from '@tanstack/react-table';

/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnsIcon, FiltersIcon, BulkActionSelect } from '@quillcrm/components';
import { DataTableConfig } from '@quillcrm/client';

interface DataTableActionsProps<TData> {
    table: Table<TData>;
    config: DataTableConfig<TData>;
    activeTab?: string;
}

export function DataTableActions<TData>({
    table,
    config,
    activeTab,
}: DataTableActionsProps<TData>) {
    return (
        <div className='flex gap-[10px] items-center'>
            {/* Bulk Actions - Always visible when enabled, but disabled when no rows selected */}
            {config.bulkActions?.enabled && (
                <BulkActionSelect
                    bulkAction={config.bulkActions.currentAction}
                    setBulkAction={config.bulkActions.onActionChange}
                    selectedRowKeys={config.selection!.selectedKeys.map(key => key.toString())}
                    doBulkAction={config.bulkActions.onExecuteAction}
                    setSelectedLists={config.bulkActions.lists?.onSelectionChange || (() => { })}
                    setSelectedTags={config.bulkActions.tags?.onSelectionChange || (() => { })}
                    selectedLists={config.bulkActions.lists?.selected || []}
                    selectedTags={config.bulkActions.tags?.selected || []}
                    activeTab={activeTab}
                />
            )}

             {/* Advanced Filters Button */}
             {config.filters?.enabled && (
                <Button
                    onClick={() => config.filters?.onToggleFilters(!config.filters.showFilters)}
                    className="bg-[#C6DFF3] border border-[#C6DFF3] font-semibold px-4 text-[#3B82F6] shadow-none hover:bg-transparent"
                >
                    <FiltersIcon />
                    {__('Advanced Filters', 'quillcrm')}
                </Button>
            )}

            {/* Manage Columns Dropdown */}
            {config.manageColumns?.enabled && (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-secondary border-secondary text-white hover:bg-secondary/80 hover:text-primary-foreground">
                                <ColumnsIcon />
                                {__('Manage Columns', 'quillcrm')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id.replace(/_/g, ' ')}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
        </div>
    );
}