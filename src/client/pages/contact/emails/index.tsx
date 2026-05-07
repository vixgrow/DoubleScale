/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CampaignEmail } from '@doublescale/client';
import { useContactContext } from '../state/context';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import { Button } from '@/components/ui/button';
import {
	ClickRateIcon,
	ContactTotalEmailsIcon,
	OpenRateIcon,
	SendEmailsIcon,
	NoEmailsIcon,
	MessageStatsCard,
	NoData,
} from '@doublescale/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useContactMessagesTable } from '@doublescale/hooks/use-contact-messages-table';
import { getColumns } from './columns';
import EmailDetails from './email-details-dialog';
import SendEmailDialog from './send-email-dialog';

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
			mode: CAMPAIGN_CHANNEL.EMAIL,
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

	const total = analytics?.messages?.total || 0;

	return (
		<div className="doublescale-emails flex flex-col gap-5">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold">
					{__('Emails', 'doublescale')}
				</h2>
				<Button
					variant="secondary"
					size="sm"
					className="bg-white"
					onClick={() => setShowSendEmailModal(true)}
				>
					<SendEmailsIcon />
					{__('Send Email', 'doublescale')}
				</Button>
			</div>

			{/* Statistics Cards */}
			{analytics && (
				<div className="flex gap-5">
					<MessageStatsCard
						icon={<ContactTotalEmailsIcon width={40} height={40} />}
						value={total}
						label={__('Total Emails', 'doublescale')}
						iconBgClass="bg-[#E4EEFD]"
						borderColorClass="border-l-secondary"
						iconColor="text-[#458DC7]"
					/>
					<MessageStatsCard
						icon={<OpenRateIcon width={40} height={40} />}
						value={`${analytics?.open_rate?.toFixed(2) || '0.00'}%`}
						label={__('Open Rate', 'doublescale')}
						iconBgClass="bg-[#D1F6DF]"
						borderColorClass="border-l-[#16A34A]"
						iconColor="text-[#16A34A]"
					/>
					<MessageStatsCard
						icon={<ClickRateIcon width={40} height={40} />}
						value={`${analytics?.click_rate?.toFixed(2) || '0.00'}%`}
						label={__('Click Rate', 'doublescale')}
						iconBgClass="bg-[#EEE4FF]"
						borderColorClass="border-l-[#660FF1]"
						iconColor="text-[#660FF1]"
					/>
				</div>
			)}

			{/* Messages Table */}
			<div>
				{!loading && messages.length === 0 ? (
					<NoData
						icon={<NoEmailsIcon />}
						title={__('No emails yet', 'doublescale')}
						subtitle={__(
							'Track subscriber growth, open rates, and conversion trends in real time.',
							'doublescale'
						)}
						onClick={() => setShowSendEmailModal(true)}
						buttonLabel={__('Send Email', 'doublescale')}
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
							setPage={() => { }}
						/>
						<DataTablePagination table={serverSideTable} />
					</>
				)}
			</div>

		{/* Dialogs */}
		<EmailDetails
			campaignEmail={campaignEmail}
			onClose={() => setCampaignEmail(null)}
			onResendSuccess={() => {
				setCampaignEmail(null);
				refetch(); // Refresh the list after resending
			}}
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
