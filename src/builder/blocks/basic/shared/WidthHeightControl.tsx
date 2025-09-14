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
	onHeightChange = () => {},
	widthLabel = __('Width', 'quillcrm'),
	heightLabel = __('Height', 'quillcrm'),
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
		{ value: '100%', label: __('100%', 'quillcrm') },
		{ value: '75%', label: __('75%', 'quillcrm') },
		{ value: '50%', label: __('50%', 'quillcrm') },
		{ value: '25%', label: __('25%', 'quillcrm') },
		{ value: '800px', label: __('800px', 'quillcrm') },
		{ value: '600px', label: __('600px', 'quillcrm') },
		{ value: '400px', label: __('400px', 'quillcrm') },
		{ value: '300px', label: __('300px', 'quillcrm') },
	];

	// Default height options if not provided
	const defaultHeightOptions = heightOptions || [
		{ value: 'auto', label: __('Auto', 'quillcrm') },
		{ value: '600px', label: __('600px', 'quillcrm') },
		{ value: '400px', label: __('400px', 'quillcrm') },
		{ value: '300px', label: __('300px', 'quillcrm') },
		{ value: '200px', label: __('200px', 'quillcrm') },
		{ value: '150px', label: __('150px', 'quillcrm') },
	];

	return (
		<div
			className={`flex gap-3 items-center w-full ${!showHeight ? 'flex-col' : ''}`}
		>
			<div
				className={`flex flex-col gap-1 text-[#333333] ${showHeight ? 'w-1/2' : 'w-full'}`}
			>
				<label className="text-sm">{widthLabel}</label>
				{widthOptions ? (
					<Select value={width} onValueChange={onWidthChange}>
						<SelectTrigger className="rounded-lg border-border h-10">
							<SelectValue
								placeholder={__('Select width', 'quillcrm')}
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
					<div className="relative flex items-center">
						<Input
							type="text"
							value={width}
							onChange={(e) => onWidthChange(e.target.value)}
							className="pr-8 h-10"
							style={{
								borderColor: '#e5e5e5',
								borderRadius: '0.5rem',
							}}
							placeholder={widthPlaceholder}
						/>
						{widthUnit && (
							<span className="absolute right-3 text-gray-400">
								{widthUnit}
							</span>
						)}
					</div>
				)}
			</div>
			{showHeight && (
				<div className="flex flex-col gap-1 text-[#333333] w-1/2">
					<label className="text-sm">{heightLabel}</label>
					{heightOptions ? (
						<Select value={height} onValueChange={onHeightChange}>
							<SelectTrigger className="rounded-lg border-border h-10">
								<SelectValue
									placeholder={__(
										'Select height',
										'quillcrm'
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
						<div className="relative flex items-center">
							<Input
								type="text"
								value={height}
								onChange={(e) => onHeightChange(e.target.value)}
								className="pr-8 h-10"
								style={{
									borderColor: '#e5e5e5',
									borderRadius: '0.5rem',
								}}
								placeholder={heightPlaceholder}
							/>
							{heightUnit && (
								<span className="absolute right-3 text-gray-400">
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
