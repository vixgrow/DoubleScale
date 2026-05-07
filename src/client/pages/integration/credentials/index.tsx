/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Integration as IntegrationType } from '@doublescale/config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SelectField from '../select-field';

interface CredentialsProps {
	integration: IntegrationType;
	slug: string;
	fieldsValue: Record<string, any>;
	setFieldsValue: (value: Record<string, any>) => void;
}

const Credentials: React.FC<CredentialsProps> = ({
	integration,
	slug,
	fieldsValue,
	setFieldsValue,
}) => {
	const { fields } = integration;

	const checkConditions = (conditions, fieldsValue) => {
		let result = true;

		map(conditions, (condition, field) => {
			if (result) {
				switch (condition.operator) {
					case '==':
						result = fieldsValue[field] === condition.value;
						break;
					case '!=':
						result = fieldsValue[field] !== condition.value;
						break;
					case '>':
						result = fieldsValue[field] > condition.value;
						break;
					case '<':
						result = fieldsValue[field] < condition.value;
						break;
					case '>=':
						result = fieldsValue[field] >= condition.value;
						break;
					case '<=':
						result = fieldsValue[field] <= condition.value;
						break;
					default:
						break;
				}
			}
		});

		return result;
	};

	return (
		<div className="space-y-4">
			{map(fields, (field, key) => {
				if (
					field.conditions &&
					!checkConditions(field.conditions, fieldsValue)
				) {
					return null;
				}

				return (
					<div key={key} className="space-y-2">
						<Label htmlFor={key}>{field.label}</Label>
						{!field.has_options && (
							<Input
								id={key}
								value={fieldsValue[key] || ''}
								onChange={(e) => {
									setFieldsValue({
										...fieldsValue,
										[key]: e.target.value,
									});
								}}
								className="h-12 bg-white"
							/>
						)}
						{field.has_options && (
							<SelectField
								integration={slug}
								slug={field.endpoint || ''}
								onChange={(value) => {
									setFieldsValue({
										...fieldsValue,
										[key]: value,
									});
								}}
								value={fieldsValue[key] || ''}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default Credentials;
