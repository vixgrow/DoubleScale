import Field from '../field';
import Timeframe, { TimeframeValue } from '../timeframe';
import EventCountCondition, {
	EventCountConditionValue,
} from '../event-count-condition';

interface PageVisitedValue {
	guid?: string;
	timeframe?: TimeframeValue;
	event_count_condition?: EventCountConditionValue;
}

interface PageVisitedProps {
	value: PageVisitedValue;
	onChange: (value: PageVisitedValue) => void;
	options: any;
}

const PageVisited = ({ value, onChange, options }: PageVisitedProps) => {
	const handlePageGuidChange = (guid: string) => {
		onChange({
			...value,
			guid,
		});
	};

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
			<div className="qcrm-page-visited-row">
				<Field
					type="select"
					value={value?.guid || ''}
					onChange={handlePageGuidChange}
					placeholder="Select page"
					options={options}
					compact={true}
				/>
				{value?.guid && (
					<Field
						type="text"
						value={value.guid}
						onChange={handlePageGuidChange}
						placeholder="Page URL"
						label="Page URL (editable)"
						compact={true}
					/>
				)}
			</div>

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

export default PageVisited;
