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
import {
	TimeAgoCell,
	ViewIcon,
	MessageStatsCard,
	NoData,
	ContactSMSIcon,
	FailedSMSIcon,
	SentSMSIcon,
	UnsubscribeSMSIcon,
	ProcessingSMSIcon,
} from '@quillcrm/components';
import SendSMSDialog from './send-sms-dialog';
import SMSDetails from './sms-details-dialog';
import TwilioConfigModal from '../components/twilio-config-modal';
import { ProviderNotConnectedWarning } from '../components/provider-not-connected-warning';
import { MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface SMSProps {
	contact_id: number;
}

const SMS: React.FC<SMSProps> = ({ contact_id }) => {
	const { contact } = useContactContext();
	const [showSendSMSModal, setShowSendSMSModal] = useState<boolean>(false);
	const [selectedSMS, setSelectedSMS] = useState<TrackedMessage | null>(null);
	const [showTwilioConfig, setShowTwilioConfig] = useState<boolean>(false);

	// Check SMS provider status
	const {
		isConnected,
		isLoading: providerLoading,
		checkStatus,
	} = useProviderStatus('sms');

	// Use combined hook for data + table pagination
	const { loading, messages, analytics, serverSideTable, refetch } =
		useContactMessagesTable({
			contactId: contact_id,
			mode: CAMPAIGN_CHANNEL.SMS,
			initialPerPage: 10,
		});

	if (!contact) {
		return null;
	}

	/**
	 * Handle send SMS button click
	 * Check provider connection before opening dialog
	 */
	const handleSendSMS = () => {
		console.log('[QuillCRM SMS] Button clicked', {
			isConnected,
			providerLoading,
		});

		if (!isConnected) {
			console.log(
				'[QuillCRM SMS] Provider not connected - inline warning visible'
			);
			// Inline warning is already visible, user can click the configure link
			return;
		}

		console.log('[QuillCRM SMS] Opening SMS dialog');
		setShowSendSMSModal(true);
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
						setSelectedSMS(row.original as TrackedMessage)
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
		<div className="qcrm-sms flex flex-col gap-5">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold">
					{__('SMS Messages', 'quillcrm')}
				</h2>
				<Button
					variant="secondary"
					size="sm"
					className="bg-white"
					onClick={handleSendSMS}
					disabled={providerLoading || !isConnected}
				>
					<ProcessingSMSIcon width={24} height={24}/>
					{providerLoading
						? __('Checking...', 'quillcrm')
						: __('Send SMS', 'quillcrm')}
				</Button>
			</div>

			{/* Inline warning when provider not configured */}
			{!isConnected && !providerLoading && (
				<ProviderNotConnectedWarning
					channel="sms"
					onConfigureClick={() => {
						console.log(
							'[QuillCRM] Configure link clicked, opening modal'
						);
						setShowTwilioConfig(true);
					}}
				/>
			)}

			{/* Statistics Cards */}
			{analytics && (
				<div className="flex gap-5">
					<MessageStatsCard
						icon={<ContactSMSIcon width={40} height={40} />}
						value={total}
						label={__('Total SMS', 'quillcrm')}
						iconBgClass="bg-[#E4EEFD]"
						borderColorClass="border-l-secondary"
						iconColor="text-[#458DC7]"
					/>
					<MessageStatsCard
						icon={<SentSMSIcon width={40} height={40} />}
						value={totalSent}
						label={__('Sent', 'quillcrm')}
						iconBgClass="bg-[#D1F6DF]"
						borderColorClass="border-l-[#16A34A]"
						iconColor="text-[#16A34A]"
					/>
					<MessageStatsCard
						icon={<FailedSMSIcon width={40} height={40} />}
						value={totalFailed}
						label={__('Failed', 'quillcrm')}
						iconBgClass="bg-[#FBE8E8]"
						borderColorClass="border-l-destructive"
						iconColor="text-destructive"
					/>
				</div>
			)}

			{/* Messages Table */}
			<div>
				{!loading && messages.length === 0 ? (
					<NoData
						icon={<UnsubscribeSMSIcon width={120} height={120} />}
						title={__('No SMS messages', 'quillcrm')}
						subtitle={__(
							'No SMS messages found for this contact.',
							'quillcrm'
						)}
					/>
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
			<SMSDetails
				smsMessage={selectedSMS}
				onClose={() => setSelectedSMS(null)}
			/>
			<SendSMSDialog
				open={showSendSMSModal}
				onClose={() => {
					setShowSendSMSModal(false);
					refetch(); // Refresh the list after sending
				}}
				contact={contact}
			/>
			{/* Twilio Config Modal - Debug */}
			{console.log(
				'[QuillCRM] Rendering TwilioConfigModal, open:',
				showTwilioConfig
			)}
			<TwilioConfigModal
				open={showTwilioConfig}
				onClose={() => {
					console.log('[QuillCRM] Modal close requested');
					setShowTwilioConfig(false);
				}}
				onSuccess={handleTwilioConfigSuccess}
			/>
		</div>
	);
};

export default SMS;
