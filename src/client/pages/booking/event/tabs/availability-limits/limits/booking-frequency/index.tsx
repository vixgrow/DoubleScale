/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { LimitBaseProps, UnitOptions } from '@/types/booking';

import LimitCard from '../limit-card';
import LimitRow from '../limit-row';
import { Card, CardContent } from '@/components/ui/card';

interface BookingFrequencyProps extends LimitBaseProps {
	addLimit: (section: 'frequency' | 'duration') => void;
	removeLimit: (section: 'frequency' | 'duration', index: number) => void;
	unitOptions: UnitOptions;
	setBookingFrequency: (val: any) => void;
}

const BookingFrequency: React.FC<BookingFrequencyProps> = ({
	limits,
	handleChange,
	addLimit,
	removeLimit,
	unitOptions,
	setBookingFrequency,
}) => {
	return (
        <Card className="mt-4"><CardContent>
                <div className='flex flex-col gap-5'>
                    <LimitCard
                        handleChange={handleChange}
                        limits={limits}
                        title={__('Limit Booking Frequency', 'doublescale')}
                        description={__(
                            'Limit how many times this event can be booked.',
                            'doublescale'
                        )}
                        type="frequency"
                    />
                    <LimitRow
                        addLimit={addLimit}
                        removeLimit={removeLimit}
                        limits={limits}
                        handleChange={handleChange}
                        unitOptions={unitOptions}
                        setBookingState={setBookingFrequency}
                        type="frequency"
                    />
                </div>
            </CardContent></Card>
    );
};

export default BookingFrequency;
