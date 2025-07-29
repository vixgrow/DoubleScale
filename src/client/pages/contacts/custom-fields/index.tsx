/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { Skeleton } from 'antd';
/**
 * internal dependencies
 */
import { useCustomFields } from './use-customFields';
import {
	CustomFieldsRef,
	CustomFieldsProps,
	CustomField,
} from '@quillcrm/client';
import { DataTableSearch } from '@/components/ui/data-table-search';
import { DataTableActions } from '@/components/ui/data-table-actions';
import { DroppableGroup } from './droppable-group';
import { FieldDialog } from './field-dialog';
import { GroupDialog } from './group-dialog';
import { DeleteGroupDialog } from './delete-group-dialog';
import { FieldTable } from './field-table';
import { DragOverlayRow } from './drag-overlay-row';
import ConfigAPI from '@quillcrm/config';
import { Button } from '@/components/ui/button';
import { NoticeBanner } from '@quillcrm/components';

// Custom modifier to center the drag overlay on the move icon
const centerOnDragHandle = ({ transform }) => {
	// Calculate the offset to center the move icon under the cursor
	// The move icon is approximately 85% from the left edge of the row
	// For a 600px wide row, this puts the move icon at ~510px from the left
	// So we need to offset by about -510px to center it under the cursor
	const dragOverlayWidth = 600; // min-w-[600px] from DragOverlayRow
	const moveIconPosition = dragOverlayWidth * -0.1; // Move icon is ~85% from left

	return {
		...transform,
		x: transform.x - moveIconPosition,
		y: transform.y - 12,
	};
};

export const CustomFields = forwardRef<CustomFieldsRef, CustomFieldsProps>(
	({ activeTab }, ref) => {
		const {
			loading,
			error,
			groups,
			notice,
			closeNotice,
			showNotice,
			fetchGroups,
			saveField,
			deleteField,
			saveGroup,
			deleteGroup,
			moveField,
		} = useCustomFields();

		const [visible, setVisible] = useState(false);
		const [addGroupVisible, setAddGroupVisible] = useState(false);
		const [deleteGroupVisible, setDeleteGroupVisible] = useState(false);
		const [selectedField, setSelectedField] = useState<CustomField | null>(
			null
		);
		const [deleteGroupId, setDeleteGroupId] = useState(0);
		const [globalFilter, setGlobalFilter] = useState('');
		const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
		const [bulkAction, setBulkAction] = useState('');
		const [activeField, setActiveField] = useState<CustomField | null>(
			null
		);

		// Add date range state
		const [dateRange, setDateRange] = useState<{
			from: Date | null;
			to: Date | null;
		}>({
			from: null,
			to: null,
		});

		const customFieldsTypes = ConfigAPI.getCustomFieldsTypes();

		// Configure sensors for better drag behavior
		const sensors = useSensors(
			useSensor(PointerSensor, {
				activationConstraint: {
					distance: 8, // Require 8px of movement before drag starts
				},
			})
		);

		useImperativeHandle(ref, () => ({
			openCreateGroupModal: () => setAddGroupVisible(true),
			openCreateFieldModal: () => {
				if (groups.length === 0) {
					showNotice({
						type: 'error',
						message: __(
							'Please create a group first before adding fields',
							'quillcrm'
						),
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
					.flatMap((group) => group.custom_fields)
					.filter((field) => selectedRowKeys.includes(field.id));

				for (const field of selectedFields) {
					await deleteField(field);
				}
				setSelectedRowKeys([]);
			}
		};

		const allFields = groups.flatMap((group) => group.custom_fields);

		// Enhanced filtering with date range
		const filteredFields = allFields.filter((field) => {
			// Text filter
			const matchesText =
				globalFilter === '' ||
				field.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
				customFieldsTypes[field.type]?.name
					.toLowerCase()
					.includes(globalFilter.toLowerCase());

			// Date range filter
			const matchesDateRange = (() => {
				if (!dateRange.from && !dateRange.to) return true;

				const fieldDate = new Date(field.created_at);
				const fromDate = dateRange.from
					? new Date(dateRange.from)
					: null;
				const toDate = dateRange.to ? new Date(dateRange.to) : null;

				if (fromDate && toDate) {
					return fieldDate >= fromDate && fieldDate <= toDate;
				} else if (fromDate) {
					return fieldDate >= fromDate;
				} else if (toDate) {
					return fieldDate <= toDate;
				}

				return true;
			})();

			return matchesText && matchesDateRange;
		});

		const mockGlobalTable = {
			getFilteredSelectedRowModel: () => ({
				rows: filteredFields
					.filter((field) => selectedRowKeys.includes(field.id))
					.map((field) => ({
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
					<p>
						{__('Error loading custom fields:', 'quillcrm')} {error}
					</p>
					<Button onClick={fetchGroups}>
						{__('Retry', 'quillcrm')}
					</Button>
				</div>
			);
		}

		return (
			<div className="custom-fields mt-5">
				{/* Notice Banner */}
				{notice && (
					<NoticeBanner notice={notice} closeNotice={closeNotice} />
				)}

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
							dateRange: {
								enabled: true,
								value: dateRange,
								onDateChange: setDateRange,
								placeholder: __('Date Range', 'quillcrm'),
							},
						}}
						activeTab={activeTab}
					/>
				</div>

				{/* Groups List */}
				<div className="flex flex-col gap-[10px]">
					<DndContext
						sensors={sensors}
						onDragStart={({ active }) => {
							const activeData = active.data.current;
							if (activeData?.type === 'field') {
								setActiveField(activeData.field);
							}
						}}
						onDragEnd={async ({ active, over }) => {
							setActiveField(null);

							if (!over) return;

							// Check if the drag actually moved to a different location
							if (active.id === over.id) return;

							const activeData = active.data.current;
							const overData = over.data.current;

							if (
								activeData?.type === 'field' &&
								overData?.type === 'group'
							) {
								const field = activeData.field;
								const groupId = parseInt(overData.groupId);

								// Additional check: don't move if it's already in the same group
								if (field.group_id === groupId) return;

								await moveField(field, groupId);
							}
						}}
					>
						{groups.map((group) => {
							const groupFilteredFields =
								group.custom_fields.filter((field) => {
									// Text filter
									const matchesText =
										globalFilter === '' ||
										field.name
											.toLowerCase()
											.includes(
												globalFilter.toLowerCase()
											) ||
										customFieldsTypes[field.type]?.name
											.toLowerCase()
											.includes(
												globalFilter.toLowerCase()
											);

									// Date range filter
									const matchesDateRange = (() => {
										if (!dateRange.from && !dateRange.to)
											return true;

										const fieldDate = new Date(
											field.created_at
										);
										const fromDate = dateRange.from
											? new Date(dateRange.from)
											: null;
										const toDate = dateRange.to
											? new Date(dateRange.to)
											: null;

										if (fromDate && toDate) {
											return (
												fieldDate >= fromDate &&
												fieldDate <= toDate
											);
										} else if (fromDate) {
											return fieldDate >= fromDate;
										} else if (toDate) {
											return fieldDate <= toDate;
										}

										return true;
									})();

									return matchesText && matchesDateRange;
								});

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

						<DragOverlay
							adjustScale={false}
							dropAnimation={null}
							style={{
								cursor: 'grabbing',
							}}
							modifiers={[centerOnDragHandle]}
						>
							{activeField ? (
								<DragOverlayRow
									field={activeField}
									fieldTypes={customFieldsTypes}
								/>
							) : null}
						</DragOverlay>
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
					groups={groups.filter(
						(group) => group.id !== deleteGroupId
					)}
					onDelete={deleteGroup}
				/>
			</div>
		);
	}
);

CustomFields.displayName = 'CustomFields';
export default CustomFields;
