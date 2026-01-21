import Field from '../field';
import Timeframe, { TimeframeValue } from '../timeframe';

interface EmailClickedValue {
	count?: number;
	timeframe?: TimeframeValue;
}

interface EmailClickedProps {
	value: EmailClickedValue;
	onChange: (value: EmailClickedValue) => void;
}

const EmailClicked = ({ value, onChange }: EmailClickedProps) => {
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
				placeholder="Enter count of emails clicked"
			/>
			<Timeframe
				value={value?.timeframe || {}}
				onChange={handleTimeframeChange}
			/>
		</>
	);
};

export default EmailClicked;
