import { getTimeAgo } from '@/utils/index';

const TimeAgoCell = ({ value }: { value: string | null | undefined }) => (
	<div>{getTimeAgo(value)}</div>
);
export default TimeAgoCell;
