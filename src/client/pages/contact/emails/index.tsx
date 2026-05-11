/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
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
import { groupMessagesIntoThreads, type EmailRow } from '@doublescale/utils';
import EmailDetails from './email-details-dialog';
import SendEmailDialog from './send-email-dialog';

interface EmailsProps {
	contact_id: number;
}

const Emails: React.FC<EmailsProps> = ({ contact_id }) => {
	const { contact, setEmailAnalytics } = useContactContext();
	const [campaignEmail, setCampaignEmail] = useState<EmailRow | null>(null);
	const [showSendEmailModal, setShowSendEmailModal] =
		useState<boolean>(false);
	const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
	const [replyToEmail, setReplyToEmail] = useState<EmailRow | null>(null);

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

	const handleToggleExpand = useCallback((emailId: number) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(emailId)) {
				next.delete(emailId);
			} else {
				next.add(emailId);
			}
			return next;
		});
	}, []);

	const handleReply = useCallback((email: EmailRow) => {
		setReplyToEmail(email);
		setCampaignEmail(null);
		setShowSendEmailModal(true);
	}, []);

	// Group messages into threaded rows
	const threadedMessages = useMemo(
		() => groupMessagesIntoThreads(messages, expandedIds),
		[messages, expandedIds]
	);

	if (!contact) {
		return null;
	}

	const columns = getColumns({
		onViewTemplate: setCampaignEmail,
		onToggleExpand: handleToggleExpand,
		onReply: handleReply,
	});

	const total =
		(analytics?.total_sent || 0) + (analytics?.total_received || 0);

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
					iconBgClass="bg-primary/10"
					iconColor="text-primary"
				/>
				<MessageStatsCard
					icon={<OpenRateIcon width={40} height={40} />}
					value={`${analytics?.open_rate?.toFixed(2) || '0.00'}%`}
					label={__('Open Rate', 'doublescale')}
					iconBgClass="bg-emerald-50"
					iconColor="text-emerald-600"
				/>
				<MessageStatsCard
					icon={<ClickRateIcon width={40} height={40} />}
					value={`${analytics?.click_rate?.toFixed(2) || '0.00'}%`}
					label={__('Click Rate', 'doublescale')}
					iconBgClass="bg-violet-50"
					iconColor="text-violet-600"
				/>
				</div>
			)}

			{/* Messages Display */}
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
							data={threadedMessages}
							loading={loading}
							showPagination={false}
							initialPageSize={
								threadedMessages.length > 10
									? threadedMessages.length
									: 10
							}
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
			onResendSuccess={() => {
				setCampaignEmail(null);
				refetch();
			}}
			onReply={handleReply}
		/>
		<SendEmailDialog
			open={showSendEmailModal}
			onClose={() => {
				setShowSendEmailModal(false);
				setReplyToEmail(null);
				refetch();
			}}
			contact={contact}
			replyTo={replyToEmail}
		/>
		</div>
	);
};

export default Emails;
