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
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useContactMessagesTable } from '@quillcrm/hooks/use-contact-messages-table';
import { TimeAgoCell, ViewIcon } from '@quillcrm/components';
import SendWhatsAppDialog from './send-whatsapp-dialog';
import WhatsAppDetails from './whatsapp-details-dialog';
import { MessageCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
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

	// Use combined hook for data + table pagination
	const { loading, messages, analytics, serverSideTable, refetch } =
		useContactMessagesTable({
			contactId: contact_id,
			mode: 'whatsapp',
			initialPerPage: 10,
		});

	if (!contact) {
		return null;
	}

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
				<Button
					variant="secondary"
					size="sm"
					className="bg-white"
					onClick={() => setShowSendWhatsAppModal(true)}
				>
					<MessageCircle className="w-4 h-4 mr-2" />
					{__('Send WhatsApp', 'quillcrm')}
				</Button>
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
		</div>
	);
};

export default WhatsApp;
