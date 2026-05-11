/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import React from 'react';

/**
 * Internal dependencies
 */
import { LocationField } from '@/config/booking';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface DynamicFormFieldProps {
	field: LocationField;
	fieldKey: string;
	namePrefix?: string[];
	value?: any;
	onChange?: (value: any) => void;
}

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
	field,
	fieldKey,
	value,
	onChange,
}) => {
	const renderField = () => {
		switch (field.type) {
			case 'text':
				return (
					<Input
						placeholder={field.desc}
						value={value || ''}
						onChange={(e) => onChange?.(e.target.value)}
					/>
				);
			case 'checkbox':
				return (
					<div className="flex items-center gap-2">
						<Checkbox
							checked={value || false}
							onCheckedChange={(checked) => onChange?.(checked)}
						/>
						<span>{field.desc}</span>
					</div>
				);
			case 'url':
				return (
					<Input
						type="url"
						placeholder={field.desc}
						value={value || ''}
						onChange={(e) => onChange?.(e.target.value)}
					/>
				);
			default:
				return (
					<Input
						placeholder={field.desc}
						value={value || ''}
						onChange={(e) => onChange?.(e.target.value)}
					/>
				);
		}
	};

	return (
		<div className="space-y-1">
			{field.type !== 'checkbox' && (
				<label className="text-sm font-medium">{field.label}</label>
			)}
			{renderField()}
		</div>
	);
};

export default DynamicFormField;
