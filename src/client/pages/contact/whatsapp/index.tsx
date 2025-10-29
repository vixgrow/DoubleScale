/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TrackedMessage } from '@quillcrm/client';
import { useContactContext } from '../state/context';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useContactMessagesTable } from '@quillcrm/hooks/use-contact-messages-table';
import { useProviderStatus } from '@/hooks/use-provider-status';
import { TimeAgoCell, ViewIcon } from '@quillcrm/components';
import SendWhatsAppDialog from './send-whatsapp-dialog';
import WhatsAppDetails from './whatsapp-details-dialog';
import TwilioConfigModal from '../components/twilio-config-modal';
import { MessageCircle, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { MessageStatsCard } from '../components/message-stats-card';
import type { ColumnDef } from '@tanstack/react-table';

interface WhatsAppProps {
	contact_id: number;
}

const WhatsApp: React.FC<WhatsAppProps> = ({ contact_id }) => {
	const { contact } = useContactContext();
	const [showSendWhatsAppModal, setShowSendWhatsAppModal] =
		useState<boolean>(false);
	const [selectedWhatsApp, setSelectedWhatsApp] =
		useState<TrackedMessage | null>(null);
	const [showTwilioConfig, setShowTwilioConfig] = useState<boolean>(false);

	// Check WhatsApp provider status
	const { isConnected, isLoading: providerLoading, checkStatus } =
		useProviderStatus('whatsapp');

	// Use combined hook for data + table pagination
	const { loading, messages, analytics, serverSideTable, refetch } =
		useContactMessagesTable({
			contactId: contact_id,
			mode: CAMPAIGN_CHANNEL.WHATSAPP,
			initialPerPage: 10,
		});

	if (!contact) {
		return null;
	}

	/**
	 * Handle send WhatsApp button click
	 * Check provider connection before opening dialog
	 */
	const handleSendWhatsApp = () => {
		console.log('[QuillCRM WhatsApp] Button clicked', {
			isConnected,
			providerLoading,
		});

		if (!isConnected) {
			console.log('[QuillCRM WhatsApp] Provider not connected - inline warning visible');
			// Inline warning is already visible, user can click the configure link
			return;
		}

		console.log('[QuillCRM WhatsApp] Opening WhatsApp dialog');
		setShowSendWhatsAppModal(true);
	};

	/**
	 * Handle successful Twilio configuration
	 * Refresh provider status
	 */
	const handleTwilioConfigSuccess = async () => {
		await checkStatus();
	};

	const columns: ColumnDef<TrackedMessage>[] = [
		{
			accessorKey: 'message',
			header: __('Message', 'quillcrm'),
			cell: ({ row }) => {
				const body =
					row.original.template?.body ||
					row.original.message?.body ||
					'';
				const preview =
					body.length > 50 ? body.substring(0, 50) + '...' : body;
				return <span className="text-sm">{preview}</span>;
			},
		},
		{
			accessorKey: 'sent_at',
			header: __('Sent On', 'quillcrm'),
			cell: ({ row }) => <TimeAgoCell value={row.getValue('sent_at')} />,
		},
		{
			accessorKey: 'status',
			header: __('Status', 'quillcrm'),
			cell: ({ row }) => {
				const statusSlug = row.original.status_slug || 'unknown';
				const statusName = row.original.status_name;

				let icon = <Clock className="w-4 h-4" />;
				let colorClass =
					'text-yellow-600 bg-yellow-50 border-yellow-600';

				if (statusSlug === 'sent' || statusSlug === 'delivered') {
					icon = <CheckCircle2 className="w-4 h-4" />;
					colorClass = 'text-green-600 bg-green-50 border-green-600';
				} else if (statusSlug === 'failed') {
					icon = <XCircle className="w-4 h-4" />;
					colorClass = 'text-red-600 bg-red-50 border-red-600';
				}

				return (
					<div className="flex items-center gap-2">
						<span
							className={`flex items-center gap-1 border rounded-md px-2 py-1 ${colorClass}`}
						>
							{icon}
							{statusName || statusSlug}
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
						{isClicked ? (
							<CheckCircle2 className="w-4 h-4 text-green-600" />
						) : (
							<XCircle className="w-4 h-4 text-gray-400" />
						)}
						<span>
							{isClicked
								? __('Yes', 'quillcrm')
								: __('No', 'quillcrm')}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'actions',
			header: __('Actions', 'quillcrm'),
			cell: ({ row }) => (
				<Button
					size="sm"
					className="bg-transparent border-y-0 border-l-0 border-r shadow-none text-primary hover:bg-transparent hover:text-primary/80"
					onClick={() =>
						setSelectedWhatsApp(row.original as TrackedMessage)
					}
				>
					<ViewIcon />
					{__('View', 'quillcrm')}
				</Button>
			),
		},
	];

	const total = analytics?.messages?.total || 0;
	const totalSent = analytics?.total_sent || 0;
	const totalFailed = analytics?.total_failed || 0;

	return (
		<div className="qcrm-whatsapp flex flex-col gap-5">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold">
					{__('WhatsApp Messages', 'quillcrm')}
				</h2>
				<div className="flex flex-col items-end gap-2">
					<Button
						variant="secondary"
						size="sm"
						className="bg-white"
						onClick={handleSendWhatsApp}
						disabled={providerLoading || !isConnected}
					>
						<MessageCircle className="w-4 h-4 mr-2" />
						{providerLoading
							? __('Checking...', 'quillcrm')
							: __('Send WhatsApp', 'quillcrm')}
					</Button>
					
					{/* Inline warning when provider not configured */}
					{!isConnected && !providerLoading && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2 max-w-sm">
							<AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
							<div className="text-sm">
								<p className="text-yellow-800 font-medium">
									{__('Twilio not configured', 'quillcrm')}
								</p>
								<button
									onClick={() => setShowTwilioConfig(true)}
									className="text-yellow-700 hover:text-yellow-900 underline mt-1 text-left"
								>
									{__('Configure Twilio to send WhatsApp', 'quillcrm')}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Statistics Cards */}
			{analytics && (
				<div className="flex gap-5">
					<MessageStatsCard
						icon={
							<MessageCircle className="w-6 h-6 text-green-600" />
						}
						value={total}
						label={__('Total Messages', 'quillcrm')}
						iconBgClass="bg-green-50"
						borderColorClass="border-l-green-600"
					/>
					<MessageStatsCard
						icon={
							<CheckCircle2 className="w-6 h-6 text-green-600" />
						}
						value={totalSent}
						label={__('Sent', 'quillcrm')}
						iconBgClass="bg-green-50"
						borderColorClass="border-l-green-600"
					/>
					<MessageStatsCard
						icon={<XCircle className="w-6 h-6 text-red-600" />}
						value={totalFailed}
						label={__('Failed', 'quillcrm')}
						iconBgClass="bg-red-50"
						borderColorClass="border-l-red-600"
					/>
				</div>
			)}

			{/* Messages Table */}
			<div>
				{!loading && messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="text-gray-400">
							<MessageCircle className="w-24 h-24" />
						</div>
						<span className="text-lg text-gray-500 font-medium">
							{__('No WhatsApp messages found', 'quillcrm')}
						</span>
					</div>
				) : (
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
			<TwilioConfigModal
				open={showTwilioConfig}
				onClose={() => setShowTwilioConfig(false)}
				onSuccess={handleTwilioConfigSuccess}
			/>
		</div>
	);
};

export default WhatsApp;
