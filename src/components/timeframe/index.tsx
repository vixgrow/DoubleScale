/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
		{ value: 'at_any_time', label: __('At any time', 'doublescale') },
		{ value: 'today', label: __('Today', 'doublescale') },
		{ value: 'yesterday', label: __('Yesterday', 'doublescale') },
		{ value: 'this_week', label: __('This week', 'doublescale') },
		{ value: 'last_week', label: __('Last week', 'doublescale') },
		{ value: 'this_month', label: __('This month', 'doublescale') },
		{ value: 'last_month', label: __('Last month', 'doublescale') },
		{ value: 'this_year', label: __('This year', 'doublescale') },
		{
			value: 'in_the_last_24_hours',
			label: __('In the last 24 hours', 'doublescale'),
		},
		{
			value: 'in_the_last_7_days',
			label: __('In the last 7 days', 'doublescale'),
		},
		{
			value: 'in_the_last_14_days',
			label: __('In the last 14 days', 'doublescale'),
		},
		{
			value: 'in_the_last_30_days',
			label: __('In the last 30 days', 'doublescale'),
		},
		{
			value: 'in_the_last_60_days',
			label: __('In the last 60 days', 'doublescale'),
		},
		{
			value: 'in_the_last_90_days',
			label: __('In the last 90 days', 'doublescale'),
		},
		{
			value: 'in_the_last_365_days',
			label: __('In the last 365 days', 'doublescale'),
		},
		{
			value: 'in_the_last_x_days',
			label: __('In the last X days', 'doublescale'),
		},
		{ value: 'before', label: __('Before', 'doublescale') },
		{ value: 'after', label: __('After', 'doublescale') },
		{ value: 'between', label: __('Between', 'doublescale') },
		{ value: 'day_of', label: __('Day of', 'doublescale') },
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
					placeholder={__('Enter number of days', 'doublescale')}
					compact={true}
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
					placeholder={__('Select date', 'doublescale')}
					compact={true}
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
						placeholder={__('From', 'doublescale')}
						label={__('From', 'doublescale')}
						compact={true}
					/>
					<Field
						type="date"
						value={value?.date_to || ''}
						onChange={handleDateToChange}
						placeholder={__('To', 'doublescale')}
						label={__('To', 'doublescale')}
						compact={true}
					/>
				</>
			);
		}

		return null;
	};

	return (
		<div className="doublescale-timeframe">
			<Field
				type="select"
				value={selectedTimeframe}
				onChange={handleTimeframeTypeChange}
				options={timeframeOptions}
				compact={true}
			/>
			{renderAdditionalField()}
		</div>
	);
};

export default Timeframe;
