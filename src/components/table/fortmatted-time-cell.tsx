import dayjs from 'dayjs';
import { convertToWordPressTimezone } from '@/utils/index';

export const FormattedDateCell = ({ value }: { value: string }) => {
	const parsedUtcDate = dayjs.utc(value);
	const parsedDate = parsedUtcDate.isValid() ? parsedUtcDate : dayjs(value);

	if (!parsedDate.isValid()) {
		return <div>-</div>;
	}

	const localizedDate = convertToWordPressTimezone(parsedDate);

	return (
		<div>
			{localizedDate.format('MMM D, YYYY')}
			{' - '}
			{localizedDate.format('h:mm A')}
		</div>
	);
};

export default FormattedDateCell;
