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
import { Button } from '@/components/ui/button';
import {
	NotOpenedIcon,
	OpenedIcon,
	ResendIcon,
	TimeAgoCell,
	ViewIcon,
} from '@quillcrm/components';
import { NavLink } from '@quillcrm/navigation';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Helper function to generate contact initials
const getContactInitials = (firstName: string, lastName: string): string => {
	const first = firstName?.charAt(0)?.toUpperCase() || '';
	const last = lastName?.charAt(0)?.toUpperCase() || '';
	return first + last || '?';
};

interface ColumnsProps {
	onViewTemplate: (email: CampaignEmail) => void;
	onResendMessage: (email: CampaignEmail) => void;
	campaignType: string | null;
}

export function getColumns({
	onViewTemplate,
	onResendMessage,
	campaignType,
}: ColumnsProps) {
	const baseColumns: ColumnDef<CampaignEmail>[] = [
		{
			accessorKey: 'contact',
			header: __('Contact', 'quillcrm'),
			cell: ({ row }) => {
				const contact = row.original.contact;
				const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
				const initials = getContactInitials(contact.first_name || '', contact.last_name || '');
				const hasImage = (contact as any).img;

				return (
					<NavLink to={`/contacts/${contact.id}`}>
						<div className="flex items-center gap-3">
							{hasImage ? (
								<Avatar className="w-12 h-12 rounded-lg">
									<AvatarImage
										src={(contact as any).img}
										alt={fullName || contact.email}
										className="rounded-lg"
									/>
								</Avatar>
							) : (
								<Avatar className="w-12 h-12 rounded-lg">
									<AvatarFallback className="rounded-lg bg-[#E3EEFF99] text-secondary font-bold text-lg">
										{initials}
									</AvatarFallback>
								</Avatar>
							)}
							<div className="flex flex-col">
								{fullName && (
									<div className="font-semibold capitalize text-base w-40 truncate text-[#09090B]">
										{fullName}
									</div>
								)}
								<div className="text-base text-gray-500">
									{campaignType === CAMPAIGN_CHANNEL.EMAIL ? contact.email : contact.phone}
								</div>
							</div>
						</div>
					</NavLink>
				);
			},
		},
		{
			accessorKey: 'sent_at',
			header: __('Sent On', 'quillcrm'),
			cell: ({ row }) => <TimeAgoCell value={row.getValue('sent_at')} />,
		},
		{
			accessorKey: 'status',
			header: __('Sent Status', 'quillcrm'),
			cell: ({ row }) => {
				const statusSlug = row.original.status_slug || 'unknown';
				let statusDisplay = statusSlug;
				let statusClass = 'text-gray-600 bg-gray-100 border-gray-600';

				if (statusSlug === 'sent' || statusSlug === 'delivered') {
					statusDisplay = __('Sent', 'quillcrm');
					statusClass =
						'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]';
				} else if (statusSlug === 'failed') {
					statusDisplay = __('Failed', 'quillcrm');
					statusClass =
						'text-destructive bg-[#EF444429] border-destructive';
				} else if (statusSlug === 'pending') {
					statusDisplay = __('Pending', 'quillcrm');
					statusClass =
						'text-yellow-600 bg-yellow-50 border-yellow-600';
				} else if (statusSlug === 'read') {
					statusDisplay = __('Read', 'quillcrm');
					statusClass =
						'text-[#16A34A] bg-[#EFFFF5] border-[#16A34A]';
				}

				return (
					<div className="flex items-center gap-2">
						<span
							className={`border rounded-md px-2 py-1 ${statusClass}`}
						>
							{statusDisplay}
						</span>
					</div>
				);
			},
		},
	];

	// Add type-specific columns
	const typeSpecificColumns: ColumnDef<CampaignEmail>[] = [];

	if (campaignType === CAMPAIGN_CHANNEL.EMAIL) {
		typeSpecificColumns.push(
			{
				accessorKey: 'opened',
				header: __('Opened', 'quillcrm'),
				cell: ({ row }) => {
					const isOpened = row.original.opened != '0';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isOpened
										? 'text-green-600'
										: 'text-destructive'
								}
							>
								{isOpened ? (
									<OpenedIcon />
								) : (
									<NotOpenedIcon />
								)}
							</div>
							<span>
								{isOpened
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'clicked',
				header: __('Clicked', 'quillcrm'),
				cell: ({ row }) => {
					const isClicked = row.original.clicked != '0';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isClicked
										? 'text-green-600'
										: 'text-destructive'
								}
							>
								{isClicked ? (
									<OpenedIcon />
								) : (
									<NotOpenedIcon />
								)}
							</div>
							<span>
								{isClicked
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')}
							</span>
						</div>
					);
				},
			}
		);
	} else if (campaignType === CAMPAIGN_CHANNEL.SMS) {
		typeSpecificColumns.push(
			{
				accessorKey: 'delivered',
				header: __('Delivered', 'quillcrm'),
				cell: ({ row }) => {
					const isDelivered =
						row.original.status_slug === 'delivered';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isDelivered
										? 'text-green-600'
										: 'text-destructive'
								}
							>
								{isDelivered ? (
									<OpenedIcon />
								) : (
									<NotOpenedIcon />
								)}
							</div>
							<span>
								{isDelivered
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'clicked',
				header: __('Clicked', 'quillcrm'),
				cell: ({ row }) => {
					const isClicked = row.original.clicked != '0';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isClicked
										? 'text-green-600'
										: 'text-destructive'
								}
							>
								{isClicked ? (
									<OpenedIcon />
								) : (
									<NotOpenedIcon />
								)}
							</div>
							<span>
								{isClicked
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')}
							</span>
						</div>
					);
				},
			}
		);
	} else if (campaignType === CAMPAIGN_CHANNEL.WHATSAPP) {
		typeSpecificColumns.push(
			{
				accessorKey: 'delivered',
				header: __('Delivered', 'quillcrm'),
				cell: ({ row }) => {
					const isDelivered =
						row.original.status_slug === 'delivered' ||
						row.original.status_slug === 'read';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isDelivered
										? 'text-green-600'
										: 'text-destructive'
								}
							>
								{isDelivered ? (
									<OpenedIcon />
								) : (
									<NotOpenedIcon />
								)}
							</div>
							<span>
								{isDelivered
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'read',
				header: __('Read', 'quillcrm'),
				cell: ({ row }) => {
					const isRead = row.original.status_slug === 'read';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isRead
										? 'text-green-600'
										: 'text-destructive'
								}
							>
								{isRead ? <OpenedIcon /> : <NotOpenedIcon />}
							</div>
							<span>
								{isRead
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'clicked',
				header: __('Clicked', 'quillcrm'),
				cell: ({ row }) => {
					const isClicked = row.original.clicked != '0';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isClicked
										? 'text-green-600'
										: 'text-destructive'
								}
							>
								{isClicked ? (
									<OpenedIcon />
								) : (
									<NotOpenedIcon />
								)}
							</div>
							<span>
								{isClicked
									? __('Yes', 'quillcrm')
									: __('No', 'quillcrm')}
							</span>
						</div>
					);
				},
			}
		);
	}

	// Actions column
	const actionsColumn: ColumnDef<CampaignEmail> = {
		accessorKey: 'actions',
		header: __('Actions', 'quillcrm'),
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				<Button
					size="sm"
					className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() => onViewTemplate(row.original)}
				>
					<ViewIcon />
					{__('View', 'quillcrm')}
				</Button>
				<Button
					size="sm"
					className="bg-transparent shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() => onResendMessage(row.original)}
				>
					<ResendIcon />
					{__('Resend', 'quillcrm')}
				</Button>
			</div>
		),
	};

	return [...baseColumns, ...typeSpecificColumns, actionsColumn];
}

