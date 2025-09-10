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
	const anyValue = 'any-value';
	const specificValue = 'specific-value';
	const labelForAnyValue = __('Any Value', 'quillcrm');
	const labelForSpecificValue = __('Specific Value', 'quillcrm');
	const placeholderForSelect = __('Select option', 'quillcrm');
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
	const isAnyValue =
		value?.condition === anyValue ||
		typeof value?.condition === 'undefined';
	const isSpecificValue = conditionOptions.some(
		(option) => option.value === value?.condition
	);
	const radioValue = isAnyValue
		? anyValue
		: isSpecificValue
			? specificValue
			: '';

	const handleRadioChange = (selectedValue: string) => {
		if (selectedValue === anyValue) {
			onChange({
				condition: anyValue,
				value: anyValue,
			});
		} else if (selectedValue === specificValue) {
			// Default to first condition option if switching to specific value
			onChange({
				condition:
					value?.condition &&
					conditionOptions.some(
						(opt) => opt.value === value?.condition
					)
						? value?.condition
						: conditionOptions[0].value,
				value: value?.value || '',
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
							value={anyValue}
							checked={radioValue === anyValue}
							onChange={(e) => handleRadioChange(e.target.value)}
							className="form-radio"
						/>
						<span>{labelForAnyValue}</span>
					</label>
					<label className="flex items-center gap-2">
						<Input
							type="radio"
							name={`value-type-${id}`}
							value={specificValue}
							checked={radioValue === specificValue}
							onChange={(e) => handleRadioChange(e.target.value)}
							className="form-radio"
						/>
						<span>{labelForSpecificValue}</span>
					</label>
				</div>
			</div>

			{/* Show condition selector and value input only for specific-value */}
			{radioValue === specificValue && (
				<div className="flex gap-2">
					<Select
						className="react-select-container w-1/2"
						classNamePrefix="react-select"
						value={
							conditionOptions.find(
								(option) => option.value === value?.condition
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
						placeholder={placeholderForSelect}
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
						placeholder={placeholderForSelect}
					/>
				</div>
			)}
		</>
	);
};

export default DealValueChange;
