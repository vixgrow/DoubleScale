/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Campaign as CampaignType } from '@quillcrm/client';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import {
	MessageStatsCard,
	ContactTotalEmailsIcon,
	ScheduledEmailsIcon,
	ProcessingEmailsIcon,
	FailedEmailsIcon,
	OpenRateIcon,
	ClickRateIcon,
	ClickToOpenRateIcon,
	UnsubscribesIcon,
	ContactSMSIcon,
	ContactWhatsAppIcon,
	DeliveryRateIcon,
	ReadRateIcon,
	ScheduleIcon,
	ProcessingSMSIcon,
	FailedSMSIcon,
	UnsubscribeSMSIcon,
} from '@quillcrm/components';

interface MetricsProps {
	campaign: CampaignType | null;
	calculatePercentage: (total: number, value: number) => string;
	totalMessages: number;
}

export const RenderMetrics: React.FC<MetricsProps> = ({
	campaign,
	calculatePercentage,
	totalMessages,
}) => {
	if (!campaign) return null;

	const isProcessing =
		campaign.status === 'processing' || campaign.status === 'resending';

	// Email Campaign Metrics
	if (campaign.type === CAMPAIGN_CHANNEL.EMAIL) {
		const clickToOpenRate =
			campaign.opened_count && campaign.opened_count > 0
				? (
						(campaign.clicked_count / campaign.opened_count) *
						100
					).toFixed(2)
				: '0.00';

		return (
			<div className="flex flex-col gap-5">
				{/* First card: Total Emails (always shown) */}
				<MessageStatsCard
					icon={<ContactTotalEmailsIcon width={40} height={40} />}
					value={totalMessages}
					label={__('Total Emails', 'quillcrm')}
					iconBgClass="bg-[#E4EEFD]"
					borderColorClass="border-l-[#458DC7]"
					iconColor="text-[#458DC7]"
				/>

				{isProcessing ? (
					<>
						{/* Processing: Scheduled emails */}
						<MessageStatsCard
							icon={
								<ScheduledEmailsIcon
									width={40}
									height={40}
								/>
							}
							value={campaign.contacts_count - totalMessages}
							label={__('Scheduled Emails', 'quillcrm')}
							iconBgClass="bg-[#FAF3DF]"
							borderColorClass="border-l-[#A67D0A]"
							iconColor="text-[#A67D0A]"
						/>

						{/* Processing: Processing emails */}
						<MessageStatsCard
							icon={
								<ProcessingEmailsIcon
									width={40}
									height={40}
								/>
							}
							value={campaign.sent_count}
							label={__('Processing Emails', 'quillcrm')}
							iconBgClass="bg-[#FAEADF]"
							borderColorClass="border-l-[#CB5301]"
							iconColor="text-[#CB5301]"
						/>
					</>
				) : (
					<>
						{/* Not Processing: Failed emails */}
						<MessageStatsCard
							icon={
								<FailedEmailsIcon width={40} height={40} />
							}
							value={campaign.failed_count}
							label={__('Failed Emails', 'quillcrm')}
							iconBgClass="bg-[#FBE8E8]"
							borderColorClass="border-l-destructive"
							iconColor="text-destructive"
						/>

						{/* Not Processing: Open rate */}
						<MessageStatsCard
							icon={<OpenRateIcon width={40} height={40} />}
							value={`${calculatePercentage(totalMessages, campaign.opened_count || 0)}%`}
							label={__('Open Rate', 'quillcrm')}
							iconBgClass="bg-[#E4FAEC]"
							borderColorClass="border-l-[#16A34A]"
							iconColor="text-[#16A34A]"
						/>

						{/* Not Processing: Click rate */}
						<MessageStatsCard
							icon={<ClickRateIcon width={40} height={40} />}
							value={`${calculatePercentage(totalMessages, campaign.clicked_count)}%`}
							label={__('Click Rate', 'quillcrm')}
							iconBgClass="bg-[#EEE4FF]"
							borderColorClass="border-l-[#660FF1]"
							iconColor="text-[#660FF1]"
						/>

						{/* Not Processing: Click to open rate */}
						<MessageStatsCard
							icon={
								<ClickToOpenRateIcon
									width={40}
									height={40}
								/>
							}
							value={`${clickToOpenRate}%`}
							label={__('Click to Open Rate', 'quillcrm')}
							iconBgClass="bg-[#FAEADF]"
							borderColorClass="border-l-[#CB5301]"
							iconColor="text-[#CB5301]"
						/>

						{/* Not Processing: Unsubscribed */}
						<MessageStatsCard
							icon={
								<UnsubscribesIcon width={40} height={40} />
							}
							value={
								(campaign as any).unsubscribed_count || 0
							}
							label={__('Unsubscribed', 'quillcrm')}
							iconBgClass="bg-[#FBE8E8]"
							borderColorClass="border-l-[#A61919]"
							iconColor="text-[#A61919]"
						/>
					</>
				)}
			</div>
		);
	}

	// SMS Campaign Metrics
	if (campaign.type === CAMPAIGN_CHANNEL.SMS) {
		return (
			<div className="flex flex-col gap-5">
				{/* First card: Total SMS (always shown) */}
				<MessageStatsCard
					icon={<ContactSMSIcon width={40} height={40} />}
					value={totalMessages}
					label={__('Total SMS', 'quillcrm')}
					iconBgClass="bg-[#E4EEFD]"
					borderColorClass="border-l-[#458DC7]"
					iconColor="text-[#458DC7]"
				/>

				{isProcessing ? (
					<>
						{/* Processing: Scheduled SMS */}
						<MessageStatsCard
							icon={
								<ScheduleIcon
									width={40}
									height={40}
								/>
							}
							value={campaign.contacts_count - totalMessages}
							label={__('Scheduled SMS', 'quillcrm')}
							iconBgClass="bg-[#FAF3DF]"
							borderColorClass="border-l-[#A67D0A]"
							iconColor="text-[#A67D0A]"
						/>

						{/* Processing: Processing SMS */}
						<MessageStatsCard
							icon={
								<ProcessingSMSIcon
									width={40}
									height={40}
								/>
							}
							value={campaign.sent_count}
							label={__('Processing SMS', 'quillcrm')}
							iconBgClass="bg-[#FAEADF]"
							borderColorClass="border-l-[#CB5301]"
							iconColor="text-[#CB5301]"
						/>
					</>
				) : (
					<>
						{/* Not Processing: Failed SMS */}
						<MessageStatsCard
							icon={
								<FailedSMSIcon width={40} height={40} />
							}
							value={campaign.failed_count}
							label={__('Failed SMS', 'quillcrm')}
							iconBgClass="bg-[#FBE8E8]"
							borderColorClass="border-l-destructive"
							iconColor="text-destructive"
						/>

						{/* Not Processing: Delivery Rate */}
						<MessageStatsCard
							icon={
								<DeliveryRateIcon width={40} height={40} />
							}
							value={`${campaign.delivery_rate || 0}%`}
							label={__('Delivery Rate', 'quillcrm')}
							iconBgClass="bg-[#E4FAEC]"
							borderColorClass="border-l-[#16A34A]"
							iconColor="text-[#16A34A]"
						/>

						{/* Not Processing: Click rate */}
						<MessageStatsCard
							icon={<ClickRateIcon width={40} height={40} />}
							value={`${campaign.click_rate || 0}%`}
							label={__('Click Rate', 'quillcrm')}
							iconBgClass="bg-[#EEE4FF]"
							borderColorClass="border-l-[#660FF1]"
							iconColor="text-[#660FF1]"
						/>

						{/* Not Processing: Unsubscribed */}
						<MessageStatsCard
							icon={
								<UnsubscribeSMSIcon width={40} height={40} />
							}
							value={
								(campaign as any).unsubscribed_count || 0
							}
							label={__('Unsubscribed', 'quillcrm')}
							iconBgClass="bg-[#FBE8E8]"
							borderColorClass="border-l-[#A61919]"
							iconColor="text-[#A61919]"
						/>
					</>
				)}
			</div>
		);
	}

	// // WhatsApp Campaign Metrics
	// if (campaign.type === CAMPAIGN_CHANNEL.WHATSAPP) {
	// 	return (
	// 		<div className="flex flex-col gap-5">
	// 			{/* First card: Total WhatsApp (always shown) */}
	// 			<MessageStatsCard
	// 				icon={<ContactWhatsAppIcon width={40} height={40} />}
	// 				value={totalMessages}
	// 				label={__('Total WhatsApp', 'quillcrm')}
	// 				iconBgClass="bg-[#E4EEFD]"
	// 				borderColorClass="border-l-[#458DC7]"
	// 				iconColor="text-[#458DC7]"
	// 			/>

	// 			{isProcessing ? (
	// 				<>
	// 					{/* Processing: Scheduled WhatsApp */}
	// 					<MessageStatsCard
	// 						icon={
	// 							<ScheduledEmailsIcon
	// 								width={40}
	// 								height={40}
	// 							/>
	// 						}
	// 						value={campaign.contacts_count - totalMessages}
	// 						label={__('Scheduled Messages', 'quillcrm')}
	// 						iconBgClass="bg-[#FAF3DF]"
	// 						borderColorClass="border-l-[#A67D0A]"
	// 						iconColor="text-[#A67D0A]"
	// 					/>

	// 					{/* Processing: Processing WhatsApp */}
	// 					<MessageStatsCard
	// 						icon={
	// 							<ProcessingEmailsIcon
	// 								width={40}
	// 								height={40}
	// 							/>
	// 						}
	// 						value={campaign.sent_count}
	// 						label={__('Processing Messages', 'quillcrm')}
	// 						iconBgClass="bg-[#FAEADF]"
	// 						borderColorClass="border-l-[#CB5301]"
	// 						iconColor="text-[#CB5301]"
	// 					/>
	// 				</>
	// 			) : (
	// 				<>
	// 					{/* Not Processing: Failed WhatsApp */}
	// 					<MessageStatsCard
	// 						icon={
	// 							<FailedEmailsIcon width={40} height={40} />
	// 						}
	// 						value={campaign.failed_count}
	// 						label={__('Failed Messages', 'quillcrm')}
	// 						iconBgClass="bg-[#FBE8E8]"
	// 						borderColorClass="border-l-destructive"
	// 						iconColor="text-destructive"
	// 					/>

	// 					{/* Not Processing: Delivery Rate */}
	// 					<MessageStatsCard
	// 						icon={
	// 							<DeliveryRateIcon width={40} height={40} />
	// 						}
	// 						value={`${campaign.delivery_rate || 0}%`}
	// 						label={__('Delivery Rate', 'quillcrm')}
	// 						iconBgClass="bg-[#E4FAEC]"
	// 						borderColorClass="border-l-[#16A34A]"
	// 						iconColor="text-[#16A34A]"
	// 					/>

	// 					{/* Not Processing: Read Rate */}
	// 					<MessageStatsCard
	// 						icon={<ReadRateIcon width={40} height={40} />}
	// 						value={`${campaign.read_rate || 0}%`}
	// 						label={__('Read Rate', 'quillcrm')}
	// 						iconBgClass="bg-[#FAEADF]"
	// 						borderColorClass="border-l-[#CB5301]"
	// 						iconColor="text-[#CB5301]"
	// 					/>

	// 					{/* Not Processing: Click rate */}
	// 					<MessageStatsCard
	// 						icon={<ClickRateIcon width={40} height={40} />}
	// 						value={`${campaign.click_rate || 0}%`}
	// 						label={__('Click Rate', 'quillcrm')}
	// 						iconBgClass="bg-[#EEE4FF]"
	// 						borderColorClass="border-l-[#660FF1]"
	// 						iconColor="text-[#660FF1]"
	// 					/>
	// 				</>
	// 			)}
	// 		</div>
	// 	);
	// }

	return null;
};

