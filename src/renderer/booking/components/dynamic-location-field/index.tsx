import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { cn } from '@/lib/utils';
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
	className,
	...rest
}: BridgeProps & React.InputHTMLAttributes<HTMLInputElement>) => (
	<Input
		className={cn('doublescale-input-control', className)}
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
		inputClass="doublescale-input-control"
		containerClass="w-full"
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
					<div className="location-followup-fields">
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
					</div>
				);
			}}
		</BookingFormItemShouldUpdate>
	);
};

export default DynamicLocationFields;
