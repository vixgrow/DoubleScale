import Field from '../field';
import Timeframe, { TimeframeValue } from '../timeframe';

interface EmailOpenedValue {
	count?: number;
	timeframe?: TimeframeValue;
}

interface EmailOpenedProps {
	value: EmailOpenedValue;
	onChange: (value: EmailOpenedValue) => void;
}

const EmailOpened = ({ value, onChange }: EmailOpenedProps) => {
	const handleCountChange = (count: number) => {
		onChange({
			...value,
			count,
		});
	};

	const handleTimeframeChange = (timeframe: TimeframeValue) => {
		onChange({
			...value,
			timeframe,
		});
	};

	return (
		<>
			<Field
				type="number"
				value={value?.count || 0}
				onChange={handleCountChange}
				placeholder="Enter count of emails opened"
			/>
			<Timeframe
				value={value?.timeframe || {}}
				onChange={handleTimeframeChange}
			/>
		</>
	);
};

export default EmailOpened;
