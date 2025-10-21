/**
 * External dependencies
 */
import { map } from 'lodash';
import { Tabs } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import Field from '../field';

type FieldType = {
	label: string;
	type: string;
	options?: {
		[key: string]: string;
	};
	multiple?: boolean;
	fields?: {
		[key: string]: FieldType;
	};
	endpoint?: string;
	settings?: {
		ajax_action?: string;
		button_text?: string;
	};
	'default-value'?: string;
	helperText?: string;
};

type FieldsType = {
	[key: string]: FieldType;
};

interface FieldsProps {
	fields: FieldsType;
	values: { [key: string]: any };
	onChange: (value: any) => void;
	enableMergeTags?: boolean;
	stepId?: number;
}

const Fields: React.FC<FieldsProps> = ({
	fields,
	values,
	onChange, enableMergeTags = false,
	stepId,
}) => {
	const handleChange = (key: string, value: any) => {
		const newValues = {
			...values,
			[key]: value,
		};

		onChange(newValues);
	};

	const optionsArray = (field: FieldType) => {
		const options = map(field.options, (label, value) => {
			return { label, value };
		});

		return options;
	};

	const processHelperText = (
		helperText: string | undefined
	): string | undefined => {
		if (!helperText || !stepId) {
			return helperText;
		}

		// Replace STEP_ID placeholder with actual step ID
		return helperText.replace(/STEP_ID/g, stepId.toString());
	};

	// Check if any field is a tab type
	const hasTabs = Object.values(fields).some(
		(field) => field.type === 'group'
	);

	if (hasTabs) {
		// Create tab items
		const tabItems = Object.entries(fields)
			.filter(([, field]) => field.type === 'group')
			.map(([key, field]) => ({
				key,
				label: field.label,
				children: (
					<div
						className="qcrm-tab-content"
						style={{ padding: '20px 0' }}
					>
						{field.fields &&
							map(field.fields, (tabField, tabFieldKey) => {
								return (
									<Field
										key={tabFieldKey}
										label={tabField.label}
										type={tabField.type}
										options={optionsArray(tabField)}
										value={values?.[tabFieldKey]}
										onChange={(value) =>
											handleChange(tabFieldKey, value)
										}
										fields={tabField.fields}
										endpoint={tabField.endpoint}
										multiple={tabField.multiple}
										settings={tabField.settings}
										allValues={values}
										defaultValue={tabField['default-value']}
										helperText={processHelperText(
											tabField.helperText
										)}
									/>
								);
							})}
					</div>
				),
			}));

		return (
			<div className="qcrm-fields" style={{ marginBottom: '20px' }}>
				<Tabs items={tabItems} type="card" style={{ width: '100%' }} />
			</div>
		);
	}

	// Fallback to regular field rendering if no tabs
	return (
		<div className="qcrm-fields" style={{ marginBottom: '20px' }}>
			{map(fields, (field, key) => {
				return (
					<Field
						key={key}
						label={field.label}
						type={field.type}
						options={optionsArray(field)}
						value={values?.[key]}
						onChange={(value) => handleChange(key, value)}
						fields={field.fields}
						endpoint={field.endpoint}
						multiple={field.multiple}
						settings={field.settings}
						allValues={values}
						defaultValue={field['default-value']}
						enableMergeTags={enableMergeTags}
						helperText={processHelperText(field.helperText)}
					/>
				);
			})}
		</div>
	);
};

export default Fields;
