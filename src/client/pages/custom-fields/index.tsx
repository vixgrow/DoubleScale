/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import {
	Typography,
	Table,
	Input,
	Button,
	Modal,
	Popconfirm,
	Select,
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { map, keys, omit } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { CustomFieldsGroups, CustomFieldsGroup, CustomField } from '../types';
import ConfigAPI from '@quillcrm/config';

const { Column } = Table;

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
	const customFieldsTypes = ConfigAPI.getCustomFieldsTypes();

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
			console.error(error);
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
		} catch (error) {
			console.error(error);
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
		} catch (error) {
			console.error(error);
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
			console.error(error);
		}
	};

	return (
		<div className="custom-fields">
			<div className="custom-fields-header">
				<Typography.Title level={4}>
					{__('Custom Fields')}
				</Typography.Title>
				<Button type="primary" onClick={() => setVisible(true)}>
					{__('Add Field')}
				</Button>
			</div>
			{map(groups, (group: CustomFieldsGroup) => (
				<div key={group.id} className="custom-fields-group">
					<Typography.Title level={4}>{group.name}</Typography.Title>
					<Table
						dataSource={group.custom_fields}
						loading={loading}
						rowKey="id"
						pagination={false}
					>
						<Column
							title={__('Name')}
							dataIndex="name"
							key="name"
						/>
						<Column
							title={__('Slug')}
							dataIndex="slug"
							key="slug"
						/>
						<Column
							title={__('Type')}
							dataIndex="type"
							key="type"
						/>
						<Column
							title={__('Actions')}
							key="actions"
							render={(field) => (
								<div className="custom-fields-actions">
									<Button
										type="link"
										icon={<EditOutlined />}
										onClick={() => {
											setSelectedField(field);
											setVisible(true);
										}}
									/>
									<Popconfirm
										title={__(
											'Are you sure you want to delete this field?'
										)}
										onConfirm={() => {
											setSelectedField(field);
											deleteField();
										}}
									>
										<Button
											type="link"
											danger
											icon={<DeleteOutlined />}
										/>
									</Popconfirm>
								</div>
							)}
						/>
					</Table>
				</div>
			))}

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
					>
						{__('Save')}
					</Button>,
				]}
			>
				<div className="qcrm-fields">
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Name', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Input
								value={
									selectedField
										? selectedField.name
										: customField.name
								}
								onChange={(e) => {
									if (selectedField) {
										setSelectedField({
											...selectedField,
											name: e.target.value,
										});
									} else {
										setCustomField({
											...customField,
											name: e.target.value,
										});
									}
								}}
							/>
						</div>
					</div>
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Type', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Select
								options={typesOptions}
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
								style={{ width: '100%' }}
							/>
						</div>
					</div>
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Group', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Select
								options={groupOptions}
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
								style={{ width: '100%' }}
							/>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default CustomFields;
