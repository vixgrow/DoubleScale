import { __ } from '@wordpress/i18n';
import DynamicLocationFields from '../dynamic-location-field';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Input } from '@doublescale/shared/ui/input';
import { Label } from '@doublescale/shared/ui/label';
import {
	RadioGroup,
	RadioGroupItem,
} from '@doublescale/shared/ui/radio-group';
import {
	BookingFormItem,
	useBookingFormInstance,
} from '../inputs/form-bridge';

/**
 * Renders dynamic fields for a selected location type
 */
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

interface LocationRadioGroupProps {
	value?: string;
	onChange?: (value: string) => void;
	options: Option[];
}

const PhoneInputField = ({
	value,
	onChange,
	country,
}: {
	value?: string;
	onChange?: (value: string) => void;
	country: string;
}) => (
	<PhoneInput
		country={country}
		value={value || ''}
		onChange={(phone) => onChange?.(phone)}
	/>
);

const LocationRadioGroup = ({
	value,
	onChange,
	options,
}: LocationRadioGroupProps) => {
	const form = useBookingFormInstance();

	return (
	<RadioGroup
		value={value}
		onValueChange={(nextValue) => {
			onChange?.(nextValue);
			form.setFieldValue('location-data', undefined);
		}}
	>
		{options.map((option) => (
			<div key={option.value} className="flex items-center space-x-2">
				<RadioGroupItem
					value={option.value}
					id={`location-${option.value}`}
				/>
				<Label htmlFor={`location-${option.value}`}>
					{option.label}
				</Label>
			</div>
		))}
	</RadioGroup>
	);
};

const Locations = ({ locationFields, countryCode }: LocationsProps) => {
	return (
		<>
			{locationFields.options.length > 1 ? (
				<>
					<BookingFormItem
						key="location"
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
						<LocationRadioGroup options={locationFields.options} />
					</BookingFormItem>
					<DynamicLocationFields
						locations={locationFields.options}
						countryCode={countryCode}
					/>
				</>
			) : (
				<>
					<BookingFormItem
						key="location"
						name="location"
						initialValue={locationFields.options[0].value}
						hidden
					>
						<input type="hidden" />
					</BookingFormItem>
					{locationFields.options[0].fields &&
						Object.entries(locationFields.options[0].fields).map(
							([fieldKey, field]) => {
								const typedField = field as Field & {
									placeholder?: string;
								};
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
													<span className="required">
														*
													</span>
												</p>
											</div>
										}
									>
										{typedField.type == 'phone' ? (
											<PhoneInputField country={countryCode} />
										) : (
											<Input
												placeholder={
													typedField.placeholder
												}
												type={typedField.type}
											/>
										)}
									</BookingFormItem>
								);
							}
						)}
				</>
			)}
		</>
	);
};

export default Locations;
