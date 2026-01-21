import Timeframe, { TimeframeValue } from '../timeframe';

interface WasActiveInactiveValue {
	timeframe?: TimeframeValue;
}

interface WasActiveInactiveProps {
	value: WasActiveInactiveValue;
	onChange: (value: WasActiveInactiveValue) => void;
}

const WasActiveInactive = ({ value, onChange }: WasActiveInactiveProps) => {
	const handleTimeframeChange = (timeframe: TimeframeValue) => {
		onChange({
			...value,
			timeframe,
		});
	};

	return (
		<>
			<Timeframe
				value={value?.timeframe || {}}
				onChange={handleTimeframeChange}
			/>
		</>
	);
};

export default WasActiveInactive;
