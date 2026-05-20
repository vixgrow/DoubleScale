import { Input } from '@doublescale/shared/ui/input';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import {
	BookingFormItem,
	BookingFormItemShouldUpdate,
} from '../inputs/form-bridge';

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

/**
 * Renders dynamic fields for a selected location type
 */
interface Field {
	label: string;
	type: string;
	required?: boolean;
	placeholder?: string;
}

interface Option {
	value: string;
	label: string;
	fields?: Record<string, Field>;
}

interface DynamicLocationFieldsProps {
	locations: Option[];
	countryCode: string;
}

const DynamicLocationFields = ({
	locations,
	countryCode,
}: DynamicLocationFieldsProps) => {
	return (
		<BookingFormItemShouldUpdate>
			{({ getFieldValue }) => {
				const selectedType = getFieldValue('location');
				if (
					selectedType !== 'attendee_address' &&
					selectedType !== 'attendee_phone'
				) {
					return null;
				}

				return (
					<>
						{locations.map(
							(location) =>
								location.value === selectedType &&
								location.fields &&
								Object.entries(location.fields).map(
									([_, field]) => (
										<BookingFormItem
											key="location-data"
											name="location-data"
											shouldUnregister
											label={
												<div className="form-label">
													<p>
														{field.label}
														{field.required && (
															<span className="required">
																*
															</span>
														)}
													</p>
												</div>
											}
											rules={
												field.required
													? [
															{
																required: true,
																message: `${field.label} is required`,
															},
														]
													: []
											}
										>
											{field.type === 'phone' ? (
												<PhoneInputField
													country={countryCode}
												/>
											) : (
												<Input
													placeholder={
														field.placeholder
													}
												/>
											)}
										</BookingFormItem>
									)
								)
						)}
					</>
				);
			}}
		</BookingFormItemShouldUpdate>
	);
};

export default DynamicLocationFields;
