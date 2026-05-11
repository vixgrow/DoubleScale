/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScheduleItem from './schedule-item';

interface SchedulesTypeProps {
	canManageAllAvailability: boolean;
	showAllSchedules: boolean;
	setShowAllSchedules: (isFiltered: boolean) => void;
}
const SchedulesType: React.FC<SchedulesTypeProps> = ({
	canManageAllAvailability,
	showAllSchedules,
	setShowAllSchedules,
}) => {
	return (
        <div className="my-4 p-4 rounded-md border border-gray-200 bg-white">
            <div className='flex items-center gap-2.5'>
				{canManageAllAvailability && (
					<ScheduleItem
						title={__('All Schedule', 'doublescale')}
						active={showAllSchedules}
						onClick={() => setShowAllSchedules(true)}
					/>
				)}
				<ScheduleItem
					title={__('My Schedule', 'doublescale')}
					active={!showAllSchedules}
					onClick={() => setShowAllSchedules(false)}
				/>
			</div>
        </div>
    );
};

export default SchedulesType;
