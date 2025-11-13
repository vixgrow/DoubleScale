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
import type { CampaignEmail } from '@quillcrm/client';
import { TimeAgoCell } from '@quillcrm/components';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { cn } from '@/lib/utils';

export function getColumns(campaignType?: string) {
	const isSMS = campaignType === CAMPAIGN_CHANNEL.SMS;

	const columns: ColumnDef<CampaignEmail>[] = [
		{
			accessorKey: 'name',
			header: __('Name', 'quillcrm'),
			cell: ({ row }) => {
				const contact = row.original.contact;
				const fullName =
					`${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
				return fullName || __('N/A', 'quillcrm');
			},
		},
		{
			accessorKey: 'sent_at',
			header: __('Sent On', 'quillcrm'),
			cell: ({ row }) => <TimeAgoCell value={row.getValue('sent_at')} />,
		},
	];

	// Add phone column for SMS, email column for Email
	if (isSMS) {
		columns.push({
			accessorKey: 'phone',
			header: __('Phone', 'quillcrm'),
			cell: ({ row }) => {
				const phone = row.original.contact?.phone;
				return phone || __('N/A', 'quillcrm');
			},
		});
	} else {
		columns.push({
			accessorKey: 'email',
			header: __('Email', 'quillcrm'),
			cell: ({ row }) => {
				const email = row.original.contact?.email;
				return email || __('N/A', 'quillcrm');
			},
		});
	}

	// Add delivery status column for SMS
	if (isSMS) {
		columns.push({
			accessorKey: 'status_slug',
			header: __('Delivery Status', 'quillcrm'),
			cell: ({ row }) => {
				const status = row.original.status_slug;
				const isFailed = status === 'failed' || status === 'undelivered';
				const isDelivered = status === 'delivered';

				if (isFailed) {
					return (
						<div
							className={cn(
								'bg-[#EF444429] w-fit text-destructive border-destructive px-2 py-1 rounded-md'
							)}
						>
							{__('Failed', 'quillcrm')}
						</div>
					);
				}

				if (isDelivered) {
					return (
						<div
							className={cn(
								'bg-[#EFFFF5] w-fit text-[#16A34A] border-[#16A34A] px-2 py-1 rounded-md'
							)}
						>
							{__('Delivered', 'quillcrm')}
						</div>
					);
				}

				return __('N/A', 'quillcrm');
			},
		});
	}

	// Add unsubscribe reason column
	columns.push({
		accessorKey: 'unsubscribe_reason',
		header: __('Unsubscribe Reason', 'quillcrm'),
		cell: ({ row }) => {
			const reason = row.original.unsubscribe_reason;
			return reason || __('Not specified', 'quillcrm');
		},
	});

	return columns;
}
