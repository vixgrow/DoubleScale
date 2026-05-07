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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
		<div className="coupon-expiry-date mb-4">
			<div className="space-y-4">
				<RadioGroup
					value={type}
					onValueChange={(value) =>
						handleTypeChange(value as 'days' | 'date' | 'never')
					}
				>
					{/* Expiry after Specific Days */}
					<div className="flex items-center space-x-3">
						<RadioGroupItem value="days" id="expiry-days" />
						<label
							htmlFor="expiry-days"
							className="text-sm font-medium text-gray-900 cursor-pointer"
						>
							{__('Expiry after Specific Days', 'doublescale')}
						</label>
					</div>

					{/* Expiry on Specific Date */}
					<div className="flex items-center space-x-3">
						<RadioGroupItem value="date" id="expiry-date" />
						<label
							htmlFor="expiry-date"
							className="text-sm font-medium text-gray-900 cursor-pointer"
						>
							{__('Expiry on Specific Date', 'doublescale')}
						</label>
					</div>

					{/* Never Expire */}
					<div className="flex items-center space-x-3">
						<RadioGroupItem value="never" id="never-expire" />
						<label
							htmlFor="never-expire"
							className="text-sm font-medium text-gray-900 cursor-pointer"
						>
							{__('Never Expire', 'doublescale')}
						</label>
					</div>
				</RadioGroup>

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
							<span className="text-sm text-gray-600 bg-gray-100 px-3 py-3.5 rounded-lg">
								{__('Days', 'doublescale')}
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
							placeholder={__('Select expiry date', 'doublescale')}
							outputFormat="iso"
							buttonClassName='bg-white border shadow-none text-[#333333] w-full'
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default CouponExpiryDate;
