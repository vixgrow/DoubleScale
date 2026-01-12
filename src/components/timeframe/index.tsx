import Field from '../field';

export interface TimeframeValue {
	type?: string;
	count?: number;
	date?: string;
	date_from?: string;
	date_to?: string;
}

interface TimeframeProps {
	value: TimeframeValue;
	onChange: (value: TimeframeValue) => void;
}

const Timeframe = ({ value, onChange }: TimeframeProps) => {
	const timeframeOptions = [
		{ value: 'at_any_time', label: 'At any time' },
		{ value: 'today', label: 'Today' },
		{ value: 'yesterday', label: 'Yesterday' },
		{ value: 'this_week', label: 'This week' },
		{ value: 'last_week', label: 'Last week' },
		{ value: 'this_month', label: 'This month' },
		{ value: 'last_month', label: 'Last month' },
		{ value: 'this_year', label: 'This year' },
		{ value: 'in_the_last_24_hours', label: 'In the last 24 hours' },
		{ value: 'in_the_last_7_days', label: 'In the last 7 days' },
		{ value: 'in_the_last_14_days', label: 'In the last 14 days' },
		{ value: 'in_the_last_30_days', label: 'In the last 30 days' },
		{ value: 'in_the_last_60_days', label: 'In the last 60 days' },
		{ value: 'in_the_last_90_days', label: 'In the last 90 days' },
		{ value: 'in_the_last_365_days', label: 'In the last 365 days' },
		{ value: 'in_the_last_x_days', label: 'In the last X days' },
		{ value: 'before', label: 'Before' },
		{ value: 'after', label: 'After' },
		{ value: 'between', label: 'Between' },
		{ value: 'day_of', label: 'Day of' },
	];

	const handleTimeframeTypeChange = (type: string) => {
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

	const handleDateChange = (date: string) => {
		onChange({
			...value,
			date,
		});
	};

	const handleDateFromChange = (date_from: string) => {
		onChange({
			...value,
			date_from,
		});
	};

	const handleDateToChange = (date_to: string) => {
		onChange({
			...value,
			date_to,
		});
	};

	const selectedTimeframe = value?.type || 'at_any_time';

	const renderAdditionalField = () => {
		// For "in the last X days" - show number input
		if (selectedTimeframe === 'in_the_last_x_days') {
			return (
				<Field
					type="number"
					value={value?.count || 0}
					onChange={handleCountChange}
					placeholder="Enter number of days"
				/>
			);
		}

		// For "before", "after", "day_of" - show single date input
		if (['before', 'after', 'day_of'].includes(selectedTimeframe)) {
			return (
				<Field
					type="date"
					value={value?.date || ''}
					onChange={handleDateChange}
					placeholder="Select date"
				/>
			);
		}

		// For "between" - show two date inputs (from and to)
		if (selectedTimeframe === 'between') {
			return (
				<>
					<Field
						type="date"
						value={value?.date_from || ''}
						onChange={handleDateFromChange}
						placeholder="From"
						label="From"
					/>
					<Field
						type="date"
						value={value?.date_to || ''}
						onChange={handleDateToChange}
						placeholder="To"
						label="To"
					/>
				</>
			);
		}

		return null;
	};

	return (
		<>
			<Field
				type="select"
				value={selectedTimeframe}
				onChange={handleTimeframeTypeChange}
				options={timeframeOptions}
			/>
			{renderAdditionalField()}
		</>
	);
};

export default Timeframe;
