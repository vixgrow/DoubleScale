import React from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface FilterSelectProps {
	label: string;
	value: string | undefined;
	defaultValue?: string;
	placeholder: string;
	onChange: (value: string) => void;
	options: Array<{
		id: number | string;
		display_name?: string;
		name?: string;
		first_name?: string;
		last_name?: string;
	}>;
	className?: string;
	renderOptionText?: (option: any) => string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
	label,
	value,
	defaultValue,
	placeholder,
	onChange,
	options,
	className = 'w-40',
	renderOptionText,
}) => (
	<div>
		<label className="block text-sm font-medium mb-1">{label}</label>
		<Select
			value={value}
			defaultValue={defaultValue}
			onValueChange={onChange}
		>
			<SelectTrigger className={className}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{options?.map((option) => (
					<SelectItem key={option.id} value={option.id.toString()}>
						{renderOptionText
							? renderOptionText(option)
							: option.display_name ||
								option.name ||
								`${option.first_name} ${option.last_name}`}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	</div>
);
