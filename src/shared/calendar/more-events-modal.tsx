/**
 * Modal listing every event on a calendar day — opened from the month grid
 * "+N more" control.
 */

import { __ } from '@wordpress/i18n';
import { format } from 'date-fns';

import { CalendarIcon } from '@/components/icons';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

import EventChip from './event-chip';
import GradientCalendarIcon from './gradient-calendar-icon';
import type { CalendarEvent } from './types';
import { CustomDialogHeader } from '@doublescale/components';

export interface MoreEventsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	date: Date | null;
	events: CalendarEvent[];
	onSelect?: (event: CalendarEvent) => void;
}

const MoreEventsModal = ({
	open,
	onOpenChange,
	date,
	events,
	onSelect,
}: MoreEventsModalProps) => {
	const dateLabel = date ? format(date, 'd/M/yyyy') : '';

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-md gap-0 overflow-hidden rounded-2xl border border-border sm:rounded-2xl"
				overlayClassName="bg-black/40 backdrop-blur-sm"
			>
				<DialogHeader>
					<CustomDialogHeader title={__('More Events', 'doublescale')} 
					subtitle={__('Knowing more events in calendar','doublescale')}
							icon={<GradientCalendarIcon width={24} height={24} />} />
				</DialogHeader>

				<div className="pt-6">
					<div className="rounded-xl bg-[#F7F8FA] border border-border p-6">
						<div className="mb-4 flex items-center justify-between gap-3 text-sm">
							<span className="inline-flex items-center gap-2 text-muted-foreground">
								<CalendarIcon width={24} height={24} />
								{__('Date', 'doublescale')}
							</span>
							<span className="font-medium text-foreground">
								{dateLabel}
							</span>
						</div>

						<div className="space-y-6">
							{events.map((event) => (
								<EventChip
									key={event.id}
									event={event}
									onSelect={(selected) => {
										onSelect?.(selected);
										onOpenChange(false);
									}}
								/>
							))}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default MoreEventsModal;
