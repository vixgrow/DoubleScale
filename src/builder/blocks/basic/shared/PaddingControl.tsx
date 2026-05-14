/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import {
	PaddingBottomIcon,
	PaddingLeftIcon,
	PaddingRightIcon,
	PaddingTopIcon,
} from '@doublescale/components';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PaddingValue {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface PaddingControlProps {
	value: PaddingValue;
	onChange: (value: PaddingValue) => void;
	label?: string;
}

const PADDING_ARIA: Record<keyof PaddingValue, string> = {
	top: __('Top padding', 'doublescale'),
	right: __('Right padding', 'doublescale'),
	bottom: __('Bottom padding', 'doublescale'),
	left: __('Left padding', 'doublescale'),
};

/** One shell per side — icon, then value + “px” */
const padShellClass =
	'flex h-10 items-center gap-1 rounded-lg bg-[rgba(255,255,255,0.1)] px-3 shadow-none ring-0';

const padInputClass =
	'min-h-0 min-w-0 flex-1 !border-none !ring-0 !ring-offset-0 !bg-transparent p-0 text-sm !text-white shadow-none outline-none ring-0 [appearance:textfield] placeholder:text-white/45 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export const PaddingControl: React.FC<PaddingControlProps> = ({
	value,
	onChange,
	label = __('Padding', 'doublescale'),
}) => {
	const handlePaddingChange = (
		direction: keyof PaddingValue,
		newValue: number
	) => {
		let constrainedValue = newValue;

		if (direction === 'left' || direction === 'right') {
			constrainedValue = Math.max(0, Math.min(120, newValue));
		} else if (direction === 'top' || direction === 'bottom') {
			constrainedValue = Math.max(0, Math.min(240, newValue));
		}

		onChange({
			...value,
			[direction]: constrainedValue,
		});
	};

	const padInput = (
		direction: keyof PaddingValue,
		max: number,
		Icon: typeof PaddingLeftIcon
	) => (
		<div className={padShellClass}>
			<span
				className="flex shrink-0 items-center text-white/85 [&_svg]:size-[18px]"
				aria-hidden
			>
				<Icon />
			</span>
			<div className="flex min-w-0 flex-1 items-center gap-1">
				<Input
					type="number"
					min={0}
					max={max}
					value={value[direction] ?? 0}
					onChange={(e) =>
						handlePaddingChange(
							direction,
							parseInt(e.target.value, 10) || 0
						)
					}
					aria-label={PADDING_ARIA[direction]}
					className={cn(padInputClass, 'text-left')}
				/>
				<span className="pointer-events-none shrink-0 text-xs text-white/55">
					px
				</span>
			</div>
		</div>
	);

	return (
		<div>
			<label className="mb-2 block text-sm font-normal text-white">
				{label}
			</label>
			{/* Figma: row1 Top | Right, row2 Left | Bottom */}
			<div className="grid grid-cols-2 gap-2">
				{padInput('top', 240, PaddingTopIcon)}
				{padInput('right', 120, PaddingRightIcon)}
				{padInput('left', 120, PaddingLeftIcon)}
				{padInput('bottom', 240, PaddingBottomIcon)}
			</div>
		</div>
	);
};
