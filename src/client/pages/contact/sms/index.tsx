/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContactContext } from '../state/context';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useContactMessagesTable } from '@quillcrm/hooks/use-contact-messages-table';
import { TimeAgoCell } from '@quillcrm/components';
import SendSMSDialog from './send-sms-dialog';
import { MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { MessageStatsCard } from '../components/message-stats-card';
import type { ColumnDef } from '@tanstack/react-table';

interface SMSMessage {
	id: number;
	recipient: string;
	body?: string;
	status: string;
	status_name: string;
	sent_at: string;
	clicked: string;
	external_id?: string;
}

interface SMSProps {
	contact_id: number;
}

const SMS: React.FC<SMSProps> = ({ contact_id }) => {
	const { contact } = useContactContext();
	const [showSendSMSModal, setShowSendSMSModal] = useState<boolean>(false);

	// Use combined hook for data + table pagination
	const { loading, messages, analytics, serverSideTable, refetch } =
		useContactMessagesTable({
			contactId: contact_id,
			mode: 'sms',
			initialPerPage: 10,
		});

	if (!contact) {
		return null;
	}

	const columns: ColumnDef<SMSMessage>[] = [
		{
			accessorKey: 'recipient',
			header: __('Recipient', 'quillcrm'),
			cell: ({ row }) => row.original.recipient,
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
				const status = row.original.status;
				const statusName = row.original.status_name;

				let icon = <Clock className="w-4 h-4" />;
				let colorClass =
					'text-yellow-600 bg-yellow-50 border-yellow-600';

				if (status === 'sent' || status === 'delivered') {
					icon = <CheckCircle2 className="w-4 h-4" />;
					colorClass = 'text-green-600 bg-green-50 border-green-600';
				} else if (status === 'failed') {
					icon = <XCircle className="w-4 h-4" />;
					colorClass = 'text-red-600 bg-red-50 border-red-600';
				}

				return (
					<div className="flex items-center gap-2">
						<span
							className={`flex items-center gap-1 border rounded-md px-2 py-1 ${colorClass}`}
						>
							{icon}
							{statusName || status}
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
					onClick={() => setShowSendSMSModal(true)}
				>
					<MessageSquare className="w-4 h-4 mr-2" />
					{__('Send SMS', 'quillcrm')}
				</Button>
			</div>

			{/* Statistics Cards */}
			{analytics && (
				<div className="flex gap-5">
					<MessageStatsCard
						icon={<MessageSquare className="w-6 h-6 text-primary" />}
						value={total}
						label={__('Total SMS', 'quillcrm')}
						iconBgClass="bg-blue-50"
						borderColorClass="border-l-primary"
					/>
					<MessageStatsCard
						icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
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
							<MessageSquare className="w-24 h-24" />
						</div>
						<span className="text-lg text-gray-500 font-medium">
							{__('No SMS messages found', 'quillcrm')}
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
						/>
						<DataTablePagination table={serverSideTable} />
					</>
				)}
			</div>

			{/* Send SMS Dialog */}
			<SendSMSDialog
				open={showSendSMSModal}
				onClose={() => {
					setShowSendSMSModal(false);
					refetch(); // Refresh the list after sending
				}}
				contact={contact}
			/>
		</div>
	);
};

export default SMS;
