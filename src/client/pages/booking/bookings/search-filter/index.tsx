/*
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { IoFilterOutline } from 'react-icons/io5';
import { IconType } from 'react-icons';

/**
 * Internal dependencies
 */
import { EventTypes, GeneralOptions } from '@/types/booking';
import {
	AllCalendarIcon,
	MultiSelect,
	SearchInput,
} from '@/components/booking';

import './style.scss';

/**
 * Main Search Filter Component
 */

type BookingTypeSelect = {
	value: 'all' | EventTypes | 'service';
	label: string;
}[];
const bookingTypesOptions: BookingTypeSelect = [
	{ value: 'all', label: __('Type: All', 'doublescale') },
	{
		value: 'one-to-one',
		label: __('Type: One to One', 'doublescale'),
	},
	{ value: 'group', label: __('Type: Group', 'doublescale') },
	{
		value: 'round-robin',
		label: __('Type: Round Robin', 'doublescale'),
	},
	{
		value: 'service',
		label: __('Type: Service', 'doublescale'),
	},
];

type SearchFilterProps = {
	events: GeneralOptions[];
	author: string;
	event: string | number;
	eventType: string;
	handleSearch: (val: string) => void;
	setEventType: (val: string) => void;
	setEvent: (val: string | number) => void;
	setAuthor: (val: string) => void;
	canManageAllBookings: boolean;
};

const SearchFilter: React.FC<SearchFilterProps> = ({
	events,
	author,
	event,
	eventType,
	setAuthor,
	setEvent,
	setEventType,
	handleSearch,
	canManageAllBookings,
}) => {
	return (
        <div className='flex gap-2.5 justify-center items-center px-2'>
            <SearchInput
				placeholder={__('Search Bookings', 'doublescale')}
				className="w-[220px]"
				onChange={(e) => handleSearch(e.target.value)}
			/>
            {author === 'own' && (
				<>
					<MultiSelect
						title={__('Booking Type', 'doublescale')}
						defaultValue={eventType}
						style={{ width: 150 }}
						onChange={(e) => setEventType(e.target.value)}
						options={bookingTypesOptions}
						Icon={IoFilterOutline}
						containerClassName="pl-2 w-fit h-10"
						selectClassName="!rounded-r-lg !rounded-l-none ml-2"
					/>
					<MultiSelect
						title={__('Event', 'doublescale')}
						defaultValue={event}
						style={{ width: 150 }}
						onChange={(e) => setEvent(e.target.value)}
						options={events}
						Icon={AllCalendarIcon as IconType}
						containerClassName="pl-2 w-fit h-10"
						selectClassName="!rounded-r-lg !rounded-l-none ml-2"
					/>
				</>
			)}
            {canManageAllBookings && (
				<MultiSelect
					title={__('Author', 'doublescale')}
					defaultValue={author}
					style={{ width: 150 }}
					onChange={(e) => setAuthor(e.target.value)}
					options={[
						{
							value: 'own',
							label: __('Meetings: My Meetings', 'doublescale'),
						},
						{
							value: 'all',
							label: __('Meetings: All', 'doublescale'),
						},
					]}
					containerClassName="h-10 ml-2.5"
					selectClassName="!rounded-lg"
				/>
			)}
        </div>
    );
};

export default SearchFilter;
