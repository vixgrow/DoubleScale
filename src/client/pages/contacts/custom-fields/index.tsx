/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { Skeleton } from 'antd';
/**
 * internal dependencies
 */
import { useCustomFields } from '../../../../hooks/use-customFields';
import { CustomFieldsRef, CustomFieldsProps, CustomField } from '@quillcrm/client';
import { DataTableSearch } from '@/components/ui/data-table-search';
import { DataTableActions } from '@/components/ui/data-table-actions';
import { DroppableGroup } from './droppable-group';
import { FieldDialog } from './field-dialog';
import { GroupDialog } from './group-dialog';
import { DeleteGroupDialog } from './delete-group-dialog';
import { FieldTable } from './field-table';
import ConfigAPI from '@quillcrm/config';
import { Button } from '@/components/ui/button';

export const CustomFields = forwardRef<CustomFieldsRef, CustomFieldsProps>(
  ({ activeTab }, ref) => {
    const {
      loading,
      error,
      groups,
      fetchGroups,
      saveField,
      deleteField,
      saveGroup,
      deleteGroup,
      moveField, // Add moveField from hook
    } = useCustomFields();

    const [visible, setVisible] = useState(false);
    const [addGroupVisible, setAddGroupVisible] = useState(false);
    const [deleteGroupVisible, setDeleteGroupVisible] = useState(false);
    const [selectedField, setSelectedField] = useState<CustomField | null>(null);
    const [deleteGroupId, setDeleteGroupId] = useState(0);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [bulkAction, setBulkAction] = useState('');

    const { createNotice } = useDispatch('quillcrm/core');
    const customFieldsTypes = ConfigAPI.getCustomFieldsTypes();

    useImperativeHandle(ref, () => ({
      openCreateGroupModal: () => setAddGroupVisible(true),
      openCreateFieldModal: () => {
        if (groups.length === 0) {
          createNotice({
            type: 'error',
            message: __('Please add group first', 'quillcrm'),
          });
          return;
        }
        setSelectedField(null);
        setVisible(true);
      },
    }));

    const handleBulkAction = async (action: string) => {
      if (action === 'delete') {
        const selectedFields = groups
          .flatMap(group => group.custom_fields)
          .filter(field => selectedRowKeys.includes(field.id));

        for (const field of selectedFields) {
          await deleteField(field);
        }
        setSelectedRowKeys([]);
      }
    };

    const allFields = groups.flatMap(group => group.custom_fields);
    const filteredFields = allFields.filter(field => 
      globalFilter === '' ||
      field.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
      customFieldsTypes[field.type]?.name.toLowerCase().includes(globalFilter.toLowerCase())
    );

    const mockGlobalTable = {
      getFilteredSelectedRowModel: () => ({
        rows: filteredFields
          .filter(field => selectedRowKeys.includes(field.id))
          .map(field => ({
            original: field,
            id: field.id.toString(),
          })),
      }),
    };

    if (loading) {
      return (
        <div className="custom-fields-loading">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="custom-fields-error">
          <p>{__('Error loading custom fields:', 'quillcrm')} {error}</p>
          <Button onClick={fetchGroups}>
            {__('Retry', 'quillcrm')}
          </Button>
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <div className="custom-fields-empty">
          <p>{__('No custom fields groups found', 'quillcrm')}</p>
          <Button onClick={() => setAddGroupVisible(true)}>
            {__('Create First Group', 'quillcrm')}
          </Button>
        </div>
      );
    }

    return (
      <div className="custom-fields mt-5">
        {/* Global Actions */}
        <div className="flex items-center justify-between p-5 border rounded-lg my-4 w-full">
          <DataTableSearch
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder={__('Search all fields...', 'quillcrm')}
          />

          <DataTableActions
            table={mockGlobalTable as any}
            config={{
              selection: {
                enabled: true,
                selectedKeys: selectedRowKeys,
                onSelectionChange: setSelectedRowKeys,
              },
              bulkActions: {
                enabled: true,
                currentAction: bulkAction,
                onActionChange: setBulkAction,
                onExecuteAction: handleBulkAction,
                activeTab: activeTab,
              },
            }}
            activeTab={activeTab}
          />
        </div>

        {/* Groups List */}
        <div className="flex flex-col gap-[10px]">
          <DndContext
            onDragEnd={async ({ active, over }) => {
              if (!over) return;

              const activeData = active.data.current;
              const overData = over.data.current;

              if (activeData?.type === 'field' && overData?.type === 'group') {
                const field = activeData.field;
                const groupId = parseInt(overData.groupId);
                
                // Use the moveField function from the hook
                await moveField(field, groupId);
              }
            }}
          >
            {groups.map(group => {
              const groupFilteredFields = group.custom_fields.filter(field => 
                globalFilter === '' ||
                field.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
                customFieldsTypes[field.type]?.name.toLowerCase().includes(globalFilter.toLowerCase())
              );

              return (
                <DroppableGroup
                  key={group.id}
                  id={`group-${group.id}`}
                  title={group.name}
                  fieldsCount={groupFilteredFields.length}
                  deletable={groups.length > 1}
                  onDelete={() => {
                    if (group.custom_fields.length > 0) {
                      // Group has fields - show dialog to move fields
                      setDeleteGroupId(group.id);
                      setDeleteGroupVisible(true);
                    } else {
                      // Empty group - delete directly without newGroupId
                      deleteGroup(group.id);
                    }
                  }}
                >
                  <FieldTable
                    fields={groupFilteredFields}
                    fieldTypes={customFieldsTypes}
                    selectedRowKeys={selectedRowKeys}
                    onSelectionChange={setSelectedRowKeys}
                    onEdit={(field) => {
                      setSelectedField(field);
                      setVisible(true);
                    }}
                    onDelete={deleteField}
                  />
                </DroppableGroup>
              );
            })}
          </DndContext>
        </div>

        {/* Dialogs */}
        <FieldDialog
          visible={visible}
          onClose={() => setVisible(false)}
          field={selectedField}
          groups={groups}
          fieldTypes={customFieldsTypes}
          onSave={saveField}
        />

        <GroupDialog
          visible={addGroupVisible}
          onClose={() => setAddGroupVisible(false)}
          onSave={saveGroup}
        />

        <DeleteGroupDialog
          visible={deleteGroupVisible}
          onClose={() => setDeleteGroupVisible(false)}
          groupId={deleteGroupId}
          groups={groups.filter(group => group.id !== deleteGroupId)}
          onDelete={deleteGroup}
        />
      </div>
    );
  }
);

CustomFields.displayName = 'CustomFields';
export default CustomFields;