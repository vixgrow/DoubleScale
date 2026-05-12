/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, {
	forwardRef,
	useImperativeHandle,
	useState,
	useEffect,
	useRef,
} from 'react';
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { CustomFieldsSkeleton } from './custom-fields-skeleton';
/**
 * internal dependencies
 */
import { useCustomFields } from './use-customFields';
import {
	CustomFieldsRef,
	CustomFieldsProps,
	CustomField,
	CustomFieldsGroup,
} from '@doublescale/client';
import { PageHeader, PlusIcon, GradientGroupIcon, NoData, PageTabs, ContactsIcon, DealsIcon } from '@doublescale/components';
import { DataTableSearch } from '@/components/ui/data-table-search';
import { DataTableActions } from '@/components/ui/data-table-actions';
import { DroppableGroup } from './droppable-group';
import { FieldDialog } from './field-dialog';
import { GroupDialog } from './group-dialog';
import { DeleteGroupDialog } from './delete-group-dialog';
import { FieldTable } from './field-table';
import { DragOverlayRow } from './drag-overlay-row';
import ConfigAPI from '@doublescale/config';
import { Button } from '@/components/ui/button';
import { NoticeBanner } from '@doublescale/components';

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
	({ activeTab, scope: propScope = 'contact' }, ref) => {
		// Use scope from props but keep state for internal changes if needed
		const [scope, setScope] = useState<string>(propScope);

		// Update scope state when prop changes
		useEffect(() => {
			if (propScope !== scope) {
				setScope(propScope);
			}
		}, [propScope]);

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
			deleteSelectedFields,
			saveGroup,
			updateGroup,
			duplicateGroup,
			deleteGroup,
			moveField,
		} = useCustomFields(scope);

		const [visible, setVisible] = useState(false);
		const noticeBannerRef = useRef<HTMLDivElement>(null);
		const [addGroupVisible, setAddGroupVisible] = useState(false);
		const [deleteGroupVisible, setDeleteGroupVisible] = useState(false);
		const [selectedField, setSelectedField] = useState<CustomField | null>(
			null
		);
		const [editingGroup, setEditingGroup] =
			useState<CustomFieldsGroup | null>(null);
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
			openCreateGroupModal: () => {
				setEditingGroup(null);
				setAddGroupVisible(true);
			},
			openCreateFieldModal: () => {
				if (!groups || groups.length === 0) {
					showNotice({
						type: 'error',
						message: __(
							'Please create a group first before adding fields',
							'doublescale'
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
				// Convert selectedRowKeys to numbers
				const fieldIds = selectedRowKeys.map((key) => Number(key));
				await deleteSelectedFields(fieldIds);
				setSelectedRowKeys([]);
			}
		};

		const handleEditGroup = (group: CustomFieldsGroup) => {
			setEditingGroup(group);
			setAddGroupVisible(true);
		};

		const handleDuplicateGroup = async (group: CustomFieldsGroup) => {
			// Generate a unique copy name by checking existing group names
			let copyCounter = 1;
			let newName = `${group.name} (Copy)`;

			// Keep checking until we find a unique name
			while (groups?.some((g) => g.name === newName)) {
				copyCounter++;
				newName = `${group.name} (Copy ${copyCounter})`;
			}

			await duplicateGroup(group.id, newName);
		};

		const handleGroupDialogSave = async (name: string) => {
			// The scope is already set in the useCustomFields hook
			return await saveGroup(name);
		};

		const handleGroupDialogUpdate = async (
			groupId: number,
			name: string
		) => {
			// The scope is already set in the useCustomFields hook
			return await updateGroup(groupId, name);
		};

		const handleGroupDialogClose = () => {
			setAddGroupVisible(false);
			setEditingGroup(null);
		};

		// Scroll to notice banner when notice appears
		useEffect(() => {
			if (notice && noticeBannerRef.current) {
				noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}, [notice]);

		// Effect to reset UI state when scope changes
		useEffect(() => {
			// Reset UI state when scope changes
			setSelectedRowKeys([]);
			setGlobalFilter('');
			setDateRange({ from: null, to: null });
		}, [scope]);

		const allFields =
			groups?.flatMap((group) => group.custom_fields || []) || [];

		const scopeTabs = [
			{ value: 'contact', label: 'Contact', icon: <ContactsIcon /> },
			{ value: 'deal', label: 'Deal', icon: <DealsIcon /> },
		];

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
			getRowModel: () => ({
				rows: filteredFields.map((field) => ({
					original: field,
					id: field.id.toString(),
				})),
			}),
			getAllColumns: () => [],
			getColumn: () => null,
			getFilteredSelectedRowModel: () => ({
				rows: filteredFields
					.filter((field) => selectedRowKeys.includes(field.id))
					.map((field) => ({
						original: field,
						id: field.id.toString(),
					})),
			}),
		};

		if (error) {
			return (
				<div className="custom-fields-error">
					<p>
						{__('Error loading custom fields:', 'doublescale')} {error}
					</p>
					<Button onClick={fetchGroups}>
						{__('Retry', 'doublescale')}
					</Button>
				</div>
			);
		}

		return (
			<div className="custom-fields mt-5">
				<PageHeader
					title={__('Custom Fields', 'doublescale')}
					actions={[
						{
							label: __('Add Field', 'doublescale'),
							onClick: () => {
								if (!groups || groups.length === 0) {
									showNotice({
										type: 'error',
										message: __(
											'Please create a group first before adding fields',
											'doublescale'
										),
									});
									return;
								}
								setSelectedField(null);
								setVisible(true);
							},
							variant: 'tertiary',
							icon: <PlusIcon />,
						},
						{
							label: __('Add Group', 'doublescale'),
							onClick: () => {
								setEditingGroup(null);
								setAddGroupVisible(true);
							},
							variant: 'default',
							icon: <PlusIcon />,
						},
					]}
				/>
				{/* Notice Banner */}
				{notice && (
					<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
				)}

				<PageTabs
					key={scope}
					defaultValue={scope}
					onValueChange={(value) => setScope(value)}
					tabsList={scopeTabs}
					tabsContent={[]}
					className="w-full mt-4"
					tabsListWrapperClassName="border rounded-lg px-5 py-3"
					tabsListClassName="bg-transparent text-foreground gap-2 justify-start"
				/>

				{/* Global Actions */}
				<div className="flex items-center justify-between p-5 border rounded-lg my-4 w-full">
					<div className="w-full">
						<DataTableSearch
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder={__('Search all fields...', 'doublescale')}
						/>
					</div>

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
								placeholder: __('Date Range', 'doublescale'),
							},
						}}
						activeTab={activeTab}
					/>
				</div>

				{/* Shimmer Effect - Now appears after global actions */}
				{loading && <CustomFieldsSkeleton />}

				{/* Groups List - Only show when not loading */}
				{!loading && (
					<>
						{/* Empty State - Show when no groups exist */}
						{(!groups || groups.length === 0) ? (
							<NoData
								icon={<GradientGroupIcon width={64} height={64} />}
								title={__('No custom field groups yet', 'doublescale')}
								subtitle={__('Create your first group to start organizing your custom fields.', 'doublescale')}
								onClick={() => {
									setEditingGroup(null);
									setAddGroupVisible(true);
								}}
								buttonLabel={__('Create Group', 'doublescale')}
							/>
						) : (
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
									{(groups || []).map((group) => {
										const groupFilteredFields = (
											group.custom_fields || []
										).filter((field) => {
											// Text filter
											const matchesText =
												globalFilter === '' ||
												field.name
													.toLowerCase()
													.includes(globalFilter.toLowerCase()) ||
												customFieldsTypes[field.type]?.name
													.toLowerCase()
													.includes(globalFilter.toLowerCase());

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
												deletable={(groups || []).length > 1}
												onDelete={() => {
													if (
														(group.custom_fields || []).length >
														0
													) {
														// Group has fields - show dialog to move fields
														setDeleteGroupId(group.id);
														setDeleteGroupVisible(true);
													} else {
														// Empty group - delete directly without newGroupId
														deleteGroup(group.id);
													}
												}}
												onEdit={() => handleEditGroup(group)}
												onDuplicate={() =>
													handleDuplicateGroup(group)
												}
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
						)}
					</>
				)}

				{/* Dialogs */}
				<FieldDialog
					visible={visible}
					onClose={() => setVisible(false)}
					field={selectedField}
					groups={groups}
					fieldTypes={customFieldsTypes}
					onSave={saveField}
					currentScope={scope}
				/>

				<GroupDialog
					visible={addGroupVisible}
					onClose={handleGroupDialogClose}
					onSave={handleGroupDialogSave}
					onUpdate={handleGroupDialogUpdate}
					editingGroup={editingGroup}
					currentScope={scope}
				/>

				<DeleteGroupDialog
					visible={deleteGroupVisible}
					onClose={() => setDeleteGroupVisible(false)}
					groupId={deleteGroupId}
					groups={(groups || []).filter(
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
