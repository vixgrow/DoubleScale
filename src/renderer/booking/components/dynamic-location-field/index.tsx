import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { Input } from '@doublescale/shared/ui/input';
import {
	BookingFormItem,
	BookingFormItemShouldUpdate,
} from '../inputs/form-bridge';

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

type BridgeProps = {
	value?: unknown;
	onChange?: (next: unknown) => void;
	onBlur?: () => void;
};

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
										>
											{field.type === 'phone' ? (
												<PhoneBridge country={countryCode} />
											) : (
												<TextBridge
													placeholder={field.placeholder}
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
