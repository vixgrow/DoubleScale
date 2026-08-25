/**
 * Bookings section — filter tabs, search, card grid, detail modal, and cancel flow.
 * Reschedule links out to the public hash page; cancel uses the portal endpoint.
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { format } from 'date-fns';
import {
	ArrowUpRight,
	ChevronLeft,
	ChevronRight,
	Search,
} from 'lucide-react';
import {
	Navigate,
	Route,
	Routes,
	useNavigate,
	useParams,
} from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	CalendarIcon,
	CustomDialogHeader,
	MoveStatusIcon,
	TimerBlockIcon,
} from '@doublescale/components';
import GradientCalendarIcon from '@doublescale/shared/calendar/gradient-calendar-icon';

import {
	cancelBooking,
	fetchBooking,
	fetchBookings,
	fetchRescheduleUrl,
	formatRestError,
	useAsync,
	type BookingFilter,
} from '../../api';
import type { PortalBooking } from '../../types';
import { formatTime } from '../../shared/format';
import { ClockIcon, MapPinIcon } from '../../shared/icons';
import { EmptyState, ErrorState, Spinner } from '../../shared/ui';

const PAGE_SIZE = 8;

const TABS: Array<{ key: BookingFilter; label: string }> = [
	{ key: 'all', label: __('All', 'doublescale') },
	{ key: 'upcoming', label: __('Upcoming', 'doublescale') },
	{ key: 'past', label: __('Past', 'doublescale') },
	{ key: 'cancelled', label: __('Cancelled', 'doublescale') },
];

type DisplayStatus = 'upcoming' | 'past' | 'cancelled';

const toDate = (value: string): Date | null => {
	if (!value) {
		return null;
	}
	const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? null : d;
};

function bookingDisplayStatus(booking: PortalBooking): DisplayStatus {
	if (booking.status === 'cancelled') {
		return 'cancelled';
	}
	const end = toDate(booking.end_time);
	if (end && end.getTime() < Date.now()) {
		return 'past';
	}
	return 'upcoming';
}

const STATUS_PILL: Record<DisplayStatus, { label: string; className: string }> =
	{
		upcoming: {
			label: __('Upcoming', 'doublescale'),
			className: 'bg-[#E8F4FE] text-[#0D9DFC]',
		},
		past: {
			label: __('Past', 'doublescale'),
			className: 'bg-[#F7F4C3] text-[#896900]',
		},
		cancelled: {
			label: __('Cancelled', 'doublescale'),
			className: 'bg-[#FBE8E8] text-[#C30A0A]',
		},
	};

function formatBookingDateParts(
	startTime: string,
	timezone: string
): { day: string; month: string } {
	const d = toDate(startTime);
	if (!d) {
		return { day: '', month: '' };
	}
	try {
		return {
			day: new Intl.DateTimeFormat(undefined, {
				day: 'numeric',
				timeZone: timezone || 'UTC',
			}).format(d),
			month: new Intl.DateTimeFormat(undefined, {
				month: 'short',
				timeZone: timezone || 'UTC',
			}).format(d),
		};
	} catch {
		return {
			day: String(d.getUTCDate()),
			month: d.toLocaleString(undefined, { month: 'short' }),
		};
	}
}

function formatBookingDateShort(startTime: string, timezone: string): string {
	const d = toDate(startTime);
	if (!d) {
		return startTime;
	}
	try {
		const parts = new Intl.DateTimeFormat(undefined, {
			day: 'numeric',
			month: 'numeric',
			year: 'numeric',
			timeZone: timezone || 'UTC',
		}).formatToParts(d);
		const day = parts.find((p) => p.type === 'day')?.value ?? '';
		const month = parts.find((p) => p.type === 'month')?.value ?? '';
		const year = parts.find((p) => p.type === 'year')?.value ?? '';
		return `${day}/${month}/${year}`;
	} catch {
		return format(d, 'd/M/yyyy');
	}
}

function formatBookingTimeLine(booking: PortalBooking): string {
	const time = formatTime(booking.start_time, booking.timezone);
	if (booking.event.duration) {
		return `${time} ,${booking.event.duration}${__('Min', 'doublescale')}`;
	}
	return time;
}

function emptyCopy(filter: BookingFilter): {
	title: string;
	description: string;
} {
	switch (filter) {
		case 'upcoming':
			return {
				title: __('No upcoming bookings yet', 'doublescale'),
				description: __(
					'There are no upcoming bookings to display at the moment.',
					'doublescale'
				),
			};
		case 'past':
			return {
				title: __('No past bookings yet', 'doublescale'),
				description: __(
					'There are no past bookings to display at the moment.',
					'doublescale'
				),
			};
		case 'cancelled':
			return {
				title: __('No cancelled bookings yet', 'doublescale'),
				description: __(
					'There are no cancelled bookings to display at the moment.',
					'doublescale'
				),
			};
		default:
			return {
				title: __('No bookings yet', 'doublescale'),
				description: __(
					'There are no bookings to display at the moment.',
					'doublescale'
				),
			};
	}
}

const BookingStatusPill = ({ booking }: { booking: PortalBooking }) => {
	const key = bookingDisplayStatus(booking);
	const pill = STATUS_PILL[key];
	return (
		<span
			className={`inline-flex rounded-lg px-2 py-1 text-sm font-medium ${pill.className}`}
		>
			{pill.label}
		</span>
	);
};

const DETAIL_ICON_SIZE = 24;

const BookingDetailDateIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={DETAIL_ICON_SIZE}
		height={DETAIL_ICON_SIZE}
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden
	>
		<path
			d="M15.3794 4.91172V3.62069C15.3794 3.28138 15.098 3 14.7587 3C14.4194 3 14.138 3.28138 14.138 3.62069V4.86207H8.75871V3.62069C8.75871 3.28138 8.47733 3 8.13802 3C7.79871 3 7.51733 3.28138 7.51733 3.62069V4.91172C5.28285 5.11862 4.19871 6.45103 4.03319 8.42897C4.01664 8.66897 4.21526 8.86759 4.44699 8.86759H18.4497C18.6897 8.86759 18.8883 8.66069 18.8635 8.42897C18.698 6.45103 17.6139 5.11862 15.3794 4.91172Z"
			fill="currentColor"
		/>
		<path
			opacity="0.4"
			d="M18.8966 10.9365V12.3765C18.8966 12.8813 18.4497 13.2703 17.9531 13.1875C17.7214 13.1544 17.4814 13.1296 17.2414 13.1296C14.7338 13.1296 12.6897 15.1737 12.6897 17.6813C12.6897 18.062 12.8386 18.5916 12.9959 19.0716C13.1779 19.6096 12.7807 20.1641 12.2097 20.1641H8.13793C5.24138 20.1641 4 18.5089 4 16.0261V10.9282C4 10.473 4.37241 10.1006 4.82759 10.1006H18.069C18.5241 10.1089 18.8966 10.4813 18.8966 10.9365Z"
			fill="currentColor"
		/>
		<path
			d="M17.241 14.3794C15.412 14.3794 13.9307 15.8608 13.9307 17.6897C13.9307 18.3104 14.1045 18.898 14.4107 19.3946C14.9817 20.3546 16.0327 21.0001 17.241 21.0001C18.4493 21.0001 19.5003 20.3546 20.0714 19.3946C20.3776 18.898 20.5514 18.3104 20.5514 17.6897C20.5514 15.8608 19.07 14.3794 17.241 14.3794ZM18.9541 17.3339L17.1914 18.9642C17.0755 19.0718 16.9183 19.1297 16.7693 19.1297C16.612 19.1297 16.4548 19.0718 16.3307 18.9477L15.5114 18.1284C15.2714 17.8884 15.2714 17.4911 15.5114 17.2511C15.7514 17.0111 16.1486 17.0111 16.3886 17.2511L16.7858 17.6484L18.11 16.4235C18.3582 16.1918 18.7555 16.2084 18.9872 16.4566C19.2189 16.7049 19.2024 17.0939 18.9541 17.3339Z"
			fill="currentColor"
		/>
		<path
			d="M8.5522 14.38C8.33702 14.38 8.12185 14.289 7.96461 14.14C7.81564 13.9828 7.72461 13.7676 7.72461 13.5524C7.72461 13.3373 7.81564 13.1221 7.96461 12.9649C8.15495 12.7745 8.44461 12.6835 8.71771 12.7414C8.76737 12.7497 8.81702 12.7662 8.86668 12.7911C8.91633 12.8076 8.96599 12.8324 9.01564 12.8655C9.05702 12.8986 9.0984 12.9317 9.13978 12.9649C9.28875 13.1221 9.37978 13.3373 9.37978 13.5524C9.37978 13.7676 9.28875 13.9828 9.13978 14.14C9.0984 14.1731 9.05702 14.2062 9.01564 14.2393C8.96599 14.2724 8.91633 14.2973 8.86668 14.3138C8.81702 14.3386 8.76737 14.3552 8.71771 14.3635C8.65978 14.3717 8.60185 14.38 8.5522 14.38Z"
			fill="currentColor"
		/>
		<path
			d="M11.4487 14.3787C11.2335 14.3787 11.0183 14.2877 10.8611 14.1387C10.7121 13.9815 10.6211 13.7663 10.6211 13.5511C10.6211 13.336 10.7121 13.1208 10.8611 12.9635C11.1756 12.6573 11.7301 12.6573 12.0363 12.9635C12.1852 13.1208 12.2763 13.336 12.2763 13.5511C12.2763 13.7663 12.1852 13.9815 12.0363 14.1387C11.879 14.2877 11.6639 14.3787 11.4487 14.3787Z"
			fill="currentColor"
		/>
		<path
			d="M8.5522 17.2763C8.33702 17.2763 8.12185 17.1853 7.96461 17.0363C7.81564 16.8791 7.72461 16.6639 7.72461 16.4487C7.72461 16.2335 7.81564 16.0185 7.96461 15.8612C8.04737 15.7867 8.13013 15.7287 8.23771 15.6873C8.54392 15.5549 8.90806 15.6295 9.13978 15.8612C9.28875 16.0185 9.37978 16.2335 9.37978 16.4487C9.37978 16.6639 9.28875 16.8791 9.13978 17.0363C8.98254 17.1853 8.76737 17.2763 8.5522 17.2763Z"
			fill="currentColor"
		/>
	</svg>
);

const DetailRowIconSlot = ({ children }: { children: React.ReactNode }) => (
	<span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#6B6C76] [&_svg]:h-6 [&_svg]:w-6">
		{children}
	</span>
);

const DetailRow = ({
	icon,
	label,
	children,
	stacked = false,
}: {
	icon: React.ReactNode;
	label: string;
	children: React.ReactNode;
	stacked?: boolean;
}) => {
	if (stacked) {
		return (
			<div className="space-y-2 text-sm">
				<span className="inline-flex items-center gap-2 text-muted-foreground">
					<DetailRowIconSlot>{icon}</DetailRowIconSlot>
					{label}
				</span>
				<div className="font-medium text-foreground">{children}</div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-between gap-3 text-sm">
			<span className="inline-flex items-center gap-2 text-muted-foreground">
				<DetailRowIconSlot>{icon}</DetailRowIconSlot>
				{label}
			</span>
			<div className="text-right font-medium text-foreground">
				{children}
			</div>
		</div>
	);
};

const CancelBookingDialog = ({
	bookingId,
	open,
	onOpenChange,
	onCancelled,
}: {
	bookingId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCancelled: () => void;
}) => {
	const [reason, setReason] = useState('');
	const [working, setWorking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			setReason('');
			setError(null);
		}
	}, [open]);

	const handleCancel = () => {
		if (!bookingId) {
			return;
		}
		setWorking(true);
		setError(null);
		cancelBooking(bookingId, reason)
			.then(() => {
				onCancelled();
				onOpenChange(false);
			})
			.catch((err) => setError(formatRestError(err)))
			.finally(() => setWorking(false));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-md gap-0 overflow-hidden rounded-2xl border border-border sm:rounded-2xl"
				overlayClassName="bg-black/40 backdrop-blur-sm"
			>
				<DialogHeader>
					<CustomDialogHeader
						title={__('Cancel this booking?', 'doublescale')}
						subtitle={__(
							'Please provide a reason for cancellation',
							'doublescale'
						)}
						icon={
							<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FBE8E8] text-[#C30A0A]">
								<CalendarIcon width={24} height={24} />
							</span>
						}
					/>
				</DialogHeader>

				<div className="space-y-4 pt-6">
					<div className="space-y-2">
						<label
							htmlFor="portal-cancel-reason"
							className="text-sm font-medium text-foreground"
						>
							{__('Reason', 'doublescale')}
						</label>
						<Textarea
							id="portal-cancel-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={__('Type Reason ……', 'doublescale')}
							rows={4}
						/>
					</div>
					{error && <ErrorState message={error} />}
				</div>

				<DialogFooter className="gap-2 pt-6 sm:justify-end">
					<Button
						type="button"
						variant="secondaryDeepBlue"
						onClick={() => onOpenChange(false)}
						disabled={working}
					>
						{__('Keep booking', 'doublescale')}
					</Button>
					<Button
						type="button"
						variant="destructive"
						className="border-transparent bg-[#C30A0A] text-white hover:bg-[#C30A0A]/90"
						onClick={handleCancel}
						disabled={working}
					>
						{working
							? __('Cancelling…', 'doublescale')
							: __('Yes, cancel', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

const BookingDetailModal = ({
	bookingId,
	open,
	onOpenChange,
	onRequestCancel,
}: {
	bookingId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onRequestCancel: (id: number) => void;
}) => {
	const {
		data: booking,
		loading,
		error,
	} = useAsync(async () => {
		if (!bookingId) {
			return null;
		}
		return fetchBooking(bookingId);
	}, [bookingId]);

	const [working, setWorking] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			setActionError(null);
		}
	}, [open]);

	const onReschedule = () => {
		if (!bookingId) {
			return;
		}
		setWorking(true);
		setActionError(null);
		fetchRescheduleUrl(bookingId)
			.then(({ url }) => {
				if (url) {
					window.location.href = url;
				} else {
					setActionError(
						__(
							'Reschedule is unavailable for this booking.',
							'doublescale'
						)
					);
				}
			})
			.catch((err) => setActionError(formatRestError(err)))
			.finally(() => setWorking(false));
	};

	const showLoader = open && !!bookingId && loading;
	const showError = open && !loading && (error || !booking);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-lg gap-0 overflow-hidden rounded-2xl border border-border sm:rounded-2xl"
				overlayClassName="bg-black/40 backdrop-blur-sm"
			>
				<DialogHeader>
					<CustomDialogHeader
						title={__('Bookings Details', 'doublescale')}
						subtitle={__(
							'View all details of booking',
							'doublescale'
						)}
						icon={<GradientCalendarIcon width={24} height={24} />}
					/>
				</DialogHeader>

				<div className="pt-6">
					{showLoader && (
						<Spinner
							label={__('Loading booking…', 'doublescale')}
						/>
					)}
					{showError && (
						<ErrorState
							message={
								error || __('Booking not found.', 'doublescale')
							}
						/>
					)}
					{open && !loading && booking && (
						<>
							<div className="rounded-xl border border-border bg-[#F7F8FA] p-6">
								<div className="space-y-4">
									<DetailRow
										icon={
											<CalendarIcon
												width={DETAIL_ICON_SIZE}
												height={DETAIL_ICON_SIZE}
											/>
										}
										label={__(
											'Booking Name',
											'doublescale'
										)}
									>
										{booking.event.name}
									</DetailRow>

									<DetailRow
										icon={<BookingDetailDateIcon />}
										label={__('Date', 'doublescale')}
									>
										{formatBookingDateShort(
											booking.start_time,
											booking.timezone
										)}
									</DetailRow>

									<DetailRow
										icon={
											<ClockIcon
												size={DETAIL_ICON_SIZE}
											/>
										}
										label={__('Time', 'doublescale')}
									>
										{formatBookingTimeLine(booking)}
									</DetailRow>

									<DetailRow
										icon={
											<TimerBlockIcon
												width={DETAIL_ICON_SIZE}
												height={DETAIL_ICON_SIZE}
												color="currentColor"
											/>
										}
										label={__('Timezone', 'doublescale')}
									>
										{booking.timezone}
									</DetailRow>

									{booking.location && (
										<DetailRow
											icon={
												<MapPinIcon
													size={DETAIL_ICON_SIZE}
												/>
											}
											label={
												booking.location.label ||
												__('Location', 'doublescale')
											}
										>
											{booking.location.value}
										</DetailRow>
									)}

									<DetailRow
										icon={
											<MoveStatusIcon
												width={DETAIL_ICON_SIZE}
												height={DETAIL_ICON_SIZE}
												color="currentColor"
											/>
										}
										label={__('Status', 'doublescale')}
									>
										<BookingStatusPill booking={booking} />
									</DetailRow>
								</div>
							</div>

							{actionError && (
								<div className="mt-4">
									<ErrorState message={actionError} />
								</div>
							)}

							{(booking.can_cancel || booking.can_reschedule) && (
								<DialogFooter className="gap-2 pt-6 sm:justify-end">
									{booking.can_cancel && (
										<Button
											type="button"
											variant="outline"
											className="border-[#C30A0A] text-[#C30A0A] bg-white hover:bg-[#FBE8E8]"
											onClick={() =>
												onRequestCancel(booking.id)
											}
											disabled={working}
										>
											{__(
												'Cancel booking',
												'doublescale'
											)}
										</Button>
									)}
									{booking.can_reschedule && (
										<Button
											type="button"
											onClick={onReschedule}
											disabled={working}
										>
											{__('Reschedule', 'doublescale')}
										</Button>
									)}
								</DialogFooter>
							)}
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

const PortalBookingCard = ({
	booking,
	onOpen,
}: {
	booking: PortalBooking;
	onOpen: (id: number) => void;
}) => {
	const { day, month } = formatBookingDateParts(
		booking.start_time,
		booking.timezone
	);
	const locationLabel =
		booking.location?.label || __('Online Meeting', 'doublescale');
	const locationValue = booking.location?.value || '—';

	return (
		<div className="rounded-xl border border-border bg-[#F7F8FA] w-80 p-4">
			<div className="flex items-start gap-3">
				<div className="flex w-12 shrink-0 flex-col overflow-hidden rounded-lg border border-border">
					<div className="flex items-center justify-center bg-white px-1 py-2">
						<span className="text-xl font-bold leading-none text-foreground">
							{day}
						</span>
					</div>
					<div className="flex items-center justify-center bg-[#EEEEFF] px-1 py-1.5">
						<span className="text-sm text-primary">{month}</span>
					</div>
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-foreground">
								{booking.event.name}
							</p>
							<div className="mt-3">
								<BookingStatusPill booking={booking} />
							</div>
						</div>
						<button
							type="button"
							onClick={() => onOpen(booking.id)}
							className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90"
							aria-label={__(
								'View booking details',
								'doublescale'
							)}
							style={{
								boxShadow:
									'0 5px 12px 0 rgba(69, 141, 199, 0.20)',
							}}
						>
							<ArrowUpRight width={16} height={16} />
						</button>
					</div>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
				<div className="flex flex-col items-center">
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<ClockIcon />
						<span>{__('Time', 'doublescale')}</span>
					</div>
					<p className="mt-2 font-medium text-foreground">
						{formatBookingTimeLine(booking)}
					</p>
				</div>
				<div className="flex flex-col items-center">
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<MapPinIcon />
						<span className="truncate">{locationLabel}</span>
					</div>
					<p className="mt-2 truncate font-medium text-foreground">
						{locationValue}
					</p>
				</div>
			</div>
		</div>
	);
};

const BookingsPagination = ({
	page,
	totalPages,
	onPageChange,
}: {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}) => {
	if (totalPages <= 1) {
		return null;
	}

	const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

	return (
		<div className="mt-6 flex items-center justify-center gap-2">
			<button
				type="button"
				onClick={() => onPageChange(page - 1)}
				disabled={page <= 1}
				className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground disabled:opacity-40"
				aria-label={__('Previous page', 'doublescale')}
			>
				<ChevronLeft width={16} height={16} />
			</button>
			{pages.map((p) => (
				<button
					key={p}
					type="button"
					onClick={() => onPageChange(p)}
					className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
						p === page
							? 'bg-primary text-white'
							: 'border border-border bg-white text-foreground'
					}`}
				>
					{p}
				</button>
			))}
			<button
				type="button"
				onClick={() => onPageChange(page + 1)}
				disabled={page >= totalPages}
				className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground disabled:opacity-40"
				aria-label={__('Next page', 'doublescale')}
			>
				<ChevronRight width={16} height={16} />
			</button>
		</div>
	);
};

const BookingsBoard = ({
	initialBookingId = null,
	onCloseDeepLink,
}: {
	initialBookingId?: number | null;
	onCloseDeepLink?: () => void;
}) => {
	const [filter, setFilter] = useState<BookingFilter>('all');
	const [query, setQuery] = useState('');
	const [page, setPage] = useState(1);
	const [selectedId, setSelectedId] = useState<number | null>(
		initialBookingId
	);
	const [cancelId, setCancelId] = useState<number | null>(null);
	const [detailOpen, setDetailOpen] = useState(!!initialBookingId);

	const { data, loading, error, refetch } = useAsync(
		() => fetchBookings(filter),
		[filter]
	);
	const bookings = data?.data || [];

	useEffect(() => {
		if (initialBookingId) {
			setSelectedId(initialBookingId);
			setDetailOpen(true);
		}
	}, [initialBookingId]);

	useEffect(() => {
		setPage(1);
	}, [filter, query]);

	const normalizedQuery = query.trim().toLowerCase();
	const filteredBookings = useMemo(() => {
		if (!normalizedQuery) {
			return bookings;
		}
		return bookings.filter((b) =>
			b.event.name.toLowerCase().includes(normalizedQuery)
		);
	}, [bookings, normalizedQuery]);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredBookings.length / PAGE_SIZE)
	);
	const pageBookings = filteredBookings.slice(
		(page - 1) * PAGE_SIZE,
		page * PAGE_SIZE
	);

	const empty = emptyCopy(filter);
	const hasBookings = bookings.length > 0;
	const hasVisibleBookings = filteredBookings.length > 0;

	const handleOpenBooking = (id: number) => {
		setSelectedId(id);
		setDetailOpen(true);
	};

	const handleDetailChange = (open: boolean) => {
		setDetailOpen(open);
		if (!open) {
			setSelectedId(null);
			onCloseDeepLink?.();
		}
	};

	const handleRequestCancel = (id: number) => {
		setCancelId(id);
	};

	const handleCancelled = () => {
		setDetailOpen(false);
		setSelectedId(null);
		setCancelId(null);
		onCloseDeepLink?.();
		refetch();
	};

	return (
		<section>
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-2xl font-semibold text-foreground">
					{__('Bookings', 'doublescale')}
				</h2>
				<div className="flex flex-wrap gap-2">
					{TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setFilter(tab.key)}
							className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
								filter === tab.key
									? 'bg-[#EEEEFF] text-primary'
									: 'border border-border bg-white text-foreground hover:bg-accent'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			<div className="relative mb-6">
				<Search
					width={16}
					height={16}
					className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={__('Search by booking name…', 'doublescale')}
					className="pl-9"
				/>
			</div>

			{loading && <Spinner />}
			{!loading && error && <ErrorState message={error} />}

			{!loading && !error && !hasBookings && (
				<EmptyState
					icon={<GradientCalendarIcon width={40} height={40} />}
					title={empty.title}
					description={empty.description}
				/>
			)}

			{!loading && !error && hasBookings && !hasVisibleBookings && (
				<EmptyState
					icon={<GradientCalendarIcon width={40} height={40} />}
					title={__('No matching bookings', 'doublescale')}
					description={__(
						'Try a different search term.',
						'doublescale'
					)}
				/>
			)}

			{!loading && !error && hasVisibleBookings && (
				<>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{pageBookings.map((booking) => (
							<PortalBookingCard
								key={booking.id}
								booking={booking}
								onOpen={handleOpenBooking}
							/>
						))}
					</div>
					<BookingsPagination
						page={page}
						totalPages={totalPages}
						onPageChange={setPage}
					/>
				</>
			)}

			<BookingDetailModal
				bookingId={selectedId}
				open={detailOpen && selectedId != null}
				onOpenChange={handleDetailChange}
				onRequestCancel={handleRequestCancel}
			/>

			<CancelBookingDialog
				bookingId={cancelId}
				open={cancelId != null}
				onOpenChange={(open) => {
					if (!open) {
						setCancelId(null);
					}
				}}
				onCancelled={handleCancelled}
			/>
		</section>
	);
};

const BookingsDeepLink = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const bookingId = Number.parseInt(id || '0', 10);

	return (
		<BookingsBoard
			initialBookingId={
				Number.isNaN(bookingId) || bookingId <= 0 ? null : bookingId
			}
			onCloseDeepLink={() => navigate('/bookings', { replace: true })}
		/>
	);
};

const Bookings = () => (
	<Routes>
		<Route index element={<BookingsBoard />} />
		<Route path=":id" element={<BookingsDeepLink />} />
		<Route path="*" element={<Navigate to="" replace />} />
	</Routes>
);

export default Bookings;
