/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TrackedMessage } from '@doublescale/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useContactMessagesTable } from '@doublescale/hooks/use-contact-messages-table';
import { useProviderStatus } from '@doublescale/hooks/use-provider-status';
import { useContactContext } from '@/client/pages/contact/state/context';
import {
	TimeAgoCell,
	ViewIcon,
	MessageStatsCard,
	NoData,
} from '@doublescale/components';
import { getToLink } from '@doublescale/navigation';
import SendWhatsAppDialog from './send-whatsapp-dialog';
import WhatsAppDetails from './whatsapp-details-dialog';
import { ProviderNotConnectedWarning, ContactNoPhoneWarning } from '@/client/pages/contact/components/provider-not-connected-warning';
import { MessageCircle, CheckCircle2, XCircle, Clock, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { renderWhatsAppBody } from './utils/render-whatsapp-body';
import ChatIcon from '@doublescale/shared/icons/chat';
import TableIcon from '@doublescale/shared/icons/table';
import SendMessageIcon from '@doublescale/shared/icons/send-message';
import TotalSendMessageIcon from '@doublescale/shared/icons/total-send';
import SentIcon from '@doublescale/shared/icons/sent';
import FaildSendIcon from '@doublescale/shared/icons/faild-send';
import ClickedIcon from '@doublescale/shared/icons/clicked';
import WhatsappChat from './whatsapp-chat';

interface WhatsAppProps {
	contact_id: number;
	navigate?: (path: string) => void;
}
type ViewMode = 'table' | 'chat';
const WhatsApp: React.FC<WhatsAppProps> = ({ contact_id, navigate }) => {
	// Get contact from shared context (singleton shared between free and Pro bundles)
	const { contact, isLoading: contextLoading } = useContactContext();

	const [showSendWhatsAppModal, setShowSendWhatsAppModal] = useState<boolean>(false);
	const [selectedWhatsApp, setSelectedWhatsApp] = useState<TrackedMessage | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>('table');

	// Check WhatsApp provider status
	const {
		isConnected,
		isLoading: providerLoading,
		checkStatus,
	} = useProviderStatus(CAMPAIGN_CHANNEL.WHATSAPP);

	// Use combined hook for data + table pagination
	const { loading, messages, analytics, serverSideTable, refetch } =
		useContactMessagesTable({
			contactId: contact_id,
			mode: CAMPAIGN_CHANNEL.WHATSAPP,
			initialPerPage: 10,
		});

	/**
	 * Contact loading state - consider loading if:
	 * 1. Context says it's loading, OR
	 * 2. Contact is null (still waiting for data)
	 *
	 * This handles the case where the component renders before the contact
	 * data is available from the parent context provider.
	 */
	const contactLoading = contextLoading || !contact;

	/**
	 * Check if contact has a valid WhatsApp phone number
	 * WhatsApp requires the whatsapp_phone field (separate from regular phone)
	 */
	const hasValidWhatsAppPhone = contact?.whatsapp_phone && contact.whatsapp_phone.trim().length > 0;

	/**
	 * Handle send WhatsApp button click
	 * Check provider connection and WhatsApp phone number before opening dialog
	 */
	const handleSendWhatsApp = () => {
		if (!isConnected) {
			// Inline warning is already visible, user can click the configure link
			return;
		}

		if (!hasValidWhatsAppPhone) {
			// Inline warning is already visible
			return;
		}

		setShowSendWhatsAppModal(true);
	};

	/**
	 * Handle configure provider click
	 * Navigate to integrations page to configure Meta WhatsApp
	 */
	const handleConfigureProvider = () => {
		if (navigate) {
			navigate(getToLink('integrations/meta-whatsapp'));
		} else {
			// Fallback for cases where navigate isn't available
			window.location.href = getToLink('integrations/meta-whatsapp');
		}
	};

	const columns: ColumnDef<TrackedMessage>[] = [
		{
			accessorKey: 'message',
			header: __('Message', 'doublescale'),
			cell: ({ row }) => {
				// Render with actual variable values (not {{1}}, {{2}} placeholders)
				const body = renderWhatsAppBody(row.original);
				const preview =
					body.length > 50 ? body.substring(0, 50) + '...' : body;
				return <span className="text-sm">{preview}</span>;
			},
		},
		{
			accessorKey: 'sent_at',
			header: __('Sent On', 'doublescale'),
			cell: ({ row }) => <TimeAgoCell value={row.original.sent_at || row.original.created_at} />,
		},
		{
			accessorKey: 'status',
			header: __('Status', 'doublescale'),
			cell: ({ row }) => {
				const direction = row.original.direction; // 1=Outbound, 2=Inbound
				const statusSlug = row.original.status_slug || 'unknown';
				const statusName = row.original.status_name;

				// Status configuration map (with full Tailwind classes for proper purging)
				const statusConfig = {
					inbound: {
						icon: ArrowDownCircle,
						className: 'text-blue-600 bg-blue-50 border-blue-600',
						label: __('Received', 'doublescale'),
					},
					delivered: {
						icon: CheckCircle2,
						className: 'text-green-600 bg-green-50 border-green-600',
						label: __('Delivered', 'doublescale'),
					},
					read: {
						icon: CheckCircle2,
						className: 'text-green-600 bg-green-50 border-green-600',
						label: __('Read', 'doublescale'),
					},
					sent: {
						icon: ArrowUpCircle,
						className: 'text-green-600 bg-green-50 border-green-600',
						label: __('Sent', 'doublescale'),
					},
					failed: {
						icon: XCircle,
						className: 'text-red-600 bg-red-50 border-red-600',
						label: statusName || __('Failed', 'doublescale'),
					},
					default: {
						icon: Clock,
						className: 'text-yellow-600 bg-yellow-50 border-yellow-600',
						label: statusName || __('Pending', 'doublescale'),
					},
				};

				// Inbound messages (direction=2) override status display
				const configKey = direction === 2 ? 'inbound' : statusSlug;
				const config = statusConfig[configKey] || statusConfig.default;
				const Icon = config.icon;

				return (
					<div className="flex items-center gap-2">
						<span className={`flex items-center gap-1 border rounded-md px-2 py-1 ${config.className}`}>
							<Icon className="w-4 h-4" />
							{config.label}
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
						<ClickedIcon width={18} height={18} />
						{row.original.clicked_at ? (
							<TimeAgoCell value={row.original.clicked_at} />
						) : (
							<span>{__('Yes', 'doublescale')}</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'actions',
			header: __('Actions', 'doublescale'),
			cell: ({ row }) => (
				<Button
					size="sm"
					className="bg-transparent border-0 shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() =>
						setSelectedWhatsApp(row.original as TrackedMessage)
					}
				>
					<ViewIcon />
					{__('View', 'doublescale')}
				</Button>
			),
		},
	];

	const total = analytics?.messages?.total || 0;
	const totalSent = analytics?.total_sent || 0;
	const totalFailed = analytics?.total_failed || 0;

	return (
		<div className="doublescale-whatsapp flex flex-col gap-6">
			<div className="flex justify-between items-center">
				<div className=' flex items-center gap-3'>
				<h2 className="text-2xl font-semibold text-foreground">
					{__('WhatsApp Messages', 'doublescale')}
					{messages.length > 0 && ` (${messages.length})`}
				  </h2>
				  {/* icon show */}
				  <div className='flex gap-3 border border-border/60 rounded-xl bg-card py-2 px-3'>
				        <span 
							className={`cursor-pointer p-1 ${viewMode === 'chat' ? ' text-primary rounded-lg bg-primary/10' : ' text-muted-foreground'}`}
							onClick={() => setViewMode('chat')}
							title={__('Chat View', 'doublescale')}
						>
							<ChatIcon width={20} height={20} />
						</span>
						<span 
							className={`cursor-pointer p-1 ${viewMode === 'table' ? ' text-primary rounded-lg bg-primary/10' : ' text-muted-foreground'}`}
							onClick={() => setViewMode('table')}
							title={__('Table View', 'doublescale')}
						>
							<TableIcon width={20} height={20} />
						</span>
						
					</div>
				</div>
			<Button
			    variant='outline'
				className="bg-white border border-primary text-primary text-base font-medium leading-[26px] hover:text-primary/80 hover:bg-primary/5 rounded-lg py-2 px-4 "
				onClick={handleSendWhatsApp}
				disabled={providerLoading || contactLoading || !isConnected || !hasValidWhatsAppPhone}
			>
				<SendMessageIcon/>
				{providerLoading
					? __('Checking provider...', 'doublescale')
					: contactLoading
						? __('Loading contact...', 'doublescale')
						: __('Send Whatsapp Message', 'doublescale')}
			</Button>
			</div>
		{/* Inline warning when contact has no WhatsApp phone number - only show after contact is loaded */}
		{contact && !hasValidWhatsAppPhone && (
			<ContactNoPhoneWarning
				channel={CAMPAIGN_CHANNEL.WHATSAPP}
				contactId={contact_id}
			/>
		)}

		{/* Inline warning when provider not configured - only show if contact has phone */}
		{/* For WhatsApp, navigate to integrations page to configure Meta WhatsApp */}
		{!isConnected && !providerLoading && contact && hasValidWhatsAppPhone && (
			<ProviderNotConnectedWarning
				channel={CAMPAIGN_CHANNEL.WHATSAPP}
				onConfigureClick={handleConfigureProvider}
			/>
		)}

			{/* Statistics Cards */}
			{analytics && (
				<div className="flex gap-8">
					<MessageStatsCard
						icon={<TotalSendMessageIcon  width={30} height={30}/>}
						value={total}
						label={__('Total WhatsApp', 'doublescale')}
						iconBgClass="bg-primary/10"
						borderColorClass=""
						iconColor="text-primary"
					/>
					<MessageStatsCard
						icon={<SentIcon width={30} height={30}/>}
						value={totalSent}
						label={__('Sent', 'doublescale')}
						iconBgClass="bg-emerald-50"
						borderColorClass=""
						iconColor="text-emerald-600"
					/>
					<MessageStatsCard
						icon={<FaildSendIcon width={30} height={30}/>}
						value={totalFailed}
						label={__('Failed', 'doublescale')}
						iconBgClass="bg-red-50"
						borderColorClass=""
						iconColor="text-red-500"
					/>
				</div>
			)}

			{/* Messages Table */}
			<div>
				{!loading && messages.length === 0 ? (
					<NoData
						icon={<MessageCircle className="w-30 h-30 text-muted-foreground" />}
						title={__('No WhatsApp messages', 'doublescale')}
						subtitle={__(
							'No WhatsApp messages found for this contact.',
							'doublescale'
						)}
					/>
				) : (
					<>
					{viewMode === 'table' ? (
                      <>
					  <DataTable
						  columns={columns}
						  data={messages}
						  loading={loading}
						  showPagination={false}
						  initialPageSize={10}
						  showMainActions={false}
						  config={{}}
						  setPage={() => {}}
					  />
					  <DataTablePagination table={serverSideTable} />
				    </>
					) : (
						<WhatsappChat messages={messages} contact={contact} />
					)}
					</>
				)}
			</div>

			{/* Dialogs */}
			<WhatsAppDetails
				whatsappMessage={selectedWhatsApp}
				onClose={() => setSelectedWhatsApp(null)}
			/>
			<SendWhatsAppDialog
				open={showSendWhatsAppModal}
				onClose={() => {
					setShowSendWhatsAppModal(false);
					refetch(); // Refresh the list after sending
				}}
				contact={contact}
			/>
		</div>
	);
};

export default WhatsApp;
