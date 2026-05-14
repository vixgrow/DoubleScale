/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export interface WidthHeightControlProps {
	width: string;
	height?: string;
	onWidthChange: (value: string) => void;
	onHeightChange?: (value: string) => void;
	widthLabel?: string;
	heightLabel?: string;
	widthOptions?: Array<{ value: string; label: string }>;
	heightOptions?: Array<{ value: string; label: string }>;
	widthUnit?: string;
	heightUnit?: string;
	widthPlaceholder?: string;
	heightPlaceholder?: string;
	showHeight?: boolean;
}

export const WidthHeightControl: React.FC<WidthHeightControlProps> = ({
	width,
	height = '',
	onWidthChange,
	onHeightChange = () => { },
	widthLabel = __('Width', 'doublescale'),
	heightLabel = __('Height', 'doublescale'),
	widthOptions,
	heightOptions,
	widthUnit,
	heightUnit,
	widthPlaceholder = '100',
	heightPlaceholder = '1',
	showHeight = true,
}) => {
	// Default width options if not provided
	const defaultWidthOptions = widthOptions || [
		{ value: '100%', label: __('100%', 'doublescale') },
		{ value: '75%', label: __('75%', 'doublescale') },
		{ value: '50%', label: __('50%', 'doublescale') },
		{ value: '25%', label: __('25%', 'doublescale') },
	];

	// Default height options if not provided
	const defaultHeightOptions = heightOptions || [
		{ value: 'auto', label: __('Auto', 'doublescale') },
		{ value: '600px', label: __('600px', 'doublescale') },
		{ value: '400px', label: __('400px', 'doublescale') },
		{ value: '300px', label: __('300px', 'doublescale') },
		{ value: '200px', label: __('200px', 'doublescale') },
		{ value: '150px', label: __('150px', 'doublescale') },
	];

	return (
		<div
			className={`flex gap-3 items-center w-full ${!showHeight ? 'flex-col' : ''}`}
		>
			<div
				className={`flex flex-col gap-1 text-white ${showHeight ? 'w-1/2' : 'w-full'}`}
			>
				<label className="text-sm">{widthLabel}</label>
				{widthOptions ? (
					<Select value={width} onValueChange={onWidthChange}>
						<SelectTrigger className="rounded-lg !text-white !border-none !ring-0 !ring-offset-0 h-10 "
						style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}
						>
							<SelectValue
								placeholder={__('Select width', 'doublescale')}
							/>
						</SelectTrigger>
						<SelectContent>
							{defaultWidthOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<div className="relative flex items-center rounded-lg"
					style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}
					>
						<Input
							type="text"
							value={width}
							onChange={(e) => {
								const value = e.target.value;
								// Only allow numbers and empty string
								if (value === '' || /^\d+$/.test(value)) {
									const numValue = parseInt(value, 10);
									// Check if value is within range (0-100) or empty
									if (value === '' || (numValue >= 0 && numValue <= 100)) {
										onWidthChange(value);
									}
								}
							}}
							className="pr-8 h-10 !bg-transparent !text-white !border-none !ring-0 !ring-offset-0 placeholder:!text-white/50"
							placeholder={widthPlaceholder}
						/>
						{widthUnit && (
							<span className="absolute right-3 text-white/50">
								{widthUnit}
							</span>
						)}
					</div>
				)}
			</div>
			{showHeight && (
				<div className="flex flex-col gap-1 text-white w-1/2">
					<label className="text-sm">{heightLabel}</label>
					{heightOptions ? (
						<Select value={height} onValueChange={onHeightChange}>
							<SelectTrigger className="rounded-lg !text-white !border-none !ring-0 !ring-offset-0 h-10 "
							style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}
							>
								<SelectValue
									placeholder={__(
										'Select height',
										'doublescale'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{defaultHeightOptions.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<div className="relative flex items-center rounded-lg"
						style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}
						>
							<Input
								type="text"
								value={height}
								onChange={(e) => {
									const value = e.target.value;
									// Only allow numbers and empty string
									if (value === '' || /^\d+$/.test(value)) {
										const numValue = parseInt(value, 10);
										// Check if value is within range (max 20) or empty
										if (value === '' || numValue <= 20) {
											onHeightChange(value);
										}
									}
								}}
								className="pr-8 h-10 !bg-transparent !text-white !border-none !ring-0 !ring-offset-0 placeholder:!text-white/50"
								placeholder={heightPlaceholder}
							/>
							{heightUnit && (
								<span className="absolute right-3 text-white/50">
									{heightUnit}
								</span>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};
