/**
 * Small presentational helpers shared across portal sections.
 */

import { __ } from '@wordpress/i18n';

export const Spinner = ({ label }: { label?: string }) => (
	<div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
		<span className="inline-block w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
		<span className="text-sm">{label || __('Loading…', 'doublescale')}</span>
	</div>
);

export const EmptyState = ({
	title,
	description,
}: {
	title: string;
	description?: string;
}) => (
	<div className="text-center py-16 px-4">
		<p className="text-base font-semibold text-foreground">{title}</p>
		{description && (
			<p className="mt-1 text-sm text-muted-foreground">{description}</p>
		)}
	</div>
);

export const ErrorState = ({ message }: { message: string }) => (
	<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
		{message}
	</div>
);

const STATUS_TONES: Record<string, string> = {
	scheduled: 'bg-blue-100 text-blue-600',
	confirmed: 'bg-green-100 text-green-600',
	pending: 'bg-amber-100 text-amber-600',
	waiting: 'bg-amber-100 text-amber-600',
	completed: 'bg-gray-200 text-gray-700',
	cancelled: 'bg-red-100 text-red-600',
	rejected: 'bg-red-100 text-red-600',
	draft: 'bg-gray-200 text-gray-700',
	paid: 'bg-green-100 text-green-600',
	open: 'bg-blue-100 text-blue-600',
	closed: 'bg-gray-200 text-gray-700',
	resolved: 'bg-green-100 text-green-600',
	// Sales document statuses (invoices, proposals, contracts).
	unpaid: 'bg-amber-100 text-amber-600',
	partially_paid: 'bg-amber-100 text-amber-600',
	overdue: 'bg-red-100 text-red-600',
	sent: 'bg-blue-100 text-blue-600',
	accepted: 'bg-green-100 text-green-600',
	declined: 'bg-red-100 text-red-600',
	signed: 'bg-green-100 text-green-600',
	active: 'bg-green-100 text-green-600',
	expired: 'bg-red-100 text-red-600',
	// Subscription statuses (`canceled` single-l is Stripe's spelling — distinct
	// from booking `cancelled`).
	future: 'bg-blue-100 text-blue-600',
	past_due: 'bg-amber-100 text-amber-600',
	paused: 'bg-amber-100 text-amber-600',
	canceled: 'bg-gray-200 text-gray-700',
	not_subscribed: 'bg-gray-200 text-gray-700',
	partially_applied: 'bg-amber-100 text-amber-600',
	applied: 'bg-green-100 text-green-600',
	void: 'bg-gray-200 text-gray-700',
};

export const StatusBadge = ({ status }: { status: string }) => {
	const tone = STATUS_TONES[status.toLowerCase()] || 'bg-gray-200 text-gray-700';
	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}
		>
			{status.replace(/_/g, ' ')}
		</span>
	);
};
