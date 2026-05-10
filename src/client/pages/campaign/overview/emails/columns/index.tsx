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
import { Button } from '@/components/ui/button';
import {
	NotOpenedIcon,
	OpenedIcon,
	ResendIcon,
	TimeAgoCell,
	ViewIcon,
} from '@doublescale/components';
import { NavLink } from '@doublescale/navigation';
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
			header: __('Contact', 'doublescale'),
			cell: ({ row }) => {
				const contact = row.original.contact;
				const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
				const initials = getContactInitials(contact.first_name || '', contact.last_name || '');
				const avatarUrl = (contact as any).avatar_url;

				return (
					<NavLink to={`/contacts/${contact.id}`}>
					<div className="flex items-center gap-2.5">
						<Avatar className="w-9 h-9 rounded-full">
							{avatarUrl ? (
								<AvatarImage
									src={avatarUrl}
									alt={fullName || contact.email}
									className="rounded-full"
								/>
							) : null}
							<AvatarFallback className="rounded-full bg-primary/10 text-primary font-semibold text-xs">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col">
							{fullName && (
								<div className="font-medium capitalize text-sm max-w-[180px] leading-tight truncate text-foreground">
									{fullName}
								</div>
							)}
							<div className="text-xs text-muted-foreground">
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
			header: __('Sent On', 'doublescale'),
			cell: ({ row }) => <TimeAgoCell value={row.original.sent_at || row.original.created_at} />,
		},
		{
			accessorKey: 'status',
			header: __('Sent Status', 'doublescale'),
			cell: ({ row }) => {
				const statusSlug = row.original.status_slug || 'unknown';
				let statusDisplay = statusSlug;
				let statusClass = 'text-muted-foreground bg-muted/50 border-border';

				if (statusSlug === 'sent' || statusSlug === 'delivered') {
					statusDisplay = __('Sent', 'doublescale');
				statusClass =
					'text-emerald-700 bg-emerald-50 border-emerald-200';
			} else if (statusSlug === 'failed') {
				statusDisplay = __('Failed', 'doublescale');
				statusClass =
					'text-destructive bg-destructive/5 border-destructive/20';
			} else if (statusSlug === 'pending') {
				statusDisplay = __('Pending', 'doublescale');
				statusClass =
					'text-amber-700 bg-amber-50 border-amber-200';
			} else if (statusSlug === 'read') {
				statusDisplay = __('Read', 'doublescale');
				statusClass =
					'text-emerald-700 bg-emerald-50 border-emerald-200';
				}

				return (
					<div className="flex items-center gap-2">
						<span
							className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${statusClass}`}
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
				header: __('Opened', 'doublescale'),
				cell: ({ row }) => {
					const isOpened = row.original.opened != '0';
					if (!isOpened) {
						return <span className="text-muted-foreground">—</span>;
					}
					return (
						<div className="flex items-center gap-2">
							<div className="text-emerald-600">
								<OpenedIcon />
							</div>
							{row.original.opened_at ? (
								<TimeAgoCell value={row.original.opened_at} />
							) : (
								<span>{__('Yes', 'doublescale')}</span>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: 'clicked',
				header: __('Clicked', 'doublescale'),
				cell: ({ row }) => {
					const isClicked = row.original.clicked != '0';
					if (!isClicked) {
						return <span className="text-muted-foreground">—</span>;
					}
					return (
						<div className="flex items-center gap-2">
							<div className="text-emerald-600">
								<OpenedIcon />
							</div>
							{row.original.clicked_at ? (
								<TimeAgoCell value={row.original.clicked_at} />
							) : (
								<span>{__('Yes', 'doublescale')}</span>
							)}
						</div>
					);
				},
			}
		);
	} else if (campaignType === CAMPAIGN_CHANNEL.SMS) {
		typeSpecificColumns.push(
			{
				accessorKey: 'delivered',
				header: __('Delivered', 'doublescale'),
				cell: ({ row }) => {
					const isDelivered =
						row.original.status_slug === 'delivered';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isDelivered
										? 'text-emerald-600'
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
									? __('Yes', 'doublescale')
									: __('No', 'doublescale')}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'clicked',
				header: __('Clicked', 'doublescale'),
				cell: ({ row }) => {
					const isClicked = row.original.clicked != '0';
					if (!isClicked) {
						return <span className="text-muted-foreground">—</span>;
					}
					return (
						<div className="flex items-center gap-2">
							<div className="text-emerald-600">
								<OpenedIcon />
							</div>
							{row.original.clicked_at ? (
								<TimeAgoCell value={row.original.clicked_at} />
							) : (
								<span>{__('Yes', 'doublescale')}</span>
							)}
						</div>
					);
				},
			}
		);
	} else if (campaignType === CAMPAIGN_CHANNEL.WHATSAPP) {
		typeSpecificColumns.push(
			{
				accessorKey: 'delivered',
				header: __('Delivered', 'doublescale'),
				cell: ({ row }) => {
					const isDelivered =
						row.original.status_slug === 'delivered' ||
						row.original.status_slug === 'read';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isDelivered
										? 'text-emerald-600'
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
									? __('Yes', 'doublescale')
									: __('No', 'doublescale')}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'read',
				header: __('Read', 'doublescale'),
				cell: ({ row }) => {
					const isRead = row.original.status_slug === 'read';
					return (
						<div className="flex items-center gap-2">
							<div
								className={
									isRead
										? 'text-emerald-600'
										: 'text-destructive'
								}
							>
								{isRead ? <OpenedIcon /> : <NotOpenedIcon />}
							</div>
							<span>
								{isRead
									? __('Yes', 'doublescale')
									: __('No', 'doublescale')}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'clicked',
				header: __('Clicked', 'doublescale'),
				cell: ({ row }) => {
					const isClicked = row.original.clicked != '0';
					if (!isClicked) {
						return <span className="text-muted-foreground">—</span>;
					}
					return (
						<div className="flex items-center gap-2">
							<div className="text-emerald-600">
								<OpenedIcon />
							</div>
							{row.original.clicked_at ? (
								<TimeAgoCell value={row.original.clicked_at} />
							) : (
								<span>{__('Yes', 'doublescale')}</span>
							)}
						</div>
					);
				},
			}
		);
	}

	// Actions column
	const actionsColumn: ColumnDef<CampaignEmail> = {
		accessorKey: 'actions',
		header: __('Actions', 'doublescale'),
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				<Button
					size="sm"
					className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() => onViewTemplate(row.original)}
				>
					<ViewIcon />
					{__('View', 'doublescale')}
				</Button>
				<Button
					size="sm"
					className="bg-transparent shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() => onResendMessage(row.original)}
				>
					<ResendIcon />
					{__('Resend', 'doublescale')}
				</Button>
			</div>
		),
	};

	return [...baseColumns, ...typeSpecificColumns, actionsColumn];
}

