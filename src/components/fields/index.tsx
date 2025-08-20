/**
 * External dependencies
 */
import { map } from 'lodash';

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
		[key: string]: {
			label: string;
		};
	};
	endpoint?: string;
	settings?: {
		ajax_action?: string;
		button_text?: string;
	};
};

type FieldsType = {
	[key: string]: FieldType;
};

interface FieldsProps {
	fields: FieldsType;
	values: { [key: string]: any };
	onChange: (value: any) => void;
}

const Fields: React.FC<FieldsProps> = ({ fields, values, onChange }) => {
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
						allValues={
							field.type === 'button' ||
							field.type === 'test_button'
								? values
								: undefined
						}
					/>
				);
			})}
		</div>
	);
};

export default Fields;
