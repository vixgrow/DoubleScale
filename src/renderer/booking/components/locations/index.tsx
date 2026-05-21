import { __, sprintf } from '@wordpress/i18n';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { cn } from '@/lib/utils';
import { Input } from '@doublescale/shared/ui/input';
import { BookingFormItem } from '../inputs/form-bridge';
import BookingRadioCards from '../booking-radio-cards';
import DynamicLocationFields from '../dynamic-location-field';

const CONFERENCING_LABELS: Record<string, string> = {
	'google-meet': 'Google Meet',
	'zoom': 'Zoom Video',
	'ms-teams': 'MS Teams',
};

const isConferencingType = (value: string): boolean =>
	value === 'google-meet' || value === 'zoom' || value === 'ms-teams';

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
}: BridgeProps & { options: Option[] }) => {
	const proActive =
		(window as any).doublescale?.booking_pro_active === true;

	const enrichedOptions = options.map((option) => {
		if (!proActive && isConferencingType(option.value)) {
			const label = CONFERENCING_LABELS[option.value] || option.label;
			return {
				...option,
				disabled: true,
				hint: sprintf(
					/* translators: %s: e.g. Google Meet, Zoom Video, MS Teams */
					__('Upgrade to Pro to use %s.', 'doublescale'),
					label
				),
			};
		}
		return option;
	});

	return (
		<BookingRadioCards
			value={(value as string | undefined) ?? ''}
			onChange={(next) => onChange?.(next)}
			options={enrichedOptions}
			idPrefix="location"
			layout="vertical"
		/>
	);
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

const HiddenBridge = ({ value }: BridgeProps) => (
	<input type="hidden" value={(value as string | undefined) ?? ''} readOnly />
);

const Locations = ({ locationFields, countryCode }: LocationsProps) => {
	if (locationFields.options.length > 1) {
		return (
			<div className="locations-field-group">
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
			</div>
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
