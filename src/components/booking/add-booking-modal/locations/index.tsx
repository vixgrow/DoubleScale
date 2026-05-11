import DynamicLocationFields from '../dynamic-location-field';

import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Field {
	label: string;
	desc: string;
	type: string;
	required?: boolean;
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
	value?: string;
	onChange?: (value: string) => void;
	locationDataValue?: string;
	onLocationDataChange?: (value: string) => void;
}

const Locations = ({ locationFields, value, onChange, locationDataValue, onLocationDataChange }: LocationsProps) => {
	if (!locationFields?.options?.length) {
		return null;
	}

	return (
		<>
			{locationFields.options.length > 1 ? (
				<>
					<div className="space-y-1">
						<div className="form-label">
							<p>{locationFields.label}</p>
						</div>
						<RadioGroup
							value={value}
							onValueChange={(val) => onChange?.(val)}
						>
							{locationFields.options.map((option) => (
								<div key={option.value} className="flex items-center space-x-2">
									<RadioGroupItem value={option.value} id={option.value} />
									<Label htmlFor={option.value}>{option.label}</Label>
								</div>
							))}
						</RadioGroup>
					</div>
					<DynamicLocationFields
						locations={locationFields.options}
						selectedType={value}
						value={locationDataValue}
						onChange={onLocationDataChange}
					/>
				</>
			) : (
				<>
					{locationFields.options[0].fields &&
						Object.entries(locationFields.options[0].fields).map(
							([fieldKey, field]) => {
								const typedField = field as Field & {
									placeholder?: string;
								};
								return (
									<div key={fieldKey} className="space-y-1">
										<div className="form-label">
											<p>
												{typedField.label}
												<span className="required">*</span>
											</p>
										</div>
										<Input
											placeholder={typedField.placeholder}
											type={typedField.type}
											value={locationDataValue || ''}
											onChange={(e) => onLocationDataChange?.(e.target.value)}
										/>
									</div>
								);
							}
						)}
				</>
			)}
		</>
	);
};

export default Locations;
