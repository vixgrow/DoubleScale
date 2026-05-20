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
	const selectedValue = value ?? getCurrentTimezone();

	return (
		<Select
			value={selectedValue}
			onValueChange={onChange}
			disabled={disabled}
		>
			<SelectTrigger className={cn('h-10', className)}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent
				position="popper"
				className="min-w-[var(--radix-select-trigger-width)] w-max max-h-[300px]"
			>
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
