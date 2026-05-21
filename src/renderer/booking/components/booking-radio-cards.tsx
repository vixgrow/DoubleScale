import { cn } from '@/lib/utils';
import {
	RadioGroup,
	RadioGroupItem,
} from '@doublescale/shared/ui/radio-group';

export type BookingRadioOption = {
	value: string;
	label: string;
	hint?: React.ReactNode;
	disabled?: boolean;
};

type BookingRadioCardsProps = {
	value?: string;
	onChange?: (next: string) => void;
	options: BookingRadioOption[];
	idPrefix?: string;
	layout?: 'horizontal' | 'vertical';
};

/**
 * Matches booking settings “Default Time Format” radios:
 * bordered card per option, secondary background when selected.
 */
const BookingRadioCards = ({
	value,
	onChange,
	options,
	idPrefix = 'booking-radio',
	layout = 'vertical',
}: BookingRadioCardsProps) => {
	const isHorizontal = layout === 'horizontal';

	return (
		<RadioGroup
			value={value ?? ''}
			onValueChange={(next) => onChange?.(next)}
			className={cn('flex w-full gap-2', isHorizontal ? 'flex-row' : 'flex-col')}
		>
			{options.map((option, index) => {
				const id = `${idPrefix}-${option.value}-${index}`;
				const selected = value === option.value;
				return (
					<label
						key={option.value}
						htmlFor={id}
						className={cn(
							'doublescale-radio-card flex flex-col gap-1 border rounded-lg p-3 font-semibold transition-all duration-300 text-[#3F4254]',
							isHorizontal ? 'w-1/2' : 'w-full',
							option.disabled
								? 'opacity-60 cursor-not-allowed'
								: 'cursor-pointer',
							selected
								? 'bg-secondary border-primary'
								: 'border-border'
						)}
					>
						<div className="flex items-center gap-2">
							<RadioGroupItem
								value={option.value}
								id={id}
								disabled={option.disabled}
							/>
							{option.label}
						</div>
						{option.hint && (
							<div className="text-[12px] italic font-normal text-[#458DC7] pl-6">
								{option.hint}
							</div>
						)}
					</label>
				);
			})}
		</RadioGroup>
	);
};

export default BookingRadioCards;
