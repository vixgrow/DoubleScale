import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnsIcon, FiltersIcon, BulkActionSelect } from '@quillcrm/components';
import { __ } from '@wordpress/i18n';
import { Flex } from 'antd';
import { Table } from '@tanstack/react-table';
import { DataTableConfig } from '@quillcrm/client';

interface DataTableActionsProps<TData> {
    table: Table<TData>;
    config: DataTableConfig<TData>;
}

export function DataTableActions<TData>({
    table,
    config,
}: DataTableActionsProps<TData>) {
    return (
        <Flex gap={10} align="center">
            {/* Manage Columns Dropdown */}
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

            {/* Advanced Filters Button */}
            {config.filters?.enabled && (
                <Button
                    onClick={() => config.filters?.onToggleFilters(!config.filters.showFilters)}
                    className="border-[#E4E4E7] border bg-transparent text-input shadow-none hover:border-input hover:bg-transparent"
                >
                    <FiltersIcon />
                    {__('Advanced Filters', 'quillcrm')}
                </Button>
            )}

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
                />
            )}
        </Flex>
    );
}