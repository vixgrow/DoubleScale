/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@/config/booking';
import { getCurrentTimezone } from '@/utils/booking';
import { cn } from '@/lib/utils';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@doublescale/shared/ui/select';

interface TimezoneSelectProps {
	value: string | null;
	onChange: (value: string) => void;
	className?: string;
	disabled?: boolean;
}

/**
 * Timezone Select Component.
 */
const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
	value,
	onChange,
	className,
	disabled,
}) => {
	const timezones = ConfigAPI.getTimezones();

	const currentValue = value ?? getCurrentTimezone();
	const currentLabel = timezones?.[currentValue] ?? currentValue;

	return (
		<Select
			value={currentValue}
			onValueChange={onChange}
			disabled={disabled}
		>
			<SelectTrigger className={cn('h-9 w-auto gap-2', className)}>
				<SelectValue>{currentLabel}</SelectValue>
			</SelectTrigger>
			<SelectContent className="max-h-[300px]">
				{map(timezones, (label, val) => (
					<SelectItem key={val} value={val}>
						{label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

export default TimezoneSelect;
