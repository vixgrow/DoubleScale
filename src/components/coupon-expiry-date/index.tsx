/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

interface CouponExpiryDateProps {
	value?: {
		type?: 'days' | 'date' | 'never';
		value?: string | number;
	};
	onChange: (value: {
		type: 'days' | 'date' | 'never';
		value?: string | number;
	}) => void;
}

const CouponExpiryDate: React.FC<CouponExpiryDateProps> = ({
	value = {},
	onChange,
}) => {
	const { type = 'days', value: expiryValue = '' } = value;

	const handleTypeChange = (newType: 'days' | 'date' | 'never') => {
		onChange({
			type: newType,
			value: newType === 'never' ? '' : expiryValue,
		});
	};

	const handleValueChange = (newValue: string | number) => {
		onChange({
			type: type,
			value: newValue,
		});
	};

	return (
		<div className="coupon-expiry-date">
			<div className="space-y-4">
				{/* Expiry after Specific Days */}
				<div className="flex items-center space-x-3">
					<input
						type="radio"
						id="expiry-days"
						name="coupon-expiry"
						checked={type === 'days'}
						onChange={() => handleTypeChange('days')}
						className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
					/>
					<label
						htmlFor="expiry-days"
						className="text-sm font-medium text-gray-900 cursor-pointer"
					>
						{__('Expiry after Specific Days', 'quillcrm')}
					</label>
				</div>

				{/* Expiry on Specific Date */}
				<div className="flex items-center space-x-3">
					<input
						type="radio"
						id="expiry-date"
						name="coupon-expiry"
						checked={type === 'date'}
						onChange={() => handleTypeChange('date')}
						className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
					/>
					<label
						htmlFor="expiry-date"
						className="text-sm font-medium text-gray-900 cursor-pointer"
					>
						{__('Expiry on Specific Date', 'quillcrm')}
					</label>
				</div>

				{/* Never Expire */}
				<div className="flex items-center space-x-3">
					<input
						type="radio"
						id="never-expire"
						name="coupon-expiry"
						checked={type === 'never'}
						onChange={() => handleTypeChange('never')}
						className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
					/>
					<label
						htmlFor="never-expire"
						className="text-sm font-medium text-gray-900 cursor-pointer"
					>
						{__('Never Expire', 'quillcrm')}
					</label>
				</div>

				{/* Days Input Field */}
				{type === 'days' && (
					<div className="mt-4">
						<div className="flex items-center space-x-2">
							<Input
								value={expiryValue}
								onChange={(e) =>
									handleValueChange(e.target.value)
								}
								type="number"
								min="1"
								className={cn('h-12 bg-white w-32')}
								style={{
									borderRadius: '8px',
								}}
								placeholder="0"
							/>
							<span className="text-sm text-gray-600 bg-gray-100 px-3 py-3 rounded-lg">
								{__('Days', 'quillcrm')}
							</span>
						</div>
					</div>
				)}

				{/* Date Picker */}
				{type === 'date' && (
					<div className="mt-4">
						<DatePicker
							value={expiryValue as string}
							onChange={(dateValue) =>
								handleValueChange(dateValue)
							}
							placeholder={__('Select expiry date', 'quillcrm')}
							outputFormat="iso"
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default CouponExpiryDate;
