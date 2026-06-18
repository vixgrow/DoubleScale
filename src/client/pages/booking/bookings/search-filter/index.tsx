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
	const filterClassName =
		'!w-full min-w-0 h-10 md:min-w-0 lg:!w-auto lg:min-w-[9.5rem] lg:max-w-[12.5rem] lg:flex-1';
	const filterWithIconClassName =
		'!w-full min-w-0 pl-2 h-10 md:min-w-0 lg:!w-auto lg:min-w-[9.5rem] lg:max-w-[12.5rem] lg:flex-1';

	return (
		<div className="search-filter grid w-full min-w-0 grid-cols-1 gap-2.5 md:grid-cols-3 lg:flex lg:flex-row lg:flex-wrap lg:items-center">
			<SearchInput
				placeholder={__('Search Bookings', 'doublescale')}
				className="w-full min-w-0 md:col-span-3 lg:col-span-auto lg:w-auto lg:min-w-[12rem] lg:max-w-[14rem] lg:flex-shrink-0"
				onChange={(e) => handleSearch(e.target.value)}
			/>
			{author === 'own' && (
				<>
					<MultiSelect
						title={__('Booking Type', 'doublescale')}
						defaultValue={eventType}
						onChange={(e) => setEventType(e.target.value)}
						options={bookingTypesOptions}
						Icon={IoFilterOutline}
						iconSize={20}
						containerClassName={filterWithIconClassName}
						selectClassName="!rounded-r-lg !rounded-l-none ml-2 min-w-0 truncate"
					/>
					<MultiSelect
						title={__('Event', 'doublescale')}
						defaultValue={event}
						onChange={(e) => setEvent(e.target.value)}
						options={events}
						Icon={AllCalendarIcon as IconType}
						iconSize={20}
						containerClassName={filterWithIconClassName}
						selectClassName="!rounded-r-lg !rounded-l-none ml-2 min-w-0 truncate"
					/>
				</>
			)}
			{canManageAllBookings && (
				<MultiSelect
					title={__('Author', 'doublescale')}
					defaultValue={author}
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
					containerClassName={filterClassName}
					selectClassName="!rounded-lg min-w-0 truncate"
				/>
			)}
		</div>
	);
};

export default SearchFilter;
