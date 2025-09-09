import { __ } from '@wordpress/i18n';
import './style.scss';
import Select from 'react-select';
import { isObject } from 'lodash';
import { Input } from '@/components/ui/input';

interface DealValueChangeProps {
	value: { condition: string; value: string };
	onChange: (value: { condition: string; value: string }) => void;
}

const DealValueChange = ({ value, onChange }: DealValueChangeProps) => {
	const conditionOptions = [
		{
			label: __('Equal To', 'quillcrm'),
			value: 'equal_to',
		},
		{
			label: __('Not Equal To', 'quillcrm'),
			value: 'not_equal_to',
		},
		{
			label: __('Greater Than', 'quillcrm'),
			value: 'greater_than',
		},
		{
			label: __('Lower Than', 'quillcrm'),
			value: 'lower_than',
		},
	];

	// random id
	const id = Math.random().toString(36).substring(2, 15);

	// Determine if current condition is "any-value" or a specific condition
	const isAnyValue = value.condition === 'any-value';
	const isSpecificValue = conditionOptions.some(
		(option) => option.value === value.condition
	);
	const radioValue = isAnyValue
		? 'any-value'
		: isSpecificValue
			? 'specific-value'
			: '';

	const handleRadioChange = (selectedValue: string) => {
		if (selectedValue === 'any-value') {
			onChange({
				condition: 'any-value',
				value: 'any-value',
			});
		} else if (selectedValue === 'specific-value') {
			// Default to first condition option if switching to specific value
			onChange({
				condition:
					value.condition &&
					conditionOptions.some(
						(opt) => opt.value === value.condition
					)
						? value.condition
						: conditionOptions[0].value,
				value: value.value || '',
			});
		}
	};

	return (
		<>
			{/* Radio buttons to choose between any-value and specific-value */}
			<div className="mb-3">
				<div className="flex gap-4">
					<label className="flex items-center gap-2">
						<Input
							type="radio"
							name={`value-type-${id}`}
							value="any-value"
							checked={radioValue === 'any-value'}
							onChange={(e) => handleRadioChange(e.target.value)}
							className="form-radio"
						/>
						<span>{__('Any Value', 'quillcrm')}</span>
					</label>
					<label className="flex items-center gap-2">
						<Input
							type="radio"
							name={`value-type-${id}`}
							value="specific-value"
							checked={radioValue === 'specific-value'}
							onChange={(e) => handleRadioChange(e.target.value)}
							className="form-radio"
						/>
						<span>{__('Specific Value', 'quillcrm')}</span>
					</label>
				</div>
			</div>

			{/* Show condition selector and value input only for specific-value */}
			{radioValue === 'specific-value' && (
				<div className="flex gap-2">
					<Select
						className="react-select-container w-1/2"
						classNamePrefix="react-select"
						value={
							conditionOptions.find(
								(option) => option.value === value.condition
							) || null
						}
						onChange={(selectedOption) => {
							if (!isObject(selectedOption)) {
								return;
							}
							onChange({
								condition: selectedOption.value,
								value: value.value || '',
							});
						}}
						options={conditionOptions}
						placeholder={__('Select condition', 'quillcrm')}
						styles={{
							menu: (base: any) => ({
								...base,
								color: 'black',
							}),
						}}
					/>
					<Input
						className="w-1/2"
						value={value.value}
						onChange={(e) =>
							onChange({
								condition: value.condition,
								value: e.target.value,
							})
						}
						type="number"
						placeholder={__('Enter value', 'quillcrm')}
					/>
				</div>
			)}
		</>
	);
};

export default DealValueChange;
