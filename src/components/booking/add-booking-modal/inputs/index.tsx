import { Upload as UploadIcon } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import './style.scss';
import Locations from '../locations';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const isObjectOption = (option) => {
	return (
		typeof option === 'object' &&
		option !== null &&
		'label' in option &&
		'value' in option
	);
};

const FIELD_COMPONENTS = {
	text: ({ size, ...props }) => <Input {...props} />,
	email: ({ size, ...props }) => <Input type="email" {...props} />,
	textarea: ({ size, ...props }) => <Textarea {...props} />,
	password: ({ size, ...props }) => <Input type="password" {...props} />,
	number: (props) => <Input type='number' {...props} />,
	phone: (props) => <Input type='tel' {...props} />,
	date: (props) => <Input type="date" {...props} />,
	time: (props) => <Input type="time" {...props} />,
	datetime: (props) => <Input type="datetime-local" {...props} />,
	range: ({ value, onChange, min = 0, max = 100, ...props }) => (
		<input type="range" min={min} max={max} value={value ?? 50} onChange={(e) => onChange?.(Number(e.target.value))} className="w-full" {...props} />
	),
	color: (props) => <Input type="color" {...props} />,
	file: ({ onChange, ...props }) => (
		<label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 hover:bg-muted">
			<UploadIcon className="w-4 h-4" /> {__('Upload', 'doublescale')}
			<input type="file" className="hidden" onChange={(e) => onChange?.(e.target.files)} {...props} />
		</label>
	),
	select: ({ options = [], value, onChange, ...props }) => {
		return (
            <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    {options.map((option, index) => {
                        if (isObjectOption(option)) {
                            return (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            );
                        }
                        return (
                            <SelectItem key={`${option}-${index}`} value={String(option)}>
                                {option}
                            </SelectItem>
                        );
                    })}
                </SelectContent></Select>
        );
	},
	radio: ({ options = [], value, onChange, ...props }) => (
		<RadioGroup value={value} onValueChange={onChange} {...props}>
			{options.map((option, index) => {
				const optVal = isObjectOption(option) ? option.value : String(option);
				const optLabel = isObjectOption(option) ? option.label : String(option);
				return (
					<div key={`${optVal}-${index}`} className="flex items-center space-x-2">
						<RadioGroupItem value={optVal} id={`radio-${optVal}`} />
						<label htmlFor={`radio-${optVal}`}>{optLabel}</label>
					</div>
				);
			})}
		</RadioGroup>
	),
	checkbox: ({ label, required, value, onChange, ...props }) => (
		<div className="flex items-center gap-2">
			<Checkbox
				checked={Boolean(value)}
				onCheckedChange={(checked) => onChange?.(Boolean(checked))}
				{...props}
			/>
			<span>{label}{required && <span className="text-red-500">*</span>}</span>
		</div>
	),
};

const FormField = ({ field, id, form }) => {
	const {
		type,
		label,
		value: defaultValue,
		options = [],
		helpText = null,
		required,
		...otherProps
	} = field;

	const FieldComponent = FIELD_COMPONENTS[type] || FIELD_COMPONENTS.text;
	const style = { width: '100%' };
	let updatedOptions = options;
	if (field.settings?.options?.length) {
		updatedOptions = field.settings.options;
	}

	if (id === 'name' || id === 'email') return null;

	if (id === 'location-select') {
		return (
			<Locations
				locationFields={field}
				value={form?.getFieldValue('location') ?? ''}
				onChange={(val) => form?.setFieldsValue({ location: val })}
				locationDataValue={form?.getFieldValue('location-data') ?? ''}
				onLocationDataChange={(val) =>
					form?.setFieldsValue({ 'location-data': val })
				}
			/>
		);
	}

	// Match QuillBooking's Form.Item naming so getFields() can strip the prefix
	// and submit the field map under the `fields` key — `id` here is the raw
	// schema id like `phone_number`, stored as `fields-phone_number`.
	const storageKey = `fields-${id}`;
	const currentValue = form?.getFieldValue(storageKey);
	const inputValue = currentValue !== undefined ? currentValue : defaultValue;

	const handleChange = (next) => {
		// Some FIELD_COMPONENTS (Input, Textarea, native range) pass an event;
		// others (Select, RadioGroup, Checkbox, file) pass the value directly.
		const value =
			next && typeof next === 'object' && 'target' in next
				? next.target.type === 'checkbox'
					? next.target.checked
					: next.target.value
				: next;
		form?.setFieldsValue({ [storageKey]: value });
	};

	const fieldProps = {
		value: inputValue ?? '',
		onChange: handleChange,
		options: updatedOptions,
		label,
		required,
		style,
		...otherProps,
	};

	return (
		<div style={{ marginBottom: '24px' }}>
			<div style={{ marginBottom: 0 }}>
				{type !== 'checkbox' && (
					<div className="form-label mb-1">
						<p>{label}{required && <span className="text-red-500"> *</span>}</p>
					</div>
				)}
				{FieldComponent(fieldProps)}
			</div>
			{helpText && <div className="help-text">{helpText}</div>}
		</div>
	);
};

export default FormField;
