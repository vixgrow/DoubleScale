import { __ } from '@wordpress/i18n';
import './style.scss';
import getValidationRules from './validation-rules';
import Locations from '../locations';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Input } from '@doublescale/shared/ui/input';
import { Textarea } from '@doublescale/shared/ui/textarea';
import { DatePicker } from '@doublescale/shared/ui/date-picker';
import { Checkbox } from '@doublescale/shared/ui/checkbox';
import { Slider } from '@doublescale/shared/ui/slider';
import {
	RadioGroup,
	RadioGroupItem,
} from '@doublescale/shared/ui/radio-group';
import { Label } from '@doublescale/shared/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@doublescale/shared/ui/select';
import { BookingFormItem } from './form-bridge';

const isObjectOption = (option) => {
	return (
		typeof option === 'object' &&
		option !== null &&
		'label' in option &&
		'value' in option
	);
};

/** Mirrors antd InputNumber value/onChange behavior */
const NumberInput = ({ value, onChange, ...props }) => (
	<Input
		type="number"
		value={value ?? ''}
		onChange={(e) =>
			onChange?.(
				e.target.value === '' ? undefined : Number(e.target.value)
			)
		}
		{...props}
	/>
);

/** Mirrors antd Upload fileList shape for submit compatibility */
const FileUploadInput = ({ value, onChange, ...props }) => (
	<div className="flex items-center gap-2">
		<Input
			type="file"
			onChange={(e) => {
				const file = e.target.files?.[0];
				if (!file) {
					onChange?.([]);
					return;
				}
				onChange?.([
					{
						uid: '-1',
						name: file.name,
						status: 'done',
						originFileObj: file,
					},
				]);
			}}
			{...props}
		/>
		<span>{__('Upload', 'doublescale')}</span>
		{Array.isArray(value) && value[0]?.name ? (
			<span className="text-sm text-muted-foreground">{value[0].name}</span>
		) : null}
	</div>
);

/** Mirrors react-phone-input-2 binding used by antd Form.Item */
const PhoneInputField = ({ value, onChange, country, ...rest }) => (
	<PhoneInput
		country={country}
		value={value || ''}
		onChange={(phone) => onChange?.(phone)}
		{...rest}
	/>
);

const SelectInput = ({ value, onChange, options = [], placeholder, ...rest }) => (
	<Select
		value={value !== undefined && value !== null ? String(value) : undefined}
		onValueChange={onChange}
		{...rest}
	>
		<SelectTrigger>
			<SelectValue placeholder={placeholder || __('Select', 'doublescale')} />
		</SelectTrigger>
		<SelectContent>
			{options.map((option, index) => {
				if (isObjectOption(option)) {
					return (
						<SelectItem
							key={option.value}
							value={String(option.value)}
						>
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
		</SelectContent>
	</Select>
);

const RadioInput = ({ value, onChange, options = [] }) => (
	<RadioGroup value={value} onValueChange={onChange}>
		{options.map((option, index) => {
			const optionValue = isObjectOption(option)
				? String(option.value)
				: String(option);
			const optionLabel = isObjectOption(option) ? option.label : option;

			return (
				<div
					key={`${optionValue}-${index}`}
					className="flex items-center space-x-2"
				>
					<RadioGroupItem
						value={optionValue}
						id={`field-radio-${optionValue}-${index}`}
					/>
					<Label htmlFor={`field-radio-${optionValue}-${index}`}>
						{optionLabel}
					</Label>
				</div>
			);
		})}
	</RadioGroup>
);

const CheckboxField = ({ checked, onChange, label, required }) => (
	<Checkbox checked={checked} onCheckedChange={onChange}>
		{label}
		{required && <span className="required">*</span>}
	</Checkbox>
);

const FIELD_COMPONENTS = {
	text: (props) => <Input {...props} />,
	email: (props) => <Input {...props} />,
	textarea: (props) => <Textarea {...props} />,
	password: (props) => <Input type="password" {...props} />,
	number: (props) => <NumberInput {...props} />,
	phone: (props) => <PhoneInputField {...props} />,
	date: (props) => (
		<DatePicker
			value={props.value}
			onChange={props.onChange}
			placeholder={props.placeholder}
		/>
	),
	time: (props) => <Input type="time" {...props} />,
	datetime: (props) => <Input type="datetime-local" {...props} />,
	range: ({ value, onChange, min, max, settings, ...props }) => {
		const resolvedMin = min ?? settings?.min ?? 0;
		const resolvedMax = max ?? settings?.max ?? 100;

		return (
			<Slider
				value={[typeof value === 'number' ? value : resolvedMin]}
				onValueChange={(vals) => onChange?.(vals[0])}
				min={resolvedMin}
				max={resolvedMax}
				{...props}
			/>
		);
	},
	color: (props) => <Input type="color" {...props} />,
	file: (props) => <FileUploadInput {...props} />,
	select: (props) => <SelectInput {...props} />,
	radio: (props) => <RadioInput {...props} />,
	checkbox: ({ label, required, ...props }) => (
		<CheckboxField label={label} required={required} {...props} />
	),
};

const FormField = ({ field, id, countryCode }) => {
	const {
		type,
		label,
		value,
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

	const fieldProps = {
		value,
		options: updatedOptions,
		label,
		required,
		style,
		country: countryCode,
		...otherProps,
	};

	const rules = getValidationRules(field);

	return (
		<>
			{id === 'location-select' ? (
				<Locations locationFields={field} countryCode={countryCode} />
			) : (
				<div style={{ marginBottom: '24px' }}>
					<BookingFormItem
						style={{ marginBottom: 0 }}
						label={
							type !== 'checkbox' && (
								<div className="form-label">
									<p>
										{label}
										{required && (
											<span className="required">*</span>
										)}
									</p>
								</div>
							)
						}
						name={id}
						key={id}
						rules={rules}
						validateTrigger={['onChange', 'onBlur']}
						valuePropName={
							type === 'checkbox' ? 'checked' : 'value'
						}
						getValueFromEvent={
							type === 'checkbox'
								? (checked) => Boolean(checked)
								: undefined
						}
					>
						{FieldComponent(fieldProps)}
					</BookingFormItem>
					{helpText && <div className="help-text">{helpText}</div>}
				</div>
			)}
		</>
	);
};

export default FormField;
