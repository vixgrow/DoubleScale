/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useContactContext } from '../state/context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { TimeAgoCell } from '@quillcrm/components';
import SendSMSDialog from './send-sms-dialog';
import { MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
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

interface SMSAnalytics {
	messages: {
		data: SMSMessage[];
		total: number;
	};
	total_sent: number;
	total_failed: number;
	total_delivered: number;
}

interface SMSProps {
	contact_id: number;
}

const SMS: React.FC<SMSProps> = ({ contact_id }) => {
	const { contact } = useContactContext();
	const [smsAnalytics, setSmsAnalytics] = useState<SMSAnalytics | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [total, setTotal] = useState<number>(0);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [showSendSMSModal, setShowSendSMSModal] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	const fetchSMS = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/contacts/${contact_id}/messages`, {
					mode: 'sms',
					per_page: perPage,
					page,
				}),
			})) as SMSAnalytics;

			if (!response || !response.messages) {
				createNotice({
					type: 'error',
					message: __('Failed to fetch SMS messages', 'quillcrm'),
				});
				return;
			}

			setSmsAnalytics(response);
			setTotal(response.messages.total);
			setTotalRecords(response.messages.total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch SMS messages', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSMS();
	}, [page, perPage]);

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
			{smsAnalytics && (
				<div className="flex gap-5">
					<Card className="flex-1 p-3 shadow-none border-l-primary border-l-[3px] border-y-0 border-r-0">
						<div className="flex justify-between items-center">
							<div className="flex flex-col">
								<span className="text-2xl font-semibold">
									{total}
								</span>
								<span className="text-lg text-gray-500 font-medium">
									{__('Total SMS', 'quillcrm')}
								</span>
							</div>
							<div className="bg-blue-50 p-2 rounded-full">
								<MessageSquare className="w-6 h-6 text-primary" />
							</div>
						</div>
					</Card>
					<Card className="flex-1 p-3 shadow-none border-l-green-600 border-l-[3px] border-y-0 border-r-0">
						<div className="flex justify-between items-center">
							<div className="flex flex-col">
								<span className="text-2xl font-semibold">
									{smsAnalytics.total_sent || 0}
								</span>
								<span className="text-lg text-gray-500 font-medium">
									{__('Sent', 'quillcrm')}
								</span>
							</div>
							<div className="bg-green-50 p-2 rounded-full">
								<CheckCircle2 className="w-6 h-6 text-green-600" />
							</div>
						</div>
					</Card>
					<Card className="flex-1 p-3 shadow-none border-l-red-600 border-l-[3px] border-y-0 border-r-0">
						<div className="flex justify-between items-center">
							<div className="flex flex-col">
								<span className="text-2xl font-semibold">
									{smsAnalytics.total_failed || 0}
								</span>
								<span className="text-lg text-gray-500 font-medium">
									{__('Failed', 'quillcrm')}
								</span>
							</div>
							<div className="bg-red-50 p-2 rounded-full">
								<XCircle className="w-6 h-6 text-red-600" />
							</div>
						</div>
					</Card>
				</div>
			)}
			<div>
				{!loading &&
				(!smsAnalytics?.messages.data ||
					smsAnalytics.messages.data.length === 0) ? (
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
							data={smsAnalytics?.messages.data || []}
							loading={loading}
							showPagination={false}
							initialPageSize={perPage}
							showMainActions={false}
							setPage={setPage}
							config={{}}
						/>
						<DataTablePagination table={serverSideTable} />
					</>
				)}
			</div>
			<SendSMSDialog
				open={showSendSMSModal}
				onClose={() => {
					setShowSendSMSModal(false);
					fetchSMS(); // Refresh the list after sending
				}}
				contact={contact}
			/>
		</div>
	);
};

export default SMS;
