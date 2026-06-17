/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Plus as PlusOutlined } from 'lucide-react';

/*
 * Internal dependencies
 */
import { Header } from '@/components/booking';

import { Button } from '@/components/ui/button';

interface BookingsHeaderProps {
	handleOpen: (state: boolean) => void;
}
/**
 * Main Bookings Component.
 */
const BookingsHeader: React.FC<BookingsHeaderProps> = ({ handleOpen }) => {
	return (
        <div className='flex  flex-col min-[375px]:flex-row justify-between items-start min-[375px]:items-center'>
            <Header
				header={__('Bookings', 'doublescale')}
				subHeader={__(
					'See your scheduled events from your calendar events links.',
					'doublescale'
				)}
			/>
            <Button
				className="bg-primary text-white"
				onClick={() => {
					handleOpen(true);
				}}
				variant='default'
				size='lg'
			>
				<PlusOutlined />
				{__('Booking Manually', 'doublescale')}
			</Button>
        </div>
    );
};

export default BookingsHeader;
