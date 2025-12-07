/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * External dependencies
 */
import { Table, Flex, Typography, Select } from 'antd';

/**
 * Internal dependencies
 */
import { Switch } from '@quillcrm/components/ui/switch';
import { Field } from '../../../../components';

interface CustomField {
	key: string;
	label: string;
	type: string;
	raw_type?: string;
	group?: string;
	options?: Array<{ label: string; value: string }>;
}

interface CustomFieldsMapping {
	customFields: CustomField[];
	mapping: {
		field: string;
		assignedField: number[];
		auto: boolean;
		type?: string;
		group?: string;
		label?: string;
		options?: Array<{ label: string; value: string }>;
	}[];
	onChange: (
		value: {
			field: string;
			assignedField: number[];
			auto: boolean;
			type?: string;
			group?: string;
			label?: string;
			options?: Array<{ label: string; value: string }>;
		}[]
	) => void;
}

const CustomFieldsMapping: React.FC<CustomFieldsMapping> = ({
	customFields,
	mapping,
	onChange,
}) => {
	// Get useCustomFields hook from Pro plugin via filter
	const useCustomFieldsHook = applyFilters(
		'quillcrm_use_custom_fields_hook',
		null
	) as any;

	// Use the hook if available, otherwise provide empty defaults
	const customFieldsData = useCustomFieldsHook
		? useCustomFieldsHook('contact')
		: { groups: [], loading: false };

	const { groups = [], loading: isLoading = false } = customFieldsData || {};

	// Flatten all custom fields from all groups
	const availableCustomFields = useMemo(() => {
		if (!groups || groups.length === 0) {
			return [];
		}

		return groups.reduce((acc: any[], group: any) => {
			if (group.custom_fields && Array.isArray(group.custom_fields)) {
				return [...acc, ...group.custom_fields];
			}
			return acc;
		}, []);
	}, [groups]);

	// Filter QuillCRM custom fields by type to match the source field type
	const getFilteredCustomFields = (sourceFieldType: string) => {
		return availableCustomFields.filter(
			(cf: any) => cf.type === sourceFieldType
		);
	};

	const getOrAddFieldToMapped = (field: string) => {
		const index = mapping.findIndex((item) => item.field === field);
		if (index > -1) {
			return { ...mapping[index], index };
		}
		console.log('mapping', mapping);
		return { field, assignedField: [], auto: false, index: -1 };
	};

	return (
		<>
			<Flex
				justify="space-between"
				align="center"
				style={{ marginBottom: 16 }}
			>
				<Typography.Text type="secondary">
					{__(
						'Map custom fields from source to QuillCRM custom fields',
						'quillcrm'
					)}
				</Typography.Text>
			</Flex>
			<Table
				dataSource={customFields}
				rowKey="key"
				pagination={false}
				loading={isLoading}
				columns={[
					{
						title: __('Source Custom Field', 'quillcrm'),
						dataIndex: 'label',
						render: (label, record: CustomField) => (
							<>
								<div>{label}</div>
								<Typography.Text
									type="secondary"
									style={{ fontSize: '12px' }}
								>
									Type: {record.type}
								</Typography.Text>
							</>
						),
					},
					{
						title: __('Assign to (QuillCRM)', 'quillcrm'),
						render: (record: CustomField) => {
							const filteredFields = getFilteredCustomFields(
								record.type
							);
							const fieldKey = record.key;

							const options = filteredFields.map((cf: any) => ({
								label: cf.name,
								value: cf.id,
							}));

							return (
								<>
									{getOrAddFieldToMapped(fieldKey).auto ? (
										<Typography.Text>
											{__(
												'Custom field will be created automatically',
												'quillcrm'
											)}
										</Typography.Text>
									) : (
										<Field
											type="multiselect"
											options={options}
											value={
												getOrAddFieldToMapped(fieldKey)
													.assignedField
											}
											onChange={(value) => {
												const { field, index } =
													getOrAddFieldToMapped(
														fieldKey
													);
												if (index > -1) {
													mapping[
														index
													].assignedField = value;
													onChange([...mapping]);
												} else {
													onChange([
														...mapping,
														{
															field,
															assignedField:
																value,
															auto: false,
															type: record.type,
															group: record.group,
															label: record.label,
															options:
																record.options,
														},
													]);
												}
											}}
										/>
									)}
								</>
							);
						},
					},
					{
						title: __('Auto Create', 'quillcrm'),
						render: (record: CustomField) => {
							const fieldKey = record.key;

							return (
								<Switch
									checked={
										mapping.find(
											(item) => item.field === fieldKey
										)?.auto
									}
									onCheckedChange={(value) => {
										const { field, index } =
											getOrAddFieldToMapped(fieldKey);
										if (index > -1) {
											mapping[index].auto = value;

											onChange([...mapping]);
										} else {
											onChange([
												...mapping,
												{
													field,
													assignedField: [],
													auto: value,
													type: record.type,
													group: record.group,
													label: record.label,
													options: record.options,
												},
											]);
										}
									}}
								/>
							);
						},
					},
				]}
			/>
		</>
	);
};

export default CustomFieldsMapping;
