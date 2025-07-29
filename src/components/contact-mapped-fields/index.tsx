/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import Select from 'react-select';
import { find, flatMap } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import { isObject, map } from 'lodash';
import { Input } from '@/components/ui/input';

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
		<div className="flex gap-[10px] flex-col">
			<div className="flex gap-5">
				<div className="flex flex-1 text-[#09090B] font-normal text-base">
					{__('Field')} <span className="text-red-600">*</span>
				</div>
				<div className="flex flex-1 pl-5 text-[#09090B] font-normal text-base">
					{__('Contact Field')}{' '}
					<span className="text-red-600">*</span>
				</div>
			</div>
			{map(fields, (_, key) => {
				return (
					<div key={key} className="flex gap-5">
						<Input
							value={fields[key].label}
							disabled
							className="flex-1"
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
							value={values ? getAllValue(values[key]) : null}
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
								menu: (base: any) => ({
									...base,
									color: 'black',
								}),
							}}
							isSearchable={false}
						/>
					</div>
				);
			})}
		</div>
	);
};

export default ContactMappedFields;
