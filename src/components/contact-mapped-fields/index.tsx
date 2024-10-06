/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Typography, Flex, Select, Input } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import { map } from 'lodash';

interface ContactMappedFieldsProps {
	onChange: (value: { [key: string]: string }) => void;
	values: { [key: string]: string };
	fields: {
		[key: string]: {
			label: string;
		};
	};
}

const ContactMappedFields: React.FC<ContactMappedFieldsProps> = ({
	onChange,
	values,
	fields,
}) => {
	const contactFieldsGroups = ConfigAPI.getContactFieldsGroups();

	return (
		<Flex gap={10} vertical>
			<Flex gap={20}>
				<Typography.Text style={{ flex: 1 }} strong>
					{__('Field')}
				</Typography.Text>
				<Typography.Text style={{ flex: 1 }} strong>
					{__('Contact Field')}
				</Typography.Text>
			</Flex>
			{map(fields, (_, key) => {
				return (
					<Flex key={key} gap={20}>
						<Input value={key} disabled style={{ flex: 1 }} />
						<Select
							onChange={(value) => {
								onChange({
									...values,
									[key]: value,
								});
							}}
							value={values?.[key] || ''}
							options={map(
								contactFieldsGroups,
								(group, groupKey) => ({
									label: group.label,
									value: groupKey,
									options: map(
										group.fields,
										(field, fieldKey) => ({
											label: field.label,
											value: fieldKey,
										})
									),
								})
							)}
							style={{ flex: 1 }}
						/>
					</Flex>
				);
			})}
		</Flex>
	);
};

export default ContactMappedFields;
