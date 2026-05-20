import { __ } from '@wordpress/i18n';
import { Upload as UploadIcon } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { Input } from '@doublescale/shared/ui/input';
import { Textarea } from '@doublescale/shared/ui/textarea';
import { Checkbox } from '@doublescale/shared/ui/checkbox';
import {
	RadioGroup,
	RadioGroupItem,
} from '@doublescale/shared/ui/radio-group';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@doublescale/shared/ui/select';
import { Slider } from '@doublescale/shared/ui/slider';

import { BookingFormItem } from './form-bridge';
import getValidationRules from './validation-rules';
import Locations from '../locations';
import './style.scss';

type Option = string | { label: string; value: string };

const isObjectOption = (
	option: unknown
): option is { label: string; value: string } =>
	typeof option === 'object' &&
	option !== null &&
	'label' in option &&
	'value' in option;

// Each FieldComponent receives `value`, `onChange`, and `onBlur` via
// React.cloneElement from BookingFormItem. Other antd-style props
// (placeholder, options, settings, country, label/required for checkbox)
// are forwarded by FormField as default props on the element.

type BridgeProps = {
	value?: unknown;
	onChange?: (next: unknown) => void;
	onBlur?: () => void;
};

const TextInput = ({
	value,
	onChange,
	onBlur,
	...rest
}: BridgeProps & React.InputHTMLAttributes<HTMLInputElement>) => (
	<Input
		value={(value as string | number | undefined) ?? ''}
		onChange={(e) => onChange?.(e.target.value)}
		onBlur={onBlur}
		{...rest}
	/>
);

const TextareaInput = ({
	value,
	onChange,
	onBlur,
	...rest
}: BridgeProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
	<Textarea
		value={(value as string | undefined) ?? ''}
		onChange={(e) => onChange?.(e.target.value)}
		onBlur={onBlur}
		{...rest}
	/>
);

const NumberInput = ({
	value,
	onChange,
	onBlur,
	...rest
}: BridgeProps & React.InputHTMLAttributes<HTMLInputElement>) => (
	<Input
		type="number"
		value={(value as string | number | undefined) ?? ''}
		onChange={(e) => {
			const raw = e.target.value;
			onChange?.(raw === '' ? undefined : Number(raw));
		}}
		onBlur={onBlur}
		{...rest}
	/>
);

/** Mirrors antd Upload — exposes a File[] via onChange so submit code can serialize it. */
const FileInput = ({ value: _value, onChange, ...rest }: BridgeProps) => (
	<label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
		<UploadIcon className="h-4 w-4" />
		<span>{__('Upload', 'doublescale')}</span>
		<input
			type="file"
			className="hidden"
			onChange={(e) => {
				const files = e.target.files ? Array.from(e.target.files) : [];
				onChange?.(files);
			}}
			{...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
		/>
	</label>
);

type SelectFieldProps = BridgeProps & {
	options?: Option[];
	placeholder?: string;
};

const SelectField = ({ value, onChange, options = [], placeholder }: SelectFieldProps) => (
	<Select
		value={(value as string | undefined) ?? undefined}
		onValueChange={(next) => onChange?.(next)}
	>
		<SelectTrigger className="w-full">
			<SelectValue placeholder={placeholder} />
		</SelectTrigger>
		<SelectContent>
			{options.map((option, index) => {
				if (isObjectOption(option)) {
					return (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					);
				}
				return (
					<SelectItem
						key={`${String(option)}-${index}`}
						value={String(option)}
					>
						{String(option)}
					</SelectItem>
				);
			})}
		</SelectContent>
	</Select>
);

type RadioFieldProps = BridgeProps & { options?: Option[] };

const RadioField = ({ value, onChange, options = [] }: RadioFieldProps) => (
	<RadioGroup
		value={(value as string | undefined) ?? ''}
		onValueChange={(next) => onChange?.(next)}
		className="mt-2 flex flex-col gap-3"
	>
		{options.map((option, index) => {
			const opt = isObjectOption(option)
				? option
				: { label: String(option), value: String(option) };
			const id = `radio-${opt.value}-${index}`;
			return (
				<label
					key={opt.value}
					htmlFor={id}
					className="flex items-center gap-2.5 cursor-pointer text-[15px] leading-none text-[#29292E]"
				>
					<RadioGroupItem
						value={opt.value}
						id={id}
						className="h-[18px] w-[18px] border border-[#D0D0D0] data-[state=checked]:border-[#3A3A99] [&_svg]:h-2 [&_svg]:w-2 [&_svg]:fill-[#3A3A99] [&_svg]:text-[#3A3A99]"
					/>
					<span>{opt.label}</span>
				</label>
			);
		})}
	</RadioGroup>
);

type CheckboxFieldProps = BridgeProps & {
	checked?: boolean;
	label?: string;
	required?: boolean;
};

const CheckboxField = ({
	checked,
	value,
	onChange,
	label,
	required,
}: CheckboxFieldProps) => (
	<label className="flex items-center gap-2 text-sm">
		<Checkbox
			checked={Boolean(checked ?? value)}
			onCheckedChange={(next) => onChange?.(Boolean(next))}
		/>
		<span>
			{label}
			{required && <span className="required">*</span>}
		</span>
	</label>
);

type SliderFieldProps = BridgeProps & {
	settings?: { min?: number; max?: number; step?: number };
};

const SliderField = ({ value, onChange, settings }: SliderFieldProps) => {
	const min = settings?.min ?? 0;
	const max = settings?.max ?? 100;
	const step = settings?.step ?? 1;
	return (
		<Slider
			min={min}
			max={max}
			step={step}
			value={[Number(value ?? min)]}
			onValueChange={(next) => onChange?.(next[0])}
		/>
	);
};

type PhoneFieldProps = BridgeProps & { country?: string };

const PhoneField = ({ value, onChange, country }: PhoneFieldProps) => (
	<PhoneInput
		country={country}
		value={(value as string | undefined) ?? ''}
		onChange={(next) => onChange?.(next)}
	/>
);

type FieldType =
	| 'text'
	| 'email'
	| 'textarea'
	| 'password'
	| 'number'
	| 'phone'
	| 'date'
	| 'time'
	| 'datetime'
	| 'range'
	| 'color'
	| 'file'
	| 'select'
	| 'radio'
	| 'checkbox';

const FIELD_COMPONENTS: Record<FieldType, React.ElementType> = {
	text: TextInput,
	email: TextInput,
	textarea: TextareaInput,
	password: TextInput,
	number: NumberInput,
	phone: PhoneField,
	date: TextInput,
	time: TextInput,
	datetime: TextInput,
	range: SliderField,
	color: TextInput,
	file: FileInput,
	select: SelectField,
	radio: RadioField,
	checkbox: CheckboxField,
};

const NATIVE_INPUT_TYPE: Partial<Record<FieldType, string>> = {
	email: 'email',
	password: 'password',
	date: 'date',
	time: 'time',
	datetime: 'datetime-local',
	color: 'color',
};

type FormFieldProps = {
	id: string;
	field: {
		type: FieldType;
		label: string;
		value?: unknown;
		options?: Option[];
		helpText?: string | null;
		required?: boolean;
		settings?: { options?: Option[]; min?: number; max?: number; step?: number };
		pattern?: RegExp;
		placeholder?: string;
	};
	countryCode: string;
};

const FormField = ({ field, id, countryCode }: FormFieldProps) => {
	const {
		type,
		label,
		options = [],
		helpText = null,
		required,
		settings,
		placeholder,
	} = field;

	const FieldComponent = FIELD_COMPONENTS[type] ?? FIELD_COMPONENTS.text;
	const updatedOptions =
		settings?.options && settings.options.length > 0 ? settings.options : options;

	if (id === 'location-select') {
		return (
			<Locations
				locationFields={
					field as unknown as React.ComponentProps<
						typeof Locations
					>['locationFields']
				}
				countryCode={countryCode}
			/>
		);
	}

	const rules = getValidationRules(field);
	const isCheckbox = type === 'checkbox';

	// Default props on the field element — BookingFormItem will clone-and-inject
	// value/onChange/onBlur on top of these.
	const fieldProps: Record<string, unknown> = {
		options: updatedOptions,
		label,
		required,
		settings,
		country: countryCode,
		placeholder,
	};
	if (NATIVE_INPUT_TYPE[type]) {
		fieldProps.type = NATIVE_INPUT_TYPE[type];
	}

	return (
		<div className="mb-6">
			<BookingFormItem
				name={id}
				rules={rules}
				validateTrigger={['onChange', 'onBlur']}
				valuePropName={isCheckbox ? 'checked' : 'value'}
				label={
					isCheckbox ? undefined : (
						<div className="form-label">
							<p>
								{label}
								{required && <span className="required">*</span>}
							</p>
						</div>
					)
				}
			>
				<FieldComponent {...fieldProps} />
			</BookingFormItem>
			{helpText && <div className="help-text">{helpText}</div>}
		</div>
	);
};

export default FormField;
