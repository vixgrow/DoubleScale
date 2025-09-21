import { __ } from '@wordpress/i18n';
import { Button, Typography } from 'antd';
import { useCustomFields } from '../../../custom-fields/use-customFields';
import Field from '@quillcrm/components/field';
import { useDealOperations } from '../../hooks/use-deal-operations';
import { useState, useEffect } from 'react';
import { useDispatch } from '@wordpress/data';
import { Deal } from '../../types';

interface DealCustomFieldsProps {
	deal: Deal;
}

export const DealCustomFields: React.FC<DealCustomFieldsProps> = ({ deal }) => {
	const { groups } = useCustomFields('deal');
	const { updateDeal } = useDealOperations();
	const [updatedCustomFields, setUpdatedCustomFields] = useState<any[]>(
		deal?.custom_fields || []
	);
	const { createNotice } = useDispatch('quillcrm/core');

	// Update state when deal changes
	useEffect(() => {
		if (deal?.custom_fields) {
			setUpdatedCustomFields(deal.custom_fields);
		}
	}, [deal]);

	// Helper function to get custom field value from deal
	const getCustomFieldValue = (fieldId: number, fieldType?: string) => {
		// First check in our updated state
		const updatedField = updatedCustomFields.find(
			(cf) => cf.id === fieldId
		);
		if (updatedField && updatedField.pivot) {
			const value = updatedField.pivot.value || '';

			// Convert string values to appropriate types
			if (fieldType === 'boolean' || fieldType === 'checkbox') {
				return value === 'true';
			}

			return value;
		}

		// Fall back to original deal data if not found in updated fields
		const customField = deal?.custom_fields?.find(
			(cf) => cf.id === fieldId
		);
		const value = customField?.pivot?.value || '';

		// Convert string values to appropriate types
		if (fieldType === 'boolean' || fieldType === 'checkbox') {
			return value === 'true';
		}

		return value;
	};

	// Helper function to update custom field value
	const updateCustomFieldValue = (
		fieldId: number,
		value: string | boolean | string[]
	) => {
		if (!deal) return;

		// Convert all values to strings for storage (API expects strings)
		let stringValue: string;
		if (typeof value === 'boolean') {
			stringValue = value.toString();
		} else if (Array.isArray(value)) {
			// For multiselect, join array values with commas
			stringValue = value.join(',');
		} else {
			stringValue = value;
		}

		// Use the current state to update the fields
		setUpdatedCustomFields((prevFields) => {
			const existingFieldIndex = prevFields.findIndex(
				(cf) => cf.id === fieldId
			);
			const newFields = [...prevFields];

			if (existingFieldIndex >= 0) {
				// Update existing field
				newFields[existingFieldIndex] = {
					...newFields[existingFieldIndex],
					value: stringValue,
					pivot: {
						...newFields[existingFieldIndex].pivot,
						value: stringValue,
					},
				};
			} else {
				// Add new field (find field definition from groups)
				const fieldDefinition = groups
					.flatMap((group) => group.custom_fields)
					.find((field) => field.id === fieldId);

				if (fieldDefinition) {
					newFields.push({
						...fieldDefinition,
						value: stringValue,
						pivot: { value: stringValue },
					});
				}
			}

			return newFields;
		});
	};

	// Helper function to get options from custom field attributes
	const getFieldOptions = (customField: any) => {
		if (!customField.attributes) {
			return [];
		}

		let options;

		// Check if attributes is directly an array (like ["ee1", "ee2"])
		if (Array.isArray(customField.attributes)) {
			options = customField.attributes;
		} else if (customField.attributes.options) {
			// Check if attributes has an options property
			options = customField.attributes.options;
		} else {
			return [];
		}

		// If options is already in correct format [{label, value}]
		if (
			Array.isArray(options) &&
			options.length > 0 &&
			typeof options[0] === 'object' &&
			options[0].label &&
			options[0].value
		) {
			return options;
		}

		// If options is an object {value: label}
		if (typeof options === 'object' && !Array.isArray(options)) {
			return Object.entries(options).map(([value, label]) => ({
				value,
				label: String(label),
			}));
		}

		// If options is an array of strings
		if (
			Array.isArray(options) &&
			options.length > 0 &&
			typeof options[0] === 'string'
		) {
			return options.map((option) => ({
				value: option,
				label: option,
			}));
		}

		return [];
	};

	// Helper function to get formatted value for multiselect
	const getMultiselectValue = (fieldValue: string) => {
		if (!fieldValue) return [];
		return fieldValue.split(',').filter((val) => val.trim() !== '');
	};

	return (
		<>
			<div className="qcrm-deal-custom-fields qcrm-fields">
				{groups && groups.length > 0 ? (
					groups.map((group) => (
						<>
							{group.custom_fields &&
								group.custom_fields.length > 0 && (
									<div
										key={group.id}
										style={{
											border: '1px solid #f0f0f0',
											backgroundColor: '#F7FAFC',
											borderRadius: '5px',
											padding: '10px',
											marginBottom: '10px',
											marginTop: '10px',
										}}
									>
										<>
											<div
												className="qcrm-field-group-title"
												style={{
													marginBottom: '5px',
												}}
											>
												<Typography.Title level={5}>
													{group.name}
												</Typography.Title>
											</div>
											{group.custom_fields.map(
												(customField) => {
													const fieldValue =
														getCustomFieldValue(
															customField.id,
															customField.type
														);

													// Get formatted value for multiselect
													const formattedValue =
														customField.type ===
														'multiselect'
															? getMultiselectValue(
																	fieldValue as string
																)
															: fieldValue;

													// Get options for select/multiselect fields
													const fieldOptions = [
														'select',
														'multiselect',
													].includes(customField.type)
														? getFieldOptions(
																customField
															)
														: undefined;

													return (
														<div
															key={customField.id}
															className="qcrm-field inline"
														>
															<div className="qcrm-field-label">
																<Typography.Text>
																	{
																		customField.name
																	}
																</Typography.Text>
																{customField.type && (
																	<Typography.Text
																		type="secondary"
																		style={{
																			fontSize:
																				'11px',
																			fontStyle:
																				'italic',
																		}}
																	>
																		(
																		{
																			customField.type
																		}
																		)
																	</Typography.Text>
																)}
															</div>
															<div className="qcrm-field-input">
																<Field
																	type={
																		customField.type
																	}
																	value={
																		formattedValue
																	}
																	options={
																		fieldOptions
																	}
																	onChange={(
																		value
																	) =>
																		updateCustomFieldValue(
																			customField.id,
																			value
																		)
																	}
																/>
															</div>
														</div>
													);
												}
											)}
										</>
									</div>
								)}
						</>
					))
				) : (
					<div className="qcrm-field">
						<Typography.Text type="secondary">
							{__('No custom fields available', 'quillcrm')}
						</Typography.Text>
					</div>
				)}
			</div>

			<div style={{ marginTop: '20px' }}>
				<Button
					type="primary"
					onClick={async () => {
						await updateDeal(deal.id, {
							custom_fields: updatedCustomFields,
						});

						if (createNotice) {
							createNotice({
								type: 'success',
								message: __(
									`Deal "${deal.title}" custom fields updated`,
									'quillcrm'
								),
							});
						}
					}}
				>
					{__('Update Custom Fields', 'quillcrm')}
				</Button>
			</div>
		</>
	);
};

export default DealCustomFields;
