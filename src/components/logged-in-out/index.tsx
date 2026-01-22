import Timeframe, { TimeframeValue } from '../timeframe';
import EventCountCondition, {
	EventCountConditionValue,
} from '../event-count-condition';

interface LoggedInOutValue {
	timeframe?: TimeframeValue;
	event_count_condition?: EventCountConditionValue;
}

interface LoggedInOutProps {
	value: LoggedInOutValue;
	onChange: (value: LoggedInOutValue) => void;
}

const LoggedInOut = ({ value, onChange }: LoggedInOutProps) => {
	const handelEventCountConditionChange = (
		event_count_condition: EventCountConditionValue
	) => {
		onChange({
			...value,
			event_count_condition,
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
			<EventCountCondition
				value={value?.event_count_condition || {}}
				onChange={handelEventCountConditionChange}
			/>

			<Timeframe
				value={value?.timeframe || {}}
				onChange={handleTimeframeChange}
			/>
		</>
	);
};

export default LoggedInOut;
