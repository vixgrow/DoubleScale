/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { Bold, Italic, Strikethrough, Underline } from 'lucide-react';
/**
 * internal dependencies
 */
import { cn } from '@/lib/utils';

export interface TextFormattingControlProps {
	value: {
		bold?: boolean;
		italic?: boolean;
		underline?: boolean;
		strikethrough?: boolean;
	};
	onChange: (updates: Partial<TextFormattingControlProps['value']>) => void;
	className?: string;
}

const active = 'border border-white';
const iconBtn =
	'size-8 w-full cursor-pointer px-5 py-3 h-10 text-white transition-colors hover:bg-white/10';

export const TextFormattingControl: React.FC<TextFormattingControlProps> = ({
	value,
	onChange,
	className,
}) => {
	return (
		<div className={cn('flex flex-col gap-2 text-white', className)}>
			<label className="text-sm text-white">
				{__('Decoration', 'doublescale')}
			</label>
			<div className="flex items-center h-10 justify-between rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
				<Bold
					className={cn(iconBtn, 'rounded-lg', value.bold && active)}
					onClick={() => onChange({ bold: !value.bold })}
				/>
				<Italic
					className={cn(iconBtn, 'rounded-lg', value.italic && active)}
					onClick={() => onChange({ italic: !value.italic })}
				/>
				<Strikethrough
					className={cn(iconBtn, 'rounded-lg', value.strikethrough && active)}
					onClick={() => onChange({ strikethrough: !value.strikethrough })}
				/>
				<Underline
					className={cn(iconBtn, 'rounded-lg', value.underline && active)}
					onClick={() => onChange({ underline: !value.underline })}
				/>
			</div>
		</div>
	);
};
