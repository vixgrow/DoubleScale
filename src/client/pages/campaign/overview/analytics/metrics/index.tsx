/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Campaign as CampaignType } from '@doublescale/client';
import { CAMPAIGN_CHANNEL, isEmailChannel } from '@/constants/campaign-channel';
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
} from '@doublescale/components';

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

	// Email Campaign Metrics (includes email, email_sequence, sequence_mail)
	if (isEmailChannel(campaign.type)) {
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
					label={__('Total Emails', 'doublescale')}
					iconBgClass="bg-primary/10"
					iconColor="text-primary"
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
							label={__('Scheduled Emails', 'doublescale')}
							iconBgClass="bg-amber-50"
							iconColor="text-amber-600"
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
							label={__('Processing Emails', 'doublescale')}
							iconBgClass="bg-orange-50"
							iconColor="text-orange-600"
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
							label={__('Failed Emails', 'doublescale')}
							iconBgClass="bg-red-50"
							iconColor="text-destructive"
						/>

						{/* Not Processing: Open rate */}
						<MessageStatsCard
							icon={<OpenRateIcon width={40} height={40} />}
							value={`${campaign.open_rate?.toFixed(2) || '0.00'}%`}
							label={__('Open Rate', 'doublescale')}
							iconBgClass="bg-emerald-50"
							iconColor="text-emerald-600"
						/>

						{/* Not Processing: Click rate */}
						<MessageStatsCard
							icon={<ClickRateIcon width={40} height={40} />}
							value={`${campaign.click_rate?.toFixed(2) || '0.00'}%`}
							label={__('Click Rate', 'doublescale')}
							iconBgClass="bg-violet-50"
							iconColor="text-violet-600"
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
							label={__('Click to Open Rate', 'doublescale')}
							iconBgClass="bg-orange-50"
							iconColor="text-orange-600"
						/>

						{/* Not Processing: Unsubscribed */}
						<MessageStatsCard
							icon={
								<UnsubscribesIcon width={40} height={40} />
							}
							value={
								(campaign as any).unsubscribed_count || 0
							}
							label={__('Unsubscribed', 'doublescale')}
							iconBgClass="bg-red-50"
							iconColor="text-red-700"
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
					label={__('Total SMS', 'doublescale')}
					iconBgClass="bg-primary/10"
					iconColor="text-primary"
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
							label={__('Scheduled SMS', 'doublescale')}
							iconBgClass="bg-amber-50"
							iconColor="text-amber-600"
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
							label={__('Processing SMS', 'doublescale')}
							iconBgClass="bg-orange-50"
							iconColor="text-orange-600"
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
							label={__('Failed SMS', 'doublescale')}
							iconBgClass="bg-red-50"
							iconColor="text-destructive"
						/>

						{/* Not Processing: Delivery Rate */}
						<MessageStatsCard
							icon={
								<DeliveryRateIcon width={40} height={40} />
							}
							value={`${campaign.delivery_rate || 0}%`}
							label={__('Delivery Rate', 'doublescale')}
							iconBgClass="bg-emerald-50"
							iconColor="text-emerald-600"
						/>

						{/* Not Processing: Click rate */}
						<MessageStatsCard
							icon={<ClickRateIcon width={40} height={40} />}
							value={`${campaign.click_rate || 0}%`}
							label={__('Click Rate', 'doublescale')}
							iconBgClass="bg-violet-50"
							iconColor="text-violet-600"
						/>

						{/* Not Processing: Unsubscribed */}
						<MessageStatsCard
							icon={
								<UnsubscribeSMSIcon width={40} height={40} />
							}
							value={
								(campaign as any).unsubscribed_count || 0
							}
							label={__('Unsubscribed', 'doublescale')}
							iconBgClass="bg-red-50"
							iconColor="text-red-700"
						/>
					</>
				)}
			</div>
		);
	}

	// WhatsApp Campaign Metrics - Coming Soon
	if (campaign.type === CAMPAIGN_CHANNEL.WHATSAPP) {
		return (
			<div className="flex flex-col items-center justify-center p-8 text-center bg-muted rounded-lg">
				<ContactWhatsAppIcon width={48} height={48} />
				<p className="mt-4 text-base font-medium text-foreground">
					{__('WhatsApp Analytics', 'doublescale')}
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					{__('WhatsApp campaign analytics coming soon', 'doublescale')}
				</p>
			</div>
		);
	}

	// // ORIGINAL WHATSAPP CODE - KEPT FOR REFERENCE
	// // if (campaign.type === CAMPAIGN_CHANNEL.WHATSAPP) {
	// // 	return (
	// // 		<div className="flex flex-col gap-5">
	// // 			{/* First card: Total WhatsApp (always shown) */}
	// // 			<MessageStatsCard
	// // 				icon={<ContactWhatsAppIcon width={40} height={40} />}
	// // 				value={totalMessages}
	// // 				label={__('Total WhatsApp', 'doublescale')}
	// // 				iconBgClass="bg-primary/10"
	// 				borderColorClass="border-l-[#458DC7]"
	// 				iconColor="text-primary"
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
	// 						label={__('Scheduled Messages', 'doublescale')}
	// 						iconBgClass="bg-amber-50"
	// 						borderColorClass="border-l-[#A67D0A]"
	// 						iconColor="text-amber-600"
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
	// 						label={__('Processing Messages', 'doublescale')}
	// 						iconBgClass="bg-orange-50"
	// 						borderColorClass="border-l-[#CB5301]"
	// 						iconColor="text-orange-600"
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
	// 						label={__('Failed Messages', 'doublescale')}
	// 						iconBgClass="bg-red-50"
	// 						borderColorClass="border-l-destructive"
	// 						iconColor="text-destructive"
	// 					/>

	// 					{/* Not Processing: Delivery Rate */}
	// 					<MessageStatsCard
	// 						icon={
	// 							<DeliveryRateIcon width={40} height={40} />
	// 						}
	// 						value={`${campaign.delivery_rate || 0}%`}
	// 						label={__('Delivery Rate', 'doublescale')}
	// 						iconBgClass="bg-emerald-50"
	// 						borderColorClass="border-l-[#16A34A]"
	// 						iconColor="text-emerald-600"
	// 					/>

	// 					{/* Not Processing: Read Rate */}
	// 					<MessageStatsCard
	// 						icon={<ReadRateIcon width={40} height={40} />}
	// 						value={`${campaign.read_rate || 0}%`}
	// 						label={__('Read Rate', 'doublescale')}
	// 						iconBgClass="bg-orange-50"
	// 						borderColorClass="border-l-[#CB5301]"
	// 						iconColor="text-orange-600"
	// 					/>

	// 					{/* Not Processing: Click rate */}
	// 					<MessageStatsCard
	// 						icon={<ClickRateIcon width={40} height={40} />}
	// 						value={`${campaign.click_rate || 0}%`}
	// 						label={__('Click Rate', 'doublescale')}
	// 						iconBgClass="bg-violet-50"
	// 						borderColorClass="border-l-[#660FF1]"
	// 						iconColor="text-violet-600"
	// 					/>
	// 				</>
	// 			)}
	// 		</div>
	// 	);
	// }

	return null;
};

