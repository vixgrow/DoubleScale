/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { isObject } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import './style.scss';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ReactSelectOptions } from '@quillcrm/client';

interface DiscountTypeWithAmountProps {
	value?: {
		type?: string;
		amount?: number | string;
	};
	onChange: (value: { type: string; amount: number | string }) => void;
	options?: ReactSelectOptions;
}

const DiscountTypeWithAmount: React.FC<DiscountTypeWithAmountProps> = ({
	value = {},
	onChange,
	options = [],
}) => {
	const { type = '', amount = '' } = value;

	const handleTypeChange = (selectedOption: any) => {
		if (!isObject(selectedOption)) {
			return;
		}
		onChange({
			type: selectedOption.value,
			amount: amount,
		});
	};

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newAmount = e.target.value;
		onChange({
			type: type,
			amount: newAmount,
		});
	};

	// Convert options to react-select format
	const selectOptions = options.map((option) => ({
		value: option.value,
		label: option.label,
	}));

	const selectedOption =
		selectOptions.find((option) => option.value === type) || null;

	return (
		<div className="discount-type-with-amount flex gap-4 mt-4">
			<div className="w-1/2">
				<Select
					className="react-select-container bg-white"
					classNamePrefix="react-select"
					value={selectedOption}
					onChange={handleTypeChange}
					options={selectOptions}
					placeholder={__('Select discount type', 'quillcrm')}
					styles={{
						control: (styles) => ({
							...styles,
							borderRadius: '8px',
							minHeight: '48px',
						}),
						menu: (base: any) => ({
							...base,
							color: 'black',
						}),
					}}
				/>
			</div>
			<div className="w-1/2">
				<Input
					value={amount}
					onChange={handleAmountChange}
					type="number"
					min="0"
					max={type === 'percent' ? '100' : ''}
					step="0.01"
					className={cn('h-12 bg-white')}
					style={{
						borderRadius: '8px',
					}}
					placeholder={
						type === 'percent' ? '%' : __('Amount', 'quillcrm')
					}
				/>
			</div>
		</div>
	);
};

export default DiscountTypeWithAmount;
