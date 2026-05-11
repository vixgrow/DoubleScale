/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@/config/booking';
import { getCurrentTimezone } from '@/utils/booking';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimezoneSelectProps {
	value: string | null;
	onChange: (value: string) => void;
	className?: string;
	disabled?: boolean;
}

/**
 * Timezone Select Component.
 */
const TimezoneSelect: React.FC<TimezoneSelectProps> = ({ value, onChange }) => {
	const timezones = ConfigAPI.getTimezones();

	return (
		<Select
			value={value ?? getCurrentTimezone()}
			onValueChange={(newVal) => onChange(newVal)}
		>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
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
