/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { BookingsTabsTypes } from '@/types/booking';

import {
	AllCalendarIcon,
	CalendarNoshowIcon,
	CancelledCalendarIcon,
	CompletedCalendarIcon,
	LatestCalendarIcon,
	PendingCalendarIcon,
	UpcomingCalendarIcon,
} from '@/components/booking';
import { IconType } from 'react-icons';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Main Bookings Tabs Component
 */
interface BookingsTabsProps {
	setPeriod: (period: BookingsTabsTypes) => void;
	period: string;
	pendingCount?: number;
	cancelled?: number;
	noShowCount?: number;
	waitingCount?: number;
}

type TabItem = {
	value: BookingsTabsTypes;
	label: string;
	icon: IconType;
};

const BookingsTabs: React.FC<BookingsTabsProps> = ({
	setPeriod,
	period,
	pendingCount,
	cancelled,
	noShowCount,
	waitingCount,
}) => {
	let tabs: TabItem[] = [
		{
			value: 'all',
			label: __('All', 'doublescale'),
			icon: AllCalendarIcon as IconType,
		},
		{
			value: 'upcoming',
			label: __('Upcoming', 'doublescale'),
			icon: UpcomingCalendarIcon as IconType,
		},
		{
			value: 'completed',
			label: __('Completed', 'doublescale'),
			icon: CompletedCalendarIcon as IconType,
		},
		{
			value: 'latest',
			label: __('Latest Bookings', 'doublescale'),
			icon: LatestCalendarIcon as IconType,
		},
	];

	if (pendingCount && pendingCount > 0) {
		tabs.splice(2, 0, {
			value: 'pending',
			label: `${__('Pending', 'doublescale')} (${pendingCount})`,
			icon: PendingCalendarIcon as IconType,
		});
	}

	if (cancelled && cancelled > 0) {
		tabs.splice(3, 0, {
			value: 'cancelled',
			label: __('Cancelled', 'doublescale'),
			icon: CancelledCalendarIcon as IconType,
		});
	}

	if (noShowCount && noShowCount > 0) {
		tabs.splice(4, 0, {
			value: 'no-show',
			label: __('No-Show', 'doublescale'),
			icon: CalendarNoshowIcon as IconType,
		});
	}

	tabs = applyFilters('doublescale_booking_bookings_tabs', tabs, {
		waitingCount,
	}) as TabItem[];

	const options = tabs.map((tab) => ({
		value: tab.value,
		label: (
			<div className="flex items-center gap-2">
				{React.createElement(tab.icon, {
					style: { fill: 'currentColor', width: 16, height: 16 },
				})}
				<span>{tab.label}</span>
			</div>
		),
	}));

	return (
		<Select
			value={period}
			onValueChange={(value) => setPeriod(value as BookingsTabsTypes)}
		>
			<SelectTrigger className="w-[260px]">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{options.map((opt) => (
					<SelectItem key={opt.value} value={opt.value}>
						{opt.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

export default BookingsTabs;
