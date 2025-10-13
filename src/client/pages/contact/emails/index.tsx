/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CampaignEmail } from '@quillcrm/client';
import { useContactContext } from '../state/context';
import { Button } from '@/components/ui/button';
import {
	ClickRateIcon,
	ContactTotalEmailsIcon,
	OpenRateIcon,
	SendEmailsIcon,
	NoEmailsIcon,
} from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useContactMessagesTable } from '@quillcrm/hooks/use-contact-messages-table';
import { getColumns } from './columns';
import EmailDetails from './email-details-dialog';
import SendEmailDialog from './send-email-dialog';
import { MessageStatsCard } from '../components/message-stats-card';

interface EmailsProps {
	contact_id: number;
}

const Emails: React.FC<EmailsProps> = ({ contact_id }) => {
	const { contact, setEmailAnalytics } = useContactContext();
	const [campaignEmail, setCampaignEmail] = useState<CampaignEmail | null>(
		null
	);
	const [showSendEmailModal, setShowSendEmailModal] =
		useState<boolean>(false);

	// Use combined hook for data + table pagination
	const { loading, messages, analytics, serverSideTable, refetch } =
		useContactMessagesTable({
			contactId: contact_id,
			mode: 'email',
			initialPerPage: 10,
		});

	// Update context when analytics change
	if (analytics && setEmailAnalytics) {
		setEmailAnalytics(analytics);
	}

	if (!contact) {
		return null;
	}

	const columns = getColumns({
		onViewTemplate: setCampaignEmail,
	});

	const calculatePercentage = (total: number, value: number) => {
		if (total === 0) {
			return 0;
		}
		return ((value / total) * 100).toFixed(2);
	};

	const total = analytics?.messages?.total || 0;
	const totalOpened = analytics?.total_opened || 0;
	const totalClicked = analytics?.total_clicked || 0;

	return (
		<div className="qcrm-emails flex flex-col gap-5">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold">
					{__('Emails', 'quillcrm')}
				</h2>
				<Button
					variant="secondary"
					size="sm"
					className="bg-white"
					onClick={() => setShowSendEmailModal(true)}
				>
					<SendEmailsIcon />
					{__('Send Email', 'quillcrm')}
				</Button>
			</div>

			{/* Statistics Cards */}
			{analytics && (
				<div className="flex gap-5">
					<MessageStatsCard
						icon={<ContactTotalEmailsIcon width={38} height={22} />}
						value={total}
						label={__('Total Emails', 'quillcrm')}
						iconBgClass="bg-[#E4EEFD]"
						borderColorClass="border-l-secondary"
					/>
					<MessageStatsCard
						icon={<OpenRateIcon width={37} height={39} />}
						value={`${calculatePercentage(total, totalOpened)}%`}
						label={__('Open Rate', 'quillcrm')}
						iconBgClass="bg-[#D1F6DF]"
						borderColorClass="border-l-[#16A34A]"
					/>
					<MessageStatsCard
						icon={<ClickRateIcon width={38} height={38} />}
						value={`${calculatePercentage(total, totalClicked)}%`}
						label={__('Click Rate', 'quillcrm')}
						iconBgClass="bg-[#EEE4FF]"
						borderColorClass="border-l-[#660FF1]"
					/>
				</div>
			)}

			{/* Messages Table */}
			<div>
				{!loading && messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="text-gray-400">
							<NoEmailsIcon width={120} height={120} />
						</div>
						<span className="text-lg text-gray-500 font-medium">
							{__('No emails found', 'quillcrm')}
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
			<EmailDetails
				campaignEmail={campaignEmail}
				onClose={() => setCampaignEmail(null)}
			/>
			<SendEmailDialog
				open={showSendEmailModal}
				onClose={() => {
					setShowSendEmailModal(false);
					refetch(); // Refresh the list after sending
				}}
				contact={contact}
			/>
		</div>
	);
};

export default Emails;
