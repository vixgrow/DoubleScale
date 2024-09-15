/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Input, Typography, Checkbox, Switch, DatePicker } from 'antd';
import en from 'antd/es/date-picker/locale/en_US';
import dayjs from 'dayjs';
import type { InputProps } from 'antd';
import { map, isEmpty } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import './style.scss';
import { ListField, TagField, LinkTriggerField } from '@quillcrm/components';

interface FieldProps {
	label?: string;
	type: string;
	options?: Record<string, string>;
	onChange: (value: any) => void;
	value: any;
	status?: InputProps['status'];
}

const Field: React.FC<FieldProps> = ({
	label,
	type,
	options,
	onChange,
	value,
	status,
}) => {
	let fieldContent;

	switch (type) {
		case 'lists':
			fieldContent = (
				<ListField
					value={value || []}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'tags':
			fieldContent = (
				<TagField
					value={value || []}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'link-triggers':
			fieldContent = (
				<LinkTriggerField
					value={value || []}
					onChange={(value) => onChange(value)}
				/>
			);
			break;
		case 'text':
		case 'number':
		case 'email':
		case 'url':
			fieldContent = (
				<Input
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					type={type}
					status={status || ''}
				/>
			);
			break;
		case 'textarea':
			fieldContent = (
				<Input.TextArea
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					status={status || ''}
				/>
			);
			break;
		case 'select':
			const selectOptions = map(options, (label, value) => ({
				label,
				value,
			}));
			fieldContent = (
				<Select
					value={
						value
							? selectOptions.find(
									(option) => option.value === value
								)
							: null
					}
					onChange={(value) => onChange(value.value)}
					options={selectOptions}
				/>
			);
			break;
		case 'multiselect':
			const multiOptions = map(options, (label, value) => ({
				label,
				value,
			}));
			fieldContent = (
				<Select
					onChange={(value) => {
						const values = value.map((val: any) => val.value);
						onChange(values);
					}}
					options={multiOptions}
					value={multiOptions.filter((option) =>
						value?.includes(option.value)
					)}
					isMulti
				/>
			);
			break;
		case 'checkbox':
			fieldContent = (
				<Checkbox
					checked={value}
					onChange={(e) => onChange(e.target.checked)}
				/>
			);
			break;
		case 'switch':
			fieldContent = (
				<Switch
					checked={value}
					onChange={(checked) => onChange(checked)}
				/>
			);
			break;
		case 'date':
			fieldContent = (
				<DatePicker
					value={!isEmpty(value) ? dayjs(value) : null}
					onChange={(value) =>
						onChange(dayjs(value).format('YYYY-MM-DD'))
					}
					locale={en}
				/>
			);
			break;
		default:
			fieldContent = null;
	}

	return (
		<div className="qcrm-field">
			{label && (
				<div className="qcrm-field-label">
					<Typography.Text>{label}</Typography.Text>
				</div>
			)}
			<div className="qcrm-field-input">{fieldContent}</div>
		</div>
	);
};

export default Field;
