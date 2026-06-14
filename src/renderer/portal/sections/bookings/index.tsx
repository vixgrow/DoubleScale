/**
 * Bookings section — upcoming / past / cancelled tabs + a detail view with
 * cancel and reschedule actions. Reschedule links out to the existing public
 * hash page (we don't reimplement the flow); cancel goes through the
 * ownership-gated portal endpoint.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

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
import { formatDateTime, formatMoney } from '../../shared/format';
import { ChevronLeftIcon, ClockIcon, MapPinIcon } from '../../shared/icons';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../../shared/ui';

const TABS: Array<{ key: BookingFilter; label: string }> = [
	{ key: 'upcoming', label: __('Upcoming', 'doublescale') },
	{ key: 'past', label: __('Past', 'doublescale') },
	{ key: 'cancelled', label: __('Cancelled', 'doublescale') },
];

const BookingCard = ({ booking }: { booking: PortalBooking }) => (
	<Link
		to={String(booking.id)}
		className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
	>
		<div className="flex items-start justify-between gap-3">
			<p className="font-semibold text-foreground">{booking.event.name}</p>
			<StatusBadge status={booking.status} />
		</div>
		<div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
			<ClockIcon className="w-4 h-4 shrink-0" />
			<span>{formatDateTime(booking.start_time, booking.timezone)}</span>
		</div>
		{booking.location && (
			<div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
				<MapPinIcon className="w-4 h-4 shrink-0" />
				<span className="truncate">
					{booking.location.label
						? `${booking.location.label}: ${booking.location.value}`
						: booking.location.value}
				</span>
			</div>
		)}
	</Link>
);

const BookingsList = () => {
	const [filter, setFilter] = useState<BookingFilter>('upcoming');
	const { data, loading, error } = useAsync(() => fetchBookings(filter), [
		filter,
	]);
	const bookings = data?.data || [];

	return (
		<section>
			<h2 className="mb-4 text-xl font-bold">{__('Bookings', 'doublescale')}</h2>

			<div className="mb-4 inline-flex rounded-lg border border-border bg-card p-1">
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setFilter(tab.key)}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
							filter === tab.key
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{loading && <Spinner />}
			{!loading && error && <ErrorState message={error} />}
			{!loading && !error && bookings.length === 0 && (
				<EmptyState
					title={__('No bookings here', 'doublescale')}
					description={__(
						'When you book an appointment it will show up in this list.',
						'doublescale'
					)}
				/>
			)}
			{!loading && !error && bookings.length > 0 && (
				<div className="space-y-3">
					{bookings.map((b) => (
						<BookingCard key={b.id} booking={b} />
					))}
				</div>
			)}
		</section>
	);
};

const DetailRow = ({
	icon,
	children,
}: {
	icon: React.ReactNode;
	children: React.ReactNode;
}) => (
	<div className="flex items-start gap-3 text-sm">
		<span className="mt-0.5 text-muted-foreground">{icon}</span>
		<span className="text-foreground">{children}</span>
	</div>
);

const BookingDetail = () => {
	const params = useParams();
	const navigate = useNavigate();
	const id = Number.parseInt(params.id || '0', 10);
	const { data: booking, loading, error, refetch } = useAsync(
		() => fetchBooking(id),
		[id]
	);

	const [confirming, setConfirming] = useState(false);
	const [reason, setReason] = useState('');
	const [working, setWorking] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const onCancel = () => {
		setWorking(true);
		setActionError(null);
		cancelBooking(id, reason)
			.then(() => {
				setConfirming(false);
				refetch();
			})
			.catch((err) => setActionError(formatRestError(err)))
			.finally(() => setWorking(false));
	};

	const onReschedule = () => {
		setWorking(true);
		setActionError(null);
		fetchRescheduleUrl(id)
			.then(({ url }) => {
				if (url) {
					window.location.href = url;
				} else {
					setActionError(
						__('Reschedule is unavailable for this booking.', 'doublescale')
					);
				}
			})
			.catch((err) => setActionError(formatRestError(err)))
			.finally(() => setWorking(false));
	};

	if (loading) {
		return <Spinner />;
	}
	if (error || !booking) {
		return (
			<div className="space-y-4">
				<BackLink onClick={() => navigate('/bookings')} />
				<ErrorState
					message={error || __('Booking not found.', 'doublescale')}
				/>
			</div>
		);
	}

	return (
		<section className="space-y-4">
			<BackLink onClick={() => navigate('/bookings')} />

			<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
				<div className="flex items-start justify-between gap-3">
					<h2 className="text-xl font-bold">{booking.event.name}</h2>
					<StatusBadge status={booking.status} />
				</div>

				<div className="mt-4 space-y-2">
					<DetailRow icon={<ClockIcon className="w-4 h-4" />}>
						{formatDateTime(booking.start_time, booking.timezone)}
						{booking.event.duration
							? ` · ${booking.event.duration} ${__('min', 'doublescale')}`
							: ''}
					</DetailRow>
					<DetailRow icon={<ClockIcon className="w-4 h-4 opacity-0" />}>
						<span className="text-muted-foreground">
							{__('Timezone', 'doublescale')}: {booking.timezone}
						</span>
					</DetailRow>
					{booking.location && (
						<DetailRow icon={<MapPinIcon className="w-4 h-4" />}>
							{booking.location.label
								? `${booking.location.label}: ${booking.location.value}`
								: booking.location.value}
						</DetailRow>
					)}
				</div>

				{booking.payment && (
					<div className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm">
						<span className="font-medium">
							{__('Payment', 'doublescale')}:{' '}
						</span>
						{formatMoney(
							booking.payment.total,
							booking.payment.currency
						)}{' '}
						<span className="capitalize text-muted-foreground">
							({booking.payment.status})
						</span>
					</div>
				)}
			</div>

			{actionError && <ErrorState message={actionError} />}

			{(booking.can_cancel || booking.can_reschedule) && (
				<div className="flex flex-wrap gap-3">
					{booking.can_reschedule && (
						<button
							type="button"
							onClick={onReschedule}
							disabled={working}
							className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
						>
							{__('Reschedule', 'doublescale')}
						</button>
					)}
					{booking.can_cancel && !confirming && (
						<button
							type="button"
							onClick={() => setConfirming(true)}
							disabled={working}
							className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
						>
							{__('Cancel booking', 'doublescale')}
						</button>
					)}
				</div>
			)}

			{confirming && (
				<div className="rounded-xl border border-destructive/30 bg-card p-4 shadow-sm">
					<p className="font-medium text-foreground">
						{__('Cancel this booking?', 'doublescale')}
					</p>
					<textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={__(
							'Reason (optional)',
							'doublescale'
						)}
						rows={3}
						className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					/>
					<div className="mt-3 flex gap-3">
						<button
							type="button"
							onClick={onCancel}
							disabled={working}
							className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
						>
							{working
								? __('Cancelling…', 'doublescale')
								: __('Yes, cancel', 'doublescale')}
						</button>
						<button
							type="button"
							onClick={() => setConfirming(false)}
							disabled={working}
							className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
						>
							{__('Keep booking', 'doublescale')}
						</button>
					</div>
				</div>
			)}
		</section>
	);
};

const BackLink = ({ onClick }: { onClick: () => void }) => (
	<button
		type="button"
		onClick={onClick}
		className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
	>
		<ChevronLeftIcon className="w-4 h-4" />
		{__('Back to bookings', 'doublescale')}
	</button>
);

const Bookings = () => (
	<Routes>
		<Route index element={<BookingsList />} />
		<Route path=":id" element={<BookingDetail />} />
		<Route path="*" element={<Navigate to="" replace />} />
	</Routes>
);

export default Bookings;
