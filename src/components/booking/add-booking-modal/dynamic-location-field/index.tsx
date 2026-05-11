import { Input } from '@/components/ui/input';

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
	selectedType?: string;
	value?: string;
	onChange?: (value: string) => void;
}

const DynamicLocationFields = ({ locations, selectedType, value, onChange }: DynamicLocationFieldsProps) => {
	if (selectedType !== 'attendee_address' && selectedType !== 'attendee_phone')
		return null;

	return (
		<>
			{locations.map(
				(location) =>
					location.value === selectedType &&
					location.fields &&
					Object.entries(location.fields).map(
						([_, field]) => (
							<div key="location-data" className="space-y-1">
								<div className="form-label">
									<p>{field.label}</p>
								</div>
								<Input
									placeholder={field.placeholder}
									value={value || ''}
									onChange={(e) => onChange?.(e.target.value)}
									required={field.required}
								/>
							</div>
						)
					)
			)}
		</>
	);
};

export default DynamicLocationFields;
