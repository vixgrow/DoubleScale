/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Typography, Flex, Input } from 'antd';
import Select from 'react-select';
import { find, flatMap } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import { isObject, map } from 'lodash';

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

	const getAllValue = (value: string) => {
		if (!value) {
			return null;
		}

		const groups = flatMap(contactFieldsGroups, (group) => group.fields);
		const field = find(groups, (fields) => fields[value]);

		return field ? { label: field[value].label, value } : null;
	};

	const options = map(contactFieldsGroups, (group, groupKey) => ({
		label: group.label,
		value: groupKey,
		options: map(group.fields, (field, fieldKey) => ({
			label: field.label,
			value: fieldKey,
		})),
	}));

	// @ts-ignore The none option not a group.
	options.unshift({
		label: __('None', 'quillcrm'),
		value: '',
	});

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
						<Input
							value={fields[key].label}
							disabled
							style={{ flex: 1 }}
						/>
						<Select
							onChange={(value) => {
								if (!isObject(value)) {
									return;
								}

								onChange({
									...values,
									[key]: value.value,
								});
							}}
							value={getAllValue(values[key])}
							options={options}
							styles={{
								control: (styles) => ({
									...styles,
									flex: 1,
								}),
								container: (styles) => ({
									...styles,
									flex: 1,
								}),
							}}
							isSearchable={false}
						/>
					</Flex>
				);
			})}
		</Flex>
	);
};

export default ContactMappedFields;
