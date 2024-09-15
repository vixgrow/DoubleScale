/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Typography, Button, Modal, Popconfirm, Flex, Skeleton } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { map, keys, omit } from 'lodash';
import { useDroppable, useDraggable, DndContext } from '@dnd-kit/core';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	CustomFieldsGroups,
	CustomFieldsGroup,
	CustomField,
} from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
import { Field } from '@quillcrm/components';

function Droppable({ children, id, title }) {
	const { setNodeRef } = useDroppable({
		id: id,
	});
	return (
		<Flex
			vertical
			ref={setNodeRef}
			gap={10}
			className="custom-fields-group"
		>
			<Typography.Title level={5} className="custom-fields-group-title">
				{title}
			</Typography.Title>
			<Flex gap={20} vertical className="custom-fields-group-items">
				{children}
			</Flex>
		</Flex>
	);
}

const Draggable = (props) => {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: props.id,
	});
	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition:
					'transform 0.25s cubic-bezier(0.15, 0.59, 0.29, 0.99)',
			}
		: undefined;

	return (
		<Flex
			ref={setNodeRef}
			style={{
				...style,
				cursor: 'pointer',
			}}
			{...listeners}
			{...attributes}
			gap={10}
			className="custom-fields-item"
			align="center"
			justify="space-between"
		>
			<Typography.Text>{props.children}</Typography.Text>
			<Flex gap={10}>
				<Button
					onClick={() => {
						console.log(Math.random());
					}}
					icon={<EditOutlined />}
				/>
				<Popconfirm
					title={__('Are you sure you want to delete this field?')}
					onConfirm={props.onDelete}
				>
					<Button danger icon={<DeleteOutlined />} />
				</Popconfirm>
			</Flex>
		</Flex>
	);
};

const CustomFields: React.FC = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [groups, setGroups] = useState<CustomFieldsGroup[]>([
		{
			id: 1,
			name: 'Group 1',
			slug: 'group-1',
			custom_fields: [],
			created_at: '2021-09-01',
			updated_at: '2021-09-01',
		},
	]);
	const [customField, setCustomField] = useState({
		name: '',
		type: '',
		group_id: 0,
	});
	const [visible, setVisible] = useState<boolean>(false);
	const [isAdding, setIsAdding] = useState<boolean>(false);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [selectedField, setSelectedField] = useState<CustomField | null>(
		null
	);
	const [group, setGroup] = useState({
		name: '',
	});
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [addGroupVisible, setAddGroupVisible] = useState<boolean>(false);
	const customFieldsTypes = ConfigAPI.getCustomFieldsTypes();
	const { createNotice } = useDispatch('quillcrm/core');

	const typesOptions = map(keys(customFieldsTypes), (type) => ({
		label: customFieldsTypes[type].name,
		value: type,
	}));

	const groupOptions = [
		{
			value: 0,
			label: __('Select a group', 'quillcrm'),
			style: {
				display: 'none',
			},
		},
		...map(groups, (group) => ({
			label: group.name,
			value: group.id,
		})),
	];

	const fetchGroups = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/custom-fields-groups'),
			})) as CustomFieldsGroups;

			setGroups(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch custom fields', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchGroups();
	}, []);

	const addField = async () => {
		setIsAdding(true);

		try {
			const response = (await apiFetch({
				path: '/qc/v1/custom-fields',
				method: 'POST',
				data: customField,
			})) as CustomField;

			const updatedGroups = map(groups, (group) => {
				if (group.id === response.group_id) {
					return {
						...group,
						custom_fields: group.custom_fields.concat(response),
					};
				}

				return group;
			});
			setGroups(updatedGroups);
			setVisible(false);
			createNotice({
				type: 'success',
				message: __('Custom field added', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to add custom field', 'quillcrm'),
			});
		} finally {
			setIsAdding(false);
		}
	};

	const editField = async () => {
		if (!selectedField) {
			return;
		}
		setIsEditing(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/custom-fields/${selectedField.id}`,
				method: 'PUT',
				data: selectedField,
			})) as CustomField;

			const updatedGroups = map(groups, (group) => {
				if (group.id === response.group_id) {
					const updatedFields = map(group.custom_fields, (field) => {
						if (field.id === response.id) {
							return response;
						}

						return field;
					});

					return {
						...group,
						custom_fields: updatedFields,
					};
				}

				return group;
			});

			setGroups(updatedGroups);
			setVisible(false);
			createNotice({
				type: 'success',
				message: __('Custom field edited', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to edit custom field', 'quillcrm'),
			});
		} finally {
			setIsEditing(false);
		}
	};

	const deleteField = async () => {
		if (!selectedField) {
			return;
		}

		try {
			await apiFetch({
				path: `/qc/v1/custom-fields/${selectedField.id}`,
				method: 'DELETE',
			});

			const updatedGroups = map(groups, (group) => {
				if (group.id === selectedField.group_id) {
					return omit(group, selectedField.id);
				}

				return group;
			});

			setGroups(updatedGroups);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to delete custom field', 'quillcrm'),
			});
		}
	};

	const saveField = async (field: CustomField) => {
		try {
			const response = (await apiFetch({
				path: `/qc/v1/custom-fields/${field.id}`,
				method: 'PUT',
				data: field,
			})) as CustomField;
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to save custom field', 'quillcrm'),
			});
		}
	};

	const addGroup = async () => {
		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: '/qc/v1/custom-fields-groups',
				method: 'POST',
				data: group,
			})) as CustomFieldsGroup;

			setGroups([...groups, response]);
			setVisible(false);
			createNotice({
				type: 'success',
				message: __('Group added', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to add group', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const getField = (fieldId: number): CustomField | null => {
		let field = null;
		map(groups, (group) => {
			map(group.custom_fields, (f) => {
				if (f.id === fieldId) {
					field = f;
				}
			});
		});

		return field;
	};

	const moveField = (
		groups: CustomFieldsGroups,
		fieldId: number,
		groupId: number
	) => {
		const field = getField(fieldId);
		if (!field || field.group_id == groupId) {
			return groups;
		}

		const newField = {
			...field,
			group_id: groupId,
		};

		const updatedGroups = map(groups, (group) => {
			if (group.id == groupId) {
				return {
					...group,
					custom_fields: [...group.custom_fields, newField],
				};
			}

			if (group.id == field.group_id) {
				return {
					...group,
					custom_fields: group.custom_fields.filter(
						(f) => f.id !== fieldId
					),
				};
			}

			return group;
		});

		saveField(newField);

		return updatedGroups;
	};

	if (loading) {
		return <Skeleton active />;
	}

	return (
		<div className="custom-fields">
			<Flex
				className="qcrm-contacts-list__actions"
				justify="space-between"
			>
				<Button onClick={() => setAddGroupVisible(true)}>
					{__('Add Group')}
				</Button>
				<Button type="primary" onClick={() => setVisible(true)}>
					{__('Add Field')}
				</Button>
			</Flex>
			<Flex gap={10}>
				<DndContext
					onDragEnd={({ active, over }) => {
						if (!over) {
							return;
						}

						// @ts-ignore
						const fieldId = active.id.split('-');
						// @ts-ignore
						const groupId = over.id.split('-');

						const updatedGroups = moveField(
							[...groups],
							parseInt(fieldId[1]),
							parseInt(groupId[1])
						);

						setGroups(updatedGroups);
					}}
				>
					{map(groups, (group: CustomFieldsGroup) => (
						<Droppable
							key={group.id}
							id={`group-${group.id}`}
							title={group.name}
						>
							{map(group.custom_fields, (field: CustomField) => (
								<Draggable
									key={field.id}
									id={`field-${field.id}`}
									onEdit={() => {
										setSelectedField(field);
										setVisible(true);
									}}
									onDelete={() => {
										setSelectedField(field);
										deleteField();
									}}
								>
									{field.name}
								</Draggable>
							))}
						</Droppable>
					))}
				</DndContext>
			</Flex>
			<Modal
				title={selectedField ? __('Edit Field') : __('Add Field')}
				open={visible}
				onOk={selectedField ? editField : addField}
				onCancel={() => setVisible(false)}
				footer={[
					<Button key="cancel" onClick={() => setVisible(false)}>
						{__('Cancel')}
					</Button>,
					<Button
						loading={isEditing || isAdding}
						onClick={selectedField ? editField : addField}
						type="primary"
					>
						{__('Save')}
					</Button>,
				]}
			>
				<div className="qcrm-fields">
					<Field
						label={__('Name', 'quillcrm')}
						value={
							selectedField
								? selectedField.name
								: customField.name
						}
						onChange={(value) => {
							if (selectedField) {
								setSelectedField({
									...selectedField,
									name: value,
								});
							} else {
								setCustomField({
									...customField,
									name: value,
								});
							}
						}}
						type="text"
					/>
					<Field
						label={__('Type', 'quillcrm')}
						value={
							selectedField
								? selectedField.type
								: customField.type
						}
						onChange={(value) => {
							if (selectedField) {
								setSelectedField({
									...selectedField,
									type: value,
								});
							} else {
								setCustomField({
									...customField,
									type: value,
								});
							}
						}}
						type="select"
						options={typesOptions}
					/>
					<Field
						label={__('Group', 'quillcrm')}
						value={
							selectedField
								? selectedField.group_id
								: customField.group_id
						}
						onChange={(value) => {
							if (selectedField) {
								setSelectedField({
									...selectedField,
									group_id: value,
								});
							} else {
								setCustomField({
									...customField,
									group_id: value,
								});
							}
						}}
						type="select"
						options={groupOptions as any}
					/>
				</div>
			</Modal>
			<Modal
				title={__('Add Group', 'quillcrm')}
				open={addGroupVisible}
				onOk={addGroup}
				onCancel={() => setAddGroupVisible(false)}
				footer={[
					<Button
						key="cancel"
						onClick={() => setAddGroupVisible(false)}
					>
						{__('Cancel')}
					</Button>,
					<Button
						loading={isSaving}
						onClick={addGroup}
						type="primary"
					>
						{__('Save')}
					</Button>,
				]}
			>
				<div className="qcrm-fields">
					<Field
						label={__('Name', 'quillcrm')}
						value={group.name}
						onChange={(value) => {
							setGroup({
								...group,
								name: value,
							});
						}}
						type="text"
					/>
				</div>
			</Modal>
		</div>
	);
};

export default CustomFields;
