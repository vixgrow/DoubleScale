/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Plus as PlusOutlined } from 'lucide-react';

import AddAvailabilityScheduleModal from './add-schedule-modal';
import AvailabilityList from './availability-list';
import { Header } from '@/components/booking';
import SchedulesType from './schedules-type';
import { useCurrentUser } from '@/hooks/booking';
import { Button } from '@/components/ui/button';

/**
 * Main Calendars Component.
 */
const Availability: React.FC = () => {
	const [open, setOpen] = useState<boolean>(false);
	const [showAllSchedules, setShowAllSchedules] = useState<boolean>(false);
	const canManageAllAvailability = useCurrentUser().hasCapability(
		'doublescale_booking_manage_all_availability'
	);

	return (
        <>
            <div className='flex justify-between items-center'>
				<Header
					header={__('Availability', 'doublescale')}
					subHeader={__(
						'Configure times when you are available for bookings.',
						'doublescale'
					)}
				/>

				<Button
                    className="px-8"
                    onClick={() => {
						setOpen(true);
					}}
                    variant='default'
                    size='lg'>{<PlusOutlined />} 
                    {__('Add New', 'doublescale')}
                </Button>
			</div>
            <SchedulesType
				canManageAllAvailability={canManageAllAvailability}
				showAllSchedules={showAllSchedules}
				setShowAllSchedules={setShowAllSchedules}
			/>
            <AvailabilityList
				showAllSchedules={showAllSchedules}
				openAvailabilityModal={setOpen}
			/>
            <AddAvailabilityScheduleModal open={open} setOpen={setOpen} />
        </>
    );
};

export default Availability;
