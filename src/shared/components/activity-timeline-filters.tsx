import type { FC } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@doublescale/components/ui/button';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@doublescale/components/ui/select';
import { DateRangePicker } from '@doublescale/components/ui/date-range-picker';
import type { ActivityTimelineTypeFilter } from '@doublescale/shared/lib/activity-timeline-type-filter';

export type { ActivityTimelineTypeFilter };

interface ActivityTimelineFiltersProps {
	filters: {
		activity_type?: ActivityTimelineTypeFilter;
		sort_by: string;
		sort_order: string;
		date_from?: string;
		date_to?: string;
	};
	onChange: (key: string, value: string) => void;
	onDateChange: (from: string, to: string) => void;
	onClear: () => void;
	onApply: () => void;
	/** When true, only show the Type dropdown (task activity tab). */
	typeOnly?: boolean;
	/** Label for the system-events filter option (defaults to Tasks). */
	systemEventsLabel?: string;
	/** Value for the system-events filter option (defaults to task). */
	systemEventsType?: ActivityTimelineTypeFilter;
	/** When false, hide call/email/meeting filters (e.g. project activity). */
	showCommunicationFilters?: boolean;
	/** Raise portaled selects above the task detail dialog (z-index 1800001). */
	nestedInTaskDialog?: boolean;
}

const ActivityTimelineFilters: FC<ActivityTimelineFiltersProps> = ({
	filters,
	onChange,
	onDateChange,
	onClear,
	onApply,
	typeOnly = false,
	systemEventsLabel = __('Tasks', 'doublescale'),
	systemEventsType = 'task',
	showCommunicationFilters = true,
	nestedInTaskDialog = false,
}) => {
	const taskDialogSelectProps = nestedInTaskDialog
		? {
				'data-task-dialog-activity-select': '',
				className: 'z-[1800004]',
				style: { zIndex: 1_800_004 },
			}
		: {};

	return (
		<div className="mb-6 flex w-full min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6 lg:gap-[24px]">
			<div className="flex w-full min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:gap-4 md:gap-6 lg:gap-[24px]">
				<div className="flex min-w-0 w-full flex-1 flex-col sm:min-w-[12rem]">
					<label className="mb-2 block text-sm font-medium leading-6 text-foreground">
						{__('Type', 'doublescale')}
					</label>
					<Select
						value={filters.activity_type || 'all'}
						onValueChange={(value) => onChange('activity_type', value)}
					>
						<SelectTrigger className="h-10 w-full rounded-lg border border-border bg-background text-sm font-normal text-foreground shadow-none">
							<SelectValue placeholder={__('All types', 'doublescale')} />
						</SelectTrigger>
						<SelectContent {...taskDialogSelectProps}>
							<SelectItem value="all">
								{__('All types', 'doublescale')}
							</SelectItem>
							<SelectItem value={systemEventsType}>
								{systemEventsLabel}
							</SelectItem>
							<SelectItem value="note">
								{__('Notes', 'doublescale')}
							</SelectItem>
							{showCommunicationFilters ? (
								<>
									<SelectItem value="call_logged">
										{__('Calls', 'doublescale')}
									</SelectItem>
									<SelectItem value="email_sent">
										{__('Emails', 'doublescale')}
									</SelectItem>
									<SelectItem value="meeting_scheduled">
										{__('Meetings', 'doublescale')}
									</SelectItem>
								</>
							) : null}
							<SelectItem value="files">
								{__('Files', 'doublescale')}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{!typeOnly ? (
					<>
						<div className="flex min-w-0 w-full flex-1 flex-col">
							<label className="mb-2 block text-sm font-medium text-foreground">
								{__('Activity Date', 'doublescale')}
							</label>
							<div className="relative z-[120] w-full min-w-0">
								<DateRangePicker
									value={{
										from: filters.date_from
											? new Date(filters.date_from)
											: null,
										to: filters.date_to
											? new Date(filters.date_to)
											: null,
									}}
									onChange={(range) => {
										onDateChange(
											range?.from?.toISOString() || '',
											range?.to?.toISOString() || ''
										);
									}}
									placeholder={__('From - To', 'doublescale')}
									className="h-10 w-full justify-start gap-2 rounded-lg border border-border bg-background text-left text-sm font-normal text-foreground shadow-none"
								/>
							</div>
						</div>

						<div className="flex min-w-0 w-full flex-1 flex-col sm:min-w-[12rem]">
							<label className="mb-2 block text-sm font-medium leading-6 text-foreground">
								{__('Sort By', 'doublescale')}
							</label>
							<Select
								value={`${filters.sort_by}-${filters.sort_order}`}
								onValueChange={(value) => {
									const [sort_by, sort_order] = value.split('-');
									onChange('sort_by', sort_by);
									onChange('sort_order', sort_order);
								}}
							>
								<SelectTrigger className="h-10 w-full rounded-lg border border-border bg-background text-sm font-normal text-foreground shadow-none">
									<SelectValue placeholder={__('Sort by', 'doublescale')} />
								</SelectTrigger>
								<SelectContent {...taskDialogSelectProps}>
									<SelectItem value="activity_date-desc">
										{__('Newest', 'doublescale')}
									</SelectItem>
									<SelectItem value="activity_date-asc">
										{__('Oldest', 'doublescale')}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</>
				) : null}
			</div>

			<div className="flex w-full shrink-0 flex-col gap-6 sm:flex-row sm:items-end sm:justify-end md:ml-auto md:w-auto">
				<Button
					variant="outline"
					size="sm"
					onClick={onClear}
					type="button"
					title={__('Clear all filters', 'doublescale')}
					className="h-10 w-full border-border bg-background text-sm font-medium text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground sm:w-auto"
				>
					{__('Clear', 'doublescale')}
				</Button>
				<Button
					variant="outline"
					size="sm"
					type="button"
					onClick={onApply}
					className="h-10 w-full border-primary bg-background text-sm font-medium text-primary shadow-none hover:bg-primary/5 sm:w-auto"
				>
					{__('Apply Filters', 'doublescale')}
				</Button>
			</div>
		</div>
	);
};

export default ActivityTimelineFilters;
