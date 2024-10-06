/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Typography, DatePicker, Select, Button } from 'antd';
import en from 'antd/es/date-picker/locale/en_US';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import './style.scss';

interface DateFilterProps {
	interval: string;
	startDate: Date;
	endDate: Date;
	onIntervalChange: (interval: string) => void;
	onChangeFromDate: (date: Date) => void;
	onChangeToDate: (date: Date) => void;
	onSubmit: () => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
	interval,
	startDate,
	endDate,
	onIntervalChange,
	onChangeFromDate,
	onChangeToDate,
	onSubmit,
}) => {
	const intervalOptions = [
		{
			label: __('Today', 'quillcrm'),
			value: 'today',
		},
		{
			label: __('Yesterday', 'quillcrm'),
			value: 'yesterday',
		},
		{
			label: __('Last 7 days', 'quillcrm'),
			value: 'last_7_days',
		},
		{
			label: __('Last 30 days', 'quillcrm'),
			value: 'last_30_days',
		},
		{
			label: __('This month', 'quillcrm'),
			value: 'this_month',
		},
		{
			label: __('Last month', 'quillcrm'),
			value: 'last_month',
		},
		{
			label: __('This year', 'quillcrm'),
			value: 'this_year',
		},
		{
			label: __('Last year', 'quillcrm'),
			value: 'last_year',
		},
		{
			label: __('Custom', 'quillcrm'),
			value: 'custom',
		},
	];

	return (
		<Flex gap={10} align="flex-end">
			<Flex gap={10} vertical>
				<Typography.Text strong>
					{__('Interval', 'quillcrm')}
				</Typography.Text>
				<Select
					value={interval}
					onChange={(value) => onIntervalChange(value)}
					options={intervalOptions}
					style={{ width: 200 }}
				/>
			</Flex>
			{interval === 'custom' && (
				<>
					<Flex gap={10} vertical>
						<Typography.Text strong>
							{__('Start Date', 'quillcrm')}
						</Typography.Text>
						<DatePicker
							locale={en}
							value={dayjs(startDate)}
							onChange={(date) => onChangeFromDate(date.toDate())}
						/>
					</Flex>
					<Flex gap={10} vertical>
						<Typography.Text strong>
							{__('End Date', 'quillcrm')}
						</Typography.Text>
						<DatePicker
							locale={en}
							value={dayjs(endDate)}
							onChange={(date) => onChangeToDate(date.toDate())}
						/>
					</Flex>
				</>
			)}
			<Button onClick={onSubmit}>{__('Refresh', 'quillcrm')}</Button>
		</Flex>
	);
};

export default DateFilter;
