/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { ColumnDef } from '@tanstack/react-table';
/**
 * Internal dependencies
 */
import type { CampaignEmail } from '@doublescale/client';
import { TimeAgoCell } from '@doublescale/components';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { cn } from '@/lib/utils';

export function getColumns(campaignType?: string) {
	const isSMS = campaignType === CAMPAIGN_CHANNEL.SMS;

	const columns: ColumnDef<CampaignEmail>[] = [
		{
			accessorKey: 'name',
			header: __('Name', 'doublescale'),
			cell: ({ row }) => {
				const contact = row.original.contact;
				const fullName =
					`${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
				return fullName || __('N/A', 'doublescale');
			},
		},
		{
			accessorKey: 'sent_at',
			header: __('Sent On', 'doublescale'),
			cell: ({ row }) => <TimeAgoCell value={row.original.sent_at || row.original.created_at} />,
		},
	];

	// Add phone column for SMS, email column for Email
	if (isSMS) {
		columns.push({
			accessorKey: 'phone',
			header: __('Phone', 'doublescale'),
			cell: ({ row }) => {
				const phone = row.original.contact?.phone;
				return phone || __('N/A', 'doublescale');
			},
		});
	} else {
		columns.push({
			accessorKey: 'email',
			header: __('Email', 'doublescale'),
			cell: ({ row }) => {
				const email = row.original.contact?.email;
				return email || __('N/A', 'doublescale');
			},
		});
	}

	// Add delivery status column for SMS
	if (isSMS) {
		columns.push({
			accessorKey: 'status_slug',
			header: __('Delivery Status', 'doublescale'),
			cell: ({ row }) => {
				const status = row.original.status_slug;
				const isFailed = status === 'failed' || status === 'undelivered';
				const isDelivered = status === 'delivered';

				if (isFailed) {
					return (
						<div
							className={cn(
								'bg-destructive/5 w-fit text-destructive border-destructive inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full'
							)}
						>
							{__('Failed', 'doublescale')}
						</div>
					);
				}

				if (isDelivered) {
					return (
						<div
							className={cn(
								'bg-emerald-50 w-fit text-emerald-700 border-emerald-200 inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full'
							)}
						>
							{__('Delivered', 'doublescale')}
						</div>
					);
				}

				return __('N/A', 'doublescale');
			},
		});
	}

	// Add unsubscribe reason column
	columns.push({
		accessorKey: 'unsubscribe_reason',
		header: __('Unsubscribe Reason', 'doublescale'),
		cell: ({ row }) => {
			const reason = row.original.unsubscribe_reason;
			return reason || __('Not specified', 'doublescale');
		},
	});

	return columns;
}
