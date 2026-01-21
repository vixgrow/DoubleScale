import Field from '../field';

export interface EventCountConditionValue {
	type?: string;
	count?: number;
}

interface EventCountConditionProps {
	value: EventCountConditionValue;
	onChange: (value: EventCountConditionValue) => void;
}

const EventCountCondition = ({ value, onChange }: EventCountConditionProps) => {
	const eventCountConditionOptions = [
		{ value: 'extactly', label: 'Extactly' },
		{ value: 'less_than', label: 'Less than' },
		{ value: 'more_than', label: 'More than' },
		{ value: 'at_least', label: 'At least' },
		{ value: 'at_most', label: 'At most' },
	];

	const handleEventCountConditionTypeChange = (type: string) => {
		onChange({
			...value,
			type,
		});
	};

	const handleCountChange = (count: number) => {
		onChange({
			...value,
			count,
		});
	};

	const selectedEventCountCondition = value?.type || 'extactly';

	return (
		<div className="qcrm-event-count-condition">
			<Field
				type="select"
				value={selectedEventCountCondition}
				onChange={handleEventCountConditionTypeChange}
				options={eventCountConditionOptions}
				compact={true}
			/>
			<Field
				type="number"
				value={value?.count || 1}
				onChange={handleCountChange}
				placeholder="Enter number of events"
				compact={true}
			/>
			<span className="qcrm-event-count-label">Times</span>
		</div>
	);
};

export default EventCountCondition;
