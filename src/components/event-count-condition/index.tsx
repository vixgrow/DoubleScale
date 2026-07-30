/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
		{ value: 'extactly', label: __('Exactly', 'doublescale') },
		{ value: 'less_than', label: __('Less than', 'doublescale') },
		{ value: 'more_than', label: __('More than', 'doublescale') },
		{ value: 'at_least', label: __('At least', 'doublescale') },
		{ value: 'at_most', label: __('At most', 'doublescale') },
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
		<div className="doublescale-event-count-condition">
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
				placeholder={__('Enter number of events', 'doublescale')}
				compact={true}
			/>
			<span className="doublescale-event-count-label">
				{__('Times', 'doublescale')}
			</span>
		</div>
	);
};

export default EventCountCondition;
