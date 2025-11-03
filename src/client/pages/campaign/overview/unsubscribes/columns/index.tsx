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

export function getColumns() {
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
		{
			accessorKey: 'email',
			header: __('Email', 'quillcrm'),
			cell: ({ row }) => {
				const email = row.original.contact?.email;
				return email || __('N/A', 'quillcrm');
			},
		},
		{
			accessorKey: 'unsubscribe_reason',
			header: __('Unsubscribe Reason', 'quillcrm'),
			cell: () => {
				// For now, we show a placeholder. In the future, this could be
				// fetched from contact meta or a separate unsubscribe tracking table
				return __('Not specified', 'quillcrm');
			},
		},
	];

	return columns;
}
