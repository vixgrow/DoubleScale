import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { CustomDialogHeader, FiltersIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	TICKET_STATUSES,
	TICKET_PRIORITIES,
	type TicketPriority,
} from '@/constants/support';
import type { TicketFilters } from '@/types/support';

export interface SupportInboxFilterValues {
	status?: string;
	priority?: TicketPriority;
	mailbox_id?: number;
	tag_id?: number;
}

interface SupportInboxFilterDialogProps {
	filters: SupportInboxFilterValues;
	mailboxes: Array<{ id: number; name?: string; slug?: string }>;
	tags: Array<{ id: number; name: string }>;
	onApply: (patch: Partial<TicketFilters>) => void;
}

const emptyFilterValues = (): SupportInboxFilterValues => ({
	status: undefined,
	priority: undefined,
	mailbox_id: undefined,
	tag_id: undefined,
});

const SupportInboxFilterDialog: React.FC<SupportInboxFilterDialogProps> = ({
	filters,
	mailboxes,
	tags,
	onApply,
}) => {
	const [open, setOpen] = useState(false);
	const [tempFilters, setTempFilters] =
		useState<SupportInboxFilterValues>(emptyFilterValues);

	const hasActiveFilters = Boolean(
		filters.status ||
			filters.priority ||
			filters.mailbox_id != null ||
			filters.tag_id != null
	);

	const hasTempFilters = Boolean(
		tempFilters.status ||
			tempFilters.priority ||
			tempFilters.mailbox_id != null ||
			tempFilters.tag_id != null
	);

	const openDialog = () => {
		setTempFilters({
			status: filters.status,
			priority: filters.priority,
			mailbox_id: filters.mailbox_id,
			tag_id: filters.tag_id,
		});
		setOpen(true);
	};

	const handleClear = () => {
		setTempFilters(emptyFilterValues());
	};

	const handleApply = () => {
		onApply({
			status: tempFilters.status,
			priority: tempFilters.priority,
			mailbox_id: tempFilters.mailbox_id,
			tag_id: tempFilters.tag_id,
		});
		setOpen(false);
	};

	return (
		<>
			<Button
				type="button"
				variant="outline"
				onClick={openDialog}
				className="flex items-center gap-1 rounded-lg border border-border bg-[#F7F8FA] px-3 py-2 text-sm font-medium text-foreground transition-colors !w-auto shrink-0"
			>
				<FiltersIcon width={24} height={24} />
				{__('Filters', 'doublescale')}

				{hasActiveFilters && (
					<span
						className="ml-1 h-2 w-2 rounded-full bg-brandPrimary"
						aria-hidden="true"
					/>
				)}
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="z-[150200] mx-1 w-[calc(100%-2rem)] max-w-2xl gap-4 rounded-2xl p-4 sm:mx-auto sm:w-full sm:p-6">
					<DialogHeader className="items-start text-left">
						<DialogTitle className="text-left">
							<CustomDialogHeader
								title={__('Filter', 'doublescale')}
								subtitle={__(
									'Select Groups of filters about data you want to view.',
									'doublescale'
								)}
								icon={<FiltersIcon width={18} height={18} />}
							/>
						</DialogTitle>
					</DialogHeader>

					<div className="rounded-lg border border-border p-4 sm:p-6">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
							<div className="min-w-0 space-y-2">
								<Label className="text-base font-normal text-foreground">
									{__('Status', 'doublescale')}
								</Label>
								<Select
									value={tempFilters.status ?? 'all'}
									onValueChange={(value) =>
										setTempFilters((prev) => ({
											...prev,
											status:
												value === 'all'
													? undefined
													: value,
										}))
									}
								>
									<SelectTrigger className="h-10 w-full rounded-lg">
										<SelectValue
											placeholder={__(
												'All',
												'doublescale'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{__('All', 'doublescale')}
										</SelectItem>
										{TICKET_STATUSES.map((status) => (
											<SelectItem
												key={status}
												value={status}
											>
												{status}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="min-w-0 space-y-2">
								<Label className="text-base font-normal text-foreground">
									{__('Priority', 'doublescale')}
								</Label>
								<Select
									value={tempFilters.priority ?? 'all'}
									onValueChange={(value) =>
										setTempFilters((prev) => ({
											...prev,
											priority:
												value === 'all'
													? undefined
													: (value as TicketPriority),
										}))
									}
								>
									<SelectTrigger className="h-10 w-full rounded-lg">
										<SelectValue
											placeholder={__(
												'All',
												'doublescale'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{__('All', 'doublescale')}
										</SelectItem>
										{TICKET_PRIORITIES.map((priority) => (
											<SelectItem
												key={priority}
												value={priority}
											>
												{priority}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="min-w-0 space-y-2">
								<Label className="text-base font-normal text-foreground">
									{__('Mailbox', 'doublescale')}
								</Label>
								<Select
									value={
										tempFilters.mailbox_id != null
											? String(tempFilters.mailbox_id)
											: 'all'
									}
									onValueChange={(value) =>
										setTempFilters((prev) => ({
											...prev,
											mailbox_id:
												value === 'all'
													? undefined
													: Number(value),
										}))
									}
								>
									<SelectTrigger className="h-10 w-full rounded-lg">
										<SelectValue
											placeholder={__(
												'All',
												'doublescale'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{__('All', 'doublescale')}
										</SelectItem>
										{mailboxes.map((mailbox) => (
											<SelectItem
												key={mailbox.id}
												value={String(mailbox.id)}
											>
												{mailbox.name || mailbox.slug}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="min-w-0 space-y-2">
								<Label className="text-base font-normal text-foreground">
									{__('Tag', 'doublescale')}
								</Label>
								<Select
									value={
										tempFilters.tag_id != null
											? String(tempFilters.tag_id)
											: 'all'
									}
									onValueChange={(value) =>
										setTempFilters((prev) => ({
											...prev,
											tag_id:
												value === 'all'
													? undefined
													: Number(value),
										}))
									}
								>
									<SelectTrigger className="h-10 w-full rounded-lg">
										<SelectValue
											placeholder={__(
												'All',
												'doublescale'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{__('All', 'doublescale')}
										</SelectItem>
										{tags.map((tag) => (
											<SelectItem
												key={tag.id}
												value={String(tag.id)}
											>
												{tag.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="mt-6">
							<Button
								type="button"
								variant="outline"
								onClick={handleClear}
								disabled={!hasTempFilters}
								className="h-10 rounded-lg border-destructive bg-white text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive"
							>
								{__('Clear Filters', 'doublescale')}
							</Button>
						</div>
					</div>

					<DialogFooter className="flex flex-row flex-wrap items-center justify-end gap-3 sm:space-x-0">
						<Button
							type="button"
							onClick={handleApply}
							className="h-10 rounded-lg px-6"
						>
							{__('Apply Filters', 'doublescale')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default SupportInboxFilterDialog;
