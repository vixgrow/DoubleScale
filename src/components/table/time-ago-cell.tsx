import { getTimeAgo } from '@/utils/index';

const TimeAgoCell = ({ value }: { value: string }) => (
	<div>{getTimeAgo(value)}</div>
);
export default TimeAgoCell;
