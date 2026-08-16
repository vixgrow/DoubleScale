/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import Select from 'react-select';
import { find, flatMap } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@doublescale/config';
import { isObject, map } from 'lodash';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { mappingSelectComponents } from './mapping-select-components';
import { getMappingSelectStyles } from './mapping-select-styles';
import { reactSelectMenuPortalProps } from '../react-select-shared-styles';

interface ContactMappedFieldsCsvProps {
	onChange: (value: { [key: string]: string }) => void;
	values: { [key: string]: string };
	fields: {
		[key: string]: {
			label: string;
		};
	};
}

const ContactMappedFieldsCsv: React.FC<ContactMappedFieldsCsvProps> = ({
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
		label: __('None', 'doublescale'),
		value: '',
	});

	const mappingSelectStyles = getMappingSelectStyles();
	const readonlyFieldClass =
		'h-10 w-full min-w-0 rounded-lg border border-border bg-[#EFF1F4] text-sm text-[#6B7280] shadow-sm disabled:opacity-100';

	return (
		<div className="contact-mapped-fields-csv-section">
			<div className="mb-6">
				<h3 className="text-lg font-semibold leading-7 text-primaryText">
					{__('Mapping the file', 'doublescale')}
				</h3>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					{__(
						'Select the column field you want to map on the system to import.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="contact-mapped-fields-csv-rows flex flex-col gap-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
					<div className="text-sm font-semibold text-primaryText">
						<span>{__('Field', 'doublescale')}</span>{' '}
						<span className="text-destructive">*</span>
					</div>
					<div className="text-sm font-semibold text-primaryText">
						<span>{__('Contact Field', 'doublescale')}</span>{' '}
						<span className="text-destructive">*</span>
					</div>
				</div>
				{map(fields, (_, key) => (
					<div
						key={key}
						className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5"
					>
						<Input
							value={fields[key].label}
							disabled
							className={cn('min-w-0', readonlyFieldClass)}
						/>
						<Select
							className="react-select-container min-w-0 w-full"
							classNamePrefix="react-select"
							placeholder={__('Select field', 'doublescale')}
							onChange={(option) => {
								if (
									!isObject(option) ||
									!('value' in option)
								) {
									return;
								}

								onChange({
									...values,
									[key]: String(
										(option as { value: string }).value
									),
								});
							}}
							value={values ? getAllValue(values[key]) : null}
							options={options}
							styles={mappingSelectStyles}
							components={mappingSelectComponents}
							isSearchable={false}
							menuShouldBlockScroll
							blurInputOnSelect={false}
							{...reactSelectMenuPortalProps}
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default ContactMappedFieldsCsv;
