/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Skeleton, Typography, Collapse } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useContactContext } from '../state/context';
import { useCustomFields } from '../../custom-fields/use-customFields';
import Field from '@quillcrm/components/field';

const Profile: React.FC = () => {
	const { setContact, updateContact, isLoading, isUpdating, contact } =
		useContactContext();
	const { groups } = useCustomFields();

	// Helper function to get custom field value from contact
	const getCustomFieldValue = (fieldId: number, fieldType?: string) => {
		const customField = contact?.custom_fields?.find(
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
		if (!contact) return;

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

		const existingFieldIndex =
			contact.custom_fields?.findIndex((cf) => cf.id === fieldId) ?? -1;
		let updatedCustomFields = [...(contact.custom_fields || [])];

		if (existingFieldIndex >= 0) {
			// Update existing field
			updatedCustomFields[existingFieldIndex] = {
				...updatedCustomFields[existingFieldIndex],
				pivot: {
					...updatedCustomFields[existingFieldIndex].pivot,
					value: stringValue,
				},
			};
		} else {
			// Add new field (find field definition from groups)
			const fieldDefinition = groups
				.flatMap((group) => group.custom_fields)
				.find((field) => field.id === fieldId);

			if (fieldDefinition) {
				updatedCustomFields.push({
					...fieldDefinition,
					pivot: { value: stringValue },
				});
			}
		}

		setContact({
			...contact,
			custom_fields: updatedCustomFields,
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

	if (isLoading || !contact) {
		return <Skeleton active />;
	}

	return (
		<>
			<div className="qcrm-contact-profile">
				<Collapse defaultActiveKey={['1']}>
					<Collapse.Panel
						header={__('Contact Details', 'quillcrm')}
						key="1"
					>
						<div className="qcrm-contact-address qcrm-fields">
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('First Name', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													first_name: value,
												});
											},
										}}
									>
										{contact.first_name || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Last Name', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													last_name: value,
												});
											},
										}}
									>
										{contact.last_name || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Email', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													email: value,
												});
											},
										}}
									>
										{contact.email}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Phone', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													phone: value,
												});
											},
										}}
									>
										{contact.phone || '----'}
									</Typography.Text>
								</div>
							</div>
						</div>
					</Collapse.Panel>
				</Collapse>
				<Collapse defaultActiveKey={['1']}>
					<Collapse.Panel header={__('Address', 'quillcrm')} key="1">
						<div className="qcrm-contact-address qcrm-fields">
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Address 1', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													address_1: value,
												});
											},
										}}
									>
										{contact.address_1 || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Address 2', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													address_2: value,
												});
											},
										}}
									>
										{contact.address_2 || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('City', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													city: value,
												});
											},
										}}
									>
										{contact.city || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('State', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													state: value,
												});
											},
										}}
									>
										{contact.state || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Country', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													country: value,
												});
											},
										}}
									>
										{contact.country || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Zip', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													zip: value,
												});
											},
										}}
									>
										{contact.zip || '----'}
									</Typography.Text>
								</div>
							</div>
						</div>
					</Collapse.Panel>
				</Collapse>
				<Collapse defaultActiveKey={['1']}>
					<Collapse.Panel
						header={__('Custom Fields', 'quillcrm')}
						key="1"
					>
						<div className="qcrm-contact-custom-fields qcrm-fields">
							{groups && groups.length > 0 ? (
								groups.map((group) => (
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
										{group.custom_fields &&
											group.custom_fields.length > 0 && (
												<>
													<div
														className="qcrm-field-group-title"
														style={{
															marginBottom: '5px',
														}}
													>
														<Typography.Title
															level={5}
														>
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
															const fieldOptions =
																[
																	'select',
																	'multiselect',
																].includes(
																	customField.type
																)
																	? getFieldOptions(
																			customField
																		)
																	: undefined;

															return (
																<div
																	key={
																		customField.id
																	}
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
											)}
									</div>
								))
							) : (
								<div className="qcrm-field">
									<Typography.Text type="secondary">
										{__(
											'No custom fields available',
											'quillcrm'
										)}
									</Typography.Text>
								</div>
							)}
						</div>
					</Collapse.Panel>
				</Collapse>
			</div>
			<Button
				onClick={() => updateContact()}
				type="primary"
				loading={isUpdating}
				style={{ marginTop: '20px' }}
			>
				{__('Update Contact', 'quillcrm')}
			</Button>
		</>
	);
};

export default Profile;
