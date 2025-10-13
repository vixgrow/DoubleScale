/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Integration as IntegrationType } from '@quillcrm/config';
import { Field } from '@quillcrm/components';

interface AppProps {
	integration: IntegrationType;
	fieldsValue: Record<string, any>;
	setFieldsValue: (value: Record<string, any>) => void;
}

const App: React.FC<AppProps> = ({
	integration,
	fieldsValue,
	setFieldsValue,
}) => {
	const { fields } = integration;

	return (
		<div className="space-y-4">
			{map(fields.app['properties'], (field, key) => {
				return (
					<Field
						key={key}
						label={field.label}
						value={fieldsValue[key]}
						onChange={(value) => {
							setFieldsValue({
								...fieldsValue,
								[key]: value,
							});
						}}
						type="text"
					/>
				);
			})}
		</div>
	);
};

export default App;
