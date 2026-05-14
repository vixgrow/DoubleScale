/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ColorPickerControlProps {
	value: string;
	onChange: (value: string) => void;
	label: string;
	placeholder?: string;
	id?: string;
	className?: string;
}

export const ColorPickerControl: React.FC<ColorPickerControlProps> = ({
	value,
	onChange,
	label,
	placeholder = '#FFFFFF',
	id,
	className,
}) => {
	return (
		<div className={cn('flex flex-col gap-2 text-white', className)}>
			<label className="text-sm text-white">{label}</label>
			<div className="flex items-center gap-2 rounded-lg !border-none !ring-0 !ring-offset-0 px-2 py-0.5"
				style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
			>
				<Input
					id={id}
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="rounded-lg !border-none !ring-0 !ring-offset-0 !bg-transparent !text-white shadow-none placeholder:text-white focus-visible:ring-1 focus-visible:ring-white/30"
					placeholder={placeholder}
				/>
				<Input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-8 w-8 shrink-0 cursor-pointer !rounded-lg !border-none !ring-0 !ring-offset-0 !bg-transparent p-1 shadow-none"
				/>
			</div>
		</div>
	);
};
