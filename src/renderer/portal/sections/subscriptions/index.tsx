/**
 * Subscriptions section — the customer's recurring plans. Read-mostly: shows
 * status, price, and the next billing (or cancellation) date, with a single
 * self-service action — cancel at period end. The destructive verb is gated by
 * the server's `can_cancel` flag; everything else (pause, plan/quantity change)
 * stays admin-only.
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';

import {
	cancelSubscription,
	fetchSubscriptions,
	formatRestError,
	useAsync,
} from '../../api';
import type { PortalSubscription } from '../../types';
import { formatDate, formatMoney } from '../../shared/format';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../../shared/ui';

const billingLabel = (sub: PortalSubscription): string => {
	const price = formatMoney(sub.amount, sub.currency);
	if (sub.billing_interval_count > 1) {
		return sprintf(
			/* translators: 1: price (e.g. $10.00), 2: count, 3: interval unit (e.g. month). */
			__('%1$s every %2$d %3$ss', 'doublescale'),
			price,
			sub.billing_interval_count,
			sub.billing_interval
		);
	}
	return sprintf(
		/* translators: 1: price (e.g. $10.00), 2: interval unit (e.g. month). */
		__('%1$s / %2$s', 'doublescale'),
		price,
		sub.billing_interval
	);
};

const SubscriptionCard = ({
	sub,
	onChanged,
}: {
	sub: PortalSubscription;
	onChanged: () => void;
}) => {
	const [confirming, setConfirming] = useState(false);
	const [working, setWorking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onCancel = () => {
		setWorking(true);
		setError(null);
		cancelSubscription(sub.id)
			.then(() => {
				setConfirming(false);
				onChanged();
			})
			.catch((err) => setError(formatRestError(err)))
			.finally(() => setWorking(false));
	};

	return (
		<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-lg font-semibold text-foreground">
						{sub.name}
					</p>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{billingLabel(sub)}
						{sub.quantity > 1
							? ` · ${sprintf(
									/* translators: %d is the quantity. */
									__('Qty %d', 'doublescale'),
									sub.quantity
							  )}`
							: ''}
					</p>
				</div>
				<StatusBadge status={sub.status} />
			</div>

			<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
				{sub.started_at && (
					<div>
						<span className="text-muted-foreground">
							{__('Started', 'doublescale')}:{' '}
						</span>
						<span className="text-foreground">
							{formatDate(sub.started_at)}
						</span>
					</div>
				)}
				{sub.current_period_end && !sub.cancel_at_period_end && (
					<div>
						<span className="text-muted-foreground">
							{__('Next billing', 'doublescale')}:{' '}
						</span>
						<span className="text-foreground">
							{formatDate(sub.current_period_end)}
						</span>
					</div>
				)}
			</div>

			{sub.cancel_at_period_end && sub.current_period_end && (
				<p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
					{sprintf(
						/* translators: %s is the end date. */
						__(
							'Cancels on %s — you keep access until then.',
							'doublescale'
						),
						formatDate(sub.current_period_end)
					)}
				</p>
			)}

			{error && (
				<div className="mt-3">
					<ErrorState message={error} />
				</div>
			)}

			{sub.can_cancel && (
				<div className="mt-4">
					{confirming ? (
						<div className="rounded-lg border border-destructive/30 p-3">
							<p className="text-sm font-medium text-foreground">
								{__('Cancel this subscription?', 'doublescale')}
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								{__(
									'It stays active until the end of the current billing period, then stops renewing.',
									'doublescale'
								)}
							</p>
							<div className="mt-3 flex gap-3">
								<Button
									variant="destructive"
									onClick={onCancel}
									disabled={working}
								>
									{working
										? __('Cancelling…', 'doublescale')
										: __('Yes, cancel', 'doublescale')}
								</Button>
								<Button
									variant="ghost"
									onClick={() => setConfirming(false)}
									disabled={working}
								>
									{__('Keep subscription', 'doublescale')}
								</Button>
							</div>
						</div>
					) : (
						<Button
							variant="outline"
							onClick={() => setConfirming(true)}
						>
							{__('Cancel subscription', 'doublescale')}
						</Button>
					)}
				</div>
			)}
		</div>
	);
};

const Subscriptions = () => {
	const { data, loading, error, refetch } = useAsync(
		() => fetchSubscriptions(),
		[]
	);
	const subs = data?.data || [];

	return (
		<section>
			<h2 className="mb-4 text-xl font-bold">
				{__('Subscriptions', 'doublescale')}
			</h2>

			{loading && <Spinner />}
			{!loading && error && <ErrorState message={error} />}
			{!loading && !error && subs.length === 0 && (
				<EmptyState
					title={__('No subscriptions yet', 'doublescale')}
					description={__(
						'Your recurring plans will appear here once you subscribe.',
						'doublescale'
					)}
				/>
			)}
			{!loading && !error && subs.length > 0 && (
				<div className="space-y-3">
					{subs.map((sub) => (
						<SubscriptionCard
							key={sub.id}
							sub={sub}
							onChanged={refetch}
						/>
					))}
				</div>
			)}
		</section>
	);
};

export default Subscriptions;
