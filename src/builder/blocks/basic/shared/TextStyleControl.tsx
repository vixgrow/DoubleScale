/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export interface TextStyleControlProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
	label?: string;
}

const TEXT_STYLE_OPTIONS = [
	{ value: 'h1', label: 'H1 Style' },
	{ value: 'h2', label: 'H2 Style' },
	{ value: 'h3', label: 'H3 Style' },
	{ value: 'p', label: 'Paragraph Style' },
	{ value: 'small', label: 'Footnote Style' },
];

export const TextStyleControl: React.FC<TextStyleControlProps> = ({
	value,
	onChange,
	className,
	label = __('Text Style', 'doublescale'),
}) => {
	return (
		<div className={className}>
			<div className="flex flex-col gap-2 text-white">
				<label className="text-sm">{label}</label>
				<Select value={value} onValueChange={onChange}>
					<SelectTrigger className="w-full rounded-lg !text-white !border-none !ring-0 !ring-offset-0 h-10 "
					style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}
					>
						<SelectValue
							placeholder={__('Select heading style', 'doublescale')}
						/>
					</SelectTrigger>
					<SelectContent>
						{TEXT_STYLE_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};
