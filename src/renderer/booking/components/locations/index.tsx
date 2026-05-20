import { __ } from '@wordpress/i18n';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { Input } from '@doublescale/shared/ui/input';
import {
	RadioGroup,
	RadioGroupItem,
} from '@doublescale/shared/ui/radio-group';
import { BookingFormItem } from '../inputs/form-bridge';
import DynamicLocationFields from '../dynamic-location-field';

interface Field {
	label: string;
	desc: string;
	type: string;
	required?: boolean;
	placeholder?: string;
}

interface Option {
	value: string;
	label: string;
	fields?: Record<string, Field>;
}

interface LocationsProps {
	locationFields: {
		label: string;
		options: Option[];
	};
	countryCode: string;
}

type BridgeProps = {
	value?: unknown;
	onChange?: (next: unknown) => void;
	onBlur?: () => void;
};

const RadioFieldBridge = ({
	value,
	onChange,
	options,
}: BridgeProps & { options: Option[] }) => (
	<RadioGroup
		value={(value as string | undefined) ?? ''}
		onValueChange={(next) => onChange?.(next)}
		className="mt-2 flex flex-col gap-3"
	>
		{options.map((option) => {
			const id = `location-${option.value}`;
			return (
				<label
					key={option.value}
					htmlFor={id}
					className="flex items-center gap-2.5 cursor-pointer text-[15px] leading-none text-[#29292E]"
				>
					<RadioGroupItem
						value={option.value}
						id={id}
						className="h-[18px] w-[18px] border border-[#D0D0D0] data-[state=checked]:border-[#3A3A99] [&_svg]:h-2 [&_svg]:w-2 [&_svg]:fill-[#3A3A99] [&_svg]:text-[#3A3A99]"
					/>
					<span>{option.label}</span>
				</label>
			);
		})}
	</RadioGroup>
);

const TextBridge = ({
	value,
	onChange,
	onBlur,
	...rest
}: BridgeProps & React.InputHTMLAttributes<HTMLInputElement>) => (
	<Input
		value={(value as string | undefined) ?? ''}
		onChange={(e) => onChange?.(e.target.value)}
		onBlur={onBlur}
		{...rest}
	/>
);

const PhoneBridge = ({
	value,
	onChange,
	country,
}: BridgeProps & { country?: string }) => (
	<PhoneInput
		country={country}
		value={(value as string | undefined) ?? ''}
		onChange={(next) => onChange?.(next)}
	/>
);

const HiddenBridge = ({ value }: BridgeProps) => (
	<input type="hidden" value={(value as string | undefined) ?? ''} readOnly />
);

const Locations = ({ locationFields, countryCode }: LocationsProps) => {
	if (locationFields.options.length > 1) {
		return (
			<>
				<BookingFormItem
					name="location"
					label={
						<div className="form-label">
							<p>
								{locationFields.label}
								<span className="required">*</span>
							</p>
						</div>
					}
				>
					<RadioFieldBridge options={locationFields.options} />
				</BookingFormItem>
				<DynamicLocationFields
					locations={locationFields.options}
					countryCode={countryCode}
				/>
			</>
		);
	}

	const onlyOption = locationFields.options[0];

	return (
		<>
			<BookingFormItem
				name="location"
				initialValue={onlyOption.value}
				style={{ display: 'none' }}
			>
				<HiddenBridge />
			</BookingFormItem>
			{onlyOption.fields &&
				Object.entries(onlyOption.fields).map(([fieldKey, field]) => {
					const typedField = field as Field;
					return (
						<BookingFormItem
							key={fieldKey}
							name="location-data"
							rules={[
								{
									required: true,
									message: __(
										`${typedField.label} is required`,
										'doublescale'
									),
								},
							]}
							label={
								<div className="form-label">
									<p>
										{typedField.label}
										<span className="required">*</span>
									</p>
								</div>
							}
						>
							{typedField.type === 'phone' ? (
								<PhoneBridge country={countryCode} />
							) : (
								<TextBridge
									type={typedField.type}
									placeholder={typedField.placeholder}
								/>
							)}
						</BookingFormItem>
					);
				})}
		</>
	);
};

export default Locations;
