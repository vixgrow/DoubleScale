/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { LimitBaseProps, UnitOptions } from '@/types/booking';

import LimitCard from '../limit-card';
import LimitRow from '../limit-row';
import { Card, CardContent } from '@/components/ui/card';

interface BookingDurationProps extends LimitBaseProps {
	addLimit: (section: 'frequency' | 'duration') => void;
	removeLimit: (section: 'frequency' | 'duration', index: number) => void;
	unitOptions: UnitOptions;
	setBookingDuration: (val: any) => void;
}

const BookingDuration: React.FC<BookingDurationProps> = ({
	limits,
	handleChange,
	addLimit,
	removeLimit,
	unitOptions,
	setBookingDuration,
}) => {
	return (
        <Card className="mt-4"><CardContent>
                <div className='flex flex-col gap-5'>
                    <LimitCard
                        handleChange={handleChange}
                        limits={limits}
                        title={__('Limit Booking Duration', 'doublescale')}
                        description={__(
                            'Limit how long this event can be booked for.',
                            'doublescale'
                        )}
                        type="duration"
                    />

                    <LimitRow
                        addLimit={addLimit}
                        removeLimit={removeLimit}
                        limits={limits}
                        handleChange={handleChange}
                        unitOptions={unitOptions}
                        setBookingState={setBookingDuration}
                        type="duration"
                    />
                </div>
            </CardContent></Card>
    );
};

export default BookingDuration;
