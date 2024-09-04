/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import Field from '../field';

interface FieldsProps {
	fields: any;
	values: any;
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

	return (
		<div className="qcrm-fields" style={{ marginBottom: '20px' }}>
			{map(fields, (field, key) => {
				return (
					<Field
						key={key}
						label={field.label}
						type={field.type}
						options={field.options}
						value={values?.[key]}
						onChange={(value) => handleChange(key, value)}
					/>
				);
			})}
		</div>
	);
};

export default Fields;
