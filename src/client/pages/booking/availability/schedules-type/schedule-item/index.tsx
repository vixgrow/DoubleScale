/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ClockIcon } from '@/components/booking';

interface ScheduleItemProps {
	title: string;
	active: boolean;
	[key: string]: any;
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({
	title,
	active = false,
	...rest
}) => {
	return (
		<div
			className={`font-semibold ${active ? 'text-white bg-primary' : 'text-[#A1A5B7]'} flex items-center gap-2 py-2 px-4 rounded-md cursor-pointer hover:bg-tertiary hover:text-primary`}
			{...rest}
		>
			<ClockIcon />
			<p>{title}</p>
		</div>
	);
};

export default ScheduleItem;
